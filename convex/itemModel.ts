import { v, type Infer } from "convex/values";
import {
  imageFocalPointValidator,
  imageFocalPointsValidator,
} from "./imageModel";

export const itemInput = v.object({
  title: v.string(),
  description: v.string(),
  category: v.string(),
  listingType: v.optional(
    v.union(v.literal("rent"), v.literal("sale"), v.literal("both")),
  ),
  salePrice: v.optional(v.number()),
  city: v.string(),
  municipality: v.string(),
  pricePerDay: v.number(),
  priceByAgreement: v.optional(v.boolean()),
  deposit: v.optional(v.number()),
  images: v.array(v.id("_storage")),
  imageFocalPoint: v.optional(imageFocalPointValidator),
  imageFocalPoints: v.optional(imageFocalPointsValidator),
  availabilitySlots: v.array(
    v.object({ startDate: v.string(), endDate: v.string() }),
  ),
  deliveryMethods: v.array(
    v.union(
      v.literal("licno"),
      v.literal("glovo"),
      v.literal("wolt"),
      v.literal("cargo"),
    ),
  ),
});
export type ItemInput = Infer<typeof itemInput>;
