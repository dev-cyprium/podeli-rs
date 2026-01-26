import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";
import { Id } from "./_generated/dataModel";

const deliveryMethodValues = ["licno", "glovo", "wolt", "cargo"] as const;

/**
 * Generate a slug from a title: lowercase, ASCII-only, dash-separated
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-ASCII characters except spaces and dashes
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes
}

/**
 * Extract the first 8 characters of a Convex ID as shortId
 */
function extractShortId(id: Id<"items">): string {
  return id.slice(0, 8);
}

const deliveryMethodValidator = v.union(
  v.literal(deliveryMethodValues[0]),
  v.literal(deliveryMethodValues[1]),
  v.literal(deliveryMethodValues[2]),
  v.literal(deliveryMethodValues[3]),
);

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

/**
 * Query for sitemap generation - returns all items with minimal fields
 * No authentication required, public data only
 */
export const listForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("items")
      .order("desc")
      .collect();
    
    // Return only the fields needed for sitemap
    return items.map((item) => ({
      _id: item._id,
      title: item.title,
      shortId: item.shortId ?? extractShortId(item._id),
      slug: item.slug ?? generateSlug(item.title),
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
    }));
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

/**
 * Resolve item by shortId
 */
export const getByShortId = query({
  args: {
    shortId: v.string(),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .collect();

    return items.length > 0 ? items[0] : null;
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
    const itemId = await ctx.db.insert("items", {
      ...args,
      ownerId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });
    // Generate shortId and slug after insert to get the full ID
    const shortId = extractShortId(itemId);
    const slug = generateSlug(args.title);
    await ctx.db.patch(itemId, {
      shortId,
      slug,
    });
    return itemId;
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
    // Update slug if title changed
    const updates: {
      updatedAt: number;
      slug?: string;
    } = {
      updatedAt: Date.now(),
    };
    if (args.title !== item.title) {
      updates.slug = generateSlug(args.title);
    }
    await ctx.db.patch(id, {
      ...rest,
      ...updates,
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

/**
 * Backfill shortId and slug for existing items that don't have them
 * This is safe to run multiple times - it only updates items missing these fields
 */
export const backfillShortIdAndSlug = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    // Only allow backfill by authenticated users (you may want to restrict this further)
    const allItems = await ctx.db.query("items").collect();
    let updated = 0;
    for (const item of allItems) {
      const needsUpdate = !item.shortId || !item.slug;
      if (needsUpdate) {
        const shortId = item.shortId ?? extractShortId(item._id);
        const slug = item.slug ?? generateSlug(item.title);
        await ctx.db.patch(item._id, {
          shortId,
          slug,
        });
        updated++;
      }
    }
    return { updated, total: allItems.length };
  },
});
