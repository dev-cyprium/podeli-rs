"use client";

import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PodeliEmptyStateProps {
  onCreate: () => void;
  className?: string;
  /** When true, the create button is disabled (e.g. contact prefs not set) */
  createDisabled?: boolean;
}

export function PodeliEmptyState({ onCreate, className, createDisabled }: PodeliEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 py-16",
        className
      )}
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-podeli-accent/10 text-podeli-accent">
          <Package className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-podeli-dark sm:text-3xl">
          Još nemaš objavljenih stvari
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Podeli stvari koje ne koristiš svaki dan i zaradi.
        </p>
        {createDisabled && (
          <p className="mt-2 text-sm text-podeli-blue">
            Postavite način kontakta u panelu iznad da biste mogli da dodate predmet.
          </p>
        )}
        <Button
          onClick={onCreate}
          disabled={createDisabled}
          title={createDisabled ? "Postavite način kontakta gore da biste dodali predmet" : undefined}
          className="mt-8 rounded-xl bg-podeli-accent px-8 py-3.5 text-sm font-semibold text-podeli-dark shadow-sm hover:bg-podeli-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Dodaj prvi predmet
        </Button>
      </div>
    </div>
  );
}
