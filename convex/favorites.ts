import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";

export const toggle = mutation({
  args: { itemId: v.id("items") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId_and_itemId", (q) =>
        q.eq("userId", userId).eq("itemId", args.itemId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("favorites", {
      userId,
      itemId: args.itemId,
      createdAt: Date.now(),
    });
    return true;
  },
});

export const isFavorited = query({
  args: { itemId: v.id("items") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId_and_itemId", (q) =>
        q.eq("userId", identity.subject).eq("itemId", args.itemId)
      )
      .first();

    return existing !== null;
  },
});

export const getFavoriteItemIds = query({
  args: {},
  returns: v.array(v.id("items")),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    return favorites.map((f) => f.itemId);
  },
});

export const listMyFavorites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    const now = Date.now();
    const items = await Promise.all(
      favorites.map(async (fav) => {
        const item = await ctx.db.get(fav.itemId);
        if (!item) return null;
        // Filter out expired single-listing items
        if (item.singleListingExpiresAt && item.singleListingExpiresAt < now) {
          return null;
        }
        // Get first image URL
        const imageUrl = item.images[0]
          ? await ctx.storage.getUrl(item.images[0])
          : null;
        return {
          favoriteId: fav._id,
          favoritedAt: fav.createdAt,
          item: {
            _id: item._id,
            title: item.title,
            category: item.category,
            pricePerDay: item.pricePerDay,
            shortId: item.shortId,
            slug: item.slug,
            imageUrl,
          },
        };
      })
    );

    return items.filter((i): i is NonNullable<typeof i> => i !== null);
  },
});
