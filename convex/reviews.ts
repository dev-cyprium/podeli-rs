import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";

export const createReview = mutation({
  args: {
    bookingId: v.id("bookings"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Ocena mora biti između 1 i 5.");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Rezervacija nije pronađena.");
    }

    if (booking.renterId !== identity.subject) {
      throw new Error("Samo zakupac može ostaviti recenziju.");
    }

    if (booking.status !== "completed") {
      throw new Error("Možete ostaviti recenziju samo za završene rezervacije.");
    }

    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .first();

    if (existingReview) {
      throw new Error("Već ste ostavili recenziju za ovu rezervaciju.");
    }

    return await ctx.db.insert("reviews", {
      itemId: booking.itemId,
      bookingId: args.bookingId,
      reviewerId: identity.subject,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });
  },
});

export const getReviewsForItem = query({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .order("desc")
      .collect();

    return reviews;
  },
});

export const getReviewByBooking = query({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .first();
  },
});

export const getItemAverageRating = query({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();

    if (reviews.length === 0) {
      return null;
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return {
      average: sum / reviews.length,
      count: reviews.length,
    };
  },
});
