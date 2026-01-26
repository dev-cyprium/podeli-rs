"use client";

import { useQuery, useAction } from "convex/react";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Star, MessageSquare } from "lucide-react";

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
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
          <MessageSquare className="h-5 w-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">Recenzije</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg bg-slate-100 p-4">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-full rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg bg-slate-50 p-6 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-2 text-sm text-slate-500">
          Ovaj predmet još nema recenzija.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">Recenzije</h3>
        </div>
        {averageRating && (
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(averageRating.average)} />
            <span className="text-sm text-slate-600">
              {averageRating.average.toFixed(1)} ({averageRating.count})
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {reviewsWithUsers?.map((review) => (
          <div
            key={review._id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
                  {review.reviewer?.firstName?.[0] ??
                    review.reviewer?.email?.[0]?.toUpperCase() ??
                    "K"}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {review.reviewer?.firstName && review.reviewer?.lastName
                      ? `${review.reviewer.firstName} ${review.reviewer.lastName[0]}.`
                      : "Korisnik"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>
              <StarRating rating={review.rating} />
            </div>
            {review.comment && (
              <p className="mt-3 text-sm text-slate-600">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
