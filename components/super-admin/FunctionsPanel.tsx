"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Zap,
  Layers,
  Hash,
  Search,
  Trash2,
  Loader2,
  Users,
  Bell,
} from "lucide-react";

export function FunctionsPanel() {
  const [loading, setLoading] = useState<string | null>(null);

  const initPlans = useMutation(api.plans.initializeDefaults);
  const backfillPlans = useMutation(api.plans.backfill);
  const initCategories = useMutation(api.categories.initializeDefaults);
  const backfillShortIdSlug = useMutation(api.items.backfillShortIdAndSlug);
  const backfillSearchText = useMutation(api.items.backfillSearchText);
  const clearOrphanedBookings = useMutation(api.bookings.clearOrphanedBookings);
  const syncMissingProfiles = useAction(api.clerk.syncMissingProfilesFromClerk);
  const backfillNotifPrefs = useMutation(api.notificationPreferences.backfillEnableAll);

  async function run(
    key: string,
    fn: () => Promise<unknown>,
    successMsg: string
  ) {
    setLoading(key);
    try {
      const result = await fn();
      const r = result as Record<string, unknown>;
      const detail =
        typeof result === "object" && result !== null && "created" in result
          ? "existing" in r
            ? `Kreirano: ${r.created}, postojalo: ${r.existing}`
            : "updated" in r && "total" in r
              ? `Kreirano: ${r.created}, ažurirano: ${r.updated} / ${r.total}`
              : "total" in r
                ? `Kreirano profila: ${r.created} / ${r.total} korisnika pregledano`
                : `Kreirano: ${r.created}`
          : typeof result === "object" &&
              result !== null &&
              "updated" in result
            ? `Ažurirano: ${r.updated} / ${r.total}`
            : typeof result === "object" &&
                result !== null &&
                "deleted" in result
              ? `Obrisano: ${r.deleted} / ${r.total}`
              : null;
      toast.success(successMsg, { description: detail ?? undefined });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Greška pri izvršavanju funkcije."
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#02020a]">Admin funkcije</h1>
        <p className="mt-1 text-muted-foreground">
          Pokreni uobičajene admin funkcije: inicijalizacija, backfill, čišćenje.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-podeli-accent" />
              Inicijalizuj planove
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Kreira podrazumevane planove ako ne postoji nijedan (free, starter,
              ultimate, lifetime, single_listing).
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  run(
                    "plans",
                    () => initPlans(),
                    "Planovi su inicijalizovani."
                  )
                }
                disabled={loading !== null}
              >
                {loading === "plans" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Inicijalizuj
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  run(
                    "backfillPlans",
                    () => backfillPlans(),
                    "Planovi su ažurirani (backfill)."
                  )
                }
                disabled={loading !== null}
              >
                {loading === "backfillPlans" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Backfill
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-podeli-accent" />
              Inicijalizuj kategorije
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Kreira podrazumevane kategorije ako ne postoje (Alati, Kampovanje,
              Elektronika, itd.).
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                run(
                  "categories",
                  () => initCategories(),
                  "Kategorije su inicijalizovane."
                )
              }
              disabled={loading !== null}
            >
              {loading === "categories" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pokreni
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="h-4 w-4 text-podeli-accent" />
              Backfill shortId / slug
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Popuni shortId i slug za oglase koji ih nemaju (potrebno za URL
              /p/[shortId]/[slug]).
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                run(
                  "backfillShortId",
                  () => backfillShortIdSlug(),
                  "Backfill shortId/slug je završen."
                )
              }
              disabled={loading !== null}
            >
              {loading === "backfillShortId" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pokreni
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-podeli-accent" />
              Backfill searchText
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Popuni searchText za oglase koji ga nemaju (potrebno za pretragu).
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                run(
                  "backfillSearch",
                  () => backfillSearchText(),
                  "Backfill searchText je završen."
                )
              }
              disabled={loading !== null}
            >
              {loading === "backfillSearch" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pokreni
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-4 w-4 text-podeli-accent" />
              Očisti siročiće zakupa
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Briše zakupe čiji predmet više ne postoji u bazi.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() =>
                run(
                  "clearOrphaned",
                  () => clearOrphanedBookings(),
                  "Siročići zakupa su očišćeni."
                )
              }
              disabled={loading !== null}
            >
              {loading === "clearOrphaned" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pokreni
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-podeli-accent" />
              Sinhronizuj profile iz Clerk-a
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Kreira profile za sve Clerk korisnike koji još nemaju profil u
              bazi.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                run(
                  "syncProfiles",
                  () => syncMissingProfiles(),
                  "Sinhronizacija profila je završena."
                )
              }
              disabled={loading !== null}
            >
              {loading === "syncProfiles" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sinhronizuj
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-podeli-accent" />
              Uključi email obaveštenja
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Kreira ili uključuje email obaveštenja za sve korisnike koji ih
              nemaju ili su ih isključili.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                run(
                  "backfillNotif",
                  () => backfillNotifPrefs(),
                  "Email obaveštenja su uključena za sve korisnike."
                )
              }
              disabled={loading !== null}
            >
              {loading === "backfillNotif" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pokreni
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
