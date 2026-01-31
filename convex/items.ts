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
    const items = await ctx.db.query("items").order("desc").take(limit + 50);
    // Filter out expired single listing items
    const now = Date.now();
    const activeItems = items.filter(
      (item) => !item.singleListingExpiresAt || item.singleListingExpiresAt > now
    );
    return activeItems.slice(0, limit);
  },
});

/**
 * Query for sitemap generation - returns all items with minimal fields
 * No authentication required, public data only
 */
export const listForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const allItems = await ctx.db
      .query("items")
      .order("desc")
      .collect();

    // Filter out expired single listing items
    const now = Date.now();
    const items = allItems.filter(
      (item) => !item.singleListingExpiresAt || item.singleListingExpiresAt > now
    );

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

    if (items.length === 0) return null;

    const item = items[0];
    // Filter expired single listing items from public view
    if (item.singleListingExpiresAt && item.singleListingExpiresAt <= Date.now()) {
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

    // --- Plan enforcement ---
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile) {
      throw new Error("Profil nije pronađen. Osvežite stranicu i pokušajte ponovo.");
    }

    const plan = await ctx.db.get(profile.planId);
    if (!plan) {
      throw new Error("Plan nije pronađen.");
    }

    // Check preferred contact types
    const prefs = profile.preferredContactTypes ?? [];
    if (prefs.length === 0) {
      throw new Error("Postavite način kontakta pre objavljivanja.");
    }

    // Check single listing expiration
    if (profile.planSlug === "single_listing" && profile.planExpiresAt && profile.planExpiresAt < Date.now()) {
      throw new Error("Vaš pojedinačni oglas je istekao. Nadogradite plan da biste kreirali nove oglase.");
    }

    // Check listing count vs maxListings
    if (plan.maxListings !== -1) {
      const myItems = await ctx.db
        .query("items")
        .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
        .collect();

      if (myItems.length >= plan.maxListings) {
        throw new Error(
          `Dostigli ste limit od ${plan.maxListings} oglas(a) za vaš "${plan.name}" plan. Nadogradite plan za više oglasa.`
        );
      }
    }

    // Check delivery methods against plan allowed methods
    for (const method of args.deliveryMethods) {
      if (!plan.allowedDeliveryMethods.includes(method)) {
        throw new Error(
          `Način dostave "${method}" nije dostupan za vaš "${plan.name}" plan. Nadogradite plan za dodatne opcije dostave.`
        );
      }
    }

    // Validate title
    if (!args.title.trim()) {
      throw new Error("Naziv predmeta je obavezan.");
    }

    // Validate description
    if (!args.description.trim()) {
      throw new Error("Opis predmeta je obavezan.");
    }

    // Validate category
    if (!args.category.trim()) {
      throw new Error("Kategorija je obavezna.");
    }

    // Validate price
    if (Number.isNaN(args.pricePerDay) || args.pricePerDay <= 0) {
      throw new Error("Cena po danu mora biti veća od nule.");
    }

    // Validate images
    if (args.images.length === 0) {
      throw new Error("Dodajte bar jednu fotografiju.");
    }
    if (args.images.length > 1) {
      throw new Error("Dozvoljena je samo jedna fotografija.");
    }

    // Validate availability slots
    const validSlots = args.availabilitySlots.filter(
      (slot) => slot.startDate && slot.endDate,
    );
    if (validSlots.length === 0) {
      throw new Error("Dodajte bar jedan termin dostupnosti.");
    }

    // Validate delivery methods
    if (args.deliveryMethods.length === 0) {
      throw new Error("Odaberite bar jedan način dostave.");
    }

    const now = Date.now();

    // Set single listing expiration if applicable
    let singleListingExpiresAt: number | undefined;
    if (profile.planSlug === "single_listing" && plan.listingDurationDays) {
      singleListingExpiresAt = now + plan.listingDurationDays * 24 * 60 * 60 * 1000;
    }

    const itemId = await ctx.db.insert("items", {
      ...args,
      availabilitySlots: validSlots,
      ownerId: identity.subject,
      singleListingExpiresAt,
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

    // --- Plan enforcement: delivery method restriction ---
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (profile) {
      const plan = await ctx.db.get(profile.planId);
      if (plan) {
        for (const method of args.deliveryMethods) {
          if (!plan.allowedDeliveryMethods.includes(method)) {
            throw new Error(
              `Način dostave "${method}" nije dostupan za vaš "${plan.name}" plan. Nadogradite plan za dodatne opcije dostave.`
            );
          }
        }
      }
    }

    // Validate title
    if (!args.title.trim()) {
      throw new Error("Naziv predmeta je obavezan.");
    }

    // Validate description
    if (!args.description.trim()) {
      throw new Error("Opis predmeta je obavezan.");
    }

    // Validate category
    if (!args.category.trim()) {
      throw new Error("Kategorija je obavezna.");
    }

    // Validate price
    if (Number.isNaN(args.pricePerDay) || args.pricePerDay <= 0) {
      throw new Error("Cena po danu mora biti veća od nule.");
    }

    // Validate images
    if (args.images.length === 0) {
      throw new Error("Dodajte bar jednu fotografiju.");
    }
    if (args.images.length > 1) {
      throw new Error("Dozvoljena je samo jedna fotografija.");
    }

    // Validate availability slots
    const validSlots = args.availabilitySlots.filter(
      (slot) => slot.startDate && slot.endDate,
    );
    if (validSlots.length === 0) {
      throw new Error("Dodajte bar jedan termin dostupnosti.");
    }

    // Validate delivery methods
    if (args.deliveryMethods.length === 0) {
      throw new Error("Odaberite bar jedan način dostave.");
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
      availabilitySlots: validSlots,
      ...updates,
    });
  },
});

// Statuses that prevent item deletion (active bookings)
const ACTIVE_BOOKING_STATUSES = [
  "confirmed",
  "agreed",
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
      throw new Error("Predmet nije pronađen.");
    }
    if (item.ownerId !== identity.subject) {
      throw new Error("Nemate dozvolu da obrišete ovaj predmet.");
    }

    // Get all bookings for this item
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_item", (q) => q.eq("itemId", args.id))
      .collect();

    // Check if there are any active bookings that prevent deletion
    const activeBookings = bookings.filter((b) =>
      ACTIVE_BOOKING_STATUSES.includes(b.status as typeof ACTIVE_BOOKING_STATUSES[number])
    );

    if (activeBookings.length > 0) {
      throw new Error(
        "Ne možete obrisati predmet dok postoje aktivne rezervacije. Sačekajte da se sve rezervacije završe."
      );
    }

    // Delete non-active bookings (pending, cancelled, vracen)
    for (const booking of bookings) {
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
      .withSearchIndex("search_items", (q) => q.search("searchText", args.query))
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
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery, category, paginationOpts } = args;
    const now = Date.now();

    // Helper to filter expired single listing items
    function filterActive<T extends { singleListingExpiresAt?: number }>(items: T[]): T[] {
      return items.filter((item) => !item.singleListingExpiresAt || item.singleListingExpiresAt > now);
    }

    // If we have a search query, use the search index
    if (searchQuery && searchQuery.length >= 2) {
      const searchBuilder = ctx.db
        .query("items")
        .withSearchIndex("search_items", (q) => {
          const search = q.search("searchText", searchQuery);
          if (category) {
            return search.eq("category", category);
          }
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
        startIndex + paginationOpts.numItems
      );
      const nextCursor =
        startIndex + paginationOpts.numItems < allResults.length
          ? pageResults[pageResults.length - 1]?._id ?? null
          : null;

      return {
        page: pageResults,
        continueCursor: nextCursor,
        isDone: nextCursor === null,
      };
    }

    // If no search query but category filter, use category index
    if (category) {
      const allResults = filterActive(
        await ctx.db
          .query("items")
          .withIndex("by_category", (q) => q.eq("category", category))
          .order("desc")
          .collect()
      );

      const cursorIndex = paginationOpts.cursor
        ? allResults.findIndex((item) => item._id === paginationOpts.cursor)
        : -1;
      const startIndex = cursorIndex + 1;
      const pageResults = allResults.slice(
        startIndex,
        startIndex + paginationOpts.numItems
      );
      const nextCursor =
        startIndex + paginationOpts.numItems < allResults.length
          ? pageResults[pageResults.length - 1]?._id ?? null
          : null;

      return {
        page: pageResults,
        continueCursor: nextCursor,
        isDone: nextCursor === null,
      };
    }

    // Default: return all items ordered by most recent
    const allResults = filterActive(await ctx.db.query("items").order("desc").collect());

    const cursorIndex = paginationOpts.cursor
      ? allResults.findIndex((item) => item._id === paginationOpts.cursor)
      : -1;
    const startIndex = cursorIndex + 1;
    const pageResults = allResults.slice(
      startIndex,
      startIndex + paginationOpts.numItems
    );
    const nextCursor =
      startIndex + paginationOpts.numItems < allResults.length
        ? pageResults[pageResults.length - 1]?._id ?? null
        : null;

    return {
      page: pageResults,
      continueCursor: nextCursor,
      isDone: nextCursor === null,
    };
  },
});
