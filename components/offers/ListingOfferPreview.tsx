"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, SignUpButton, SignOutButton } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLocation } from "@/lib/item-location";
import { offerPath } from "@/lib/listing-offers";
import Link from "next/link";

export function ListingOfferPreview({ token }: { token: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const offer = useQuery(api.listingOffers.preview, { token });
  const profile = useQuery(
    api.profiles.getMyProfile,
    isAuthenticated ? {} : "skip",
  );
  const imageUrls = useQuery(
    api.items.getImageUrls,
    offer?.data.images.length ? { storageIds: offer.data.images } : "skip",
  );
  const claim = useMutation(api.listingOffers.claim);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const path = offerPath(token);
  async function takeOffer() {
    setBusy(true);
    setError("");
    try {
      const id = await claim({ token });
      router.push(`/kontrolna-tabla/ponude/${id}`);
    } catch (err) {
      setError(
        err instanceof ConvexError && typeof err.data === "string"
          ? err.data
          : "Preuzimanje nije uspelo. Pokušajte ponovo.",
      );
    } finally {
      setBusy(false);
    }
  }
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
                : "Oglas još nije objavljen. Pregledajte predlog, a nakon preuzimanja proverite podatke i dodajte dostupnost."}
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
              <p className="font-semibold">
                {offer.data.priceByAgreement
                  ? "Cena po dogovoru"
                  : `${offer.data.pricePerDay.toLocaleString("sr-Latn-RS")} RSD / dan`}
              </p>
              {offer.data.deposit !== undefined && (
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
              {isLoading ? (
                <p role="status">Učitavanje prijave…</p>
              ) : offer.mine ? (
                <Button asChild>
                  <Link href={`/kontrolna-tabla/ponude/${offer.id}`}>
                    Nastavi uređivanje ponude
                  </Link>
                </Button>
              ) : !isAuthenticated ? (
                <div className="flex flex-wrap gap-2">
                  <SignUpButton
                    mode="modal"
                    forceRedirectUrl={path}
                    signInForceRedirectUrl={path}
                  >
                    <Button>Preuzmi ponudu — napravi nalog</Button>
                  </SignUpButton>
                  <SignInButton
                    mode="modal"
                    forceRedirectUrl={path}
                    signUpForceRedirectUrl={path}
                  >
                    <Button variant="outline">Već imam nalog</Button>
                  </SignInButton>
                </div>
              ) : offer.canClaim ? (
                <Button disabled={busy || !profile} onClick={takeOffer}>
                  {busy
                    ? "Preuzimanje…"
                    : !profile
                      ? "Priprema naloga…"
                      : "Preuzmi i uredi ponudu"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p role="alert" className="text-sm">
                    Ovaj nalog nema potvrđenu mejl adresu kojoj je ponuda
                    namenjena. Prijavite se odgovarajućim nalogom.
                  </p>
                  <SignOutButton redirectUrl={path}>
                    <Button variant="outline">Promeni nalog</Button>
                  </SignOutButton>
                </div>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Preuzimanje čuva predlog na vašem nalogu. Oglas postaje javan
                tek kada potvrdite podatke i izaberete „Potvrdi i objavi oglas”.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
