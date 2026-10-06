import { v } from "convex/values";
import { itemInput } from "./itemModel";

export const offerStatus = v.union(
  v.literal("draft"),
  v.literal("ready"),
  v.literal("sent"),
  v.literal("claimed"),
  v.literal("published"),
);
export const offerFields = {
  prospectId: v.id("prospects"),
  data: itemInput,
  status: offerStatus,
  token: v.optional(v.string()),
  recipientEmail: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
  claimedBy: v.optional(v.string()),
  itemId: v.optional(v.id("items")),
  createdAt: v.number(),
  updatedAt: v.number(),
};
export const offerSummary = v.object({
  id: v.id("listingOffers"),
  status: offerStatus,
  expiresAt: v.optional(v.number()),
});
export const offerDocument = v.object({
  ...offerFields,
  _id: v.id("listingOffers"),
  _creationTime: v.number(),
});
