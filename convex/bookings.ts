import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";
import { parseDateString } from "@/lib/date-utils";

function datesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseDateString(start1);
  const e1 = parseDateString(end1);
  const s2 = parseDateString(start2);
  const e2 = parseDateString(end2);
  return s1 <= e2 && s2 <= e1;
}

function calculateDays(startDate: string, endDate: string): number {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Statuses that block dates (active bookings)
const ACTIVE_STATUSES = [
  "confirmed",
  "agreed",
  "nije_isporucen",
  "isporucen",
] as const;

export const createBooking = mutation({
  args: {
    itemId: v.id("items"),
    startDate: v.string(),
    endDate: v.string(),
    deliveryMethod: v.string(),
  },
  returns: v.id("bookings"),
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

    // Only check conflicts with active bookings (not pending or cancelled)
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();

    const conflictingBooking = existingBookings.find(
      (booking) =>
        ACTIVE_STATUSES.includes(booking.status as typeof ACTIVE_STATUSES[number]) &&
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
      status: "pending",
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

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const item = await ctx.db.get(booking.itemId);

        // Get renter profile
        const renterProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", booking.renterId))
          .first();

        // Get renter's average rating
        const renterReviews = await ctx.db
          .query("renterReviews")
          .withIndex("by_renter", (q) => q.eq("renterId", booking.renterId))
          .collect();

        let renterRating = null;
        if (renterReviews.length > 0) {
          const sum = renterReviews.reduce((acc, r) => acc + r.rating, 0);
          renterRating = {
            average: sum / renterReviews.length,
            count: renterReviews.length,
          };
        }

        // Count completed rentals for this renter
        const completedRentals = await ctx.db
          .query("bookings")
          .withIndex("by_renter", (q) => q.eq("renterId", booking.renterId))
          .collect();
        const completedCount = completedRentals.filter(
          (b) => b.status === "vracen"
        ).length;

        return {
          ...booking,
          item,
          renter: renterProfile
            ? {
                firstName: renterProfile.firstName,
                lastName: renterProfile.lastName,
                imageUrl: renterProfile.imageUrl,
              }
            : null,
          renterRating,
          renterCompletedRentals: completedCount,
        };
      })
    );

    return bookingsWithDetails;
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

    // Only active bookings block dates
    return bookings
      .filter((b) => ACTIVE_STATUSES.includes(b.status as typeof ACTIVE_STATUSES[number]))
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
  returns: v.null(),
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

    // Check for conflicts with other active bookings
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_item", (q) => q.eq("itemId", booking.itemId))
      .collect();

    const conflictingBooking = existingBookings.find(
      (b) =>
        b._id !== booking._id &&
        ACTIVE_STATUSES.includes(b.status as typeof ACTIVE_STATUSES[number]) &&
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

    // Notify renter about approval - mention chat is now available
    const item = await ctx.db.get(booking.itemId);
    await ctx.db.insert("notifications", {
      userId: booking.renterId,
      message: `Vaša rezervacija za "${item?.title ?? "predmet"}" je odobrena! Sada možete razgovarati sa vlasnikom.`,
      type: "booking_approved",
      link: `/kontrolna-tabla/zakupi/poruke/${args.id}`,
      createdAt: now,
      updatedAt: now,
    });

    return null;
  },
});

export const rejectBooking = mutation({
  args: {
    id: v.id("bookings"),
  },
  returns: v.null(),
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

    return null;
  },
});

/**
 * Agree to a booking (either renter or owner)
 * Both parties must agree and at least one message must have been exchanged
 */
export const agreeToBooking = mutation({
  args: {
    id: v.id("bookings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError("Rezervacija nije pronađena.");
    }

    const isRenter = booking.renterId === userId;
    const isOwner = booking.ownerId === userId;

    if (!isRenter && !isOwner) {
      throw new ConvexError("Nemate pristup ovoj rezervaciji.");
    }

    if (booking.status !== "confirmed") {
      throw new ConvexError("Dogovor je moguć samo za potvrđene rezervacije.");
    }

    // Check if messages have been exchanged
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.id))
      .first();

    if (!messages) {
      throw new ConvexError("Pre potvrde dogovora morate razmeniti barem jednu poruku.");
    }

    const now = Date.now();
    const item = await ctx.db.get(booking.itemId);
    const otherPartyId = isRenter ? booking.ownerId : booking.renterId;

    // Get current user's profile for notification
    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    const userName = userProfile?.firstName ?? "Korisnik";

    if (isRenter) {
      await ctx.db.patch(args.id, {
        renterAgreed: true,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(args.id, {
        ownerAgreed: true,
        updatedAt: now,
      });
    }

    // Check if both have now agreed (re-read fresh state)
    const updatedBooking = await ctx.db.get(args.id);
    
    // Both must have agreed AND status must still be "confirmed" to transition
    // This prevents race conditions where both parties transition simultaneously
    const bothAgreed = updatedBooking?.renterAgreed && updatedBooking?.ownerAgreed;
    const shouldTransition = bothAgreed && updatedBooking?.status === "confirmed";

    if (shouldTransition) {
      // Transition to agreed status only if still in confirmed state
      await ctx.db.patch(args.id, {
        status: "agreed",
        agreedAt: now,
        updatedAt: now,
      });

      // Notify both parties
      await ctx.db.insert("notifications", {
        userId: booking.renterId,
        message: `Dogovor za "${item?.title ?? "predmet"}" je postignut!`,
        type: "booking_agreed",
        link: `/kontrolna-tabla/zakupi/poruke/${args.id}`,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("notifications", {
        userId: booking.ownerId,
        message: `Dogovor za "${item?.title ?? "predmet"}" je postignut!`,
        type: "booking_agreed",
        link: `/kontrolna-tabla/predmeti/poruke/${args.id}`,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Notify the other party that agreement is requested
      const otherPartyIsOwner = otherPartyId === booking.ownerId;
      const agreementLink = otherPartyIsOwner
        ? `/kontrolna-tabla/predmeti/poruke/${args.id}`
        : `/kontrolna-tabla/zakupi/poruke/${args.id}`;
      await ctx.db.insert("notifications", {
        userId: otherPartyId,
        message: `${userName} je potvrdio/la dogovor za "${item?.title ?? "predmet"}". Čekamo vašu potvrdu.`,
        type: "agreement_requested",
        link: agreementLink,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});

/**
 * Mark item as ready for pickup (owner only)
 * agreed -> nije_isporucen
 */
export const markAsReady = mutation({
  args: {
    id: v.id("bookings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError("Rezervacija nije pronađena.");
    }

    if (booking.ownerId !== identity.subject) {
      throw new ConvexError("Samo vlasnik može označiti predmet kao spreman.");
    }

    if (booking.status !== "agreed") {
      throw new ConvexError("Predmet može biti označen kao spreman samo nakon postignutog dogovora.");
    }

    const now = Date.now();
    const item = await ctx.db.get(booking.itemId);

    await ctx.db.patch(args.id, {
      status: "nije_isporucen",
      updatedAt: now,
    });

    // Notify renter
    await ctx.db.insert("notifications", {
      userId: booking.renterId,
      message: `Predmet "${item?.title ?? "predmet"}" je spreman za preuzimanje!`,
      type: "item_ready",
      link: `/kontrolna-tabla/zakupi/poruke/${args.id}`,
      createdAt: now,
      updatedAt: now,
    });

    return null;
  },
});

/**
 * Mark item as delivered (owner only)
 * nije_isporucen -> isporucen
 */
export const markAsDelivered = mutation({
  args: {
    id: v.id("bookings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError("Rezervacija nije pronađena.");
    }

    if (booking.ownerId !== identity.subject) {
      throw new ConvexError("Samo vlasnik može potvrditi isporuku.");
    }

    if (booking.status !== "nije_isporucen") {
      throw new ConvexError("Isporuka može biti potvrđena samo za predmete koji čekaju preuzimanje.");
    }

    const now = Date.now();
    const item = await ctx.db.get(booking.itemId);

    await ctx.db.patch(args.id, {
      status: "isporucen",
      deliveredAt: now,
      updatedAt: now,
    });

    // Notify renter
    await ctx.db.insert("notifications", {
      userId: booking.renterId,
      message: `Predmet "${item?.title ?? "predmet"}" je isporučen.`,
      type: "item_delivered",
      link: `/kontrolna-tabla/zakupi/poruke/${args.id}`,
      createdAt: now,
      updatedAt: now,
    });

    return null;
  },
});

/**
 * Mark item as returned (owner only)
 * isporucen -> vracen
 */
export const markAsReturned = mutation({
  args: {
    id: v.id("bookings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError("Rezervacija nije pronađena.");
    }

    if (booking.ownerId !== identity.subject) {
      throw new ConvexError("Samo vlasnik može potvrditi povratak.");
    }

    if (booking.status !== "isporucen") {
      throw new ConvexError("Povratak može biti potvrđen samo za isporučene predmete.");
    }

    const now = Date.now();
    const item = await ctx.db.get(booking.itemId);

    await ctx.db.patch(args.id, {
      status: "vracen",
      returnedAt: now,
      updatedAt: now,
    });

    // Notify renter
    await ctx.db.insert("notifications", {
      userId: booking.renterId,
      message: `Predmet "${item?.title ?? "predmet"}" je uspešno vraćen. Hvala!`,
      type: "item_returned",
      link: "/kontrolna-tabla/zakupi",
      createdAt: now,
      updatedAt: now,
    });

    return null;
  },
});

/**
 * Cancel a booking (either party, only before agreed status)
 */
export const cancelBooking = mutation({
  args: {
    id: v.id("bookings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError("Rezervacija nije pronađena.");
    }

    const isRenter = booking.renterId === userId;
    const isOwner = booking.ownerId === userId;

    if (!isRenter && !isOwner) {
      throw new ConvexError("Nemate pristup ovoj rezervaciji.");
    }

    // Can only cancel before agreed status
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new ConvexError("Rezervacija ne može biti otkazana nakon postignutog dogovora.");
    }

    const now = Date.now();
    const item = await ctx.db.get(booking.itemId);
    const otherPartyId = isRenter ? booking.ownerId : booking.renterId;

    // Get current user's profile for notification
    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    const userName = userProfile?.firstName ?? "Korisnik";

    await ctx.db.patch(args.id, {
      status: "cancelled",
      updatedAt: now,
    });

    // Notify the other party
    await ctx.db.insert("notifications", {
      userId: otherPartyId,
      message: `${userName} je otkazao/la rezervaciju za "${item?.title ?? "predmet"}".`,
      type: "booking_rejected",
      link: isOwner ? "/kontrolna-tabla/zakupi" : "/kontrolna-tabla/predmeti",
      createdAt: now,
      updatedAt: now,
    });

    return null;
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
