"use client";

import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PodeliEmptyStateProps {
  onCreate: () => void;
  className?: string;
}

export function PodeliEmptyState({ onCreate, className }: PodeliEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 py-16",
        className
      )}
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Package className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Još nemaš objavljenih stvari
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Podeli stvari koje ne koristiš svaki dan i zaradi.
        </p>
        <Button
          onClick={onCreate}
          className="mt-8 rounded-xl bg-amber-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
        >
          Dodaj prvi predmet
        </Button>
      </div>
    </div>
  );
}
