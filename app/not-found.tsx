import Image from "next/image";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { SearchBar } from "@/components/search/SearchBar";
import { ItemsGrid } from "@/components/ItemsGrid";
import { ItemsGridSkeleton } from "@/components/ItemsGridSkeleton";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Suspense } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WanderingAnts } from "@/components/WanderingAnts";

async function SuggestedItems() {
  const preloadItems = await preloadQuery(api.items.listAll, { limit: 4 });

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-podeli-dark">
          Možda te zanima nešto od ovoga?
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ItemsGrid preloadedItems={preloadItems} />
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/pretraga"
            className="text-sm font-semibold text-podeli-accent hover:text-podeli-accent/90"
          >
            Pregledaj sve oglase &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-podeli-light font-sans text-podeli-dark selection:bg-podeli-accent/20 selection:text-podeli-dark">
      <NavBar />

      {/* 404 Hero */}
      <section className="relative overflow-hidden pt-12 pb-8 sm:pt-20 sm:pb-12">
        <WanderingAnts />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Illustration */}
            <div className="relative mb-8 h-72 w-72 sm:h-96 sm:w-96">
              <Image
                src="/img/lost_ants_404.png"
                alt="Zbunjeni mravi traže stranicu"
                fill
                className="rounded-3xl object-contain"
                priority
              />
            </div>

            {/* 404 text */}
            <p className="mb-2 text-6xl font-black tracking-tighter text-podeli-accent sm:text-8xl">
              404
            </p>
            <h1 className="max-w-lg text-2xl font-bold tracking-tight text-podeli-dark sm:text-3xl">
              Čak su se i naši mravi izgubili!
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Stranica koju tražiš ne postoji, promenila je adresu, ili su je
              mravi odneli negde drugde.
            </p>

            {/* Action buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="bg-podeli-accent text-white hover:bg-podeli-accent/90">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Početna stranica
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pretraga">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Pregledaj oglase
                </Link>
              </Button>
            </div>

            {/* Search */}
            <div className="mt-10 w-full max-w-xl">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Ili probaj da pronađeš ono što ti treba:
              </p>
              <SearchBar placeholder="Pretraži oglase..." />
            </div>
          </div>
        </div>
      </section>

      {/* Suggested items */}
      <Suspense
        fallback={
          <div className="py-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mb-8 flex justify-center">
                <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl bg-card shadow-md"
                  >
                    <div className="flex h-48 w-full items-center justify-center bg-muted">
                      <div className="h-20 w-20 animate-pulse rounded-full bg-slate-200" />
                    </div>
                    <div className="p-5">
                      <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                      <div className="mb-2 h-4 w-1/4 animate-pulse rounded bg-slate-200" />
                      <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <SuggestedItems />
      </Suspense>

      {/* Footer */}
      <footer className="bg-card py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground lg:px-8">
          <p>© {new Date().getFullYear()} podeli.rs – Sva prava zadržana.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-6">
            <Link href="/" className="hover:text-podeli-dark">
              Početna
            </Link>
            <Link href="/pretraga" className="hover:text-podeli-dark">
              Pretraga
            </Link>
            <Link href="/kako-funkcionise" className="hover:text-podeli-dark">
              Kako funkcioniše
            </Link>
            <a
              href="mailto:kontakt@podeli.rs"
              className="hover:text-podeli-dark"
            >
              Kontakt
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
