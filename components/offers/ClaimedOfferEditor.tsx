"use client";

import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import {
  ItemWizardForm,
  type ItemFormData,
} from "@/components/kontrolna-tabla/predmeti/ItemWizardForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { offersRent } from "@/lib/listing-types";

export function ClaimedOfferEditor({ id }: { id: Id<"listingOffers"> }) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const offer = useQuery(
    api.listingOffers.getMine,
    isAuthenticated ? { id } : "skip",
  );
  const profile = useQuery(
    api.profiles.getMyProfile,
    isAuthenticated ? {} : "skip",
  );
  const publish = useMutation(api.listingOffers.publish);
  async function save(data: ItemFormData) {
    await publish({ id, data });
    router.push("/kontrolna-tabla/predmeti");
  }
  return (
    <DashboardShell context="podeli" section="main">
      <Card>
        <CardHeader>
          <CardTitle>Potvrdi i objavi svoju ponudu</CardTitle>
          <p className="text-sm text-muted-foreground">
            Predlog je sačuvan na tvom nalogu. Proveri cenu, fotografije i
            lokaciju, dodaj dostupnost i potvrdi način kontakta.
          </p>
        </CardHeader>
        <CardContent>
          {offer === undefined || profile === undefined ? (
            <p role="status">Učitavanje ponude…</p>
          ) : !offer ? (
            <p>Ponuda nije pronađena na ovom nalogu.</p>
          ) : offer.itemId ? (
            <div className="space-y-3">
              <p>Oglas je već objavljen.</p>
              <Button asChild>
                <Link
                  href={`/kontrolna-tabla/predmeti/novi?id=${offer.itemId}`}
                >
                  Izmeni objavljeni oglas
                </Link>
              </Button>
            </div>
          ) : !profile ? (
            <p role="status">Priprema profila…</p>
          ) : (
            <ItemWizardForm
              item={offer.data}
              initialStep={offersRent(offer.data) ? 2 : 3}
              submitLabel="Potvrdi i objavi oglas"
              onSave={save}
              preferredContactTypes={profile.preferredContactTypes ?? []}
              phoneNumber={profile.phoneNumber}
            />
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
