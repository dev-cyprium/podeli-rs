import { v } from "convex/values";

export const imageFocalPointValidator = v.object({
  x: v.number(),
  y: v.number(),
});
export const imageFocalPointsValidator = v.record(
  v.id("_storage"),
  imageFocalPointValidator,
);
