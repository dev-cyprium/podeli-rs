import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  items: defineTable({
    ownerId: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    pricePerDay: v.number(),
    images: v.array(v.id("_storage")),
    availabilitySlots: v.array(
      v.object({
        startDate: v.string(),
        endDate: v.string(),
      }),
    ),
    deliveryMethods: v.array(v.string()),
    shortId: v.optional(v.string()),
    slug: v.optional(v.string()),
    searchText: v.optional(v.string()),
    singleListingExpiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_shortId", ["shortId"])
    .index("by_category", ["category"])
    .searchIndex("search_items", {
      searchField: "searchText",
      filterFields: ["category"],
    }),

  plans: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    maxListings: v.number(),
    maxActiveRentals: v.number(),
    allowedDeliveryMethods: v.array(v.string()),
    hasBadge: v.boolean(),
    badgeLabel: v.optional(v.string()),
    priceAmount: v.number(),
    priceCurrency: v.string(),
    priceInterval: v.string(),
    isSubscription: v.boolean(),
    listingDurationDays: v.optional(v.number()),
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"])
    .index("by_isActive", ["isActive"]),

  promotionalCodes: defineTable({
    code: v.string(),
    forPlanId: v.id("plans"),
    durationMonths: v.optional(v.number()),
    comment: v.optional(v.string()),
    isUsed: v.boolean(),
    usedBy: v.optional(v.string()),
    validUntil: v.number(),
  }).index("by_code", ["code"]),

  profiles: defineTable({
    userId: v.string(),
    planId: v.id("plans"),
    planSlug: v.string(),
    planActivatedAt: v.number(),
    planExpiresAt: v.optional(v.number()),
    singleListingItemId: v.optional(v.id("items")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    hasBadge: v.boolean(),
    badgeLabel: v.optional(v.string()),
    superAdmin: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_planSlug", ["planSlug"])
    .index("by_hasBadge", ["hasBadge"]),

  bookings: defineTable({
    itemId: v.id("items"),
    renterId: v.string(),
    ownerId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    totalDays: v.number(),
    pricePerDay: v.number(),
    totalPrice: v.number(),
    deliveryMethod: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    paymentMethod: v.union(v.literal("cash"), v.literal("card")),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_item", ["itemId"])
    .index("by_renter", ["renterId"])
    .index("by_owner", ["ownerId"]),

  reviews: defineTable({
    itemId: v.id("items"),
    bookingId: v.id("bookings"),
    reviewerId: v.string(),
    rating: v.number(),
    comment: v.string(),
    createdAt: v.number(),
  })
    .index("by_item", ["itemId"])
    .index("by_booking", ["bookingId"]),

  notifications: defineTable({
    userId: v.string(),
    message: v.string(),
    read: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),

  categories: defineTable({
    name: v.string(),
    order: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_order", ["order"]),
});
