import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";

export const listForSuperAdmin = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("promotionalCodes"),
      code: v.string(),
      forPlanId: v.id("plans"),
      planName: v.string(),
      durationMonths: v.optional(v.number()),
      validUntil: v.number(),
      isUsed: v.boolean(),
      usedBy: v.optional(v.string()),
      usedByDisplayName: v.optional(v.string()),
      usedByEmail: v.optional(v.string()),
      comment: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile?.superAdmin) return [];

    const codes = await ctx.db.query("promotionalCodes").collect();
    const result = await Promise.all(
      codes.map(async (row) => {
        const plan = await ctx.db.get(row.forPlanId);
        let usedByDisplayName: string | undefined;
        let usedByEmail: string | undefined;
        const usedByUserId = row.usedBy;
        if (usedByUserId) {
          const usedByProfile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", usedByUserId))
            .first();
          if (usedByProfile) {
            usedByEmail = usedByProfile.email ?? undefined;
            if (usedByProfile.firstName != null || usedByProfile.lastName != null) {
              usedByDisplayName = [usedByProfile.firstName, usedByProfile.lastName]
                .filter(Boolean)
                .join(" ")
                .trim();
            }
          }
        }
        return {
          _id: row._id,
          code: row.code,
          forPlanId: row.forPlanId,
          planName: plan?.name ?? "—",
          durationMonths: row.durationMonths,
          validUntil: row.validUntil,
          isUsed: row.isUsed,
          usedBy: row.usedBy,
          usedByDisplayName: usedByDisplayName ?? undefined,
          usedByEmail: usedByEmail ?? undefined,
          comment: row.comment,
        };
      }),
    );
    return result.sort((a, b) => b.validUntil - a.validUntil);
  },
});

export const createPromotionalCode = mutation({
  args: {
    code: v.string(),
    forPlanId: v.id("plans"),
    durationMonths: v.number(),
    validUntil: v.number(),
    comment: v.optional(v.string()),
  },
  returns: v.id("promotionalCodes"),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile?.superAdmin) {
      throw new Error("Samo super administratori mogu da kreiraju promotivne kodove.");
    }

    const { code, forPlanId, durationMonths, validUntil, comment } = args;
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) throw new Error("Kod ne sme biti prazan.");

    const id = await ctx.db.insert("promotionalCodes", {
      code: normalizedCode,
      forPlanId,
      durationMonths,
      comment,
      validUntil,
      isUsed: false,
    });

    return id;
  },
});

export const redeemPromotionalCode = mutation({
  args: {
    code: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const normalizedCode = args.code.trim().toUpperCase();
    if (!normalizedCode) {
      throw new Error("Unesite promotivni kod.");
    }

    const promo = await ctx.db
      .query("promotionalCodes")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();

    if (!promo) {
      throw new Error("Promotivni kod nije pronađen.");
    }
    if (promo.isUsed) {
      throw new Error("Ovaj kod je već iskorišćen.");
    }
    const now = Date.now();
    if (promo.validUntil < now) {
      throw new Error("Promotivni kod je istekao.");
    }

    const plan = await ctx.db.get(promo.forPlanId);
    if (!plan) {
      throw new Error("Plan povezan sa kodom nije pronađen.");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!profile) {
      throw new Error("Profil nije pronađen. Osvežite stranicu i pokušajte ponovo.");
    }

    const durationMonths = promo.durationMonths ?? 1;
    const planExpiresAt =
      now + durationMonths * 30 * 24 * 60 * 60 * 1000;

    if (plan.maxListings !== -1) {
      const userItems = await ctx.db
        .query("items")
        .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
        .collect();

      if (userItems.length > plan.maxListings) {
        await ctx.db.insert("notifications", {
          userId: identity.subject,
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
      planSlug: plan.slug,
      planActivatedAt: now,
      planExpiresAt,
      singleListingItemId: undefined,
      hasBadge: plan.hasBadge,
      badgeLabel: plan.badgeLabel,
      updatedAt: now,
    });

    await ctx.db.patch(promo._id, {
      isUsed: true,
      usedBy: identity.subject,
    });

    return null;
  },
});
