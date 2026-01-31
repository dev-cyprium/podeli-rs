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

    if (booking.status !== "vracen") {
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

// ==================== RENTER REVIEWS ====================

/**
 * Create a review for a renter (owner reviews the renter after booking is complete)
 */
export const createRenterReview = mutation({
  args: {
    bookingId: v.id("bookings"),
    rating: v.number(),
    comment: v.optional(v.string()),
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

    if (booking.ownerId !== identity.subject) {
      throw new Error("Samo vlasnik može oceniti zakupca.");
    }

    if (booking.status !== "vracen") {
      throw new Error("Možete oceniti zakupca samo nakon završene rezervacije.");
    }

    const existingReview = await ctx.db
      .query("renterReviews")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .first();

    if (existingReview) {
      throw new Error("Već ste ocenili zakupca za ovu rezervaciju.");
    }

    const now = Date.now();

    const reviewId = await ctx.db.insert("renterReviews", {
      bookingId: args.bookingId,
      renterId: booking.renterId,
      ownerId: identity.subject,
      rating: args.rating,
      comment: args.comment,
      createdAt: now,
    });

    // Get item and owner info for notification
    const item = await ctx.db.get(booking.itemId);
    const ownerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    const ownerName = ownerProfile?.firstName ?? "Vlasnik";

    // Notify the renter about their new review
    await ctx.db.insert("notifications", {
      userId: booking.renterId,
      message: `${ownerName} vas je ocenio/la sa ${args.rating} zvezdica za "${item?.title ?? "predmet"}".`,
      type: "renter_reviewed",
      link: "/kontrolna-tabla/zakupi/ocene",
      createdAt: now,
      updatedAt: now,
    });

    return reviewId;
  },
});

/**
 * Get a renter's average rating
 */
export const getRenterAverageRating = query({
  args: {
    renterId: v.string(),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("renterReviews")
      .withIndex("by_renter", (q) => q.eq("renterId", args.renterId))
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

/**
 * Get renter review for a specific booking
 */
export const getRenterReviewByBooking = query({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("renterReviews")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .first();
  },
});

/**
 * Get all reviews for a renter
 */
export const getReviewsForRenter = query({
  args: {
    renterId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("renterReviews")
      .withIndex("by_renter", (q) => q.eq("renterId", args.renterId))
      .order("desc")
      .collect();
  },
});

/**
 * Get reviews for the current user as a renter (with detailed info)
 */
export const getMyRenterReviews = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    const reviews = await ctx.db
      .query("renterReviews")
      .withIndex("by_renter", (q) => q.eq("renterId", userId))
      .order("desc")
      .collect();

    // Enrich with booking, item, and owner details
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const booking = await ctx.db.get(review.bookingId);
        const item = booking ? await ctx.db.get(booking.itemId) : null;
        const ownerProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", review.ownerId))
          .first();

        return {
          ...review,
          item: item
            ? {
                _id: item._id,
                title: item.title,
                images: item.images,
              }
            : null,
          owner: ownerProfile
            ? {
                firstName: ownerProfile.firstName,
                lastName: ownerProfile.lastName,
                imageUrl: ownerProfile.imageUrl,
              }
            : null,
          booking: booking
            ? {
                startDate: booking.startDate,
                endDate: booking.endDate,
              }
            : null,
        };
      })
    );

    return enrichedReviews;
  },
});

/**
 * Get renter's average rating for the current user
 */
export const getMyRenterRating = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    const reviews = await ctx.db
      .query("renterReviews")
      .withIndex("by_renter", (q) => q.eq("renterId", userId))
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

// ==================== OWNER REVIEWS (for Podeli/Ocene page) ====================

/**
 * Get all reviews for items owned by the current user (with detailed info)
 */
export const getReviewsForMyItems = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("reviews"),
      _creationTime: v.number(),
      itemId: v.id("items"),
      bookingId: v.id("bookings"),
      reviewerId: v.string(),
      rating: v.number(),
      comment: v.string(),
      createdAt: v.number(),
      item: v.union(
        v.object({
          _id: v.id("items"),
          title: v.string(),
          images: v.array(v.id("_storage")),
        }),
        v.null()
      ),
      renter: v.union(
        v.object({
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
        v.null()
      ),
      booking: v.union(
        v.object({
          startDate: v.string(),
          endDate: v.string(),
        }),
        v.null()
      ),
    })
  ),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    // Get all items owned by this user
    const myItems = await ctx.db
      .query("items")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const myItemIds = myItems.map((item) => item._id);

    // Get all reviews for these items
    const allReviews = [];
    for (const itemId of myItemIds) {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_item", (q) => q.eq("itemId", itemId))
        .collect();
      allReviews.push(...reviews);
    }

    // Sort by createdAt descending
    allReviews.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with item, renter, and booking details
    const enrichedReviews = await Promise.all(
      allReviews.map(async (review) => {
        const item = await ctx.db.get(review.itemId);
        const booking = await ctx.db.get(review.bookingId);
        const renterProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", review.reviewerId))
          .first();

        return {
          ...review,
          item: item
            ? {
                _id: item._id,
                title: item.title,
                images: item.images,
              }
            : null,
          renter: renterProfile
            ? {
                firstName: renterProfile.firstName,
                lastName: renterProfile.lastName,
                imageUrl: renterProfile.imageUrl,
              }
            : null,
          booking: booking
            ? {
                startDate: booking.startDate,
                endDate: booking.endDate,
              }
            : null,
        };
      })
    );

    return enrichedReviews;
  },
});

/**
 * Get average rating across all items owned by the current user
 */
export const getMyItemsAverageRating = query({
  args: {},
  returns: v.union(
    v.object({
      average: v.number(),
      count: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    // Get all items owned by this user
    const myItems = await ctx.db
      .query("items")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const myItemIds = myItems.map((item) => item._id);

    // Get all reviews for these items
    const allReviews = [];
    for (const itemId of myItemIds) {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_item", (q) => q.eq("itemId", itemId))
        .collect();
      allReviews.push(...reviews);
    }

    if (allReviews.length === 0) {
      return null;
    }

    const sum = allReviews.reduce((acc, review) => acc + review.rating, 0);
    return {
      average: sum / allReviews.length,
      count: allReviews.length,
    };
  },
});

/**
 * Get all renter reviews given by the current user (as an owner)
 */
export const getRenterReviewsGivenByMe = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("renterReviews"),
      _creationTime: v.number(),
      bookingId: v.id("bookings"),
      renterId: v.string(),
      ownerId: v.string(),
      rating: v.number(),
      comment: v.optional(v.string()),
      createdAt: v.number(),
      item: v.union(
        v.object({
          _id: v.id("items"),
          title: v.string(),
          images: v.array(v.id("_storage")),
        }),
        v.null()
      ),
      renter: v.union(
        v.object({
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
        v.null()
      ),
      booking: v.union(
        v.object({
          startDate: v.string(),
          endDate: v.string(),
        }),
        v.null()
      ),
    })
  ),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    // Get all renter reviews where I am the owner
    const reviews = await ctx.db
      .query("renterReviews")
      .order("desc")
      .collect();

    // Filter to only reviews by this owner (no index by owner, so filter in memory)
    const myReviews = reviews.filter((r) => r.ownerId === userId);

    // Sort by createdAt descending
    myReviews.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with booking, item, and renter details
    const enrichedReviews = await Promise.all(
      myReviews.map(async (review) => {
        const booking = await ctx.db.get(review.bookingId);
        const item = booking ? await ctx.db.get(booking.itemId) : null;
        const renterProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", review.renterId))
          .first();

        return {
          ...review,
          item: item
            ? {
                _id: item._id,
                title: item.title,
                images: item.images,
              }
            : null,
          renter: renterProfile
            ? {
                firstName: renterProfile.firstName,
                lastName: renterProfile.lastName,
                imageUrl: renterProfile.imageUrl,
              }
            : null,
          booking: booking
            ? {
                startDate: booking.startDate,
                endDate: booking.endDate,
              }
            : null,
        };
      })
    );

    return enrichedReviews;
  },
});
