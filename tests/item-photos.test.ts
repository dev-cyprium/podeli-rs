import { describe, expect, it } from "vitest";
import { getImageFocalPoint } from "../lib/item-photos";

describe("photo focus compatibility", () => {
  it("uses the old focal point only for the cover of legacy listings", () => {
    const legacy = { x: 20, y: 80 };
    expect(getImageFocalPoint("cover", 0, undefined, legacy)).toEqual(legacy);
    expect(getImageFocalPoint("second", 1, undefined, legacy)).toEqual({ x: 50, y: 50 });
  });

  it("keeps focus attached to the storage ID when a photo becomes the cover", () => {
    const points = { cover: { x: 20, y: 80 }, second: { x: 75, y: 25 } };
    expect(getImageFocalPoint("second", 0, points, points.cover)).toEqual(points.second);
    expect(getImageFocalPoint("cover", 1, points, points.second)).toEqual(points.cover);
  });
});
