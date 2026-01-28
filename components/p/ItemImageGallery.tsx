"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface ItemImageGalleryProps {
  images: Id<"_storage">[];
  title: string;
}

export function ItemImageGallery({ images, title }: ItemImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const imageUrls = useQuery(
    api.items.getImageUrls,
    images.length > 0 ? { storageIds: images } : "skip"
  );

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-muted sm:h-80 md:h-96">
        <span className="text-muted-foreground">Nema slika</span>
      </div>
    );
  }

  const currentImageUrl = imageUrls?.[images[currentIndex]];

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-muted">
        <div className="relative h-64 w-full sm:h-80 md:h-96">
          {currentImageUrl ? (
            <Image
              src={currentImageUrl}
              alt={`${title} - slika ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
            </div>
          )}
        </div>

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-podeli-light/80 hover:bg-podeli-light"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-podeli-light/80 hover:bg-podeli-light"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((imageId, index) => {
            const thumbnailUrl = imageUrls?.[imageId];
            return (
              <button
                key={imageId}
                onClick={() => setCurrentIndex(index)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  index === currentIndex
                    ? "border-podeli-accent"
                    : "border-transparent hover:border-podeli-accent/30"
                }`}
              >
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={`${title} - thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-muted" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
