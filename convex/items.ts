import { imageFocalPointsError } from "@/lib/item-photos";
import { imageFocalPointValidator, imageFocalPointsValidator } from "./imageModel";
import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";
import schema from "./schema";
import { Id } from "./_generated/dataModel";
import {
  availabilityError,
  getBelgradeDate,
  isRangeAvailable,
} from "@/lib/rental-dates";

import { locationError, normalizeLocation } from "@/lib/item-location";

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

/**
 * Generate searchText by combining title and description (lowercase)
 */
function generateSearchText(title: string, description: string): string {
  return `${title} ${description}`.toLowerCase();
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
    const allItems = await ctx.db.query("items").order("desc").collect();

    const items = allItems;

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
      throw new ConvexError("Nemate dozvolu da pristupite ovom predmetu.");
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

    if (items.length === 0) return null;

    const item = items[0];

    return item;
  },
});

export const create = mutation({
  returns: v.id("items"),
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    city: v.string(),
    municipality: v.string(),
    pricePerDay: v.number(),
    priceByAgreement: v.optional(v.boolean()),
    deposit: v.optional(v.number()),
    images: v.array(v.id("_storage")),
    imageFocalPoint: v.optional(imageFocalPointValidator),
    imageFocalPoints: v.optional(imageFocalPointsValidator),
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

    // Publishing is free; a profile and contact preferences are still required.
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile) {
      throw new ConvexError(
        "Profil nije pronađen. Osvežite stranicu i pokušajte ponovo.",
      );
    }

    // Check preferred contact types
    const prefs = profile.preferredContactTypes ?? [];
    if (prefs.length === 0) {
      throw new ConvexError("Postavite način kontakta pre objavljivanja.");
    }

    const latestItem = await ctx.db
      .query("items")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .order("desc")
      .first();
    if (latestItem && Date.now() - latestItem.createdAt < 10_000) {
      throw new ConvexError(
        "Sačekajte 10 sekundi između objavljivanja oglasa.",
      );
    }

    const error = locationError(args.city, args.municipality);
    if (error) throw new ConvexError(error);
    const location = {
      city: args.city.trim().replace(/\s+/g, " "),
      municipality: args.municipality.trim().replace(/\s+/g, " "),
      cityKey: normalizeLocation(args.city),
      municipalityKey: normalizeLocation(args.municipality),
    };

    // Validate title
    if (!args.title.trim()) {
      throw new ConvexError("Naziv predmeta je obavezan.");
    }

    // Validate description
    if (!args.description.trim()) {
      throw new ConvexError("Opis predmeta je obavezan.");
    }

    // Validate category
    if (!args.category.trim()) {
      throw new ConvexError("Kategorija je obavezna.");
    }

    // Validate price (skip if price is by agreement)
    if (
      !args.priceByAgreement &&
      (!Number.isFinite(args.pricePerDay) || args.pricePerDay <= 0)
    ) {
      throw new ConvexError("Cena po danu mora biti veća od nule.");
    }

    if (
      args.title.length > 200 ||
      args.description.length > 10_000 ||
      args.category.length > 100
    ) {
      throw new ConvexError("Naziv, opis ili kategorija su predugački.");
    }
    if (
      args.deposit !== undefined &&
      (!Number.isFinite(args.deposit) || args.deposit < 0)
    ) {
      throw new ConvexError("Depozit mora biti pozitivan broj ili nula.");
    }

    // Validate images
    if (args.images.length === 0) {
      throw new ConvexError("Dodajte bar jednu fotografiju.");
    }
    if (args.images.length > 10) {
      throw new ConvexError("Maksimalno 10 fotografija po predmetu.");
    }

    const focalError = imageFocalPointsError(args.images, args.imageFocalPoints);
    if (focalError) throw new ConvexError(focalError);

    const validSlots = args.availabilitySlots;
    const slotError = availabilityError(validSlots);
    if (slotError) throw new ConvexError(slotError);

    // Validate delivery methods
    if (args.deliveryMethods.length === 0) {
      throw new ConvexError("Odaberite bar jedan način dostave.");
    }

    const now = Date.now();

    const itemId = await ctx.db.insert("items", {
      ...args,
      ...location,
      pricePerDay: args.priceByAgreement ? 0 : args.pricePerDay,
      availabilitySlots: validSlots,
      ownerId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });
    // Generate shortId, slug, and searchText after insert
    const shortId = extractShortId(itemId);
    const slug = generateSlug(args.title);
    const searchText = generateSearchText(args.title, args.description);
    await ctx.db.patch(itemId, {
      shortId,
      slug,
      searchText,
    });
    return itemId;
  },
});

export const update = mutation({
  returns: v.null(),
  args: {
    id: v.id("items"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    city: v.string(),
    municipality: v.string(),
    pricePerDay: v.number(),
    priceByAgreement: v.optional(v.boolean()),
    deposit: v.optional(v.number()),
    images: v.array(v.id("_storage")),
    imageFocalPoint: v.optional(imageFocalPointValidator),
    imageFocalPoints: v.optional(imageFocalPointsValidator),
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
      throw new ConvexError("Predmet nije pronađen.");
    }
    if (item.ownerId !== identity.subject) {
      throw new ConvexError("Nemate dozvolu da menjate ovaj predmet.");
    }

    const error = locationError(args.city, args.municipality);
    if (error) throw new ConvexError(error);
    const location = {
      city: args.city.trim().replace(/\s+/g, " "),
      municipality: args.municipality.trim().replace(/\s+/g, " "),
      cityKey: normalizeLocation(args.city),
      municipalityKey: normalizeLocation(args.municipality),
    };

    // Validate title
    if (!args.title.trim()) {
      throw new ConvexError("Naziv predmeta je obavezan.");
    }

    // Validate description
    if (!args.description.trim()) {
      throw new ConvexError("Opis predmeta je obavezan.");
    }

    // Validate category
    if (!args.category.trim()) {
      throw new ConvexError("Kategorija je obavezna.");
    }

    // Validate price (skip if price is by agreement)
    if (
      !args.priceByAgreement &&
      (!Number.isFinite(args.pricePerDay) || args.pricePerDay <= 0)
    ) {
      throw new ConvexError("Cena po danu mora biti veća od nule.");
    }

    if (
      args.title.length > 200 ||
      args.description.length > 10_000 ||
      args.category.length > 100
    ) {
      throw new ConvexError("Naziv, opis ili kategorija su predugački.");
    }
    if (
      args.deposit !== undefined &&
      (!Number.isFinite(args.deposit) || args.deposit < 0)
    ) {
      throw new ConvexError("Depozit mora biti pozitivan broj ili nula.");
    }

    // Validate images
    if (args.images.length === 0) {
      throw new ConvexError("Dodajte bar jednu fotografiju.");
    }
    if (args.images.length > 10) {
      throw new ConvexError("Maksimalno 10 fotografija po predmetu.");
    }

    const focalError = imageFocalPointsError(args.images, args.imageFocalPoints);
    if (focalError) throw new ConvexError(focalError);

    const validSlots = args.availabilitySlots;
    const slotError = availabilityError(validSlots);
    if (slotError) throw new ConvexError(slotError);

    // Validate delivery methods
    if (args.deliveryMethods.length === 0) {
      throw new ConvexError("Odaberite bar jedan način dostave.");
    }

    // Editing availability must preserve all accepted rental commitments.
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_item", (q) => q.eq("itemId", args.id))
      .collect();
    if (
      bookings.some(
        (booking) =>
          ACTIVE_BOOKING_STATUSES.includes(
            booking.status as (typeof ACTIVE_BOOKING_STATUSES)[number],
          ) && !isRangeAvailable(booking, validSlots),
      )
    ) {
      throw new ConvexError(
        "Dostupnost mora obuhvatiti postojeće prihvaćene rezervacije.",
      );
    }

    // Delete old images that are no longer in the new list
    const oldImageIds = item.images.filter(
      (oldId) => !args.images.includes(oldId),
    );
    for (const oldImageId of oldImageIds) {
      await ctx.storage.delete(oldImageId);
    }
    const { id, ...rest } = args;
    // Update slug and searchText if title or description changed
    const updates: {
      updatedAt: number;
      slug?: string;
      searchText?: string;
    } = {
      updatedAt: Date.now(),
    };
    if (args.title !== item.title) {
      updates.slug = generateSlug(args.title);
    }
    if (args.title !== item.title || args.description !== item.description) {
      updates.searchText = generateSearchText(args.title, args.description);
    }
    await ctx.db.patch(id, {
      ...rest,
      ...location,
      pricePerDay: args.priceByAgreement ? 0 : args.pricePerDay,
      availabilitySlots: validSlots,
      ...updates,
    });
  },
});

// Statuses that prevent item deletion (active bookings)
const ACTIVE_BOOKING_STATUSES = [
  "confirmed",
  "nije_isporucen",
  "isporucen",
] as const;

export const remove = mutation({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new ConvexError("Predmet nije pronađen.");
    }
    if (item.ownerId !== identity.subject) {
      throw new ConvexError("Nemate dozvolu da obrišete ovaj predmet.");
    }

    // Get all bookings for this item
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_item", (q) => q.eq("itemId", args.id))
      .collect();

    // Check if there are any active bookings that prevent deletion
    const activeBookings = bookings.filter((b) =>
      ACTIVE_BOOKING_STATUSES.includes(
        b.status as (typeof ACTIVE_BOOKING_STATUSES)[number],
      ),
    );

    if (activeBookings.length > 0) {
      throw new ConvexError(
        "Ne možete obrisati predmet dok postoje aktivne rezervacije. Sačekajte da se sve rezervacije završe.",
      );
    }

    // Delete non-active bookings (pending, cancelled, vracen)
    for (const booking of bookings) {
      // Delete related reviews
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .collect();
      for (const review of reviews) {
        await ctx.db.delete(review._id);
      }

      // Delete related renter reviews
      const renterReviews = await ctx.db
        .query("renterReviews")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .collect();
      for (const renterReview of renterReviews) {
        await ctx.db.delete(renterReview._id);
      }

      // Delete related messages
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .collect();
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      // Delete related chat presence records
      const chatPresences = await ctx.db
        .query("chatPresence")
        .withIndex("by_booking_and_user", (q) => q.eq("bookingId", booking._id))
        .collect();
      for (const chatPresence of chatPresences) {
        await ctx.db.delete(chatPresence._id);
      }

      // Finally delete the booking itself
      await ctx.db.delete(booking._id);
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
    // Only allow backfill by authenticated users
    await requireIdentity(ctx);
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

/**
 * Backfill searchText for existing items
 */
export const backfillSearchText = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    const allItems = await ctx.db.query("items").collect();
    let updated = 0;
    for (const item of allItems) {
      if (!item.searchText) {
        const searchText = generateSearchText(item.title, item.description);
        await ctx.db.patch(item._id, { searchText });
        updated++;
      }
    }
    return { updated, total: allItems.length };
  },
});

/**
 * Lightweight autocomplete query - returns minimal fields for dropdown suggestions
 */
export const searchAutocomplete = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.query.length < 2) {
      return [];
    }

    const results = await ctx.db
      .query("items")
      .withSearchIndex("search_items", (q) =>
        q.search("searchText", args.query),
      )
      .take(5);

    return results.map((item) => ({
      _id: item._id,
      title: item.title,
      category: item.category,
      shortId: item.shortId ?? extractShortId(item._id),
      slug: item.slug ?? generateSlug(item.title),
    }));
  },
});

/**
 * Full paginated search with optional category filter
 */
export const searchItems = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    city: v.optional(v.string()),
    municipality: v.optional(v.string()),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  returns: v.object({
    page: v.array(
      v.object({
        ...schema.tables.items.validator.fields,
        _id: v.id("items"),
        _creationTime: v.number(),
      }),
    ),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { query: searchQuery, category, paginationOpts } = args;
    const cityKey = args.city ? normalizeLocation(args.city) : undefined;
    const municipalityKey = args.municipality
      ? normalizeLocation(args.municipality)
      : undefined;
    const today = getBelgradeDate();

    // Hide items with no current or future availability.
    function filterActive<
      T extends {
        category: string;
        availabilitySlots: Array<{ startDate: string; endDate: string }>;
      },
    >(items: T[]): T[] {
      return items.filter((item) => {
        if (category && item.category !== category) return false;
        // Filter out items with no availability slots
        if (item.availabilitySlots.length === 0) {
          return false;
        }
        // Filter out items where every slot's endDate is in the past
        const hasActiveFutureSlot = item.availabilitySlots.some(
          (slot) => slot.endDate >= today,
        );
        return hasActiveFutureSlot;
      });
    }

    // If we have a search query, use the search index
    if (searchQuery && searchQuery.length >= 2) {
      const searchBuilder = ctx.db
        .query("items")
        .withSearchIndex("search_items", (q) => {
          let search = q.search("searchText", searchQuery);
          if (category) {
            search = search.eq("category", category);
          }
          if (cityKey) search = search.eq("cityKey", cityKey);
          if (municipalityKey)
            search = search.eq("municipalityKey", municipalityKey);
          return search;
        });

      // Manual pagination for search queries
      const allResults = filterActive(await searchBuilder.collect());
      const cursorIndex = paginationOpts.cursor
        ? allResults.findIndex((item) => item._id === paginationOpts.cursor)
        : -1;
      const startIndex = cursorIndex + 1;
      const pageResults = allResults.slice(
        startIndex,
        startIndex + paginationOpts.numItems,
      );
      const nextCursor =
        startIndex + paginationOpts.numItems < allResults.length
          ? (pageResults[pageResults.length - 1]?._id ?? null)
          : null;

      return {
        page: pageResults,
        continueCursor: nextCursor,
        isDone: nextCursor === null,
      };
    }

    // If no search query but category filter, use category index
    if (category || cityKey || municipalityKey) {
      const itemQuery = ctx.db.query("items");
      const locationQuery = cityKey
        ? itemQuery.withIndex("by_cityKey_and_municipalityKey", (q) => {
            const city = q.eq("cityKey", cityKey);
            return municipalityKey
              ? city.eq("municipalityKey", municipalityKey)
              : city;
          })
        : municipalityKey
          ? itemQuery.withIndex("by_municipalityKey", (q) =>
              q.eq("municipalityKey", municipalityKey),
            )
          : itemQuery.withIndex("by_category", (q) =>
              q.eq("category", category!),
            );
      const allResults = filterActive(
        await locationQuery.order("desc").collect(),
      );

      const cursorIndex = paginationOpts.cursor
        ? allResults.findIndex((item) => item._id === paginationOpts.cursor)
        : -1;
      const startIndex = cursorIndex + 1;
      const pageResults = allResults.slice(
        startIndex,
        startIndex + paginationOpts.numItems,
      );
      const nextCursor =
        startIndex + paginationOpts.numItems < allResults.length
          ? (pageResults[pageResults.length - 1]?._id ?? null)
          : null;

      return {
        page: pageResults,
        continueCursor: nextCursor,
        isDone: nextCursor === null,
      };
    }

    // Default: return all items ordered by most recent
    const allResults = filterActive(
      await ctx.db.query("items").order("desc").collect(),
    );

    const cursorIndex = paginationOpts.cursor
      ? allResults.findIndex((item) => item._id === paginationOpts.cursor)
      : -1;
    const startIndex = cursorIndex + 1;
    const pageResults = allResults.slice(
      startIndex,
      startIndex + paginationOpts.numItems,
    );
    const nextCursor =
      startIndex + paginationOpts.numItems < allResults.length
        ? (pageResults[pageResults.length - 1]?._id ?? null)
        : null;

    return {
      page: pageResults,
      continueCursor: nextCursor,
      isDone: nextCursor === null,
    };
  },
});
