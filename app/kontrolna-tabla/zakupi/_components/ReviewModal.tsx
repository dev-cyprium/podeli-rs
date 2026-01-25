"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, X, Loader2 } from "lucide-react";

interface ReviewModalProps {
  bookingId: Id<"bookings">;
  itemTitle: string;
  onClose: () => void;
}

export function ReviewModal({
  bookingId,
  itemTitle,
  onClose,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = useMutation(api.reviews.createReview);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Molimo izaberite ocenu.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createReview({
        bookingId,
        rating,
        comment,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri slanju recenzije"
      );
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false} accessibleTitle="Ostavi recenziju">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Ostavi recenziju</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-sm text-slate-600">
            Kako biste ocenili iznajmljivanje predmeta{" "}
            <strong>{itemTitle}</strong>?
          </p>

          <div className="mt-4">
            <Label className="mb-2 block text-sm font-medium">Ocena</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="rounded p-1 transition-colors hover:bg-amber-50"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= displayRating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-slate-200 text-slate-200"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="comment" className="mb-2 block text-sm font-medium">
              Komentar (opciono)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Napišite vaše iskustvo sa ovim iznajmljivanjem..."
              rows={4}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Otkaži
          </Button>
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Slanje...
              </>
            ) : (
              "Pošalji recenziju"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
