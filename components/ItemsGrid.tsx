"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useQuery,
  useAction,
  Preloaded,
  usePreloadedQuery,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { getItemUrl } from "@/lib/utils";
import { Drill, Tent, Gamepad2, Bike, MapPin } from "lucide-react";

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
    item.images[0] ? { storageId: item.images[0] as Id<"_storage"> } : "skip",
  );
  const owner = item.owner;
  const itemUrl = getItemUrl(item);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
      <Link href={itemUrl}>
        <div className="relative flex h-48 w-full items-center justify-center bg-slate-100 transition-colors group-hover:bg-amber-50">
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
              className="h-20 w-20 text-slate-300 group-hover:text-amber-500"
              strokeWidth={1.5}
            />
          )}
        </div>
      </Link>
      <div className="flex h-full flex-col p-5">
        <Link href={itemUrl}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 flex-1 font-semibold text-slate-900 hover:text-amber-600">
              {item.title}
            </h3>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
              {item.category}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="h-3 w-3" />
            <span>Beograd</span>
          </div>
        </Link>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-slate-200"></div>
            <span className="text-xs font-medium text-slate-600">
              {owner && owner.firstName && owner.lastName
                ? `${owner.firstName} ${owner.lastName[0]}.`
                : "Komšija"}
            </span>
          </div>
          <span className="font-bold text-amber-600">
            {item.pricePerDay.toFixed(0)} RSD
            <span className="text-xs font-normal text-slate-400"> /dan</span>
          </span>
        </div>
        <div className="mt-auto pt-4">
          <Button
            asChild
            className="w-full bg-amber-500 text-white hover:bg-amber-600"
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

  useEffect(() => {
    if (items && items.length > 0) {
      const userIds = items.map((item) => item.ownerId);
      getUsersByIds({ userIds }).then(setUsers).catch(console.error);
    }
  }, [items, getUsersByIds]);

  const itemsWithUsers = useMemo(() => {
    if (!items) return undefined;
    const userMap = new Map(users.map((user) => [user.id, user]));
    return items.map((item) => ({
      ...item,
      owner: userMap.get(item.ownerId),
    }));
  }, [items, users]);

  if (itemsWithUsers === undefined) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-md"
          >
            <div className="flex h-48 w-full items-center justify-center bg-slate-100">
              <div className="h-20 w-20 animate-pulse rounded-full bg-slate-200"></div>
            </div>
            <div className="p-5">
              <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-slate-200"></div>
              <div className="mb-2 h-4 w-1/4 animate-pulse rounded bg-slate-200"></div>
              <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-slate-200"></div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (itemsWithUsers.length === 0) {
    return (
      <div className="col-span-full rounded-2xl bg-white p-12 text-center shadow-md">
        <p className="text-slate-600">
          Trenutno nema dostupnih predmeta. Budite prvi koji će objaviti
          predmet!
        </p>
      </div>
    );
  }

  return (
    <>
      {itemsWithUsers.map((item) => (
        <ItemCard key={item._id} item={item} />
      ))}
    </>
  );
}
