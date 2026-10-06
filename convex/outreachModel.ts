import { v } from "convex/values";
export const outreachStatus = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("follow_up"),
  v.literal("interested"),
  v.literal("not_interested"),
  v.literal("onboarded"),
  v.literal("offer_ready"),
  v.literal("offer_sent"),
  v.literal("offer_claimed"),
);
export const outreachStep = v.union(
  v.literal("prepare_offer"),
  v.literal("send_offer"),
  v.literal("await_reply"),
  v.literal("follow_up"),
  v.literal("help_publish"),
);
export const outreachChannel = v.union(
  v.literal("email"),
  v.literal("contact_form"),
  v.literal("phone"),
);
export const prospectFields = {
  name: v.string(),
  category: v.string(),
  phone: v.string(),
  email: v.optional(v.string()),
  contactFormUrl: v.optional(v.string()),
  preferredChannel: v.optional(outreachChannel),
  website: v.string(),
  contactPerson: v.string(),
  status: outreachStatus,
  nextAction: v.string(),
  nextStep: v.optional(outreachStep),
  followUpDate: v.string(),
  supplierProfileId: v.optional(v.id("profiles")),
};
export const prospectInput = v.object(prospectFields);
export const prospectDocument = v.object({
  ...prospectFields,
  _id: v.id("prospects"),
  _creationTime: v.number(),
  key: v.string(),
  importKey: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});
export const activityDocument = v.object({
  _id: v.id("prospectActivities"),
  _creationTime: v.number(),
  prospectId: v.id("prospects"),
  authorId: v.string(),
  outcome: outreachStatus,
  note: v.string(),
  channel: v.optional(outreachChannel),
  createdAt: v.number(),
});
