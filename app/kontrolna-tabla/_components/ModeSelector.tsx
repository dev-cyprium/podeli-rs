"use client";

import Link from "next/link";
import { Package, Search } from "lucide-react";

export function ModeSelector() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 flex justify-center">
          <Link
            href="/"
            className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            ← Nazad na početnu
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Šta želiš da radiš danas?
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Izaberi režim rada i započni.
        </p>
      </div>

      <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Podeli Card */}
        <Link
          href="/kontrolna-tabla/predmeti"
          className="group relative overflow-hidden rounded-2xl border-2 border-transparent bg-white p-8 text-left shadow-md transition-all hover:-translate-y-1 hover:border-amber-500 hover:shadow-xl"
        >
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
            <Package className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Podeli</h2>
          <p className="mt-2 text-slate-600">
            Podeli stvari koje ne koristiš svaki dan i zaradi dodatni novac.
          </p>
          <span className="mt-6 inline-flex items-center text-sm font-semibold text-amber-600 group-hover:text-amber-700">
            Postani izdavalac
            <span className="ml-1 transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </span>
        </Link>

        {/* Zakupi Card */}
        <Link
          href="/kontrolna-tabla/zakupi"
          className="group relative overflow-hidden rounded-2xl border-2 border-transparent bg-white p-8 text-left shadow-md transition-all hover:-translate-y-1 hover:border-amber-500 hover:shadow-xl"
        >
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
            <Search className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Zakupi</h2>
          <p className="mt-2 text-slate-600">
            Pronađi i iznajmi stvari koje ti trebaju od komšija u blizini.
          </p>
          <span className="mt-6 inline-flex items-center text-sm font-semibold text-amber-600 group-hover:text-amber-700">
            Pretraži ponudu
            <span className="ml-1 transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
