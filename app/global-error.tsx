"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { WanderingAnts } from "@/components/WanderingAnts";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="sr">
      <body className="min-h-screen bg-[#f8f7ff] font-sans text-[#02020a]">
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
          <WanderingAnts />
          <div className="relative z-10 flex flex-col items-center text-center">
            <p className="mb-2 text-6xl font-black tracking-tighter text-[#f0a202] sm:text-8xl">
              500
            </p>
            <h1 className="max-w-lg text-2xl font-bold tracking-tight text-[#02020a] sm:text-3xl">
              Mravi su napravili haos!
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-[#02020a]/60 sm:text-lg">
              Nešto je pošlo po zlu. Naši mravi rade na rešavanju problema.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg bg-[#f0a202] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#f0a202]/90"
              >
                <Home className="h-4 w-4" />
                Početna stranica
              </Link>
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center gap-2 rounded-lg border border-[#02020a]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#02020a] transition-colors hover:bg-[#02020a]/5"
              >
                <RotateCcw className="h-4 w-4" />
                Pokušaj ponovo
              </button>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
}
