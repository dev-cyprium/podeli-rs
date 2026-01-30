"use client";

import { useQuery, useAction } from "convex/react";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Star, MessageSquare } from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";

type UserSnapshot = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

interface ReviewsListProps {
  itemId: Id<"items">;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-podeli-accent text-podeli-accent"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewsList({ itemId }: ReviewsListProps) {
  const reviews = useQuery(api.reviews.getReviewsForItem, { itemId });
  const averageRating = useQuery(api.reviews.getItemAverageRating, { itemId });
  const getUsersByIds = useAction(api.clerk.getUsersByIds);
  const [users, setUsers] = useState<UserSnapshot[]>([]);

  useEffect(() => {
    if (reviews && reviews.length > 0) {
      const userIds = reviews.map((review) => review.reviewerId);
      getUsersByIds({ userIds }).then(setUsers).catch(console.error);
    }
  }, [reviews, getUsersByIds]);

  const reviewsWithUsers = useMemo(() => {
    if (!reviews) return undefined;
    const userMap = new Map(users.map((user) => [user.id, user]));
    return reviews.map((review) => ({
      ...review,
      reviewer: userMap.get(review.reviewerId),
    }));
  }, [reviews, users]);

  if (reviews === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-podeli-dark">Recenzije</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg bg-muted p-4">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-2 h-3 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg bg-muted p-6 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Ovaj predmet još nema recenzija.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-podeli-dark">Recenzije</h3>
        </div>
        {averageRating && (
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(averageRating.average)} />
            <span className="text-sm text-muted-foreground">
              {averageRating.average.toFixed(1)} ({averageRating.count})
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {reviewsWithUsers?.map((review) => (
          <div
            key={review._id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                  {review.reviewer?.firstName?.[0] ??
                    review.reviewer?.email?.[0]?.toUpperCase() ??
                    "K"}
                </div>
                <div>
                  <p className="font-medium text-podeli-dark">
                    {review.reviewer?.firstName && review.reviewer?.lastName
                      ? `${review.reviewer.firstName} ${review.reviewer.lastName[0]}.`
                      : "Korisnik"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <DateDisplay value={review.createdAt} format="long" />
                  </p>
                </div>
              </div>
              <StarRating rating={review.rating} />
            </div>
            {review.comment && (
              <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
