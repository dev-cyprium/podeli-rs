"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Show } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import {
  ItemFormData,
  ItemWizardForm,
} from "@/components/kontrolna-tabla/predmeti/ItemWizardForm";

function NoviPredmetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageError, setPageError] = useState<string | null>(null);

  const itemId = useMemo(() => searchParams.get("id"), [searchParams]);
  const profile = useQuery(api.profiles.getMyProfile);
  const item = useQuery(
    api.items.getById,
    itemId ? { id: itemId as Id<"items"> } : "skip",
  );

  const preferredContactTypes = profile?.preferredContactTypes ?? [];

  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);

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
      setPageError(null);
      throw error;
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
          <Show when="signed-out">
            <div className="py-10 text-center text-sm text-muted-foreground">
              Prijavite se da biste dodali predmet.
            </div>
          </Show>
          <Show when="signed-in">
            {itemId && item === undefined ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Učitavanje predmeta...
              </div>
            ) : itemId && item === null ? (
              <p className="py-10 text-center text-muted-foreground">
                Predmet nije pronađen.
              </p>
            ) : profile === undefined || profile === null ? (
              <p className="py-10 text-center text-muted-foreground">
                Učitavanje profila...
              </p>
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
                  preferredContactTypes={preferredContactTypes}
                  phoneNumber={profile.phoneNumber}
                  onContactSaved={() => setPageError(null)}
                />
              </>
            )}
          </Show>
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
