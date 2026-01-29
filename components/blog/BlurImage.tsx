"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BlurImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function BlurImage({
  src,
  alt,
  className,
  priority = false,
}: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
      priority={priority}
      onLoad={() => setIsLoaded(true)}
      className={cn(
        "object-cover transition-all duration-500",
        isLoaded ? "scale-100 blur-0" : "scale-105 blur-md",
        className
      )}
    />
  );
}
