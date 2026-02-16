"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FavoritesList() {
  const favorites = useQuery(api.favorites.listMyFavorites);
  const toggleFavorite = useMutation(api.favorites.toggle);

  if (favorites === undefined) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square animate-pulse rounded-xl bg-muted" />
            <div className="space-y-1.5 pt-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
              <div className="h-4 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-card p-12 text-center shadow-sm">
        <Heart className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <h2 className="text-lg font-semibold text-podeli-dark">
          Nemate omiljenih predmeta
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Kliknite na srce na bilo kom predmetu da ga sačuvate ovde.
        </p>
        <Button asChild className="mt-6 bg-podeli-accent text-white hover:bg-podeli-accent/90">
          <Link href="/pretraga">
            <Search className="mr-2 h-4 w-4" />
            Pretraži ponudu
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {favorites.map((fav) => {
        const itemUrl = fav.item.shortId && fav.item.slug
          ? `/p/${fav.item.shortId}/${fav.item.slug}`
          : "#";

        return (
          <Link key={fav.favoriteId} href={itemUrl} className="group block">
            {/* Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
              {fav.item.imageUrl ? (
                <Image
                  src={fav.item.imageUrl}
                  alt={fav.item.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-4xl text-muted-foreground/20">📦</span>
                </div>
              )}

              {/* Heart — top-right */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite({ itemId: fav.item._id });
                }}
                className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-white/80 shadow-md transition-colors hover:bg-white"
                title="Ukloni iz omiljenih"
              >
                <Heart className="h-4 w-4 fill-[#dd1c1a] text-[#dd1c1a]" />
              </Button>
            </div>

            {/* Text content */}
            <div className="pt-2">
              <h3 className="line-clamp-1 text-sm font-semibold text-podeli-dark">
                {fav.item.title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {fav.item.category}
              </p>
              <p className="mt-1 text-sm font-semibold text-podeli-accent">
                {fav.item.pricePerDay.toFixed(0)} RSD
                <span className="text-xs font-normal text-muted-foreground"> /dan</span>
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
