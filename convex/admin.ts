import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/** Set superAdmin flag on a profile. Call from Convex dashboard only. */
export const setSuperAdmin = internalMutation({
  args: {
    userId: v.string(),
    superAdmin: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error(`Profil za korisnika "${args.userId}" nije pronađen.`);
    }

    await ctx.db.patch(profile._id, {
      superAdmin: args.superAdmin,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const setUserPlan = internalMutation({
  args: {
    userId: v.string(),
    planSlug: v.string(),
    singleListingItemId: v.optional(v.id("items")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_slug", (q) => q.eq("slug", args.planSlug))
      .first();

    if (!plan) {
      throw new Error(`Plan "${args.planSlug}" nije pronađen.`);
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error(`Profil za korisnika "${args.userId}" nije pronađen.`);
    }

    const now = Date.now();

    // Calculate expiry for single_listing plan
    let planExpiresAt: number | undefined;
    if (args.planSlug === "single_listing" && plan.listingDurationDays) {
      planExpiresAt = now + plan.listingDurationDays * 24 * 60 * 60 * 1000;
    }

    // Check if downgrade with excess listings
    if (plan.maxListings !== -1) {
      const userItems = await ctx.db
        .query("items")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
        .collect();

      if (userItems.length > plan.maxListings) {
        await ctx.db.insert("notifications", {
          userId: args.userId,
          message: `Vaš plan je promenjen na "${plan.name}". Imate ${userItems.length} oglas(a), a dozvoljeno je ${plan.maxListings}. Nećete moći da kreirate nove oglase dok ne smanjite broj.`,
          type: "plan_changed",
          link: "/kontrolna-tabla/predmeti",
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(profile._id, {
      planId: plan._id,
      planSlug: args.planSlug,
      planActivatedAt: now,
      planExpiresAt,
      singleListingItemId: args.singleListingItemId,
      hasBadge: plan.hasBadge,
      badgeLabel: plan.badgeLabel,
      updatedAt: now,
    });

    return null;
  },
});

export const migrateExistingUsers = internalMutation({
  args: {},
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const lifetimePlan = await ctx.db
      .query("plans")
      .withIndex("by_slug", (q) => q.eq("slug", "lifetime"))
      .first();

    if (!lifetimePlan) {
      throw new Error(
        "Doživotni plan nije pronađen. Pokrenite inicijalizaciju planova prvo.",
      );
    }

    // Get all unique owner IDs from items
    const allItems = await ctx.db.query("items").collect();
    const uniqueOwnerIds = [...new Set(allItems.map((item) => item.ownerId))];

    let migrated = 0;
    let skipped = 0;

    for (const ownerId of uniqueOwnerIds) {
      const existingProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", ownerId))
        .first();

      if (existingProfile) {
        skipped++;
        continue;
      }

      const now = Date.now();
      await ctx.db.insert("profiles", {
        userId: ownerId,
        planId: lifetimePlan._id,
        planSlug: "lifetime",
        planActivatedAt: now,
        hasBadge: true,
        badgeLabel: "DOMACIN",
        createdAt: now,
        updatedAt: now,
      });
      migrated++;
    }

    return { migrated, skipped };
  },
});
