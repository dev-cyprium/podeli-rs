"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MapPin, Truck, Calendar } from "lucide-react";
import { ItemImageGallery } from "./ItemImageGallery";
import { offersRent, offersSale } from "@/lib/listing-types";
import { PurchaseForm } from "./PurchaseForm";
import { BookingForm } from "./BookingForm";
import { ReviewsList } from "./ReviewsList";
import { FavoriteButton } from "./FavoriteButton";
import { Badge } from "@/components/ui/badge";
import { DateDisplay } from "@/components/ui/date-display";

const DELIVERY_OPTIONS: Record<string, string> = {
  licno: "Lično preuzimanje",
  glovo: "Glovo",
  wolt: "Wolt",
  cargo: "Cargo",
};

export function ItemDetailContent({
  preloadedItem,
  slug,
  ownerCard,
}: {
  preloadedItem: Preloaded<typeof api.items.getByShortId>;
  slug: string;
  ownerCard: ReactNode;
}) {
  const item = usePreloadedQuery(preloadedItem);
  const router = useRouter();
  useEffect(() => {
    if (item && item.slug !== slug)
      router.replace(`/p/${item.shortId}/${item.slug}`);
  }, [item, slug, router]);
  if (!item)
    return (
      <div className="rounded-xl bg-card p-12 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-podeli-dark">
          Predmet nije pronađen
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ovaj predmet ne postoji ili je uklonjen.
        </p>
        <Link href="/" className="mt-6 inline-block text-podeli-accent">
          Nazad na ponudu
        </Link>
      </div>
    );
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <ItemImageGallery
          key={item.images.join(",")}
          images={item.images}
          title={item.title}
          imageFocalPoint={item.imageFocalPoint}
        />

        <div className="rounded-xl bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-podeli-dark">
                  {item.title}
                </h1>
                <Badge>{item.category}</Badge>
                <FavoriteButton itemId={item._id} />
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Beograd</span>
              </div>
            </div>
            <div className="text-right">
              {offersRent(item) && (
                <>
                  <p className="text-sm text-muted-foreground">Najam</p>
                  {item.priceByAgreement ? (
                    <p className="text-2xl font-bold text-podeli-accent">
                      Po dogovoru
                    </p>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-podeli-accent">
                        {item.pricePerDay.toFixed(0)} RSD
                      </p>
                      <p className="text-sm text-muted-foreground">po danu</p>
                    </>
                  )}
                </>
              )}
              {offersSale(item) && (
                <p className="mt-2 font-bold text-podeli-blue">
                  Prodaja: {item.salePrice?.toFixed(0)} RSD
                </p>
              )}
              {offersRent(item) && item.deposit != null && item.deposit > 0 && (
                <span className="mt-2 inline-block rounded-full bg-podeli-accent px-3 py-0.5 text-sm font-semibold text-white">
                  Depozit: {item.deposit.toFixed(0)} RSD
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <h2 className="font-semibold text-podeli-dark">Opis</h2>
            <p className="mt-2 text-muted-foreground">{item.description}</p>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <h2 className="flex items-center gap-2 font-semibold text-podeli-dark">
              <Truck className="h-4 w-4" />
              Dostupni načini dostave
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.deliveryMethods.map((method) => (
                <span
                  key={method}
                  className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                >
                  {DELIVERY_OPTIONS[method] ?? method}
                </span>
              ))}
            </div>
          </div>

          {item.availabilitySlots.length > 0 && (
            <div className="mt-6 border-t border-border pt-6">
              <h2 className="flex items-center gap-2 font-semibold text-podeli-dark">
                <Calendar className="h-4 w-4" />
                Dostupnost
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ovo prikazuje dostupnost{" "}
                <strong className="text-podeli-dark">
                  bez trenutnih aktivnih rezervacija
                </strong>
                . Pogledajte{" "}
                <strong className="text-podeli-dark">kalendar</strong> ispod za
                rezervacije i više detalja.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.availabilitySlots.map((slot, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-podeli-blue/10 px-3 py-1 text-sm text-podeli-blue"
                  >
                    <DateDisplay value={slot.startDate} format="short" /> –{" "}
                    <DateDisplay value={slot.endDate} format="short" />
                  </span>
                ))}
              </div>
            </div>
          )}

          {ownerCard}
        </div>

        <ReviewsList itemId={item._id} />
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        {item.soldAt !== undefined ? (
          <p className="rounded-xl bg-card p-6 font-semibold">
            Predmet je prodat.
          </p>
        ) : (
          <div className="space-y-4">
            {offersSale(item) && <PurchaseForm item={item} />}
            {offersRent(item) && (
              <BookingForm
                key={`${item._id}:${item.deliveryMethods.join(",")}`}
                item={item}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
