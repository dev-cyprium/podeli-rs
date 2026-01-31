import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";

export const getMyPreferences = query({
  args: {},
  returns: v.union(
    v.object({
      emailOnBookingRequest: v.boolean(),
      emailOnNewMessage: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!preferences) return null;

    return {
      emailOnBookingRequest: preferences.emailOnBookingRequest,
      emailOnNewMessage: preferences.emailOnNewMessage,
    };
  },
});

export const updatePreferences = mutation({
  args: {
    emailOnBookingRequest: v.optional(v.boolean()),
    emailOnNewMessage: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!preferences) {
      throw new Error("Podešavanja obaveštenja nisu pronađena. Osvežite stranicu.");
    }

    const now = Date.now();
    await ctx.db.patch(preferences._id, {
      ...(args.emailOnBookingRequest !== undefined && {
        emailOnBookingRequest: args.emailOnBookingRequest,
      }),
      ...(args.emailOnNewMessage !== undefined && {
        emailOnNewMessage: args.emailOnNewMessage,
      }),
      updatedAt: now,
    });

    return null;
  },
});

export const ensurePreferences = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) return null;

    const now = Date.now();
    await ctx.db.insert("notificationPreferences", {
      userId: identity.subject,
      emailOnBookingRequest: true,
      emailOnNewMessage: true,
      createdAt: now,
      updatedAt: now,
    });

    return null;
  },
});
