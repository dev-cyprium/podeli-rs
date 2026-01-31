"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, User, Calendar } from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";

export function MyRenterReviews() {
  const reviews = useQuery(api.reviews.getMyRenterReviews);
  const myRating = useQuery(api.reviews.getMyRenterRating);

  if (reviews === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        Učitavanje ocena...
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
              Moje ocene
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Ocene koje ste dobili kao zakupac.
            </p>
          </div>
          {myRating && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-amber-600">
                {myRating.average.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({myRating.count} {myRating.count === 1 ? "ocena" : "ocena"})
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center px-6 py-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
        <Star className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-podeli-dark">
        Još nemate ocena
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Kada završite rezervaciju, vlasnici mogu da vas ocene. Vaše ocene će se
        prikazati ovde.
      </p>
    </div>
  );
}

type ReviewWithDetails = {
  _id: Id<"renterReviews">;
  rating: number;
  comment?: string;
  createdAt: number;
  item: {
    _id: Id<"items">;
    title: string;
    images: Id<"_storage">[];
  } | null;
  owner: {
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  } | null;
  booking: {
    startDate: string;
    endDate: string;
  } | null;
};

function ReviewCard({ review }: { review: ReviewWithDetails }) {
  const imageUrl = useQuery(
    api.items.getImageUrl,
    review.item?.images[0]
      ? { storageId: review.item.images[0] }
      : "skip"
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
                  <DateDisplay value={review.booking.startDate} format="short" /> –{" "}
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

        {/* Owner info */}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-muted">
            {review.owner?.imageUrl ? (
              <img
                src={review.owner.imageUrl}
                alt={review.owner.firstName ?? "Vlasnik"}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-2.5 w-2.5 text-muted-foreground" />
            )}
          </div>
          <span>
            Ocenio/la: {review.owner?.firstName ?? "Korisnik"}
          </span>
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
