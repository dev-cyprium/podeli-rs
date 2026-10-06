export type ImageFocalPoint = { x: number; y: number };
export type ImageFocalPoints = Record<string, ImageFocalPoint>;

export const CENTER_FOCAL_POINT: ImageFocalPoint = { x: 50, y: 50 };

export function getImageFocalPoint(
  imageId: string,
  index: number,
  points?: ImageFocalPoints,
  legacyCoverPoint?: ImageFocalPoint,
): ImageFocalPoint {
  return (
    points?.[imageId] ??
    (index === 0 ? legacyCoverPoint : undefined) ??
    CENTER_FOCAL_POINT
  );
}

export function imageFocalPointsError(
  images: string[],
  points?: ImageFocalPoints,
): string | null {
  if (!points) return null;
  for (const [id, point] of Object.entries(points)) {
    if (!images.includes(id))
      return "Fokus mora pripadati fotografiji ovog oglasa.";
    if (
      ![point.x, point.y].every(
        (value) => Number.isFinite(value) && value >= 0 && value <= 100,
      )
    ) {
      return "Fokus fotografije mora biti između 0 i 100.";
    }
  }
  return null;
}
