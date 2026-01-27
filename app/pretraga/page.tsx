import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { SearchPageContent } from "@/components/search/SearchPageContent";
import { SearchResultsSkeleton } from "@/components/search/SearchResultsSkeleton";

export const metadata = {
  title: "Pretraga | PODELI.rs",
  description: "Pretraži i iznajmi stvari od komšija u Beogradu",
};

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-6">
            <div className="h-9 w-64 animate-pulse rounded bg-slate-200"></div>
            <div className="mt-2 h-5 w-48 animate-pulse rounded bg-slate-200"></div>
          </div>
          <div className="h-16 max-w-2xl animate-pulse rounded-2xl bg-slate-200"></div>
        </div>
      </div>
      <div className="border-b border-slate-200 bg-white py-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-24 animate-pulse rounded-full bg-slate-200"
              ></div>
            ))}
          </div>
        </div>
      </div>
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SearchResultsSkeleton />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      <NavBar />
      <Suspense fallback={<SearchPageSkeleton />}>
        <SearchPageContent />
      </Suspense>
    </div>
  );
}
