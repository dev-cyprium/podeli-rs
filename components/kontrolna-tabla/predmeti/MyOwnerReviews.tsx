"use client";

import { useQuery, useAction } from "convex/react";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, User, Calendar, MessageSquare, Package } from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";

type ClerkUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
};

export function MyOwnerReviews() {
  const itemReviews = useQuery(api.reviews.getReviewsForMyItems);
  const myItemsRating = useQuery(api.reviews.getMyItemsAverageRating);
  const givenReviews = useQuery(api.reviews.getRenterReviewsGivenByMe);
  const getUsersByIds = useAction(api.clerk.getUsersByIds);

  const [clerkUsers, setClerkUsers] = useState<ClerkUser[]>([]);

  // Collect all unique user IDs from both review types
  const allUserIds = useMemo(() => {
    const ids = new Set<string>();
    itemReviews?.forEach((r) => ids.add(r.reviewerId));
    givenReviews?.forEach((r) => ids.add(r.renterId));
    return Array.from(ids);
  }, [itemReviews, givenReviews]);

  // Fetch user data from Clerk
  useEffect(() => {
    if (allUserIds.length > 0) {
      getUsersByIds({ userIds: allUserIds })
        .then(setClerkUsers)
        .catch(console.error);
    }
  }, [allUserIds, getUsersByIds]);

  // Create a map for quick lookup
  const userMap = useMemo(() => {
    return new Map(clerkUsers.map((u) => [u.id, u]));
  }, [clerkUsers]);

  const isLoading = itemReviews === undefined || givenReviews === undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        Ucitavanje ocena...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Ocene
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Ocene vaših predmeta i ocene koje ste dali zakupcima.
            </p>
          </div>
          {myItemsRating && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-amber-600">
                {myItemsRating.average.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({myItemsRating.count}{" "}
                {myItemsRating.count === 1 ? "ocena" : "ocena"})
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ocene mojih predmeta
              {itemReviews.length > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {itemReviews.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="given" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Ocene koje sam dao/la
              {givenReviews.length > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {givenReviews.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4">
            {itemReviews.length === 0 ? (
              <EmptyStateReceived />
            ) : (
              <div className="space-y-4">
                {itemReviews.map((review) => (
                  <ReceivedReviewCard
                    key={review._id}
                    review={review}
                    clerkUser={userMap.get(review.reviewerId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="given" className="mt-4">
            {givenReviews.length === 0 ? (
              <EmptyStateGiven />
            ) : (
              <div className="space-y-4">
                {givenReviews.map((review) => (
                  <GivenReviewCard
                    key={review._id}
                    review={review}
                    clerkUser={userMap.get(review.renterId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EmptyStateReceived() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center px-6 py-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
        <Package className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-podeli-dark">
        Još nemate ocena za vaše predmete
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Kada zakupci zavrse korišcenje vaših predmeta, mogu da ostave ocene.
        Ocene ce se prikazati ovde.
      </p>
    </div>
  );
}

function EmptyStateGiven() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center px-6 py-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
        <MessageSquare className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-podeli-dark">
        Još niste ocenili nijednog zakupca
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Nakon završene rezervacije možete oceniti zakupce. Vaše ocene ce se
        prikazati ovde.
      </p>
    </div>
  );
}

type ReceivedReview = {
  _id: Id<"reviews">;
  reviewerId: string;
  rating: number;
  comment: string;
  createdAt: number;
  item: {
    _id: Id<"items">;
    title: string;
    images: Id<"_storage">[];
  } | null;
  booking: {
    startDate: string;
    endDate: string;
  } | null;
};

function ReceivedReviewCard({
  review,
  clerkUser,
}: {
  review: ReceivedReview;
  clerkUser?: ClerkUser;
}) {
  const imageUrl = useQuery(
    api.items.getImageUrl,
    review.item?.images[0] ? { storageId: review.item.images[0] } : "skip"
  );

  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4">
      {/* Item thumbnail */}
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={review.item?.title ?? "Predmet"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Nema
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {/* Item title and rating */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-podeli-dark">
              {review.item?.title ?? "Predmet nije dostupan"}
            </h4>
            {review.booking && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  <DateDisplay value={review.booking.startDate} format="short" />{" "}
                  –{" "}
                  <DateDisplay value={review.booking.endDate} format="short" />
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Comment */}
        {review.comment && (
          <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
        )}

        {/* Renter info from Clerk */}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-muted">
            {clerkUser?.imageUrl ? (
              <img
                src={clerkUser.imageUrl}
                alt={clerkUser.firstName ?? "Zakupac"}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-2.5 w-2.5 text-muted-foreground" />
            )}
          </div>
          <span>Ocenio/la: {clerkUser?.firstName ?? "Korisnik"}</span>
          <span className="text-muted-foreground/60">•</span>
          <span>
            {new Date(review.createdAt).toLocaleDateString("sr-RS", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

type GivenReview = {
  _id: Id<"renterReviews">;
  renterId: string;
  rating: number;
  comment?: string;
  createdAt: number;
  item: {
    _id: Id<"items">;
    title: string;
    images: Id<"_storage">[];
  } | null;
  booking: {
    startDate: string;
    endDate: string;
  } | null;
};

function GivenReviewCard({
  review,
  clerkUser,
}: {
  review: GivenReview;
  clerkUser?: ClerkUser;
}) {
  const imageUrl = useQuery(
    api.items.getImageUrl,
    review.item?.images[0] ? { storageId: review.item.images[0] } : "skip"
  );

  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4">
      {/* Renter avatar from Clerk */}
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-muted">
        {clerkUser?.imageUrl ? (
          <img
            src={clerkUser.imageUrl}
            alt={clerkUser.firstName ?? "Zakupac"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {/* Renter name and rating */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-podeli-dark">
              {clerkUser?.firstName ?? "Korisnik"}{" "}
              {clerkUser?.lastName ? clerkUser.lastName.charAt(0) + "." : ""}
            </h4>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              <span>{review.item?.title ?? "Predmet nije dostupan"}</span>
            </div>
            {review.booking && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  <DateDisplay value={review.booking.startDate} format="short" />{" "}
                  –{" "}
                  <DateDisplay value={review.booking.endDate} format="short" />
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Comment if exists */}
        {review.comment && (
          <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
        )}

        {/* Date */}
        <div className="mt-2 text-xs text-muted-foreground">
          <span>
            {new Date(review.createdAt).toLocaleDateString("sr-RS", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Item thumbnail (small) */}
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={review.item?.title ?? "Predmet"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            <Package className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
