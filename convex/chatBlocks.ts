import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";

/**
 * Block a user in a booking conversation
 */
export const blockUser = mutation({
  args: {
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
  },
  returns: v.id("chatBlocks"),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError("Rezervacija nije pronađena.");
    }

    const isRenter = booking.renterId === userId;
    const isOwner = booking.ownerId === userId;
    if (!isRenter && !isOwner) {
      throw new ConvexError("Nemate pristup ovoj rezervaciji.");
    }

    // Check if already blocked
    const existing = await ctx.db
      .query("chatBlocks")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .first();
    if (existing) {
      throw new ConvexError("Razgovor je već blokiran.");
    }

    const blockedUser = isOwner ? booking.renterId : booking.ownerId;

    return await ctx.db.insert("chatBlocks", {
      bookingId: args.bookingId,
      blockedBy: userId,
      blockedUser,
      reason: args.reason,
      createdAt: Date.now(),
    });
  },
});

/**
 * Unblock a user in a booking conversation
 */
export const unblockUser = mutation({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    const block = await ctx.db
      .query("chatBlocks")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .first();

    if (!block) {
      throw new ConvexError("Razgovor nije blokiran.");
    }

    // Only the blocker or a super-admin can unblock
    if (block.blockedBy !== userId) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      if (!profile?.superAdmin) {
        throw new ConvexError("Samo onaj ko je blokirao ili admin može odblokirati.");
      }
    }

    await ctx.db.delete(block._id);
    return null;
  },
});

/**
 * Get block status for a booking conversation
 */
export const getBlockStatus = query({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.union(
    v.object({
      isBlocked: v.boolean(),
      blockedByMe: v.boolean(),
      blockedByOther: v.boolean(),
      reason: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    const block = await ctx.db
      .query("chatBlocks")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .first();

    if (!block) {
      return { isBlocked: false, blockedByMe: false, blockedByOther: false };
    }

    return {
      isBlocked: true,
      blockedByMe: block.blockedBy === userId,
      blockedByOther: block.blockedBy !== userId,
      reason: block.reason,
    };
  },
});

/**
 * Get all blocked conversations (super-admin only)
 */
export const getBlockedConversations = query({
  args: {},
  returns: v.array(
    v.object({
      blockId: v.id("chatBlocks"),
      bookingId: v.id("bookings"),
      blockedBy: v.string(),
      blockedUser: v.string(),
      reason: v.optional(v.string()),
      createdAt: v.number(),
      blockedByProfile: v.union(
        v.object({
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
        }),
        v.null()
      ),
      blockedUserProfile: v.union(
        v.object({
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
        }),
        v.null()
      ),
      itemTitle: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile?.superAdmin) {
      throw new ConvexError("Samo super-admin može pristupiti.");
    }

    const blocks = await ctx.db.query("chatBlocks").collect();

    return await Promise.all(
      blocks.map(async (block) => {
        const booking = await ctx.db.get(block.bookingId);
        const item = booking ? await ctx.db.get(booking.itemId) : null;

        const blockedByProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", block.blockedBy))
          .first();
        const blockedUserProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", block.blockedUser))
          .first();

        return {
          blockId: block._id,
          bookingId: block.bookingId,
          blockedBy: block.blockedBy,
          blockedUser: block.blockedUser,
          reason: block.reason,
          createdAt: block.createdAt,
          blockedByProfile: blockedByProfile
            ? { firstName: blockedByProfile.firstName, lastName: blockedByProfile.lastName }
            : null,
          blockedUserProfile: blockedUserProfile
            ? { firstName: blockedUserProfile.firstName, lastName: blockedUserProfile.lastName }
            : null,
          itemTitle: item?.title,
        };
      })
    );
  },
});
