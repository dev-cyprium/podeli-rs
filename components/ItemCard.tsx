"use client";

import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { DomacinBadge } from "@/components/DomacinBadge";
import { ItemCardCarousel } from "@/components/ItemCardCarousel";
import { getItemUrl } from "@/lib/utils";
import { Heart, MapPin } from "lucide-react";

type OwnerProfile = {
  userId: string;
  hasBadge: boolean;
  badgeLabel?: string;
  planSlug: string;
};

interface ItemCardProps {
  item: Doc<"items"> & {
    ownerProfile?: OwnerProfile;
  };
  isFavorited: boolean;
  isAuthenticated: boolean;
}

export function ItemCard({
  item,
  isFavorited,
  isAuthenticated,
}: ItemCardProps) {
  const toggleFavorite = useMutation(api.favorites.toggle);
  const hasBadge = item.ownerProfile?.hasBadge ?? false;
  const itemUrl = getItemUrl(item);

  return (
    <Link href={itemUrl} className="group block">
      {/* Image carousel */}
      <div className="relative">
        <ItemCardCarousel
          images={item.images}
          title={item.title}
          focalPoint={item.imageFocalPoint}
        />

        {/* Heart — top-right */}
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
            className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-white/80 shadow-md transition-colors hover:bg-white"
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorited
                  ? "fill-[#dd1c1a] text-[#dd1c1a]"
                  : "text-podeli-dark/70"
              }`}
            />
          </Button>
        )}

        {/* Deposit — bottom-left */}
        {item.deposit != null && item.deposit > 0 && (
          <span className="absolute bottom-2 left-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-podeli-dark shadow-sm">
            Depozit {item.deposit.toFixed(0)} RSD
          </span>
        )}

        {/* Domacin badge — bottom-right */}
        {hasBadge && (
          <span className="absolute bottom-2 right-2 z-10">
            <DomacinBadge size="sm" />
          </span>
        )}
      </div>

      {/* Text content */}
      <div className="pt-2">
        <h3 className="line-clamp-1 text-sm font-semibold text-podeli-dark">
          {item.title}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>Beograd</span>
          <span className="mx-0.5">&middot;</span>
          <span>{item.category}</span>
        </p>
        <p className="mt-1 text-sm font-semibold text-podeli-accent">
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
        </p>
      </div>
    </Link>
  );
}
