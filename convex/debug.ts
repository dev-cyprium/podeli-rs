import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";

const TIME_OVERRIDE_KEY = "timeOverride";

/**
 * Get the current debug time override (if set)
 * Returns null if no override is set
 */
export const getTimeOverride = query({
  args: {},
  handler: async (ctx) => {
    const override = await ctx.db
      .query("debugSettings")
      .withIndex("by_key", (q) => q.eq("key", TIME_OVERRIDE_KEY))
      .first();

    if (!override) return null;

    return {
      timestamp: parseInt(override.value),
      updatedAt: override.updatedAt,
    };
  },
});

/**
 * Set a time override for testing (super-admin only)
 */
export const setTimeOverride = mutation({
  args: {
    timestamp: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    // Check if user is super-admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile?.superAdmin) {
      throw new Error("Samo super-admin može menjati vreme.");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("debugSettings")
      .withIndex("by_key", (q) => q.eq("key", TIME_OVERRIDE_KEY))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.timestamp.toString(),
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("debugSettings", {
        key: TIME_OVERRIDE_KEY,
        value: args.timestamp.toString(),
        updatedAt: now,
      });
    }

    return null;
  },
});

/**
 * Clear the time override (super-admin only)
 */
export const clearTimeOverride = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    // Check if user is super-admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile?.superAdmin) {
      throw new Error("Samo super-admin može menjati vreme.");
    }

    const existing = await ctx.db
      .query("debugSettings")
      .withIndex("by_key", (q) => q.eq("key", TIME_OVERRIDE_KEY))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return null;
  },
});
