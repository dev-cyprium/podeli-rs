import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";

export async function notifyInquiry(
  ctx: MutationCtx,
  args: {
    userId: string;
    message: string;
    link: string;
    request: boolean;
    type?: "booking_approved" | "booking_rejected";
  },
) {
  const now = Date.now();
  const notificationId = await ctx.db.insert("notifications", {
    userId: args.userId,
    message: args.message,
    link: args.link,
    type: args.type ?? (args.request ? "booking_pending" : "system"),
    createdAt: now,
    updatedAt: now,
  });
  const preferences = await ctx.db
    .query("notificationPreferences")
    .withIndex("by_userId", (q) => q.eq("userId", args.userId))
    .first();
  const enabled = args.request
    ? preferences?.emailOnBookingRequest
    : (preferences?.emailOnInquiryResponse ??
      preferences?.emailOnBookingRequest);
  if (!enabled) return;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", args.userId))
    .first();
  if (profile?.email)
    await ctx.scheduler.runAfter(0, internal.emails.sendInquiryEmail, {
      idempotencyKey: `inquiry-${notificationId}`,
      to: profile.email,
      message: args.message,
      actionUrl: `https://podeli.rs${args.link}`,
    });
}
