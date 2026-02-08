"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useQuery,
  useAction,
  useMutation,
  useConvexAuth,
  Preloaded,
  usePreloadedQuery,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { DomacinBadge } from "@/components/DomacinBadge";
import { getItemUrl } from "@/lib/utils";
import { Tag, MapPin, Heart } from "lucide-react";
import { AntIcon } from "@/components/icons/Icons";

type UserSnapshot = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

function CategoryIcon({
  className,
  strokeWidth,
}: {
  category: string;
  className?: string;
  strokeWidth?: number;
}) {
  return <Tag className={className} strokeWidth={strokeWidth} />;
}

type OwnerProfile = {
  userId: string;
  hasBadge: boolean;
  badgeLabel?: string;
  planSlug: string;
};

function ItemCard({
  item,
  isFavorited,
  isAuthenticated,
}: {
  item: Doc<"items"> & {
    owner: UserSnapshot | undefined;
    ownerProfile?: OwnerProfile;
  };
  isFavorited: boolean;
  isAuthenticated: boolean;
}) {
  const imageUrl = useQuery(
    api.items.getImageUrl,
    item.images[0] ? { storageId: item.images[0] as Id<"_storage"> } : "skip",
  );
  const toggleFavorite = useMutation(api.favorites.toggle);
  const owner = item.owner;
  const ownerProfile = item.ownerProfile;
  const hasBadge = ownerProfile?.hasBadge ?? false;
  const itemUrl = getItemUrl(item);

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ${hasBadge ? "ring-2 ring-[#f0a202]/50 shadow-[0_4px_24px_0_rgba(240,162,2,0.10)]" : ""}`}
    >
      <Link href={itemUrl}>
        <div className="relative flex aspect-[4/5] w-full items-center justify-center bg-muted transition-colors group-hover:bg-podeli-accent/10">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
              className="object-cover"
              style={item.imageFocalPoint ? { objectPosition: `${item.imageFocalPoint.x}% ${item.imageFocalPoint.y}%` } : undefined}
            />
          ) : (
            <CategoryIcon
              category={item.category}
              className="h-20 w-20 text-muted group-hover:text-podeli-accent"
              strokeWidth={1.5}
            />
          )}
          {isAuthenticated && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite({ itemId: item._id });
              }}
              className="absolute left-2 top-2 z-10 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm transition-colors hover:bg-black/50"
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? "fill-[#dd1c1a] text-[#dd1c1a]" : "text-white"}`}
              />
            </Button>
          )}
          {item.deposit != null && item.deposit > 0 && (
            <span className="absolute right-2 top-2 rounded-full bg-podeli-accent px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
              Depozit {item.deposit.toFixed(0)} RSD
            </span>
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
            <AntIcon className="p-[4px] border border-border rounded-full h-9 w-9 shrink-0" />
            <span className="text-xs font-medium text-muted-foreground">
              {owner && owner.firstName && owner.lastName
                ? `${owner.firstName} ${owner.lastName[0]}.`
                : "Komšija"}
            </span>
            {hasBadge && <DomacinBadge size="sm" />}
          </div>
          <span className="font-bold text-podeli-accent">
            {item.priceByAgreement ? (
              "Po dogovoru"
            ) : (
              <>
                {item.pricePerDay.toFixed(0)} RSD
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  /dan
                </span>
              </>
            )}
          </span>
        </div>
        <div className="mt-auto pt-4">
          <Button
            asChild
            className="w-full bg-podeli-accent text-white hover:bg-podeli-accent/90"
            size="sm"
          >
            <Link href={itemUrl}>Iznajmi</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ItemsGrid({
  preloadedItems,
}: {
  preloadedItems: Preloaded<typeof api.items.listAll>;
}) {
  const items = usePreloadedQuery(preloadedItems);
  const getUsersByIds = useAction(api.clerk.getUsersByIds);
  const [users, setUsers] = useState<UserSnapshot[]>([]);
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

  useEffect(() => {
    if (items && items.length > 0) {
      const userIds = items.map((item) => item.ownerId);
      getUsersByIds({ userIds }).then(setUsers).catch(console.error);
    }
  }, [items, getUsersByIds]);

  const itemsWithUsers = useMemo(() => {
    if (!items) return undefined;
    const userMap = new Map(users.map((user) => [user.id, user]));
    const profileMap = new Map((ownerProfiles ?? []).map((p) => [p.userId, p]));
    return items.map((item) => ({
      ...item,
      owner: userMap.get(item.ownerId),
      ownerProfile: profileMap.get(item.ownerId),
    }));
  }, [items, users, ownerProfiles]);

  if (itemsWithUsers === undefined) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl bg-card shadow-md"
          >
            <div className="flex aspect-[4/5] w-full items-center justify-center bg-muted">
              <div className="h-20 w-20 animate-pulse rounded-full bg-muted"></div>
            </div>
            <div className="p-5">
              <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted"></div>
              <div className="mb-2 h-4 w-1/4 animate-pulse rounded bg-muted"></div>
              <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-muted"></div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (itemsWithUsers.length === 0) {
    return (
      <div className="col-span-full rounded-2xl bg-card p-12 text-center shadow-md">
        <p className="text-muted-foreground">
          Trenutno nema dostupnih predmeta. Budite prvi koji će objaviti
          predmet!
        </p>
      </div>
    );
  }

  return (
    <>
      {itemsWithUsers.map((item) => (
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
