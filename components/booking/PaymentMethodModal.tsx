"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Banknote, X, Loader2, CheckCircle } from "lucide-react";

type PaymentMethod = "cash" | "card";

interface PaymentMethodModalProps {
  totalPrice: number;
  onConfirm: (paymentMethod: PaymentMethod) => Promise<void>;
  onCancel: () => void;
}

export function PaymentMethodModal({
  totalPrice,
  onConfirm,
  onCancel,
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await onConfirm(selectedMethod);
      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri rezervaciji");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isComplete && !isSubmitting && onCancel()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false} accessibleTitle="Način plaćanja">
        {isComplete ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-podeli-blue/10">
              <CheckCircle className="h-8 w-8 text-podeli-blue" />
            </div>
            <h2 className="text-xl font-bold text-podeli-dark">
              Zahtev poslat!
            </h2>
            <p className="mt-2 text-muted-foreground">
              Vlasnik će pregledati vaš zahtev i obavestiti vas o odluci.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-podeli-dark">
                <CreditCard className="h-5 w-5 text-podeli-accent" />
                Način plaćanja
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                disabled={isSubmitting}
                className="size-auto rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-podeli-dark disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="py-6 space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ukupno za plaćanje</span>
                  <span className="text-xl font-bold text-podeli-dark">
                    {totalPrice.toFixed(0)} RSD
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Card option - disabled */}
                <Button
                  type="button"
                  variant="ghost"
                  disabled
                  className="relative h-auto w-full rounded-lg border border-border bg-muted p-4 text-left opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-muted-foreground">Karticom</span>
                        <span className="rounded-full bg-podeli-accent/10 px-2 py-0.5 text-xs font-medium text-podeli-accent">
                          Uskoro
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Online plaćanje karticom
                      </p>
                    </div>
                  </div>
                </Button>

                {/* Cash option - pre-selected */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedMethod("cash")}
                  className={`relative h-auto w-full rounded-lg border p-4 text-left transition-colors ${
                    selectedMethod === "cash"
                      ? "border-podeli-accent bg-podeli-accent/10 hover:bg-podeli-accent/10"
                      : "border-border hover:border-podeli-accent/30 hover:bg-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      selectedMethod === "cash" ? "bg-podeli-accent/10" : "bg-muted"
                    }`}>
                      <Banknote className={`h-5 w-5 ${
                        selectedMethod === "cash" ? "text-podeli-accent" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <span className={`font-medium ${
                        selectedMethod === "cash" ? "text-podeli-accent" : "text-podeli-dark"
                      }`}>
                        Kesom
                      </span>
                      <p className={`text-sm ${
                        selectedMethod === "cash" ? "text-podeli-accent" : "text-muted-foreground"
                      }`}>
                        Platiti pri preuzimanju predmeta
                      </p>
                    </div>
                    {selectedMethod === "cash" && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-podeli-accent">
                        <CheckCircle className="h-4 w-4 text-podeli-dark" />
                      </div>
                    )}
                  </div>
                </Button>
              </div>

              {error && (
                <div className="rounded-lg bg-podeli-red/10 p-3 text-sm text-podeli-red">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-border pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Otkaži
              </Button>
              <Button
                className="flex-1 bg-podeli-accent hover:bg-podeli-accent/90 text-podeli-dark"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Slanje...
                  </>
                ) : (
                  "Potvrdi rezervaciju"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
