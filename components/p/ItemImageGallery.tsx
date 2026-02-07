"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "./ImageLightbox";

interface ItemImageGalleryProps {
  images: Id<"_storage">[];
  title: string;
  imageFocalPoint?: { x: number; y: number };
}

export function ItemImageGallery({ images, title, imageFocalPoint }: ItemImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
      <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-muted md:aspect-[3/2]">
        <span className="text-muted-foreground">Nema slika</span>
      </div>
    );
  }

  const currentImageUrl = imageUrls?.[images[currentIndex]];
  const focalStyle = imageFocalPoint
    ? { objectPosition: `${imageFocalPoint.x}% ${imageFocalPoint.y}%` }
    : undefined;

  return (
    <div className="space-y-4">
      <div
        className="group/gallery relative cursor-pointer overflow-hidden rounded-xl bg-muted"
        onClick={() => currentImageUrl && setLightboxOpen(true)}
      >
        <div className="relative aspect-[4/5] w-full md:aspect-[3/2]">
          {currentImageUrl ? (
            <Image
              src={currentImageUrl}
              alt={`${title} - slika ${currentIndex + 1}`}
              fill
              className="object-cover md:object-contain"
              style={focalStyle}
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
            </div>
          )}
        </div>

        {/* Expand icon */}
        {currentImageUrl && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/gallery:opacity-100">
            <Expand className="h-4 w-4" />
          </div>
        )}

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-podeli-light/80 hover:bg-podeli-light"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-podeli-light/80 hover:bg-podeli-light"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
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
              <Button
                key={imageId}
                variant="ghost"
                onClick={() => setCurrentIndex(index)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 p-0 transition-colors ${
                  index === currentIndex
                    ? "border-podeli-accent"
                    : "border-transparent hover:border-podeli-accent/30 hover:bg-transparent"
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
              </Button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {currentImageUrl && (
        <ImageLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          src={currentImageUrl}
          alt={`${title} - slika ${currentIndex + 1}`}
        />
      )}
    </div>
  );
}
