"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Legacy route handler - redirects to canonical URL format
 * Supports both full IDs and shortIds for backward compatibility
 */
export default function LegacyItemDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const idOrShortId = resolvedParams.id;
  
  // Try to resolve the item
  const result = useQuery(api.items.getByShortIdOrId, {
    shortIdOrId: idOrShortId,
  });

  useEffect(() => {
    if (result?.item) {
      const item = result.item;
      // If item has shortId and slug, redirect to canonical URL
      if (item.shortId && item.slug) {
        router.replace(`/p/${item.shortId}/${item.slug}`);
      }
      // If item doesn't have shortId/slug yet, stay on legacy route
      // The item will be displayed, and backfill can be run later
    } else if (result && result.item === null) {
      // Item not found, redirect to home
      router.replace("/");
    }
  }, [result, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Preusmjeravanje...</p>
      </div>
    </div>
  );
}
