"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { SearchResults } from "./SearchResults";

export function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("q") || "";
  const category = searchParams.get("kategorija") || null;

  const updateUrl = useCallback(
    (newQuery?: string, newCategory?: string | null) => {
      const params = new URLSearchParams();
      const q = newQuery !== undefined ? newQuery : query;
      const cat = newCategory !== undefined ? newCategory : category;

      if (q) params.set("q", q);
      if (cat) params.set("kategorija", cat);

      const newUrl = params.toString() ? `/pretraga?${params}` : "/pretraga";
      router.push(newUrl);
    },
    [query, category, router]
  );

  const handleSearch = useCallback(
    (newQuery: string) => {
      updateUrl(newQuery, category);
    },
    [updateUrl, category]
  );

  const handleCategoryChange = useCallback(
    (newCategory: string | null) => {
      updateUrl(query, newCategory);
    },
    [updateUrl, query]
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header with search */}
      <div className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">
              {query ? `Rezultati za "${query}"` : "Pretraži sve predmete"}
            </h1>
            <p className="mt-2 text-slate-600">
              Pronađi šta ti treba u komšiluku
            </p>
          </div>

          <div className="max-w-2xl">
            <SearchBar
              placeholder="Pretraži predmete..."
              showButton={true}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="border-b border-slate-200 bg-white py-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <CategoryFilter
            selectedCategory={category}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* Results */}
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SearchResults query={query || undefined} category={category || undefined} />
        </div>
      </div>
    </div>
  );
}
