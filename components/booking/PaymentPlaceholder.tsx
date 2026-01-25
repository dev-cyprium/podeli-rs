"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, X, Loader2 } from "lucide-react";

interface PaymentPlaceholderProps {
  bookingId: Id<"bookings">;
  totalPrice: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function PaymentPlaceholder({
  bookingId,
  totalPrice,
  onComplete,
  onCancel,
}: PaymentPlaceholderProps) {
  const [isPaying, setIsPaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsPaid = useMutation(api.bookings.markAsPaid);

  const handlePay = async () => {
    setError(null);
    setIsPaying(true);

    try {
      await markAsPaid({ id: bookingId });
      setIsComplete(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri plaćanju");
      setIsPaying(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isComplete && onCancel()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false} accessibleTitle="Plaćanje">
        {isComplete ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Plaćanje uspešno!
            </h2>
            <p className="mt-2 text-slate-600">
              Vaša rezervacija je potvrđena.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <CreditCard className="h-5 w-5 text-amber-500" />
                Plaćanje
              </h2>
              <button
                onClick={onCancel}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-6">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Ukupno za plaćanje</span>
                  <span className="text-xl font-bold text-slate-900">
                    {totalPrice.toFixed(0)} RSD
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm text-slate-500">
                  Ovo je demo verzija. U produkciji bi ovde bila integracija sa
                  platnim sistemom.
                </p>
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
                onClick={onCancel}
                disabled={isPaying}
              >
                Otkaži
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                onClick={handlePay}
                disabled={isPaying}
              >
                {isPaying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Plaćanje...
                  </>
                ) : (
                  "Plati"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
