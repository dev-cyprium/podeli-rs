import type { MetadataRoute } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Make this a knob you can change later.
// 1 hour is a good starting point for a marketplace.
export const revalidate = 3600;

// If Convex is sometimes slow, you can also force static behavior:
// export const dynamic = "force-static";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://podeli.rs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!CONVEX_URL) {
    // If Convex URL is not set, return only static pages
    return [
      { url: `${SITE}/`, lastModified: new Date() },
      { url: `${SITE}/kako-funkcionise`, lastModified: new Date() },
    ];
  }

  const client = new ConvexHttpClient(CONVEX_URL);
  
  // Fetch minimal fields: _id, title, shortId, slug, updatedAt, createdAt
  let listings: Array<{
    _id: string;
    title: string;
    shortId: string;
    slug: string;
    updatedAt: number;
    createdAt: number;
  }> = [];
  
  try {
    listings = await client.query(api.items.listForSitemap, {});
  } catch (error) {
    // If Convex query fails, log error but don't fail the build
    // Return sitemap with static pages only
    console.error("Failed to fetch listings for sitemap:", error);
  }

  const now = new Date();

  return [
    // Include your core pages too
    { url: `${SITE}/`, lastModified: now },
    { url: `${SITE}/kako-funkcionise`, lastModified: now },

    // Listings
    ...listings.map((l) => {
      const shortId = l.shortId;
      const slug = l.slug;
      return {
        url: `${SITE}/p/${shortId}/${slug}`,
        lastModified: new Date(l.updatedAt ?? l.createdAt ?? Date.now()),
        changeFrequency: "daily" as const,
        priority: 0.7,
      };
    }),
  ];
}
