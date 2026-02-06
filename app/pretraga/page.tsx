import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { SearchPageContent } from "@/components/search/SearchPageContent";
import { SearchResultsSkeleton } from "@/components/search/SearchResultsSkeleton";

export const metadata = {
  title: "Pretraga | podeli.rs",
  description: "Pretraži i iznajmi stvari od komšija u Beogradu",
};

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-podeli-light">
      <div className="border-b border-border bg-card py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-6">
            <div className="h-9 w-64 animate-pulse rounded bg-muted"></div>
            <div className="mt-2 h-5 w-48 animate-pulse rounded bg-muted"></div>
          </div>
          <div className="h-16 max-w-2xl animate-pulse rounded-2xl bg-muted"></div>
        </div>
      </div>
      <div className="border-b border-border bg-card py-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-24 animate-pulse rounded-full bg-muted"
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
    <div className="min-h-screen bg-podeli-light font-sans text-podeli-dark selection:bg-podeli-accent/20 selection:text-podeli-dark">
      <NavBar />
      <Suspense fallback={<SearchPageSkeleton />}>
        <SearchPageContent />
      </Suspense>
    </div>
  );
}
