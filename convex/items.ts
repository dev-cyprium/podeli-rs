import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { UserIdentity } from "convex/server";

const deliveryMethodValues = ["licno", "glovo", "wolt", "cargo"] as const;

const deliveryMethodValidator = v.union(
  v.literal(deliveryMethodValues[0]),
  v.literal(deliveryMethodValues[1]),
  v.literal(deliveryMethodValues[2]),
  v.literal(deliveryMethodValues[3]),
);

async function requireIdentity(ctx: {
  auth: { getUserIdentity: () => Promise<UserIdentity | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Morate biti prijavljeni.");
  }
  return identity;
}

export const listAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const items = await ctx.db.query("items").order("desc").take(limit);
    return items;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return await ctx.db
      .query("items")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) {
      return null;
    }
    if (item.ownerId !== identity.subject) {
      throw new Error("Nemate dozvolu da pristupite ovom predmetu.");
    }
    return item;
  },
});

export const getByIdPublic = query({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) {
      return null;
    }
    return item;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    pricePerDay: v.number(),
    images: v.array(v.id("_storage")),
    availabilitySlots: v.array(
      v.object({
        startDate: v.string(),
        endDate: v.string(),
      }),
    ),
    deliveryMethods: v.array(deliveryMethodValidator),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const now = Date.now();
    return await ctx.db.insert("items", {
      ...args,
      ownerId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("items"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    pricePerDay: v.number(),
    images: v.array(v.id("_storage")),
    availabilitySlots: v.array(
      v.object({
        startDate: v.string(),
        endDate: v.string(),
      }),
    ),
    deliveryMethods: v.array(deliveryMethodValidator),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error("Predmet nije pronađen.");
    }
    if (item.ownerId !== identity.subject) {
      throw new Error("Nemate dozvolu da menjate ovaj predmet.");
    }
    // Delete old images that are no longer in the new list
    const oldImageIds = item.images.filter(
      (oldId) => !args.images.includes(oldId),
    );
    for (const oldImageId of oldImageIds) {
      await ctx.storage.delete(oldImageId);
    }
    const { id, ...rest } = args;
    await ctx.db.patch(id, {
      ...rest,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error("Predmet nije pronađen.");
    }
    if (item.ownerId !== identity.subject) {
      throw new Error("Nemate dozvolu da obrišete ovaj predmet.");
    }
    // Delete associated image files
    for (const imageId of item.images) {
      await ctx.storage.delete(imageId);
    }
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getImageUrls = query({
  args: {
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const urlMap: Record<string, string | null> = {};
    for (const storageId of args.storageIds) {
      urlMap[storageId] = await ctx.storage.getUrl(storageId);
    }
    return urlMap;
  },
});
