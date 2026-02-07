"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FavoriteButton({ itemId }: { itemId: Id<"items"> }) {
  const { isAuthenticated } = useConvexAuth();
  const isFavorited = useQuery(
    api.favorites.isFavorited,
    isAuthenticated ? { itemId } : "skip",
  );
  const toggle = useMutation(api.favorites.toggle);

  if (!isAuthenticated) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggle({ itemId })}
      className="gap-2"
    >
      <Heart
        className={`h-4 w-4 ${isFavorited ? "fill-[#dd1c1a] text-[#dd1c1a]" : ""}`}
      />
      {isFavorited ? "Sačuvano" : "Sačuvaj"}
    </Button>
  );
}
