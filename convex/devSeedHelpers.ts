import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// --- Helpers (copied from items.ts to avoid circular deps) ---

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractShortId(id: Id<"items">): string {
  return id.slice(0, 8);
}

// --- Wipe ---

export const wipeBatch = internalMutation({
  args: {
    table: v.string(),
  },
  returns: v.object({
    deleted: v.number(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const tableName = args.table;
    let deleted = 0;

    if (tableName === "_storage") {
      const files = await ctx.db.system.query("_storage").take(500);
      for (const file of files) {
        await ctx.storage.delete(file._id);
        deleted++;
      }
      return { deleted, isDone: files.length < 500 };
    }

    // For regular tables, use a type-safe approach per table
    // We need to cast because Convex doesn't allow dynamic table names in the typed API
    const docs = await (ctx.db.query(tableName as "items") as ReturnType<typeof ctx.db.query>)
      .take(500);

    for (const doc of docs) {
      // For items table, also delete associated storage files
      if (tableName === "items") {
        const item = doc as { images?: Array<Id<"_storage">> };
        if (item.images) {
          for (const imageId of item.images) {
            try {
              await ctx.storage.delete(imageId);
            } catch {
              // Image may already be deleted
            }
          }
        }
      }
      await ctx.db.delete(doc._id);
      deleted++;
    }

    return { deleted, isDone: docs.length < 500 };
  },
});

// --- Upload URL ---

export const generateUploadUrlInternal = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// --- Batch Inserts ---

const itemValidator = v.object({
  ownerId: v.string(),
  title: v.string(),
  description: v.string(),
  category: v.string(),
  pricePerDay: v.number(),
  priceByAgreement: v.optional(v.boolean()),
  deposit: v.optional(v.number()),
  images: v.array(v.id("_storage")),
  availabilitySlots: v.array(
    v.object({ startDate: v.string(), endDate: v.string() })
  ),
  deliveryMethods: v.array(v.string()),
  imageFocalPoint: v.optional(v.object({ x: v.number(), y: v.number() })),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const insertItemsBatch = internalMutation({
  args: {
    items: v.array(itemValidator),
  },
  returns: v.array(v.id("items")),
  handler: async (ctx, args) => {
    const ids: Array<Id<"items">> = [];
    for (const item of args.items) {
      const itemId = await ctx.db.insert("items", item);
      const shortId = extractShortId(itemId);
      const slug = generateSlug(item.title);
      const searchText = `${item.title} ${item.description}`.toLowerCase();
      await ctx.db.patch(itemId, { shortId, slug, searchText });
      ids.push(itemId);
    }
    return ids;
  },
});

const bookingValidator = v.object({
  itemId: v.id("items"),
  renterId: v.string(),
  ownerId: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  totalDays: v.number(),
  pricePerDay: v.number(),
  totalPrice: v.number(),
  deliveryMethod: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("confirmed"),
    v.literal("nije_isporucen"),
    v.literal("isporucen"),
    v.literal("vracen"),
    v.literal("cancelled"),
  ),
  renterAgreed: v.optional(v.boolean()),
  ownerAgreed: v.optional(v.boolean()),
  agreedAt: v.optional(v.number()),
  deliveredAt: v.optional(v.number()),
  returnedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const insertBookingsBatch = internalMutation({
  args: {
    bookings: v.array(bookingValidator),
  },
  returns: v.array(v.id("bookings")),
  handler: async (ctx, args) => {
    const ids: Array<Id<"bookings">> = [];
    for (const booking of args.bookings) {
      const id = await ctx.db.insert("bookings", booking);
      ids.push(id);
    }
    return ids;
  },
});

const reviewValidator = v.object({
  itemId: v.id("items"),
  bookingId: v.id("bookings"),
  reviewerId: v.string(),
  rating: v.number(),
  comment: v.string(),
  createdAt: v.number(),
});

export const insertReviewsBatch = internalMutation({
  args: {
    reviews: v.array(reviewValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const review of args.reviews) {
      await ctx.db.insert("reviews", review);
    }
    return null;
  },
});

const renterReviewValidator = v.object({
  bookingId: v.id("bookings"),
  renterId: v.string(),
  ownerId: v.string(),
  rating: v.number(),
  comment: v.optional(v.string()),
  createdAt: v.number(),
});

export const insertRenterReviewsBatch = internalMutation({
  args: {
    reviews: v.array(renterReviewValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const review of args.reviews) {
      await ctx.db.insert("renterReviews", review);
    }
    return null;
  },
});

const messageValidator = v.object({
  bookingId: v.id("bookings"),
  senderId: v.string(),
  content: v.string(),
  read: v.boolean(),
  type: v.optional(v.union(v.literal("user"), v.literal("system"))),
  createdAt: v.number(),
});

export const insertMessagesBatch = internalMutation({
  args: {
    messages: v.array(messageValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const msg of args.messages) {
      await ctx.db.insert("messages", msg);
    }
    return null;
  },
});

const favoriteValidator = v.object({
  userId: v.string(),
  itemId: v.id("items"),
  createdAt: v.number(),
});

export const insertFavoritesBatch = internalMutation({
  args: {
    favorites: v.array(favoriteValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const fav of args.favorites) {
      await ctx.db.insert("favorites", fav);
    }
    return null;
  },
});

const notificationValidator = v.object({
  userId: v.string(),
  message: v.string(),
  read: v.optional(v.boolean()),
  type: v.optional(
    v.union(
      v.literal("booking_pending"),
      v.literal("booking_approved"),
      v.literal("booking_rejected"),
      v.literal("plan_changed"),
      v.literal("system"),
      v.literal("message_received"),
      v.literal("agreement_requested"),
      v.literal("booking_agreed"),
      v.literal("item_delivered"),
      v.literal("return_reminder"),
      v.literal("item_returned"),
      v.literal("renter_reviewed"),
    ),
  ),
  link: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const insertNotificationsBatch = internalMutation({
  args: {
    notifications: v.array(notificationValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const notif of args.notifications) {
      await ctx.db.insert("notifications", notif);
    }
    return null;
  },
});

const profileValidator = v.object({
  userId: v.string(),
  planId: v.id("plans"),
  planSlug: v.string(),
  planActivatedAt: v.number(),
  planExpiresAt: v.optional(v.number()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  email: v.optional(v.string()),
  hasBadge: v.boolean(),
  badgeLabel: v.optional(v.string()),
  preferredContactTypes: v.optional(
    v.array(
      v.union(
        v.literal("chat"),
        v.literal("email"),
        v.literal("phone"),
      )
    )
  ),
  phoneNumber: v.optional(v.string()),
  defaultDashboardMode: v.optional(
    v.union(v.literal("podeli"), v.literal("zakupi"))
  ),
  superAdmin: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const insertProfiles = internalMutation({
  args: {
    profiles: v.array(profileValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const profile of args.profiles) {
      await ctx.db.insert("profiles", profile);
    }
    return null;
  },
});

const categoryValidator = v.object({
  name: v.string(),
  order: v.optional(v.number()),
  isSystem: v.optional(v.boolean()),
  createdBy: v.optional(v.string()),
  status: v.optional(v.union(v.literal("active"), v.literal("pending"))),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const insertCategories = internalMutation({
  args: {
    categories: v.array(categoryValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const cat of args.categories) {
      // Idempotent: skip if category with this name exists
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_name", (q) => q.eq("name", cat.name))
        .first();
      if (!existing) {
        await ctx.db.insert("categories", cat);
      }
    }
    return null;
  },
});
