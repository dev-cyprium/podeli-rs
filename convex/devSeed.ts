"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { clerkClient } from "@clerk/nextjs/server";
import {
  SERBIAN_NAMES,
  ITEM_TEMPLATES,
  REVIEW_TEMPLATES,
  RENTER_REVIEW_TEMPLATES,
  MESSAGE_TEMPLATES,
  NOTIFICATION_TEMPLATES,
  CATEGORIES,
} from "./devSeedData";

// --- Constants ---

const TOTAL_USERS = 23;
const IMAGE_COUNT = 30;
const DAY_MS = 86_400_000;

type BookingStatus =
  | "pending"
  | "confirmed"
  | "nije_isporucen"
  | "isporucen"
  | "vracen"
  | "cancelled";

// --- Utility helpers ---

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function weightedRating(): number {
  const r = Math.random();
  if (r < 0.35) return 5;
  if (r < 0.65) return 4;
  if (r < 0.82) return 3;
  if (r < 0.94) return 2;
  return 1;
}

function generatePhone(): string {
  const prefixes = ["060", "061", "062", "063", "064", "065", "066"];
  return `${pick(prefixes)}${randomInt(1000000, 9999999)}`;
}

// --- Wipe all tables ---

async function wipeAllTables(ctx: {
  runMutation: (ref: typeof internal.devSeedHelpers.wipeBatch, args: { table: string }) => Promise<{ deleted: number; isDone: boolean }>;
}) {
  // Leaf tables first to avoid referential issues
  const tables = [
    "chatPresence",
    "chatBlocks",
    "messages",
    "reviews",
    "renterReviews",
    "favorites",
    "notifications",
    "notificationPreferences",
    "bookings",
    "items",
    "profiles",
    "promotionalCodes",
    "categories",
    "plans",
    "debugSettings",
    "_storage",
  ];

  for (const table of tables) {
    let isDone = false;
    let totalDeleted = 0;
    while (!isDone) {
      const result = await ctx.runMutation(internal.devSeedHelpers.wipeBatch, {
        table,
      });
      totalDeleted += result.deleted;
      isDone = result.isDone;
    }
    if (totalDeleted > 0) {
      console.log(`  Wiped ${table}: ${totalDeleted} docs`);
    }
  }
}

// --- Upload images ---

async function uploadImages(ctx: {
  runMutation: (ref: typeof internal.devSeedHelpers.generateUploadUrlInternal, args: Record<string, never>) => Promise<string>;
}): Promise<Array<Id<"_storage">>> {
  const storageIds: Array<Id<"_storage">> = [];

  // Upload in batches of 5 for speed
  for (let batch = 0; batch < IMAGE_COUNT; batch += 5) {
    const batchPromises = [];
    for (let i = batch; i < Math.min(batch + 5, IMAGE_COUNT); i++) {
      batchPromises.push(uploadSingleImage(ctx, i));
    }
    const results = await Promise.all(batchPromises);
    storageIds.push(...results);
  }

  console.log(`  Uploaded ${storageIds.length} images`);
  return storageIds;
}

async function uploadSingleImage(ctx: {
  runMutation: (ref: typeof internal.devSeedHelpers.generateUploadUrlInternal, args: Record<string, never>) => Promise<string>;
}, index: number): Promise<Id<"_storage">> {
  const uploadUrl = await ctx.runMutation(
    internal.devSeedHelpers.generateUploadUrlInternal,
    {}
  );

  // Fetch from picsum with a seed for consistency
  const imageUrl = `https://picsum.photos/seed/podeli${index}/800/600`;
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": blob.type },
    body: blob,
  });

  const { storageId } = (await uploadResponse.json()) as {
    storageId: Id<"_storage">;
  };
  return storageId;
}

// --- Ensure Clerk users ---

type ClerkUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

async function ensureClerkUsers(): Promise<ClerkUser[]> {
  const client = await clerkClient();
  const users: ClerkUser[] = [];

  // Fetch existing users
  const existingUsers = new Map<string, string>(); // email -> userId
  let offset = 0;
  while (true) {
    const page = await client.users.getUserList({ limit: 100, offset });
    for (const u of page.data) {
      for (const email of u.emailAddresses) {
        existingUsers.set(email.emailAddress, u.id);
      }
    }
    if (page.data.length < 100) break;
    offset += 100;
  }

  for (let i = 1; i <= TOTAL_USERS; i++) {
    const email = `korisnik${i}+clerk_test@podeli.rs`;
    const name = SERBIAN_NAMES[(i - 1) % SERBIAN_NAMES.length];

    const existingId = existingUsers.get(email);
    if (existingId) {
      users.push({
        id: existingId,
        firstName: name.firstName,
        lastName: name.lastName,
        email,
      });
      continue;
    }

    // Create new user
    const newUser = await client.users.createUser({
      emailAddress: [email],
      password: "Podeli123!",
      skipPasswordChecks: true,
      firstName: name.firstName,
      lastName: name.lastName,
    });

    users.push({
      id: newUser.id,
      firstName: name.firstName,
      lastName: name.lastName,
      email,
    });
  }

  console.log(`  Ensured ${users.length} Clerk users`);
  return users;
}

// --- Main seed action ---

export const run = internalAction({
  args: {
    itemCount: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const itemCount = args.itemCount ?? 325;
    const now = Date.now();

    console.log("=== Dev Seed: Starting ===");

    // 1. Wipe all tables
    console.log("Step 1: Wiping all tables...");
    await wipeAllTables(ctx);

    // 2. Upload images
    console.log("Step 2: Uploading images...");
    const imageIds = await uploadImages(ctx);

    // 3. Initialize plans
    console.log("Step 3: Initializing plans...");
    await ctx.runMutation(api.plans.initializeDefaults, {});

    // 4. Ensure Clerk users
    console.log("Step 4: Ensuring Clerk users...");
    const clerkUsers = await ensureClerkUsers();

    // 5. Create categories
    console.log("Step 5: Creating categories...");
    const categoryData = CATEGORIES.map((cat) => ({
      ...cat,
      createdBy:
        cat.status === "pending" ? clerkUsers[randomInt(2, TOTAL_USERS - 1)].id : undefined,
      createdAt: now,
      updatedAt: now,
    }));
    await ctx.runMutation(internal.devSeedHelpers.insertCategories, {
      categories: categoryData,
    });

    // 6. Fetch plan IDs
    console.log("Step 6: Creating profiles...");
    const plans = await ctx.runQuery(api.plans.list, {});
    const planMap = new Map(plans.map((p) => [p.slug, p._id]));

    // Plan distribution for 23 users:
    // User 0: superAdmin, lifetime
    // Users 1-3: lifetime
    // Users 4-7: ultimate
    // Users 8-14: starter
    // Users 15-19: free
    // Users 20-22: single_listing
    const planAssignments: Array<{
      slug: string;
      hasBadge: boolean;
      badgeLabel?: string;
      superAdmin?: boolean;
    }> = [
      { slug: "lifetime", hasBadge: true, badgeLabel: "DOMACIN", superAdmin: true },
      { slug: "lifetime", hasBadge: true, badgeLabel: "DOMACIN" },
      { slug: "lifetime", hasBadge: true, badgeLabel: "DOMACIN" },
      { slug: "lifetime", hasBadge: true, badgeLabel: "DOMACIN" },
      { slug: "ultimate", hasBadge: false },
      { slug: "ultimate", hasBadge: false },
      { slug: "ultimate", hasBadge: false },
      { slug: "ultimate", hasBadge: false },
      { slug: "starter", hasBadge: false },
      { slug: "starter", hasBadge: false },
      { slug: "starter", hasBadge: false },
      { slug: "starter", hasBadge: false },
      { slug: "starter", hasBadge: false },
      { slug: "starter", hasBadge: false },
      { slug: "starter", hasBadge: false },
      { slug: "free", hasBadge: false },
      { slug: "free", hasBadge: false },
      { slug: "free", hasBadge: false },
      { slug: "free", hasBadge: false },
      { slug: "free", hasBadge: false },
      { slug: "single_listing", hasBadge: false },
      { slug: "single_listing", hasBadge: false },
      { slug: "single_listing", hasBadge: false },
    ];

    const contactTypes: Array<"chat" | "email" | "phone"> = [
      "chat",
      "email",
      "phone",
    ];
    const dashboardModes: Array<"podeli" | "zakupi" | undefined> = [
      "podeli",
      "zakupi",
      undefined,
    ];

    const profiles = clerkUsers.map((user, i) => {
      const assignment = planAssignments[i];
      const planId = planMap.get(assignment.slug);
      if (!planId) throw new Error(`Plan not found: ${assignment.slug}`);

      return {
        userId: user.id,
        planId,
        planSlug: assignment.slug,
        planActivatedAt: now - randomInt(1, 90) * DAY_MS,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        hasBadge: assignment.hasBadge,
        badgeLabel: assignment.badgeLabel,
        preferredContactTypes: pickN(contactTypes, randomInt(1, 3)) as Array<
          "chat" | "email" | "phone"
        >,
        phoneNumber: Math.random() > 0.3 ? generatePhone() : undefined,
        defaultDashboardMode: pick(dashboardModes),
        superAdmin: assignment.superAdmin,
        createdAt: now,
        updatedAt: now,
      };
    });

    await ctx.runMutation(internal.devSeedHelpers.insertProfiles, {
      profiles,
    });

    // 7. Generate & insert items
    console.log(`Step 7: Generating ${itemCount} items...`);
    const categoryNames = Object.keys(ITEM_TEMPLATES);
    const deliveryOptions = ["licno", "glovo", "wolt", "cargo"];

    // Items per user based on plan
    const itemsPerUser: number[] = planAssignments.map((a) => {
      switch (a.slug) {
        case "free":
          return 1;
        case "single_listing":
          return 1;
        case "starter":
          return randomInt(2, 5);
        case "ultimate":
          return randomInt(20, 35);
        case "lifetime":
          return randomInt(20, 40);
        default:
          return 1;
      }
    });

    // Scale to match target item count
    const rawTotal = itemsPerUser.reduce((a, b) => a + b, 0);
    const scale = itemCount / rawTotal;
    const scaledItems = itemsPerUser.map((n) =>
      Math.max(1, Math.round(n * scale))
    );
    // Adjust last user to hit exact total
    const currentTotal = scaledItems.reduce((a, b) => a + b, 0);
    const diff = itemCount - currentTotal;
    // Spread diff across ultimate/lifetime users
    if (diff !== 0) {
      for (let adj = 0; adj < Math.abs(diff); adj++) {
        const idx = (adj % 8); // first 8 users are lifetime/ultimate
        scaledItems[idx] += diff > 0 ? 1 : -1;
        if (scaledItems[idx] < 1) scaledItems[idx] = 1;
      }
    }

    type ItemInsert = {
      ownerId: string;
      title: string;
      description: string;
      category: string;
      pricePerDay: number;
      priceByAgreement?: boolean;
      deposit?: number;
      images: Array<Id<"_storage">>;
      availabilitySlots: Array<{ startDate: string; endDate: string }>;
      deliveryMethods: string[];
      createdAt: number;
      updatedAt: number;
    };

    const allItems: ItemInsert[] = [];
    const itemOwnerMap: number[] = []; // index into clerkUsers for each item

    for (let userIdx = 0; userIdx < clerkUsers.length; userIdx++) {
      const count = scaledItems[userIdx];
      const user = clerkUsers[userIdx];

      for (let j = 0; j < count; j++) {
        const category = pick(categoryNames);
        const templates = ITEM_TEMPLATES[category];
        const template = pick(templates);

        const price = randomInt(template.priceRange[0], template.priceRange[1]);
        const numImages = randomInt(2, 5);
        const itemImages = pickN(imageIds, numImages);

        // Random availability: past to future
        const startOffset = randomInt(-60, -10);
        const endOffset = randomInt(30, 120);

        const createdAt = now - randomInt(1, 60) * DAY_MS;

        const item: ItemInsert = {
          ownerId: user.id,
          title: template.title,
          description: template.description,
          category,
          pricePerDay: price,
          images: itemImages,
          availabilitySlots: [
            {
              startDate: daysFromNow(startOffset),
              endDate: daysFromNow(endOffset),
            },
          ],
          deliveryMethods: pickN(
            deliveryOptions,
            randomInt(1, 3)
          ),
          createdAt,
          updatedAt: createdAt,
        };

        // 15% chance of priceByAgreement
        if (Math.random() < 0.15) {
          item.priceByAgreement = true;
        }

        // 25% chance of deposit
        if (Math.random() < 0.25) {
          item.deposit = randomInt(1000, 10000);
        }

        allItems.push(item);
        itemOwnerMap.push(userIdx);
      }
    }

    // Insert in batches of 150
    const allItemIds: Array<Id<"items">> = [];
    for (let i = 0; i < allItems.length; i += 150) {
      const batch = allItems.slice(i, i + 150);
      const ids: Array<Id<"items">> = await ctx.runMutation(
        internal.devSeedHelpers.insertItemsBatch,
        { items: batch }
      );
      allItemIds.push(...ids);
    }
    console.log(`  Inserted ${allItemIds.length} items`);

    // 8. Generate & insert bookings
    console.log("Step 8: Generating bookings...");

    type BookingInsert = {
      itemId: Id<"items">;
      renterId: string;
      ownerId: string;
      startDate: string;
      endDate: string;
      totalDays: number;
      pricePerDay: number;
      totalPrice: number;
      deliveryMethod: string;
      status: BookingStatus;
      renterAgreed?: boolean;
      ownerAgreed?: boolean;
      agreedAt?: number;
      deliveredAt?: number;
      returnedAt?: number;
      createdAt: number;
      updatedAt: number;
    };

    const allBookings: BookingInsert[] = [];

    // Status distribution
    const statusWeights: Array<{ status: BookingStatus; weight: number }> = [
      { status: "vracen", weight: 0.30 },
      { status: "cancelled", weight: 0.15 },
      { status: "pending", weight: 0.20 },
      { status: "confirmed", weight: 0.15 },
      { status: "isporucen", weight: 0.10 },
      { status: "nije_isporucen", weight: 0.10 },
    ];

    function pickStatus(): BookingStatus {
      const r = Math.random();
      let cumulative = 0;
      for (const { status, weight } of statusWeights) {
        cumulative += weight;
        if (r < cumulative) return status;
      }
      return "vracen";
    }

    // ~40% of items get 1-2 bookings
    for (let i = 0; i < allItemIds.length; i++) {
      if (Math.random() > 0.4) continue;

      const itemId = allItemIds[i];
      const ownerIdx = itemOwnerMap[i];
      const ownerId = clerkUsers[ownerIdx].id;
      const pricePerDay = allItems[i].pricePerDay;
      const deliveryMethod = pick(allItems[i].deliveryMethods);

      const numBookings = randomInt(1, 2);
      const usedDateRanges: Array<{ start: number; end: number }> = [];

      for (let b = 0; b < numBookings; b++) {
        // Pick a renter that isn't the owner
        let renterIdx: number;
        do {
          renterIdx = randomInt(0, clerkUsers.length - 1);
        } while (renterIdx === ownerIdx);

        const renterId = clerkUsers[renterIdx].id;
        const status = pickStatus();

        // Generate non-overlapping dates
        let startDayOffset: number;
        let endDayOffset: number;
        let attempts = 0;
        do {
          if (
            status === "vracen" ||
            status === "cancelled"
          ) {
            startDayOffset = randomInt(-60, -10);
          } else if (status === "isporucen") {
            startDayOffset = randomInt(-10, -1);
          } else if (status === "nije_isporucen") {
            startDayOffset = randomInt(-3, 3);
          } else {
            startDayOffset = randomInt(1, 30);
          }

          const totalDays = randomInt(2, 10);
          endDayOffset = startDayOffset + totalDays;
          attempts++;
        } while (
          attempts < 10 &&
          usedDateRanges.some(
            (r) =>
              !(endDayOffset <= r.start || startDayOffset >= r.end)
          )
        );

        usedDateRanges.push({ start: startDayOffset, end: endDayOffset });

        const totalDays = endDayOffset - startDayOffset;
        const totalPrice = pricePerDay * totalDays;
        const bookingCreatedAt =
          now + (startDayOffset - randomInt(3, 10)) * DAY_MS;

        const booking: BookingInsert = {
          itemId,
          renterId,
          ownerId,
          startDate: daysFromNow(startDayOffset),
          endDate: daysFromNow(endDayOffset),
          totalDays,
          pricePerDay,
          totalPrice,
          deliveryMethod,
          status,
          createdAt: bookingCreatedAt,
          updatedAt: bookingCreatedAt,
        };

        // Add status-specific fields
        if (
          status === "confirmed" ||
          status === "nije_isporucen" ||
          status === "isporucen" ||
          status === "vracen"
        ) {
          booking.renterAgreed = true;
          booking.ownerAgreed = true;
          booking.agreedAt = bookingCreatedAt + DAY_MS;
          booking.updatedAt = booking.agreedAt;
        }

        if (status === "isporucen" || status === "vracen") {
          booking.deliveredAt = now + startDayOffset * DAY_MS;
          booking.updatedAt = booking.deliveredAt;
        }

        if (status === "vracen") {
          booking.returnedAt = now + endDayOffset * DAY_MS;
          booking.updatedAt = booking.returnedAt;
        }

        allBookings.push(booking);
      }
    }

    // Insert bookings in batches
    const allBookingIds: Array<Id<"bookings">> = [];
    for (let i = 0; i < allBookings.length; i += 500) {
      const batch = allBookings.slice(i, i + 500);
      const ids = await ctx.runMutation(
        internal.devSeedHelpers.insertBookingsBatch,
        { bookings: batch }
      );
      allBookingIds.push(...ids);
    }
    console.log(`  Inserted ${allBookingIds.length} bookings`);

    // 9. Generate & insert reviews
    console.log("Step 9: Generating reviews...");

    type ReviewInsert = {
      itemId: Id<"items">;
      bookingId: Id<"bookings">;
      reviewerId: string;
      rating: number;
      comment: string;
      createdAt: number;
    };

    type RenterReviewInsert = {
      bookingId: Id<"bookings">;
      renterId: string;
      ownerId: string;
      rating: number;
      comment?: string;
      createdAt: number;
    };

    const reviews: ReviewInsert[] = [];
    const renterReviews: RenterReviewInsert[] = [];

    for (let i = 0; i < allBookings.length; i++) {
      const booking = allBookings[i];
      const bookingId = allBookingIds[i];

      if (booking.status !== "vracen") continue;

      // 60% get item review
      if (Math.random() < 0.6) {
        const rating = weightedRating();
        const templates = REVIEW_TEMPLATES[rating] ?? REVIEW_TEMPLATES[3];
        reviews.push({
          itemId: booking.itemId,
          bookingId,
          reviewerId: booking.renterId,
          rating,
          comment: pick(templates),
          createdAt: (booking.returnedAt ?? now) + randomInt(1, 5) * DAY_MS,
        });
      }

      // 40% get renter review
      if (Math.random() < 0.4) {
        const rating = weightedRating();
        const templates =
          RENTER_REVIEW_TEMPLATES[rating] ?? RENTER_REVIEW_TEMPLATES[3];
        renterReviews.push({
          bookingId,
          renterId: booking.renterId,
          ownerId: booking.ownerId,
          rating,
          comment: pick(templates),
          createdAt: (booking.returnedAt ?? now) + randomInt(1, 5) * DAY_MS,
        });
      }
    }

    if (reviews.length > 0) {
      await ctx.runMutation(internal.devSeedHelpers.insertReviewsBatch, {
        reviews,
      });
    }
    if (renterReviews.length > 0) {
      await ctx.runMutation(internal.devSeedHelpers.insertRenterReviewsBatch, {
        reviews: renterReviews,
      });
    }
    console.log(
      `  Inserted ${reviews.length} item reviews, ${renterReviews.length} renter reviews`
    );

    // 10. Generate & insert messages
    console.log("Step 10: Generating messages...");

    type MessageInsert = {
      bookingId: Id<"bookings">;
      senderId: string;
      content: string;
      read: boolean;
      type: "user";
      createdAt: number;
    };

    const messages: MessageInsert[] = [];

    for (let i = 0; i < allBookings.length; i++) {
      const booking = allBookings[i];
      const bookingId = allBookingIds[i];

      if (booking.status === "pending") continue;
      if (Math.random() > 0.3) continue;

      const msgCount = randomInt(2, 4);
      let msgTime = booking.createdAt + randomInt(1, 3) * 3_600_000;

      for (let m = 0; m < msgCount; m++) {
        const isFromRenter = m % 2 === 0;
        const senderId = isFromRenter ? booking.renterId : booking.ownerId;
        const content =
          m === 0
            ? pick(MESSAGE_TEMPLATES.starters)
            : pick(MESSAGE_TEMPLATES.replies);

        messages.push({
          bookingId,
          senderId,
          content,
          read: true,
          type: "user",
          createdAt: msgTime,
        });

        msgTime += randomInt(10, 120) * 60_000;
      }
    }

    if (messages.length > 0) {
      for (let i = 0; i < messages.length; i += 500) {
        const batch = messages.slice(i, i + 500);
        await ctx.runMutation(internal.devSeedHelpers.insertMessagesBatch, {
          messages: batch,
        });
      }
    }
    console.log(`  Inserted ${messages.length} messages`);

    // 11. Generate & insert favorites
    console.log("Step 11: Generating favorites...");

    type FavoriteInsert = {
      userId: string;
      itemId: Id<"items">;
      createdAt: number;
    };

    const favorites: FavoriteInsert[] = [];

    for (let userIdx = 0; userIdx < clerkUsers.length; userIdx++) {
      const userId = clerkUsers[userIdx].id;
      const favCount = randomInt(3, 8);
      // Filter out items owned by this user
      const otherItems = allItemIds.filter(
        (_, idx) => itemOwnerMap[idx] !== userIdx
      );
      const favItems = pickN(otherItems, Math.min(favCount, otherItems.length));

      for (const itemId of favItems) {
        favorites.push({
          userId,
          itemId,
          createdAt: now - randomInt(1, 30) * DAY_MS,
        });
      }
    }

    if (favorites.length > 0) {
      for (let i = 0; i < favorites.length; i += 500) {
        const batch = favorites.slice(i, i + 500);
        await ctx.runMutation(internal.devSeedHelpers.insertFavoritesBatch, {
          favorites: batch,
        });
      }
    }
    console.log(`  Inserted ${favorites.length} favorites`);

    // 12. Generate & insert notifications
    console.log("Step 12: Generating notifications...");

    type NotificationInsert = {
      userId: string;
      message: string;
      read?: boolean;
      type:
        | "booking_pending"
        | "booking_approved"
        | "booking_rejected"
        | "plan_changed"
        | "system"
        | "message_received"
        | "agreement_requested"
        | "booking_agreed"
        | "item_delivered"
        | "return_reminder"
        | "item_returned"
        | "renter_reviewed";
      createdAt: number;
      updatedAt: number;
    };

    const notifications: NotificationInsert[] = [];

    for (const user of clerkUsers) {
      const count = randomInt(3, 8);
      const picked = pickN(NOTIFICATION_TEMPLATES, count);

      for (const template of picked) {
        const createdAt = now - randomInt(1, 30) * DAY_MS;
        notifications.push({
          userId: user.id,
          message: template.message,
          read: Math.random() > 0.4,
          type: template.type,
          createdAt,
          updatedAt: createdAt,
        });
      }
    }

    if (notifications.length > 0) {
      for (let i = 0; i < notifications.length; i += 500) {
        const batch = notifications.slice(i, i + 500);
        await ctx.runMutation(
          internal.devSeedHelpers.insertNotificationsBatch,
          { notifications: batch }
        );
      }
    }
    console.log(`  Inserted ${notifications.length} notifications`);

    // Summary
    console.log("\n=== Dev Seed: Complete ===");
    console.log(`  Items: ${allItemIds.length}`);
    console.log(`  Bookings: ${allBookingIds.length}`);
    console.log(`  Reviews: ${reviews.length}`);
    console.log(`  Renter Reviews: ${renterReviews.length}`);
    console.log(`  Messages: ${messages.length}`);
    console.log(`  Favorites: ${favorites.length}`);
    console.log(`  Notifications: ${notifications.length}`);
    console.log(`  Users: ${clerkUsers.length}`);
    console.log(`  Images: ${imageIds.length}`);

    return null;
  },
});

// --- Standalone wipe ---

export const wipeAll = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("=== Dev Seed: Wiping all tables ===");
    await wipeAllTables(ctx);
    console.log("=== Wipe complete ===");
    return null;
  },
});
