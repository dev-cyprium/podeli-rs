import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Doc } from "@/convex/_generated/dataModel"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate the canonical URL for an item
 * Falls back to legacy format if shortId/slug are not available
 */
export function getItemUrl(item: Doc<"items"> | { _id: string; shortId?: string | null; slug?: string | null }): string {
  if (item.shortId && item.slug) {
    return `/p/${item.shortId}/${item.slug}`
  }
  // Fallback to legacy format for items without shortId/slug
  return `/predmet/${item._id}`
}
