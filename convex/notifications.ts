import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";

const notificationValidator = v.object({
  _id: v.id("notifications"),
  _creationTime: v.number(),
  userId: v.string(),
  message: v.string(),
  read: v.optional(v.boolean()),
  type: v.optional(
    v.union(
      v.literal("booking_pending"),
      v.literal("booking_approved"),
      v.literal("booking_rejected"),
      v.literal("plan_changed"),
      v.literal("system"),
      v.literal("message_received"),
      v.literal("agreement_requested"),
      v.literal("booking_agreed"),
      v.literal("item_ready"),
      v.literal("item_delivered"),
      v.literal("return_reminder"),
      v.literal("item_returned"),
      v.literal("renter_reviewed"),
    ),
  ),
  link: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listForUser = query({
  args: {},
  returns: v.array(notificationValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const sorted = notifications.sort((a, b) => b.createdAt - a.createdAt);
    return sorted.slice(0, 50);
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== identity.subject) {
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(args.notificationId, { read: true, updatedAt: now });
    return null;
  },
});

export const markAllAsRead = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const now = Date.now();
    for (const notification of notifications) {
      if (!notification.read) {
        await ctx.db.patch(notification._id, { read: true, updatedAt: now });
      }
    }
    return null;
  },
});

export const deleteAll = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
    return null;
  },
});
