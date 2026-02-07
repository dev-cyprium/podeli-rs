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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl bg-card shadow-sm"
          >
            <div className="h-40 animate-pulse bg-muted" />
            <div className="p-4">
              <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((fav) => {
        const itemUrl = fav.item.shortId && fav.item.slug
          ? `/p/${fav.item.shortId}/${fav.item.slug}`
          : "#";

        return (
          <div
            key={fav.favoriteId}
            className="group overflow-hidden rounded-xl bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Link href={itemUrl}>
              <div className="relative h-40 w-full bg-muted">
                {fav.item.imageUrl ? (
                  <Image
                    src={fav.item.imageUrl}
                    alt={fav.item.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-4xl text-muted-foreground/20">📦</span>
                  </div>
                )}
              </div>
            </Link>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <Link href={itemUrl} className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 font-semibold text-podeli-dark group-hover:text-podeli-accent">
                    {fav.item.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {fav.item.category}
                    </span>
                    <span className="text-sm font-bold text-podeli-accent">
                      {fav.item.pricePerDay.toFixed(0)} RSD/dan
                    </span>
                  </div>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite({ itemId: fav.item._id })}
                  className="h-8 w-8 shrink-0 rounded-full text-[#dd1c1a] hover:bg-[#dd1c1a]/10"
                  title="Ukloni iz omiljenih"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
