import { v, ConvexError } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";

async function requireSuperAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await requireIdentity(ctx);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .first();
  if (!profile?.superAdmin) {
    throw new ConvexError("Samo super-admin može pristupiti.");
  }
  return identity;
}

/** A category is active if status is undefined (legacy) or "active" */
function isActive(cat: { status?: "active" | "pending" }) {
  return cat.status === undefined || cat.status === "active";
}

function sortCategories<T extends { order?: number; name: string }>(
  cats: Array<T>,
): Array<T> {
  return cats.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * List all active categories, ordered by order field (or by name if order is not set)
 */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      name: v.string(),
      order: v.optional(v.number()),
      isSystem: v.optional(v.boolean()),
      createdBy: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const active = categories.filter(isActive);
    return sortCategories(active);
  },
});

/**
 * Get active category names as a simple string array
 */
export const listNames = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const active = categories.filter(isActive);
    return sortCategories(active).map((cat) => cat.name);
  },
});

/**
 * List active categories with item counts (for public pages)
 */
export const listWithItemCounts = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      name: v.string(),
      itemCount: v.number(),
      isSystem: v.optional(v.boolean()),
      createdBy: v.optional(v.string()),
      order: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const active = categories.filter(isActive);
    const results = await Promise.all(
      active.map(async (cat) => {
        const items = await ctx.db
          .query("items")
          .withIndex("by_category", (q) => q.eq("category", cat.name))
          .collect();
        return {
          _id: cat._id,
          name: cat.name,
          itemCount: items.length,
          isSystem: cat.isSystem,
          createdBy: cat.createdBy,
          order: cat.order,
        };
      }),
    );
    return sortCategories(results);
  },
});

/**
 * List ALL categories with item counts and status (super admin only)
 */
export const listAllWithItemCounts = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      name: v.string(),
      itemCount: v.number(),
      isSystem: v.optional(v.boolean()),
      createdBy: v.optional(v.string()),
      order: v.optional(v.number()),
      status: v.optional(v.union(v.literal("active"), v.literal("pending"))),
    }),
  ),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const results = await Promise.all(
      categories.map(async (cat) => {
        const items = await ctx.db
          .query("items")
          .withIndex("by_category", (q) => q.eq("category", cat.name))
          .collect();
        return {
          _id: cat._id,
          name: cat.name,
          itemCount: items.length,
          isSystem: cat.isSystem,
          createdBy: cat.createdBy,
          order: cat.order,
          status: cat.status,
        };
      }),
    );
    return sortCategories(results);
  },
});

/**
 * List the current user's pending category suggestions
 */
export const listMySuggestions = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      name: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const categories = await ctx.db.query("categories").collect();
    return categories
      .filter((c) => c.status === "pending" && c.createdBy === identity.subject)
      .map((c) => ({ _id: c._id, name: c.name, createdAt: c.createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Create a new category (super admin) — immediately active
 */
export const create = mutation({
  args: {
    name: v.string(),
    order: v.optional(v.number()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const trimmed = args.name.trim();
    if (!trimmed) {
      throw new ConvexError("Naziv kategorije ne može biti prazan.");
    }

    // Case-insensitive duplicate check (active + pending)
    const all = await ctx.db.query("categories").collect();
    const duplicate = all.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      throw new ConvexError("Kategorija sa ovim imenom već postoji.");
    }

    const now = Date.now();
    return await ctx.db.insert("categories", {
      name: trimmed,
      order: args.order,
      isSystem: false,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Suggest a new category (authenticated users).
 * If an active category with same name exists, returns it.
 * If a pending category with same name exists, tells the user.
 * Otherwise creates a new pending category awaiting admin approval.
 */
export const suggestCategory = mutation({
  args: {
    name: v.string(),
  },
  returns: v.union(
    v.object({ result: v.literal("exists"), name: v.string() }),
    v.object({ result: v.literal("already_pending"), name: v.string() }),
    v.object({ result: v.literal("created"), name: v.string() }),
  ),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const trimmed = args.name.trim();
    if (!trimmed) {
      throw new ConvexError("Naziv kategorije ne može biti prazan.");
    }

    // Case-insensitive lookup across all categories
    const all = await ctx.db.query("categories").collect();
    const existing = all.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    );

    if (existing) {
      if (isActive(existing)) {
        return { result: "exists" as const, name: existing.name };
      }
      // Already pending
      return { result: "already_pending" as const, name: existing.name };
    }

    // Create new pending category
    const now = Date.now();
    await ctx.db.insert("categories", {
      name: trimmed,
      isSystem: false,
      status: "pending",
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
    });
    return { result: "created" as const, name: trimmed };
  },
});

/**
 * Approve a pending category (super admin only) — sets status to active
 */
export const approve = mutation({
  args: {
    id: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new ConvexError("Kategorija nije pronađena.");
    }
    if (category.status !== "pending") {
      throw new ConvexError("Ova kategorija nije na čekanju.");
    }

    await ctx.db.patch(args.id, {
      status: "active",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Reject a pending category (super admin only) — deletes it
 */
export const reject = mutation({
  args: {
    id: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new ConvexError("Kategorija nije pronađena.");
    }
    if (category.status !== "pending") {
      throw new ConvexError("Ova kategorija nije na čekanju.");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Update a category (super admin only)
 * Propagates name change to all items using this category.
 */
export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new ConvexError("Kategorija nije pronađena.");
    }

    // Block renaming system categories
    if (args.name && args.name !== category.name && category.isSystem) {
      throw new ConvexError("Sistemska kategorija ne može biti preimenovana.");
    }

    // If updating name, check for duplicates (case-insensitive)
    if (args.name && args.name.trim() !== category.name) {
      const trimmed = args.name.trim();
      const all = await ctx.db.query("categories").collect();
      const duplicate = all.find(
        (c) =>
          c._id !== args.id &&
          c.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (duplicate) {
        throw new ConvexError("Kategorija sa ovim imenom već postoji.");
      }

      // Propagate rename to all items
      const items = await ctx.db
        .query("items")
        .withIndex("by_category", (q) => q.eq("category", category.name))
        .collect();
      for (const item of items) {
        await ctx.db.patch(item._id, { category: trimmed });
      }

      await ctx.db.patch(args.id, {
        name: trimmed,
        order: args.order !== undefined ? args.order : undefined,
        updatedAt: Date.now(),
      });
    } else {
      const updates: { order?: number; updatedAt: number } = {
        updatedAt: Date.now(),
      };
      if (args.order !== undefined) {
        updates.order = args.order;
      }
      await ctx.db.patch(args.id, updates);
    }

    return null;
  },
});

/**
 * Delete a category (super admin only).
 * Reassigns all items to "Ostalo" before deleting.
 * Cannot delete the "Ostalo" system category.
 */
export const remove = mutation({
  args: {
    id: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new ConvexError("Kategorija nije pronađena.");
    }

    if (category.isSystem) {
      throw new ConvexError("Sistemska kategorija ne može biti obrisana.");
    }

    // Reassign all items to "Ostalo"
    const items = await ctx.db
      .query("items")
      .withIndex("by_category", (q) => q.eq("category", category.name))
      .collect();
    for (const item of items) {
      await ctx.db.patch(item._id, { category: "Ostalo" });
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Merge source category into target (super admin only).
 * All items from source are reassigned to target, then source is deleted.
 */
export const merge = mutation({
  args: {
    sourceId: v.id("categories"),
    targetId: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    if (args.sourceId === args.targetId) {
      throw new ConvexError("Izvor i cilj ne mogu biti ista kategorija.");
    }

    const source = await ctx.db.get(args.sourceId);
    const target = await ctx.db.get(args.targetId);
    if (!source) {
      throw new ConvexError("Izvorišna kategorija nije pronađena.");
    }
    if (!target) {
      throw new ConvexError("Ciljna kategorija nije pronađena.");
    }

    if (source.isSystem) {
      throw new ConvexError("Sistemska kategorija ne može biti spojena.");
    }

    // Reassign items from source to target
    const items = await ctx.db
      .query("items")
      .withIndex("by_category", (q) => q.eq("category", source.name))
      .collect();
    for (const item of items) {
      await ctx.db.patch(item._id, { category: target.name });
    }

    await ctx.db.delete(args.sourceId);
    return null;
  },
});

/**
 * Initialize default categories if they don't exist.
 * Adds "Ostalo" as a system category.
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
          isSystem: false,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
        created++;
      } else {
        existing++;
      }
    }

    // Ensure "Ostalo" exists as system category
    const ostalo = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", "Ostalo"))
      .first();
    if (!ostalo) {
      const now = Date.now();
      await ctx.db.insert("categories", {
        name: "Ostalo",
        order: -1,
        isSystem: true,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      created++;
    } else if (!ostalo.isSystem) {
      // Mark existing "Ostalo" as system
      await ctx.db.patch(ostalo._id, { isSystem: true, order: -1 });
    }

    return { created, existing };
  },
});
