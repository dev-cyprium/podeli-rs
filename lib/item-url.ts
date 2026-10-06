import type { Id } from "../convex/_generated/dataModel";

/**
 * Generate a slug from a title: lowercase, ASCII-only, dash-separated
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-ASCII characters except spaces and dashes
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes
}

/**
 * Extract the first 8 characters of a Convex ID as shortId
 */
export function extractShortId(id: Id<"items">): string {
  return id.slice(0, 8);
}

/**
 * Generate searchText by combining title and description (lowercase)
 */
export function generateSearchText(title: string, description: string): string {
  return `${title} ${description}`.toLowerCase();
}
