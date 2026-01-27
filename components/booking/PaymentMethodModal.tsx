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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Zahtev poslat!
            </h2>
            <p className="mt-2 text-slate-600">
              Vlasnik će pregledati vaš zahtev i obavestiti vas o odluci.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <CreditCard className="h-5 w-5 text-amber-500" />
                Način plaćanja
              </h2>
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-6 space-y-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Ukupno za plaćanje</span>
                  <span className="text-xl font-bold text-slate-900">
                    {totalPrice.toFixed(0)} RSD
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Card option - disabled */}
                <button
                  type="button"
                  disabled
                  className="relative w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-left opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200">
                      <CreditCard className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-500">Karticom</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Uskoro
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        Online plaćanje karticom
                      </p>
                    </div>
                  </div>
                </button>

                {/* Cash option - pre-selected */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod("cash")}
                  className={`relative w-full rounded-lg border p-4 text-left transition-colors ${
                    selectedMethod === "cash"
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      selectedMethod === "cash" ? "bg-amber-100" : "bg-slate-100"
                    }`}>
                      <Banknote className={`h-5 w-5 ${
                        selectedMethod === "cash" ? "text-amber-600" : "text-slate-500"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <span className={`font-medium ${
                        selectedMethod === "cash" ? "text-amber-700" : "text-slate-700"
                      }`}>
                        Kesom
                      </span>
                      <p className={`text-sm ${
                        selectedMethod === "cash" ? "text-amber-600" : "text-slate-500"
                      }`}>
                        Platiti pri preuzimanju predmeta
                      </p>
                    </div>
                    {selectedMethod === "cash" && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Otkaži
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600"
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
