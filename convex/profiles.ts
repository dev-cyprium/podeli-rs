import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile) return null;

    // Never expose superAdmin to clients
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally omitted from response
    const { superAdmin, ...rest } = profile;
    return rest;
  },
});

/** Returns whether the current user is a super admin. Does not expose superAdmin field. */
export const getIsCurrentUserSuperAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    return profile?.superAdmin === true;
  },
});

export const getMyPlanLimits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile) return null;

    const plan = await ctx.db.get(profile.planId);
    if (!plan) return null;

    // Count current listings
    const myItems = await ctx.db
      .query("items")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .collect();
    const listingCount = myItems.length;

    return {
      planName: plan.name,
      planSlug: plan.slug,
      maxListings: plan.maxListings,
      allowedDeliveryMethods: plan.allowedDeliveryMethods,
      hasBadge: plan.hasBadge,
      badgeLabel: plan.badgeLabel,
      listingCount,
      planExpiresAt: profile.planExpiresAt,
      listingDurationDays: plan.listingDurationDays,
      isSubscription: plan.isSubscription,
    };
  },
});

export const getProfileByUserId = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) return null;

    return {
      userId: profile.userId,
      hasBadge: profile.hasBadge,
      badgeLabel: profile.badgeLabel,
      planSlug: profile.planSlug,
      firstName: profile.firstName,
      lastName: profile.lastName,
      imageUrl: profile.imageUrl,
    };
  },
});

export const getProfilesByUserIds = query({
  args: {
    userIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const profiles = await Promise.all(
      args.userIds.map(async (userId) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first();

        if (!profile) return null;

        return {
          userId: profile.userId,
          hasBadge: profile.hasBadge,
          badgeLabel: profile.badgeLabel,
          planSlug: profile.planSlug,
        };
      })
    );

    return profiles.filter(
      (p): p is NonNullable<typeof p> => p !== null
    );
  },
});

export const ensureProfile = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    // Check if profile already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) return null;

    // Find the free plan
    const freePlan = await ctx.db
      .query("plans")
      .withIndex("by_slug", (q) => q.eq("slug", "free"))
      .first();

    if (!freePlan) {
      throw new Error("Besplatan plan nije pronađen. Pokrenite inicijalizaciju planova.");
    }

    const now = Date.now();
    await ctx.db.insert("profiles", {
      userId: identity.subject,
      planId: freePlan._id,
      planSlug: "free",
      planActivatedAt: now,
      firstName: (identity.givenName as string) ?? undefined,
      lastName: (identity.familyName as string) ?? undefined,
      email: identity.email ?? undefined,
      imageUrl: (identity.pictureUrl as string) ?? undefined,
      hasBadge: false,
      createdAt: now,
      updatedAt: now,
    });

    return null;
  },
});
