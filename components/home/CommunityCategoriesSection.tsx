"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tag, Plus } from "lucide-react";

export function CommunityCategoriesSection() {
  const categories = useQuery(api.categories.listWithItemCounts);

  if (!categories || categories.length === 0) return null;

  return (
    <section className="bg-podeli-accent/5 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-podeli-dark sm:text-4xl">
            Kategorije koje zajednica stvara
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Korisnici sami kreiraju kategorije kada objavljuju predmete. Vaša
            kategorija se pojavljuje odmah i dostupna je svima.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/pretraga?kategorija=${encodeURIComponent(cat.name)}`}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-podeli-light p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-podeli-accent/10 text-podeli-accent transition-transform group-hover:scale-110">
                <Tag className="h-6 w-6" />
              </div>
              <span className="text-center text-sm font-semibold text-podeli-dark">
                {cat.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {cat.itemCount} {cat.itemCount === 1 ? "predmet" : "predmeta"}
              </span>
            </Link>
          ))}

          {/* CTA card */}
          <Link
            href="/kontrolna-tabla/kategorije"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-podeli-accent/40 bg-podeli-light/50 p-6 transition-all hover:border-podeli-accent hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-podeli-accent/20 text-podeli-accent transition-transform group-hover:scale-110">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-center text-sm font-semibold text-podeli-accent">
              Dodaj svoju kategoriju
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
