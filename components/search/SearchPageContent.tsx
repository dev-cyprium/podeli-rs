"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { SearchResults } from "./SearchResults";

export function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("q") || "";
  const city = searchParams.get("grad") || "";
  const municipality = searchParams.get("opstina") || "";
  const category = searchParams.get("kategorija") || null;

  const updateUrl = useCallback(
    (newQuery?: string, newCategory?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      const q = newQuery !== undefined ? newQuery : query;
      const cat = newCategory !== undefined ? newCategory : category;

      if (q) params.set("q", q);
      else params.delete("q");
      if (cat) params.set("kategorija", cat);
      else params.delete("kategorija");

      const newUrl = params.toString() ? `/pretraga?${params}` : "/pretraga";
      router.push(newUrl);
    },
    [query, category, router, searchParams],
  );

  const handleSearch = useCallback(
    (newQuery: string) => {
      updateUrl(newQuery, category);
    },
    [updateUrl, category],
  );

  const handleCategoryChange = useCallback(
    (newCategory: string | null) => {
      updateUrl(query, newCategory);
    },
    [updateUrl, query],
  );

  return (
    <div className="min-h-screen bg-podeli-light">
      {/* Header with search */}
      <div className="border-b border-border bg-card py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-podeli-dark">
              {query ? `Rezultati za "${query}"` : "Pretraži sve predmete"}
            </h1>
            <p className="mt-2 text-muted-foreground">
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
      <div className="border-b border-border bg-card py-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <form
            key={JSON.stringify([city, municipality])}
            className="mb-4 flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const params = new URLSearchParams(searchParams.toString());
              for (const name of ["grad", "opstina"]) {
                const value = String(data.get(name) ?? "").trim();
                if (value) params.set(name, value);
                else params.delete(name);
              }
              router.push(params.size ? `/pretraga?${params}` : "/pretraga");
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="filter-city">Grad</Label>
              <Input
                id="filter-city"
                name="grad"
                defaultValue={city}
                maxLength={100}
                placeholder="Svi gradovi"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter-municipality">Opština</Label>
              <Input
                id="filter-municipality"
                name="opstina"
                defaultValue={municipality}
                maxLength={100}
                placeholder="Sve opštine"
              />
            </div>
            <Button type="submit">Primeni lokaciju</Button>
            {(city || municipality) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete("grad");
                  params.delete("opstina");
                  router.push(
                    params.size ? `/pretraga?${params}` : "/pretraga",
                  );
                }}
              >
                Ukloni lokaciju
              </Button>
            )}
          </form>
          <CategoryFilter
            selectedCategory={category}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* Results */}
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SearchResults
            query={query || undefined}
            category={category || undefined}
            city={city || undefined}
            municipality={municipality || undefined}
          />
        </div>
      </div>
    </div>
  );
}
