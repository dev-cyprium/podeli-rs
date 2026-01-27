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
