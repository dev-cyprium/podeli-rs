"use client";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
}

export function ImageLightbox({
  open,
  onOpenChange,
  src,
  alt,
}: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-full h-dvh w-dvw border-none bg-black/95 p-0 rounded-none sm:max-w-full"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">
          Prikaz fotografije u punoj veličini. Koristite pinch ili scroll za zumiranje.
        </DialogDescription>

        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={5}
          doubleClick={{ mode: "reset" }}
          wheel={{ step: 0.1 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Controls */}
              <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => zoomIn()}
                  className="h-10 w-10 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => zoomOut()}
                  className="h-10 w-10 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => resetTransform()}
                  className="h-10 w-10 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-10 w-10 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Image */}
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={alt}
                  className="max-h-dvh max-w-full object-contain"
                  draggable={false}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </DialogContent>
    </Dialog>
  );
}
