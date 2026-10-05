import { v } from "convex/values";
export const outreachStatus = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("follow_up"),
  v.literal("interested"),
  v.literal("not_interested"),
  v.literal("onboarded"),
);
export const prospectFields = {
  name: v.string(),
  category: v.string(),
  phone: v.string(),
  website: v.string(),
  contactPerson: v.string(),
  status: outreachStatus,
  nextAction: v.string(),
  followUpDate: v.string(),
  supplierProfileId: v.optional(v.id("profiles")),
};
export const prospectInput = v.object(prospectFields);
export const prospectDocument = v.object({
  ...prospectFields,
  _id: v.id("prospects"),
  _creationTime: v.number(),
  key: v.string(),
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
  createdAt: v.number(),
});
