"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { ItemFormData, ItemWizardForm } from "@/components/kontrolna-tabla/predmeti/ItemWizardForm";

function NoviPredmetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageError, setPageError] = useState<string | null>(null);

  const itemId = useMemo(() => searchParams.get("id"), [searchParams]);
  const item = useQuery(
    api.items.getById,
    itemId ? { id: itemId as Id<"items"> } : "skip"
  );

  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);

  async function handleSave(data: ItemFormData) {
    setPageError(null);
    try {
      if (itemId) {
        await updateItem({ id: itemId as Id<"items">, ...data });
      } else {
        await createItem(data);
      }
      router.push("/kontrolna-tabla/predmeti");
    } catch (error) {
      setPageError("Čuvanje nije uspelo. Pokušajte ponovo.");
    }
  }

  return (
    <DashboardShell mode="podeli">
      <Card>
        <CardHeader>
          <CardTitle>
            {itemId ? "Izmena predmeta" : "Dodavanje predmeta"}
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            {itemId
              ? "Ažurirajte detalje o predmetu."
              : "Unesite informacije o predmetu koji delite."}
          </p>
        </CardHeader>
        <CardContent>
          <SignedOut>
            <div className="py-10 text-center text-sm text-slate-600">
              Prijavite se da biste dodali predmet.
            </div>
          </SignedOut>
          <SignedIn>
            {itemId && item === undefined ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Učitavanje predmeta...
              </div>
            ) : (
              <>
                {pageError ? (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {pageError}
                  </div>
                ) : null}
                <ItemWizardForm
                  item={item ?? null}
                  onSave={handleSave}
                  onCancel={() => router.push("/kontrolna-tabla/predmeti")}
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
        <DashboardShell mode="podeli">
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
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
