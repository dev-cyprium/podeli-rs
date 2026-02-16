"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { ItemCard } from "@/components/ItemCard";
import { SearchResultsSkeleton } from "./SearchResultsSkeleton";

function SearchResultsInner({ query, category }: SearchResultsInnerProps) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [accumulatedItems, setAccumulatedItems] = useState<Doc<"items">[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastProcessedCursor = useRef<string | null>(null);
  const { isAuthenticated } = useConvexAuth();

  const favoriteItemIds = useQuery(
    api.favorites.getFavoriteItemIds,
    isAuthenticated ? {} : "skip",
  );
  const favoriteSet = useMemo(
    () => new Set(favoriteItemIds ?? []),
    [favoriteItemIds],
  );

  const searchResult = useQuery(api.items.searchItems, {
    query: query || undefined,
    category: category || undefined,
    paginationOpts: {
      numItems: 12,
      cursor,
    },
  });

  // Handle initial page and pagination
  useEffect(() => {
    if (!searchResult?.page) return;

    // For initial load (cursor is null), just set the items
    if (cursor === null) {
      setAccumulatedItems(searchResult.page);
      lastProcessedCursor.current = null;
      return;
    }

    // For pagination, append only if we haven't processed this cursor yet
    if (lastProcessedCursor.current !== cursor) {
      lastProcessedCursor.current = cursor;
      const existingIds = new Set(accumulatedItems.map((item) => item._id));
      const newItems = searchResult.page.filter(
        (item) => !existingIds.has(item._id),
      );
      if (newItems.length > 0) {
        setAccumulatedItems((prev) => [...prev, ...newItems]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResult?.page, cursor]);

  // Infinite scroll observer
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          searchResult &&
          !searchResult.isDone &&
          searchResult.continueCursor
        ) {
          setCursor(searchResult.continueCursor);
        }
      },
      { rootMargin: "100px" },
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [searchResult]);

  const ownerIds = useMemo(() => {
    return [...new Set(accumulatedItems.map((item) => item.ownerId))];
  }, [accumulatedItems]);

  const ownerProfiles = useQuery(
    api.profiles.getProfilesByUserIds,
    ownerIds.length > 0 ? { userIds: ownerIds } : "skip",
  );

  const itemsWithProfiles = useMemo(() => {
    const profileMap = new Map((ownerProfiles ?? []).map((p) => [p.userId, p]));
    return accumulatedItems.map((item) => ({
      ...item,
      ownerProfile: profileMap.get(item.ownerId),
    }));
  }, [accumulatedItems, ownerProfiles]);

  // Initial loading state
  if (!searchResult && accumulatedItems.length === 0) {
    return <SearchResultsSkeleton />;
  }

  // Empty state
  if (searchResult && accumulatedItems.length === 0 && searchResult.isDone) {
    return (
      <div className="rounded-2xl bg-card p-12 text-center">
        <p className="text-muted-foreground">
          {query
            ? `Nema rezultata za "${query}".`
            : "Nema dostupnih predmeta u ovoj kategoriji."}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pokušajte sa drugim pojmom za pretragu.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 xl:grid-cols-5">
        {itemsWithProfiles.map((item) => (
          <ItemCard
            key={item._id}
            item={item}
            isFavorited={favoriteSet.has(item._id)}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {searchResult && !searchResult.isDone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Učitavanje...</span>
          </div>
        )}
      </div>
    </>
  );
}

interface SearchResultsInnerProps {
  query?: string;
  category?: string;
}

interface SearchResultsProps {
  query?: string;
  category?: string;
}

// Wrapper component that uses key to reset state when query/category changes
export function SearchResults({ query, category }: SearchResultsProps) {
  // Using key to force remount when search params change, which resets all state
  const key = `${query ?? ""}-${category ?? ""}`;
  return <SearchResultsInner key={key} query={query} category={category} />;
}
