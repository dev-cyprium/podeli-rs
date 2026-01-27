import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * List all categories, ordered by order field (or by name if order is not set)
 */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      name: v.string(),
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    // Sort by order if present, otherwise by name
    return categories.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

/**
 * Get category names as a simple string array
 */
export const listNames = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    // Sort by order if present, otherwise by name
    const sorted = categories.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
    return sorted.map((cat) => cat.name);
  },
});

/**
 * Create a new category
 */
export const create = mutation({
  args: {
    name: v.string(),
    order: v.optional(v.number()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    // Check if category with this name already exists
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (existing) {
      throw new Error("Kategorija sa ovim imenom već postoji.");
    }

    const now = Date.now();
    return await ctx.db.insert("categories", {
      name: args.name,
      order: args.order,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a category
 */
export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new Error("Kategorija nije pronađena.");
    }

    // If updating name, check for duplicates
    if (args.name && args.name !== category.name) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_name", (q) => q.eq("name", args.name))
        .first();
      if (existing) {
        throw new Error("Kategorija sa ovim imenom već postoji.");
      }
    }

    const updates: {
      name?: string;
      order?: number;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.order !== undefined) {
      updates.order = args.order;
    }

    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/**
 * Delete a category
 */
export const remove = mutation({
  args: {
    id: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new Error("Kategorija nije pronađena.");
    }

    // Check if any items are using this category
    const itemsUsingCategory = await ctx.db
      .query("items")
      .withIndex("by_category", (q) => q.eq("category", category.name))
      .first();

    if (itemsUsingCategory) {
      throw new Error(
        "Ne možete obrisati kategoriju koja se koristi u predmetima.",
      );
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Initialize default categories if they don't exist
 * This can be called to seed the database with initial categories
 */
export const initializeDefaults = mutation({
  args: {},
  returns: v.object({
    created: v.number(),
    existing: v.number(),
  }),
  handler: async (ctx) => {
    const defaultCategories = [
      "Alati",
      "Kampovanje",
      "Elektronika",
      "Društvene igre",
      "Prevoz",
    ];

    let created = 0;
    let existing = 0;

    for (let i = 0; i < defaultCategories.length; i++) {
      const name = defaultCategories[i];
      const existingCategory = await ctx.db
        .query("categories")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first();

      if (!existingCategory) {
        const now = Date.now();
        await ctx.db.insert("categories", {
          name,
          order: i,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      } else {
        existing++;
      }
    }

    return { created, existing };
  },
});
