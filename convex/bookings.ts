import { v } from "convex/values";
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
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const renterId = identity.subject;

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Predmet nije pronađen.");
    }

    if (item.ownerId === renterId) {
      throw new Error("Ne možete rezervisati sopstveni predmet.");
    }

    if (
      item.deliveryMethods.length > 0 &&
      !item.deliveryMethods.includes(args.deliveryMethod)
    ) {
      throw new Error("Izabrani način dostave nije dostupan za ovaj predmet.");
    }

    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();

    const conflictingBooking = existingBookings.find(
      (booking) =>
        booking.status !== "cancelled" &&
        datesOverlap(
          args.startDate,
          args.endDate,
          booking.startDate,
          booking.endDate
        )
    );

    if (conflictingBooking) {
      throw new Error(
        "Predmet je već rezervisan za izabrani period. Molimo izaberite drugi termin."
      );
    }

    const totalDays = calculateDays(args.startDate, args.endDate);
    const totalPrice = totalDays * item.pricePerDay;
    const now = Date.now();

    return await ctx.db.insert("bookings", {
      itemId: args.itemId,
      renterId,
      ownerId: item.ownerId,
      startDate: args.startDate,
      endDate: args.endDate,
      totalDays,
      pricePerDay: item.pricePerDay,
      totalPrice,
      deliveryMethod: args.deliveryMethod,
      status: "confirmed",
      paymentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
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
      throw new Error("Nemate pristup ovoj rezervaciji.");
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
      throw new Error("Rezervacija nije pronađena.");
    }

    const isOwner = booking.ownerId === identity.subject;
    const isRenter = booking.renterId === identity.subject;

    if (!isOwner && !isRenter) {
      throw new Error("Nemate pristup ovoj rezervaciji.");
    }

    if (args.status === "cancelled") {
      if (booking.status === "completed") {
        throw new Error("Ne možete otkazati završenu rezervaciju.");
      }
      if (booking.status === "cancelled") {
        throw new Error("Rezervacija je već otkazana.");
      }
    }

    if (args.status === "active" && !isOwner) {
      throw new Error("Samo vlasnik može aktivirati rezervaciju.");
    }

    if (args.status === "completed" && !isOwner) {
      throw new Error("Samo vlasnik može označiti rezervaciju kao završenu.");
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
      throw new Error("Rezervacija nije pronađena.");
    }

    if (booking.renterId !== identity.subject) {
      throw new Error("Samo zakupac može izvršiti plaćanje.");
    }

    if (booking.paymentStatus === "paid") {
      throw new Error("Rezervacija je već plaćena.");
    }

    if (booking.status === "cancelled") {
      throw new Error("Ne možete platiti otkazanu rezervaciju.");
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

    return bookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => ({
        startDate: b.startDate,
        endDate: b.endDate,
      }));
  },
});
