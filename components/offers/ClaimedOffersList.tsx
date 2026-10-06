"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClaimedOffersList() {
  const { isAuthenticated } = useConvexAuth();
  const offers = useQuery(
    api.listingOffers.listMine,
    isAuthenticated ? {} : "skip",
  );
  if (!offers?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preuzete ponude za objavu</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ovi predlozi još nisu javni. Dopuni podatke i objavi kada budeš
          spreman.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {offers.map((offer) => (
          <div
            key={offer._id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
          >
            <p className="font-medium">{offer.data.title}</p>
            <Button asChild variant="outline">
              <Link href={`/kontrolna-tabla/ponude/${offer._id}`}>
                Dopuni i objavi
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
