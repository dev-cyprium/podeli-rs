import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    return plans.sort((a, b) => a.order - b.order);
  },
});

export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plans")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const initializeDefaults = mutation({
  args: {},
  returns: v.object({
    created: v.number(),
    existing: v.number(),
  }),
  handler: async (ctx) => {
    const defaultPlans = [
      {
        slug: "free",
        name: "Besplatno",
        description: "Savršen za početnike koji žele da isprobaju platformu.",
        maxListings: 1,
        maxActiveRentals: 1,
        allowedDeliveryMethods: ["licno"],
        hasBadge: false,
        priceAmount: 0,
        priceCurrency: "RSD",
        priceInterval: "mesečno",
        isSubscription: false,
        order: 0,
      },
      {
        slug: "starter",
        name: "Starter",
        description: "Za aktivne korisnike koji žele više oglasa i kurirsku dostavu.",
        maxListings: 5,
        maxActiveRentals: -1,
        allowedDeliveryMethods: ["licno", "glovo", "wolt", "cargo"],
        hasBadge: false,
        priceAmount: 250,
        priceCurrency: "RSD",
        priceInterval: "mesečno",
        isSubscription: true,
        order: 1,
      },
      {
        slug: "ultimate",
        name: "Ultimate",
        description: "Bez ograničenja. Neograničen broj oglasa i zakupa.",
        maxListings: -1,
        maxActiveRentals: -1,
        allowedDeliveryMethods: ["licno", "glovo", "wolt", "cargo"],
        hasBadge: false,
        priceAmount: 500,
        priceCurrency: "RSD",
        priceInterval: "mesečno",
        isSubscription: true,
        order: 2,
      },
      {
        slug: "lifetime",
        name: "Doživotni",
        description: "Jednokratno plaćanje za doživotni pristup svim funkcijama. DOMACIN bedž uključen.",
        maxListings: -1,
        maxActiveRentals: -1,
        allowedDeliveryMethods: ["licno", "glovo", "wolt", "cargo"],
        hasBadge: true,
        badgeLabel: "DOMACIN",
        priceAmount: 300,
        priceCurrency: "EUR",
        priceInterval: "jednokratno",
        isSubscription: false,
        order: 3,
      },
      {
        slug: "single_listing",
        name: "Pojedinačni oglas",
        description: "Jedan oglas na 30 dana. Idealan za jednokratno iznajmljivanje.",
        maxListings: 1,
        maxActiveRentals: 1,
        allowedDeliveryMethods: ["licno"],
        hasBadge: false,
        priceAmount: 100,
        priceCurrency: "RSD",
        priceInterval: "po oglasu",
        isSubscription: false,
        listingDurationDays: 30,
        order: 4,
      },
    ];

    let created = 0;
    let existing = 0;

    for (const plan of defaultPlans) {
      const existingPlan = await ctx.db
        .query("plans")
        .withIndex("by_slug", (q) => q.eq("slug", plan.slug))
        .first();

      if (!existingPlan) {
        const now = Date.now();
        await ctx.db.insert("plans", {
          ...plan,
          isActive: true,
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
