"use client";

import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLocation } from "@/lib/item-location";
import Link from "next/link";
import { OfferAcceptanceEditor } from "./OfferAcceptanceEditor";
import type { ItemFormData } from "@/components/kontrolna-tabla/predmeti/ItemWizardForm";
import { offersRent, offersSale } from "@/lib/listing-types";

export function ListingOfferPreview({ token }: { token: string }) {
  const { isLoading } = useConvexAuth();
  const offer = useQuery(api.listingOffers.preview, { token });
  const imageUrls = useQuery(
    api.items.getImageUrls,
    offer?.data.images.length ? { storageIds: offer.data.images } : "skip",
  );
  const [editing, setEditing] = useState(false);
  return (
    <main className="ph-no-capture mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-12">
      <Link href="/" className="text-lg font-semibold text-podeli-accent">
        podeli.rs
      </Link>
      {offer === undefined ? (
        <p role="status">Učitavanje predloga…</p>
      ) : offer === null ? (
        <Card>
          <CardHeader>
            <CardTitle>Ponuda nije dostupna</CardTitle>
          </CardHeader>
          <CardContent>
            Link je istekao, povučen ili je ponuda već preuzeta. Obratite se
            Podeliju za nastavak.
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium text-podeli-accent">
              Predlog ponude za {offer.company}
            </p>
            <h1 className="mt-2 text-3xl font-bold">{offer.data.title}</h1>
            <p className="mt-2 text-muted-foreground">
              {offer.published
                ? "Oglas je objavljen. Možete nastaviti da ga uređujete sa svog naloga."
                : "Oglas još nije objavljen. Pregledajte i uredite podatke i dodajte dostupnost, pa potvrdite mejl i objavu."}
            </p>
          </div>
          {offer.data.images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {offer.data.images.map(
                (id) =>
                  imageUrls?.[id] && (
                    // Storage URLs are returned by the existing image resolver.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={id}
                      src={imageUrls[id]!}
                      alt={offer.data.title}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                  ),
              )}
            </div>
          )}
          <Card>
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm text-muted-foreground">
                {offer.data.category} · {formatLocation(offer.data)}
              </p>
              <p className="whitespace-pre-wrap">{offer.data.description}</p>
              {offersRent(offer.data) && (
                <p className="font-semibold">
                  {offer.data.priceByAgreement
                    ? "Cena po dogovoru"
                    : `${offer.data.pricePerDay.toLocaleString("sr-Latn-RS")} RSD / dan`}
                </p>
              )}
              {offersSale(offer.data) && (
                <p className="font-semibold">
                  Prodaja: {offer.data.salePrice?.toLocaleString("sr-Latn-RS")}{" "}
                  RSD
                </p>
              )}
              {offersRent(offer.data) && offer.data.deposit !== undefined && (
                <p className="text-sm">
                  Depozit: {offer.data.deposit.toLocaleString("sr-Latn-RS")} RSD
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm">
                Ponuda je namenjena nalogu sa potvrđenom mejl adresom{" "}
                <strong>{offer.recipientHint}</strong>. Objavljivanje je
                besplatno.
              </p>
              {editing && !offer.mine ? (
                <OfferAcceptanceEditor
                  token={token}
                  data={
                    {
                      ...offer.data,
                      deliveryMethods: offer.data.deliveryMethods.filter(
                        (method) => method === "licno",
                      ),
                    } as ItemFormData
                  }
                  recipientHint={offer.recipientHint}
                  canClaim={offer.canClaim}
                />
              ) : isLoading ? (
                <p role="status">Učitavanje prijave…</p>
              ) : offer.mine ? (
                <Button asChild>
                  <Link href={`/kontrolna-tabla/ponude/${offer.id}`}>
                    Nastavi uređivanje ponude
                  </Link>
                </Button>
              ) : (
                <Button onClick={() => setEditing(true)}>
                  Pregledaj i uredi ponudu
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Oglas postaje javan tek kada potvrdite podatke i izaberete
                „Potvrdi i objavi oglas”.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
