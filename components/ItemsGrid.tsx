"use client";

import { useMemo } from "react";
import {
  useQuery,
  useConvexAuth,
  Preloaded,
  usePreloadedQuery,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { ItemCard } from "@/components/ItemCard";

export function ItemsGrid({
  preloadedItems,
}: {
  preloadedItems: Preloaded<typeof api.items.listAll>;
}) {
  const items = usePreloadedQuery(preloadedItems);
  const { isAuthenticated } = useConvexAuth();
  const favoriteItemIds = useQuery(
    api.favorites.getFavoriteItemIds,
    isAuthenticated ? {} : "skip",
  );
  const favoriteSet = useMemo(
    () => new Set(favoriteItemIds ?? []),
    [favoriteItemIds],
  );

  const ownerIds = useMemo(() => {
    if (!items) return [];
    return [...new Set(items.map((item) => item.ownerId))];
  }, [items]);

  const ownerProfiles = useQuery(
    api.profiles.getProfilesByUserIds,
    ownerIds.length > 0 ? { userIds: ownerIds } : "skip",
  );

  const itemsWithProfiles = useMemo(() => {
    if (!items) return undefined;
    const profileMap = new Map((ownerProfiles ?? []).map((p) => [p.userId, p]));
    return items.map((item) => ({
      ...item,
      ownerProfile: profileMap.get(item.ownerId),
    }));
  }, [items, ownerProfiles]);

  if (itemsWithProfiles === undefined) {
    return (
      <>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square animate-pulse rounded-xl bg-muted" />
            <div className="space-y-1.5 pt-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
              <div className="h-4 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (itemsWithProfiles.length === 0) {
    return (
      <div className="col-span-full rounded-2xl bg-card p-12 text-center">
        <p className="text-muted-foreground">
          Trenutno nema dostupnih predmeta. Budite prvi koji će objaviti
          predmet!
        </p>
      </div>
    );
  }

  return (
    <>
      {itemsWithProfiles.map((item) => (
        <ItemCard
          key={item._id}
          item={item}
          isFavorited={favoriteSet.has(item._id)}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </>
  );
}
