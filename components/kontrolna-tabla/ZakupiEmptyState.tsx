"use client";

import { Search } from "lucide-react";

export function ZakupiEmptyState() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <Search className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Pronađi šta ti treba
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Pretraži stvari koje komšije dele u tvojoj blizini.
        </p>
        <button
          disabled
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-amber-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pretraži ponudu
        </button>
        <p className="mt-3 text-sm text-slate-500">
          Uskoro dostupno
        </p>
      </div>
    </div>
  );
}
