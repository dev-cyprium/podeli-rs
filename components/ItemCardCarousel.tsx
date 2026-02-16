"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ItemCardCarouselProps {
  images: Id<"_storage">[];
  title: string;
  focalPoint?: { x: number; y: number };
}

export function ItemCardCarousel({
  images,
  title,
  focalPoint,
}: ItemCardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [pointerStart, setPointerStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [swiping, setSwiping] = useState(false);

  const imageUrls = useQuery(
    api.items.getImageUrls,
    images.length > 0 ? { storageIds: images } : "skip",
  );

  const hasMultiple = images.length > 1;

  const goTo = useCallback(
    (newIndex: number, dir: number) => {
      setDirection(dir);
      setCurrentIndex(
        ((newIndex % images.length) + images.length) % images.length,
      );
    },
    [images.length],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!hasMultiple) return;
      setPointerStart({ x: e.clientX, y: e.clientY });
      setSwiping(false);
    },
    [hasMultiple],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerStart || !hasMultiple) return;
      const dx = e.clientX - pointerStart.x;
      const dy = e.clientY - pointerStart.y;
      // Only swipe if horizontal movement exceeds threshold and is more horizontal than vertical
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        setSwiping(true);
        if (dx < 0) {
          goTo(currentIndex + 1, 1);
        } else {
          goTo(currentIndex - 1, -1);
        }
      }
      setPointerStart(null);
    },
    [pointerStart, hasMultiple, goTo, currentIndex],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // If the user swiped, prevent the parent link from navigating
      if (swiping) {
        e.preventDefault();
        e.stopPropagation();
        setSwiping(false);
      }
    },
    [swiping],
  );

  // No images fallback
  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-muted">
        <Tag className="h-12 w-12 text-muted-foreground/30" strokeWidth={1.5} />
      </div>
    );
  }

  const currentStorageId = images[currentIndex];
  const currentUrl = imageUrls?.[currentStorageId] ?? null;
  // Apply focal point only to first image
  const objectPosition =
    currentIndex === 0 && focalPoint
      ? `${focalPoint.x}% ${focalPoint.y}%`
      : undefined;

  // Single image — no controls
  if (!hasMultiple) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt={title}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
            style={objectPosition ? { objectPosition } : undefined}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Tag
              className="h-12 w-12 text-muted-foreground/30"
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>
    );
  }

  // Multiple images — carousel
  return (
    <div
      className="group/carousel relative aspect-square w-full overflow-hidden rounded-xl bg-muted"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClickCapture={handleClick}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          initial={{ x: direction > 0 ? "100%" : "-100%", opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? "-100%" : "100%", opacity: 0.5 }}
          transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt={`${title} ${currentIndex + 1}`}
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
              draggable={false}
              style={objectPosition ? { objectPosition } : undefined}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Tag
                className="h-12 w-12 text-muted-foreground/30"
                strokeWidth={1.5}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Prev/Next arrows — desktop hover only */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          goTo(currentIndex - 1, -1);
        }}
        className="absolute left-1.5 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 rounded-full bg-white/90 shadow-md hover:bg-white group-hover/carousel:flex"
      >
        <ChevronLeft className="h-4 w-4 text-podeli-dark" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          goTo(currentIndex + 1, 1);
        }}
        className="absolute right-1.5 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 rounded-full bg-white/90 shadow-md hover:bg-white group-hover/carousel:flex"
      >
        <ChevronRight className="h-4 w-4 text-podeli-dark" />
      </Button>

      {/* Dot indicators (max 5) */}
      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
        {images.slice(0, 5).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === currentIndex
                ? "bg-white"
                : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
