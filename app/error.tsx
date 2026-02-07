"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { WanderingAnts } from "@/components/WanderingAnts";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-podeli-light font-sans text-podeli-dark selection:bg-podeli-accent/20 selection:text-podeli-dark">
      <nav className="sticky top-0 z-50 border-b border-border bg-podeli-light/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6 lg:px-8">
          <Logo href="/" />
        </div>
      </nav>

      <section className="relative overflow-hidden pt-12 pb-8 sm:pt-20 sm:pb-12">
        <WanderingAnts />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <p className="mb-2 text-6xl font-black tracking-tighter text-podeli-accent sm:text-8xl">
              500
            </p>
            <h1 className="max-w-lg text-2xl font-bold tracking-tight text-podeli-dark sm:text-3xl">
              Mravi su napravili haos!
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Nešto je pošlo po zlu. Naši mravi rade na rešavanju problema.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Početna stranica
                </Link>
              </Button>
              <Button variant="outline" onClick={() => reset()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Pokušaj ponovo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-card py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground lg:px-8">
          <p>&copy; {new Date().getFullYear()} podeli.rs &ndash; Sva prava zadržana.</p>
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
