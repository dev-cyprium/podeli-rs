"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { Tag, Plus, ArrowRight, Search, Clock, Info } from "lucide-react";
import Link from "next/link";

export default function KategorijePage() {
  const { isAuthenticated } = useConvexAuth();
  const categories = useQuery(api.categories.listWithItemCounts);
  const mySuggestions = useQuery(
    api.categories.listMySuggestions,
    isAuthenticated ? {} : "skip",
  );
  const suggest = useMutation(api.categories.suggestCategory);

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalItems = categories?.reduce((sum, c) => sum + c.itemCount, 0) ?? 0;
  const userCreated = categories?.filter((c) => c.createdBy).length ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Unesite naziv kategorije.");
      return;
    }
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await suggest({ name: trimmed });
      if (response.result === "exists") {
        setSuccess(`Kategorija "${response.name}" već postoji.`);
      } else if (response.result === "already_pending") {
        setSuccess(
          `Kategorija "${response.name}" je već predložena i čeka odobrenje administratora.`,
        );
      } else {
        setSuccess(
          `Kategorija "${response.name}" je uspešno predložena! Administrator će je pregledati i odobriti.`,
        );
      }
      setName("");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Greška pri predlaganju kategorije.";
      setError(msg);
    } finally {
      setCreating(false);
    }
  }

  return (
    <DashboardShell context="podeli" section="kategorije">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-podeli-dark sm:text-3xl">
          Kategorije
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pregledajte postojeće ili predložite novu kategoriju za zajednicu.
        </p>
      </div>

      {/* Stats + Create form row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-podeli-accent/10 text-podeli-accent">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-podeli-dark">
                {categories?.length ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Ukupno kategorija
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-podeli-blue/10 text-podeli-blue">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-podeli-dark">
                {totalItems}
              </p>
              <p className="text-xs text-muted-foreground">Predmeta ukupno</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-podeli-dark">
                {userCreated}
              </p>
              <p className="text-xs text-muted-foreground">
                Kreirali korisnici
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggest new category */}
      <SignedOut>
        <Card className="mb-8">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Prijavite se da biste predložili novu kategoriju.
          </CardContent>
        </Card>
      </SignedOut>
      <SignedIn>
        <Card className="mb-8">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-podeli-dark">
              Predloži novu kategoriju
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Vaš predlog će biti pregledan od strane administratora pre nego što
              postane dostupan svima.
            </p>
            <form
              onSubmit={handleSubmit}
              className="mt-4 flex items-end gap-3"
            >
              <div className="flex-1">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Npr. Sport, Kućni aparati, Muzika..."
                />
              </div>
              <Button
                type="submit"
                disabled={creating || !name.trim()}
                className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {creating ? "Slanje..." : "Predloži"}
              </Button>
            </form>
            {error && (
              <p className="mt-2 text-sm text-podeli-red">{error}</p>
            )}
            {success && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User's pending suggestions */}
        {mySuggestions && mySuggestions.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-semibold text-podeli-dark">
              Vaši predlozi na čekanju
            </h2>
            <div className="space-y-2">
              {mySuggestions.map((suggestion) => (
                <Card key={suggestion._id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-podeli-dark">
                        {suggestion.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Predloženo{" "}
                        {new Date(suggestion.createdAt).toLocaleDateString(
                          "sr-Latn-RS",
                        )}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      Na čekanju
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </SignedIn>

      {/* Categories grid */}
      <h2 className="mb-4 text-sm font-semibold text-podeli-dark">
        Sve kategorije
      </h2>
      {!categories ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Još uvek nema kategorija. Budite prvi!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/pretraga?kategorija=${encodeURIComponent(cat.name)}`}
              className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-podeli-accent/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-podeli-accent/10 text-podeli-accent transition-colors group-hover:bg-podeli-accent group-hover:text-white">
                  <Tag className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold text-podeli-dark">
                  {cat.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {cat.itemCount} {cat.itemCount === 1 ? "predmet" : "predmeta"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
