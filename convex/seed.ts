import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Seed the database with test data for local development.
 *
 * Run with: npx convex run seed:default
 *
 * Idempotent — returns early if seed data already exists.
 */

// Fake user IDs (these won't match real Clerk users, but bookings/items will show up
// for the currently logged-in user if you replace OWNER_ID with your actual Clerk subject)
const OWNER_ID = "seed_owner_001";
const RENTER_1 = "seed_renter_001";
const RENTER_2 = "seed_renter_002";
const RENTER_3 = "seed_renter_003";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractShortId(id: Id<"items">): string {
  return id.slice(0, 8);
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const seed = internalMutation({
  args: {
    ownerIdOverride: v.optional(v.string()),
  },
  returns: v.object({
    seeded: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const ownerId = args.ownerIdOverride ?? OWNER_ID;

    // Idempotency check: skip if we already have seed items
    const existingItems = await ctx.db
      .query("items")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect();

    if (existingItems.length > 0) {
      return { seeded: false, message: "Seed data already exists. Skipping." };
    }

    const now = Date.now();

    // --- 1. Ensure plans exist ---
    let freePlan = await ctx.db
      .query("plans")
      .withIndex("by_slug", (q) => q.eq("slug", "free"))
      .first();

    if (!freePlan) {
      const planId = await ctx.db.insert("plans", {
        slug: "free",
        name: "Besplatno",
        description: "Savršen za početnike.",
        maxListings: 1,
        maxActiveRentals: 1,
        allowedDeliveryMethods: ["licno"],
        hasBadge: false,
        priceAmount: 0,
        priceCurrency: "RSD",
        priceInterval: "mesečno",
        isSubscription: false,
        order: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      freePlan = await ctx.db.get(planId);
    }

    let starterPlan = await ctx.db
      .query("plans")
      .withIndex("by_slug", (q) => q.eq("slug", "starter"))
      .first();

    if (!starterPlan) {
      const planId = await ctx.db.insert("plans", {
        slug: "starter",
        name: "Starter",
        description: "Za aktivne korisnike.",
        maxListings: 5,
        maxActiveRentals: -1,
        allowedDeliveryMethods: ["licno"],
        hasBadge: false,
        priceAmount: 250,
        priceCurrency: "RSD",
        priceInterval: "mesečno",
        isSubscription: true,
        order: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      starterPlan = await ctx.db.get(planId);
    }

    // --- 2. Create profiles ---
    const ownerPlanId = starterPlan!._id;

    await ctx.db.insert("profiles", {
      userId: ownerId,
      planId: ownerPlanId,
      planSlug: "starter",
      planActivatedAt: now,
      firstName: "Stefan",
      lastName: "Vlasnik",
      email: "stefan@test.rs",
      hasBadge: false,
      preferredContactTypes: ["chat"],
      createdAt: now,
      updatedAt: now,
    });

    const renters = [
      { id: RENTER_1, firstName: "Marko", lastName: "Petrović" },
      { id: RENTER_2, firstName: "Ana", lastName: "Jovanović" },
      { id: RENTER_3, firstName: "Nikola", lastName: "Đorđević" },
    ];

    for (const renter of renters) {
      await ctx.db.insert("profiles", {
        userId: renter.id,
        planId: freePlan!._id,
        planSlug: "free",
        planActivatedAt: now,
        firstName: renter.firstName,
        lastName: renter.lastName,
        email: `${renter.firstName.toLowerCase()}@test.rs`,
        hasBadge: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    // --- 3. Create categories ---
    const categoryNames = ["Alati", "Sport", "Elektronika", "Kamp oprema", "Ostalo"];
    for (let i = 0; i < categoryNames.length; i++) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_name", (q) => q.eq("name", categoryNames[i]))
        .first();
      if (!existing) {
        await ctx.db.insert("categories", {
          name: categoryNames[i],
          order: i,
          isSystem: categoryNames[i] === "Ostalo",
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // --- 4. Create items ---
    const itemsData = [
      {
        title: "Bušilica Bosch Professional",
        description:
          "Bosch profesionalna bušilica sa setom burgija. Idealna za kućne projekte i renoviranje.",
        category: "Alati",
        pricePerDay: 500,
        deliveryMethods: ["licno"],
      },
      {
        title: "Šator Coleman 4-Person",
        description:
          "Prostran šator za 4 osobe sa zaštitom od kiše. Savršen za vikend kampovanje.",
        category: "Kamp oprema",
        pricePerDay: 800,
        deliveryMethods: ["licno"],
      },
      {
        title: "Bicikl Trek Marlin 5",
        description:
          "Mountain bike u odličnom stanju. 27.5 inča točkovi, 21 brzina. Za staze i gradske vožnje.",
        category: "Sport",
        pricePerDay: 1200,
        deposit: 5000,
        deliveryMethods: ["licno"],
      },
      {
        title: "Projektor Epson EB-U05",
        description:
          "Full HD projektor za prezentacije ili kućni bioskop. 3400 lumena, HDMI ulaz.",
        category: "Elektronika",
        pricePerDay: 1500,
        deliveryMethods: ["licno"],
      },
    ];

    const itemIds: Array<Id<"items">> = [];

    for (const data of itemsData) {
      const itemId = await ctx.db.insert("items", {
        ownerId,
        title: data.title,
        description: data.description,
        category: data.category,
        pricePerDay: data.pricePerDay,
        deposit: data.deposit,
        images: [], // No images in seed (no file storage)
        availabilitySlots: [
          { startDate: daysFromNow(-30), endDate: daysFromNow(90) },
        ],
        deliveryMethods: data.deliveryMethods,
        searchText: `${data.title} ${data.description}`.toLowerCase(),
        createdAt: now,
        updatedAt: now,
      });

      // Backfill shortId and slug
      const shortId = extractShortId(itemId);
      const slug = generateSlug(data.title);
      await ctx.db.patch(itemId, { shortId, slug });

      itemIds.push(itemId);
    }

    // --- 5. Create bookings (various statuses for each item) ---
    const [bosilica, sator, bicikl, projektor] = itemIds;

    // Bušilica: 1 pending, 1 confirmed, 1 completed
    await ctx.db.insert("bookings", {
      itemId: bosilica,
      renterId: RENTER_1,
      ownerId,
      startDate: daysFromNow(3),
      endDate: daysFromNow(7),
      totalDays: 5,
      pricePerDay: 500,
      totalPrice: 2500,
      deliveryMethod: "licno",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("bookings", {
      itemId: bosilica,
      renterId: RENTER_2,
      ownerId,
      startDate: daysFromNow(-2),
      endDate: daysFromNow(3),
      totalDays: 6,
      pricePerDay: 500,
      totalPrice: 3000,
      deliveryMethod: "licno",
      status: "confirmed",
      renterAgreed: true,
      ownerAgreed: false,
      createdAt: now - 86400000,
      updatedAt: now,
    });

    await ctx.db.insert("bookings", {
      itemId: bosilica,
      renterId: RENTER_3,
      ownerId,
      startDate: daysFromNow(-20),
      endDate: daysFromNow(-15),
      totalDays: 6,
      pricePerDay: 500,
      totalPrice: 3000,
      deliveryMethod: "licno",
      status: "vracen",
      renterAgreed: true,
      ownerAgreed: true,
      agreedAt: now - 86400000 * 20,
      deliveredAt: now - 86400000 * 20,
      returnedAt: now - 86400000 * 15,
      createdAt: now - 86400000 * 25,
      updatedAt: now - 86400000 * 15,
    });

    // Šator: 1 pending, 1 active (isporucen)
    await ctx.db.insert("bookings", {
      itemId: sator,
      renterId: RENTER_3,
      ownerId,
      startDate: daysFromNow(5),
      endDate: daysFromNow(8),
      totalDays: 4,
      pricePerDay: 800,
      totalPrice: 3200,
      deliveryMethod: "licno",
      status: "pending",
      createdAt: now - 3600000,
      updatedAt: now,
    });

    await ctx.db.insert("bookings", {
      itemId: sator,
      renterId: RENTER_1,
      ownerId,
      startDate: daysFromNow(-3),
      endDate: daysFromNow(2),
      totalDays: 6,
      pricePerDay: 800,
      totalPrice: 4800,
      deliveryMethod: "licno",
      status: "isporucen",
      renterAgreed: true,
      ownerAgreed: true,
      agreedAt: now - 86400000 * 4,
      deliveredAt: now - 86400000 * 3,
      createdAt: now - 86400000 * 7,
      updatedAt: now - 86400000 * 3,
    });

    // Bicikl: 3 completed (vracen + cancelled)
    await ctx.db.insert("bookings", {
      itemId: bicikl,
      renterId: RENTER_1,
      ownerId,
      startDate: daysFromNow(-30),
      endDate: daysFromNow(-25),
      totalDays: 6,
      pricePerDay: 1200,
      totalPrice: 7200,
      deliveryMethod: "licno",
      status: "vracen",
      renterAgreed: true,
      ownerAgreed: true,
      agreedAt: now - 86400000 * 30,
      deliveredAt: now - 86400000 * 30,
      returnedAt: now - 86400000 * 25,
      createdAt: now - 86400000 * 35,
      updatedAt: now - 86400000 * 25,
    });

    await ctx.db.insert("bookings", {
      itemId: bicikl,
      renterId: RENTER_2,
      ownerId,
      startDate: daysFromNow(-15),
      endDate: daysFromNow(-10),
      totalDays: 6,
      pricePerDay: 1200,
      totalPrice: 7200,
      deliveryMethod: "licno",
      status: "vracen",
      renterAgreed: true,
      ownerAgreed: true,
      agreedAt: now - 86400000 * 15,
      deliveredAt: now - 86400000 * 15,
      returnedAt: now - 86400000 * 10,
      createdAt: now - 86400000 * 20,
      updatedAt: now - 86400000 * 10,
    });

    await ctx.db.insert("bookings", {
      itemId: bicikl,
      renterId: RENTER_3,
      ownerId,
      startDate: daysFromNow(-8),
      endDate: daysFromNow(-5),
      totalDays: 4,
      pricePerDay: 1200,
      totalPrice: 4800,
      deliveryMethod: "licno",
      status: "cancelled",
      createdAt: now - 86400000 * 10,
      updatedAt: now - 86400000 * 8,
    });

    // Projektor: 1 nije_isporucen (waiting for pickup)
    await ctx.db.insert("bookings", {
      itemId: projektor,
      renterId: RENTER_2,
      ownerId,
      startDate: daysFromNow(0),
      endDate: daysFromNow(4),
      totalDays: 5,
      pricePerDay: 1500,
      totalPrice: 7500,
      deliveryMethod: "licno",
      status: "nije_isporucen",
      renterAgreed: true,
      ownerAgreed: true,
      agreedAt: now - 86400000,
      createdAt: now - 86400000 * 3,
      updatedAt: now - 86400000,
    });

    // --- 6. Create a renter review (for completed booking) ---
    const completedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect();

    const firstCompleted = completedBookings.find(
      (b) => b.status === "vracen"
    );
    if (firstCompleted) {
      await ctx.db.insert("renterReviews", {
        bookingId: firstCompleted._id,
        renterId: firstCompleted.renterId,
        ownerId,
        rating: 4,
        comment: "Odličan zakupac, vratio na vreme.",
        createdAt: now,
      });
    }

    // --- 7. Create a chat message (for the confirmed booking) ---
    const confirmedBooking = completedBookings.find(
      (b) => b.status === "confirmed"
    );
    if (confirmedBooking) {
      await ctx.db.insert("messages", {
        bookingId: confirmedBooking._id,
        senderId: confirmedBooking.renterId,
        content: "Zdravo! Mogu da preuzmem sutra u 10h?",
        read: false,
        type: "user",
        createdAt: now - 3600000,
      });
      await ctx.db.insert("messages", {
        bookingId: confirmedBooking._id,
        senderId: ownerId,
        content: "Može, vidimo se!",
        read: true,
        type: "user",
        createdAt: now - 1800000,
      });
    }

    return {
      seeded: true,
      message: `Seeded: 4 items, ${completedBookings.length} bookings, 4 profiles, 5 categories for owner "${ownerId}".`,
    };
  },
});

export default seed;

/**
 * Seed for the currently authenticated user (call from the dashboard).
 * This lets you test locally with your actual Clerk account.
 */
export const seedForCurrentUser = internalMutation({
  args: {},
  returns: v.object({
    seeded: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { seeded: false, message: "Not authenticated. Log in first." };
    }

    // Delegate to the main seed with the real user ID
    // We can't call ctx.runMutation for internal functions easily,
    // so we just inline the call with the override
    return { seeded: false, message: `Your Clerk user ID is: ${identity.subject}. Run: npx convex run seed:default '{"ownerIdOverride": "${identity.subject}"}'` };
  },
});
