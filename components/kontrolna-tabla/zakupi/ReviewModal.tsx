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
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-bold text-podeli-dark">Ostavi recenziju</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-auto rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-podeli-dark"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Kako biste ocenili iznajmljivanje predmeta{" "}
            <strong>{itemTitle}</strong>?
          </p>

          <div className="mt-4">
            <Label className="mb-2 block text-sm font-medium">Ocena</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="size-auto rounded p-1 transition-colors hover:bg-podeli-accent/10"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= displayRating
                        ? "fill-podeli-accent text-podeli-accent"
                        : "fill-muted text-muted"
                    }`}
                  />
                </Button>
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
            <div className="mt-4 rounded-lg bg-podeli-red/10 p-3 text-sm text-podeli-red">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-border pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Otkaži
          </Button>
          <Button
            className="flex-1 bg-podeli-accent hover:bg-podeli-accent/90 text-podeli-dark"
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
