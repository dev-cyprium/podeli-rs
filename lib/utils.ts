import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Doc } from "@/convex/_generated/dataModel"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate the canonical URL for an item
 * Requires shortId and slug to be present
 */
export function getItemUrl(item: Doc<"items"> | { shortId: string; slug: string }): string {
  if (!item.shortId || !item.slug) {
    throw new Error(
      `Item ${item._id || "unknown"} is missing shortId or slug. Please run backfillShortIdAndSlug mutation.`
    );
  }
  return `/p/${item.shortId}/${item.slug}`
}
