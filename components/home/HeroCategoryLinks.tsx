"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function HeroCategoryLinks() {
  const categories = useQuery(api.categories.listNames);

  if (!categories || categories.length === 0) return null;

  const displayed = categories.slice(0, 5);

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
      <span>Popularno:</span>
      {displayed.map((name) => (
        <Link
          key={name}
          href={`/pretraga?kategorija=${encodeURIComponent(name)}`}
          className="font-medium text-podeli-dark hover:text-podeli-accent hover:underline"
        >
          {name}
        </Link>
      ))}
    </div>
  );
}
