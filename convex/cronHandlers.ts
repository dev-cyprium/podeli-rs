import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "@/lib/convex-auth";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const TIME_OVERRIDE_KEY = "timeOverride";

/**
 * Helper to get current time (respects debug time override)
 */
async function getCurrentTime(ctx: { db: any }): Promise<number> {
  const override = await ctx.db
    .query("debugSettings")
    .withIndex("by_key", (q: any) => q.eq("key", TIME_OVERRIDE_KEY))
    .first();

  if (override) {
    return parseInt(override.value);
  }
  return Date.now();
}

/**
 * Check for bookings that need return reminders
 * Runs every 6 hours
 * Finds bookings: status="isporucen", endDate within 24h, no reminder sent
 */
export const checkReturnReminders = internalMutation({
  args: {},
  returns: v.object({
    remindersSent: v.number(),
  }),
  handler: async (ctx) => {
    const now = await getCurrentTime(ctx);
    let remindersSent = 0;

    // Get all delivered bookings
    const deliveredBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "isporucen"))
      .collect();

    for (const booking of deliveredBookings) {
      // Skip if reminder already sent
      if (booking.returnReminderSent) {
        continue;
      }

      // Parse end date (return day starts at midnight) and check if within 24 hours
      const returnDayStart = new Date(booking.endDate + "T00:00:00");
      const returnDayTime = returnDayStart.getTime();
      const timeUntilReturnDay = returnDayTime - now;

      // If return day is within 24 hours and hasn't started yet
      if (timeUntilReturnDay > 0 && timeUntilReturnDay <= TWENTY_FOUR_HOURS) {
        const item = await ctx.db.get(booking.itemId);

        // Send reminder notification to renter
        await ctx.db.insert("notifications", {
          userId: booking.renterId,
          message: `Podsetnik: Sutra je dan za vraćanje "${item?.title ?? "predmet"}".`,
          type: "return_reminder",
          link: `/kontrolna-tabla/zakupi/poruke/${booking._id}`,
          createdAt: now,
          updatedAt: now,
        });

        // Mark reminder as sent
        await ctx.db.patch(booking._id, {
          returnReminderSent: true,
          updatedAt: now,
        });

        remindersSent++;
      }
    }

    return { remindersSent };
  },
});

/**
 * Clean up old messages from completed bookings
 * Runs daily
 * Deletes messages from bookings that have been "vracen" for more than 30 days
 */
export const cleanupOldMessages = internalMutation({
  args: {},
  returns: v.object({
    messagesDeleted: v.number(),
    bookingsProcessed: v.number(),
  }),
  handler: async (ctx) => {
    const now = await getCurrentTime(ctx);
    const cutoffTime = now - THIRTY_DAYS;
    let messagesDeleted = 0;
    let bookingsProcessed = 0;

    // Get all returned bookings
    const returnedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "vracen"))
      .collect();

    for (const booking of returnedBookings) {
      // Check if booking was returned more than 30 days ago
      if (booking.returnedAt && booking.returnedAt < cutoffTime) {
        // Get all messages for this booking
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
          .collect();

        // Delete all messages
        for (const message of messages) {
          await ctx.db.delete(message._id);
          messagesDeleted++;
        }

        bookingsProcessed++;
      }
    }

    return { messagesDeleted, bookingsProcessed };
  },
});

/**
 * Manually trigger return reminders check (super-admin only, for testing)
 */
export const triggerReturnReminders = mutation({
  args: {},
  returns: v.object({
    remindersSent: v.number(),
    debug: v.object({
      currentTime: v.string(),
      bookingsFound: v.number(),
      bookingsAlreadyReminded: v.number(),
      bookingsChecked: v.array(v.object({
        endDate: v.string(),
        returnDayStart: v.string(),
        hoursUntilReturnDay: v.number(),
        wouldSend: v.boolean(),
      })),
    }),
  }),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    // Check if user is super-admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile?.superAdmin) {
      throw new Error("Samo super-admin može pokrenuti ovu akciju.");
    }

    const now = await getCurrentTime(ctx);
    let remindersSent = 0;
    let bookingsAlreadyReminded = 0;
    const bookingsChecked: Array<{
      endDate: string;
      returnDayStart: string;
      hoursUntilReturnDay: number;
      wouldSend: boolean;
    }> = [];

    // Get all delivered bookings
    const deliveredBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "isporucen"))
      .collect();

    for (const booking of deliveredBookings) {
      // Skip if reminder already sent
      if (booking.returnReminderSent) {
        bookingsAlreadyReminded++;
        continue;
      }

      // Parse end date (return day starts at midnight) and check if within 24 hours
      const returnDayStart = new Date(booking.endDate + "T00:00:00");
      const returnDayTime = returnDayStart.getTime();
      const timeUntilReturnDay = returnDayTime - now;
      const hoursUntil = timeUntilReturnDay / (60 * 60 * 1000);
      const wouldSend = timeUntilReturnDay > 0 && timeUntilReturnDay <= TWENTY_FOUR_HOURS;

      bookingsChecked.push({
        endDate: booking.endDate,
        returnDayStart: returnDayStart.toISOString(),
        hoursUntilReturnDay: Math.round(hoursUntil * 10) / 10,
        wouldSend,
      });

      // If return day is within 24 hours and hasn't started yet
      if (wouldSend) {
        const item = await ctx.db.get(booking.itemId);

        // Send reminder notification to renter
        await ctx.db.insert("notifications", {
          userId: booking.renterId,
          message: `Podsetnik: Sutra je dan za vraćanje "${item?.title ?? "predmet"}".`,
          type: "return_reminder",
          link: `/kontrolna-tabla/zakupi/poruke/${booking._id}`,
          createdAt: now,
          updatedAt: now,
        });

        // Mark reminder as sent
        await ctx.db.patch(booking._id, {
          returnReminderSent: true,
          updatedAt: now,
        });

        remindersSent++;
      }
    }

    return {
      remindersSent,
      debug: {
        currentTime: new Date(now).toISOString(),
        bookingsFound: deliveredBookings.length,
        bookingsAlreadyReminded,
        bookingsChecked,
      },
    };
  },
});

/**
 * Reset returnReminderSent flag on a specific booking (super-admin only, for testing)
 */
export const resetReminderFlag = mutation({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    // Check if user is super-admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile?.superAdmin) {
      throw new Error("Samo super-admin može pokrenuti ovu akciju.");
    }

    await ctx.db.patch(args.bookingId, {
      returnReminderSent: false,
    });

    return null;
  },
});
