import type { MetadataRoute } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Make this a knob you can change later.
// 1 hour is a good starting point for a marketplace.
export const revalidate = 3600;

// If Convex is sometimes slow, you can also force static behavior:
// export const dynamic = "force-static";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://podeli.rs";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = new ConvexHttpClient(CONVEX_URL);
  
  // Fetch minimal fields: _id, title, shortId, slug, updatedAt, createdAt
  const listings = await client.query(api.items.listForSitemap, {});

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
