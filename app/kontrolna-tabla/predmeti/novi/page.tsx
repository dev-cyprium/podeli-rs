"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { ItemFormData, ItemWizardForm } from "@/components/kontrolna-tabla/predmeti/ItemWizardForm";
import { AlertTriangle } from "lucide-react";

function NoviPredmetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageError, setPageError] = useState<string | null>(null);

  const itemId = useMemo(() => searchParams.get("id"), [searchParams]);
  const profile = useQuery(api.profiles.getMyProfile);
  const item = useQuery(
    api.items.getById,
    itemId ? { id: itemId as Id<"items"> } : "skip"
  );
  const limits = useQuery(api.profiles.getMyPlanLimits);

  const preferredContactTypes = profile?.preferredContactTypes ?? [];

  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);

  const isEditing = !!itemId;
  const isUnlimited = limits?.maxListings === -1;
  const atLimit = limits && !isUnlimited && !isEditing && limits.listingCount >= limits.maxListings;

  async function handleSave(data: ItemFormData) {
    setPageError(null);
    try {
      const { deposit, ...rest } = data;
      const payload = deposit !== undefined ? { ...rest, deposit } : rest;
      if (itemId) {
        await updateItem({ id: itemId as Id<"items">, ...payload });
      } else {
        await createItem(payload);
      }
      router.push("/kontrolna-tabla/predmeti");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Čuvanje nije uspelo. Pokušajte ponovo.";
      setPageError(message);
    }
  }

  return (
    <DashboardShell context="podeli" section="main">
      <Card>
        <CardHeader>
          <CardTitle>
            {itemId ? "Izmena predmeta" : "Dodavanje predmeta"}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {itemId
              ? "Ažurirajte detalje o predmetu."
              : "Unesite informacije o predmetu koji delite."}
          </p>
        </CardHeader>
        <CardContent>
          <SignedOut>
            <div className="py-10 text-center text-sm text-muted-foreground">
              Prijavite se da biste dodali predmet.
            </div>
          </SignedOut>
          <SignedIn>
            {atLimit ? (
              <div className="py-10 text-center">
                <AlertTriangle className="mx-auto h-10 w-10 text-[#f0a202]" />
                <h3 className="mt-4 text-lg font-semibold text-[#02020a]">
                  Dostigli ste limit oglasa
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Vaš &quot;{limits?.planName}&quot; plan dozvoljava maksimalno {limits?.maxListings} oglas(a).
                  Nadogradite plan da biste kreirali više oglasa.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button asChild className="bg-podeli-accent text-white hover:bg-podeli-accent/90">
                    <Link href="/planovi">Pogledajte planove</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/kontrolna-tabla/predmeti">Nazad</Link>
                  </Button>
                </div>
              </div>
            ) : itemId && item === undefined ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Učitavanje predmeta...
              </div>
            ) : (
              <>
                {pageError ? (
                  <div className="mb-4 rounded-lg border border-podeli-red/30 bg-podeli-red/10 px-3 py-2 text-sm text-podeli-red">
                    {pageError}
                  </div>
                ) : null}
                <ItemWizardForm
                  item={item ?? null}
                  onSave={handleSave}
                  onCancel={() => router.push("/kontrolna-tabla/predmeti")}
                  planLimits={limits ?? undefined}
                  preferredContactTypes={preferredContactTypes}
                />
              </>
            )}
          </SignedIn>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

export default function NoviPredmetPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell context="podeli" section="main">
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Učitavanje forme...
            </CardContent>
          </Card>
        </DashboardShell>
      }
    >
      <NoviPredmetContent />
    </Suspense>
  );
}
