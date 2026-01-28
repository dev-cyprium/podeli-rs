"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { getItemUrl } from "@/lib/utils";
import { Drill, Tent, Gamepad2, Bike, MapPin, Loader2 } from "lucide-react";
import { SearchResultsSkeleton } from "./SearchResultsSkeleton";

type UserSnapshot = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  Alati: Drill,
  Kampovanje: Tent,
  Zabava: Gamepad2,
  Prevoz: Bike,
  Elektronika: Gamepad2,
  "Društvene igre": Gamepad2,
};

function CategoryIcon({
  category,
  className,
  strokeWidth,
}: {
  category: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = categoryIcons[category] || Drill;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

function ItemCard({
  item,
}: {
  item: Doc<"items"> & { owner: UserSnapshot | undefined };
}) {
  const imageUrl = useQuery(
    api.items.getImageUrl,
    item.images[0] ? { storageId: item.images[0] as Id<"_storage"> } : "skip"
  );
  const owner = item.owner;
  const itemUrl = getItemUrl(item);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
      <Link href={itemUrl}>
        <div className="relative flex h-48 w-full items-center justify-center bg-muted transition-colors group-hover:bg-podeli-accent/10">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
          ) : (
            <CategoryIcon
              category={item.category}
              className="h-20 w-20 text-muted group-hover:text-podeli-accent"
              strokeWidth={1.5}
            />
          )}
        </div>
      </Link>
      <div className="flex h-full flex-col p-5">
        <Link href={itemUrl}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 flex-1 font-semibold text-podeli-dark hover:text-podeli-accent">
              {item.title}
            </h3>
            <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
              {item.category}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Beograd</span>
          </div>
        </Link>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted"></div>
            <span className="text-xs font-medium text-muted-foreground">
              {owner && owner.firstName && owner.lastName
                ? `${owner.firstName} ${owner.lastName[0]}.`
                : "Komšija"}
            </span>
          </div>
          <span className="font-bold text-podeli-accent">
            {item.pricePerDay.toFixed(0)} RSD
            <span className="text-xs font-normal text-muted-foreground"> /dan</span>
          </span>
        </div>
        <div className="mt-auto pt-4">
          <Button
            asChild
            className="w-full bg-podeli-accent text-podeli-dark hover:bg-podeli-accent/90"
            size="sm"
          >
            <Link href={itemUrl}>Iznajmi</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SearchResultsInnerProps {
  query?: string;
  category?: string;
}

function SearchResultsInner({ query, category }: SearchResultsInnerProps) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [accumulatedItems, setAccumulatedItems] = useState<Doc<"items">[]>([]);
  const [users, setUsers] = useState<UserSnapshot[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastProcessedCursor = useRef<string | null>(null);

  const getUsersByIds = useAction(api.clerk.getUsersByIds);

  const searchResult = useQuery(api.items.searchItems, {
    query: query || undefined,
    category: category || undefined,
    paginationOpts: {
      numItems: 8,
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
        (item) => !existingIds.has(item._id)
      );
      if (newItems.length > 0) {
        setAccumulatedItems((prev) => [...prev, ...newItems]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResult?.page, cursor]);

  // Fetch users for displayed items
  useEffect(() => {
    if (accumulatedItems.length > 0) {
      const userIds = [...new Set(accumulatedItems.map((item) => item.ownerId))];
      getUsersByIds({ userIds }).then(setUsers).catch(console.error);
    }
  }, [accumulatedItems, getUsersByIds]);

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
      { rootMargin: "100px" }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [searchResult]);

  const itemsWithUsers = useMemo(() => {
    const userMap = new Map(users.map((user) => [user.id, user]));
    return accumulatedItems.map((item) => ({
      ...item,
      owner: userMap.get(item.ownerId),
    }));
  }, [accumulatedItems, users]);

  // Initial loading state
  if (!searchResult && accumulatedItems.length === 0) {
    return <SearchResultsSkeleton />;
  }

  // Empty state
  if (searchResult && accumulatedItems.length === 0 && searchResult.isDone) {
    return (
      <div className="rounded-2xl bg-card p-12 text-center shadow-md">
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {itemsWithUsers.map((item) => (
          <ItemCard key={item._id} item={item} />
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
