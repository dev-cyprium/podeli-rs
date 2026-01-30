import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";

function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

function datesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseDate(start1);
  const e1 = parseDate(end1);
  const s2 = parseDate(start2);
  const e2 = parseDate(end2);
  return s1 <= e2 && s2 <= e1;
}

function calculateDays(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export const createBooking = mutation({
  args: {
    itemId: v.id("items"),
    startDate: v.string(),
    endDate: v.string(),
    deliveryMethod: v.string(),
    paymentMethod: v.union(v.literal("cash"), v.literal("card")),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const renterId = identity.subject;

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new ConvexError("Predmet nije pronađen.");
    }

    if (item.ownerId === renterId) {
      throw new ConvexError("Ne možete rezervisati sopstveni predmet.");
    }

    if (
      item.deliveryMethods.length > 0 &&
      !item.deliveryMethods.includes(args.deliveryMethod)
    ) {
      throw new ConvexError("Izabrani način dostave nije dostupan za ovaj predmet.");
    }

    // Only check conflicts with confirmed/active bookings (not pending)
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();

    const conflictingBooking = existingBookings.find(
      (booking) =>
        (booking.status === "confirmed" || booking.status === "active") &&
        datesOverlap(
          args.startDate,
          args.endDate,
          booking.startDate,
          booking.endDate
        )
    );

    if (conflictingBooking) {
      throw new ConvexError(
        "Predmet je već rezervisan za izabrani period. Molimo izaberite drugi termin."
      );
    }

    const totalDays = calculateDays(args.startDate, args.endDate);
    const totalPrice = totalDays * item.pricePerDay;
    const now = Date.now();

    const bookingId = await ctx.db.insert("bookings", {
      itemId: args.itemId,
      renterId,
      ownerId: item.ownerId,
      startDate: args.startDate,
      endDate: args.endDate,
      totalDays,
      pricePerDay: item.pricePerDay,
      totalPrice,
      deliveryMethod: args.deliveryMethod,
      paymentMethod: args.paymentMethod,
      status: "pending",
      paymentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Notify owner about new booking request
    await ctx.db.insert("notifications", {
      userId: item.ownerId,
      message: `Nova rezervacija za "${item.title}" čeka vaše odobrenje.`,
      type: "booking_pending",
      link: "/kontrolna-tabla/predmeti",
      createdAt: now,
      updatedAt: now,
    });

    return bookingId;
  },
});

export const getBookingById = query({
  args: {
    id: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      return null;
    }

    if (
      booking.renterId !== identity.subject &&
      booking.ownerId !== identity.subject
    ) {
      throw new ConvexError("Nemate pristup ovoj rezervaciji.");
    }

    const item = await ctx.db.get(booking.itemId);

    return {
      ...booking,
      item,
    };
  },
});

export const getBookingsAsRenter = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_renter", (q) => q.eq("renterId", identity.subject))
      .order("desc")
      .collect();

    const bookingsWithItems = await Promise.all(
      bookings.map(async (booking) => {
        const item = await ctx.db.get(booking.itemId);
        return {
          ...booking,
          item,
        };
      })
    );

    return bookingsWithItems;
  },
});

export const getBookingsAsOwner = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .order("desc")
      .collect();

    const bookingsWithItems = await Promise.all(
      bookings.map(async (booking) => {
        const item = await ctx.db.get(booking.itemId);
        return {
          ...booking,
          item,
        };
      })
    );

    return bookingsWithItems;
  },
});

export const updateBookingStatus = mutation({
  args: {
    id: v.id("bookings"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError("Rezervacija nije pronađena.");
    }

    const isOwner = booking.ownerId === identity.subject;
    const isRenter = booking.renterId === identity.subject;

    if (!isOwner && !isRenter) {
      throw new ConvexError("Nemate pristup ovoj rezervaciji.");
    }

    if (args.status === "cancelled") {
      if (booking.status === "completed") {
        throw new ConvexError("Ne možete otkazati završenu rezervaciju.");
      }
      if (booking.status === "cancelled") {
        throw new ConvexError("Rezervacija je već otkazana.");
      }
    }

    if (args.status === "active" && !isOwner) {
      throw new ConvexError("Samo vlasnik može aktivirati rezervaciju.");
    }

    if (args.status === "completed" && !isOwner) {
      throw new ConvexError("Samo vlasnik može označiti rezervaciju kao završenu.");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const markAsPaid = mutation({
  args: {
    id: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError("Rezervacija nije pronađena.");
    }

    if (booking.renterId !== identity.subject) {
      throw new ConvexError("Samo zakupac može izvršiti plaćanje.");
    }

    if (booking.paymentStatus === "paid") {
      throw new ConvexError("Rezervacija je već plaćena.");
    }

    if (booking.status === "cancelled") {
      throw new ConvexError("Ne možete platiti otkazanu rezervaciju.");
    }

    await ctx.db.patch(args.id, {
      paymentStatus: "paid",
      status: "confirmed",
      updatedAt: Date.now(),
    });
  },
});

export const getItemBookedDates = query({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();

    // Only confirmed and active bookings block dates (not pending)
    return bookings
      .filter((b) => b.status === "confirmed" || b.status === "active")
      .map((b) => ({
        startDate: b.startDate,
        endDate: b.endDate,
      }));
  },
});

export const approveBooking = mutation({
  args: {
    id: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError("Rezervacija nije pronađena.");
    }

    if (booking.ownerId !== identity.subject) {
      throw new ConvexError("Samo vlasnik može odobriti rezervaciju.");
    }

    if (booking.status !== "pending") {
      throw new ConvexError("Samo rezervacije na čekanju mogu biti odobrene.");
    }

    // Check for conflicts with other confirmed/active bookings
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_item", (q) => q.eq("itemId", booking.itemId))
      .collect();

    const conflictingBooking = existingBookings.find(
      (b) =>
        b._id !== booking._id &&
        (b.status === "confirmed" || b.status === "active") &&
        datesOverlap(
          booking.startDate,
          booking.endDate,
          b.startDate,
          b.endDate
        )
    );

    if (conflictingBooking) {
      throw new ConvexError(
        "Datumi su već rezervisani drugom rezervacijom. Odbijte ovu rezervaciju."
      );
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "confirmed",
      updatedAt: now,
    });

    // Notify renter about approval
    const item = await ctx.db.get(booking.itemId);
    await ctx.db.insert("notifications", {
      userId: booking.renterId,
      message: `Vaša rezervacija za "${item?.title ?? "predmet"}" je odobrena!`,
      type: "booking_approved",
      link: "/kontrolna-tabla/zakupi",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const rejectBooking = mutation({
  args: {
    id: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError("Rezervacija nije pronađena.");
    }

    if (booking.ownerId !== identity.subject) {
      throw new ConvexError("Samo vlasnik može odbiti rezervaciju.");
    }

    if (booking.status !== "pending") {
      throw new ConvexError("Samo rezervacije na čekanju mogu biti odbijene.");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "cancelled",
      updatedAt: now,
    });

    // Notify renter about rejection
    const item = await ctx.db.get(booking.itemId);
    await ctx.db.insert("notifications", {
      userId: booking.renterId,
      message: `Vaša rezervacija za "${item?.title ?? "predmet"}" je odbijena.`,
      type: "booking_rejected",
      link: "/kontrolna-tabla/zakupi",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Admin-only: Delete orphaned bookings (bookings whose items no longer exist)
 */
export const clearOrphanedBookings = mutation({
  args: {},
  returns: v.object({
    deleted: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    // Check if user is a superAdmin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile?.superAdmin) {
      throw new ConvexError("Samo administratori mogu izvršiti ovu akciju.");
    }

    const allBookings = await ctx.db.query("bookings").collect();
    let deleted = 0;

    for (const booking of allBookings) {
      const item = await ctx.db.get(booking.itemId);
      if (!item) {
        await ctx.db.delete(booking._id);
        deleted++;
      }
    }

    return { deleted, total: allBookings.length };
  },
});
