"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ZakupiEmptyState() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-podeli-blue/10 text-podeli-blue">
          <Search className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-podeli-dark sm:text-3xl">
          Pronađi šta ti treba
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Pretraži stvari koje komšije dele u tvojoj blizini.
        </p>
        <Button
          disabled
          className="mt-8 bg-podeli-accent px-8 py-3.5 text-sm font-semibold text-podeli-dark shadow-sm hover:bg-podeli-accent/90"
        >
          Pretraži ponudu
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">
          Uskoro dostupno
        </p>
      </div>
    </div>
  );
}
