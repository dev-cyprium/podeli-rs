"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarDays, Truck, CreditCard, AlertTriangle } from "lucide-react";
import { DateRange } from "react-day-picker";
import { PaymentMethodModal } from "@/components/booking/PaymentMethodModal";

type DeliveryMethod = "licno" | "glovo" | "wolt" | "cargo";

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string }[] = [
  { value: "licno", label: "Lično preuzimanje" },
  { value: "glovo", label: "Glovo" },
  { value: "wolt", label: "Wolt" },
  { value: "cargo", label: "Cargo" },
];

interface BookingFormProps {
  item: Doc<"items">;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

export function BookingForm({ item }: BookingFormProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    (item.deliveryMethods[0] as DeliveryMethod) ?? "licno"
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = useMutation(api.bookings.createBooking);
  const bookedDates = useQuery(api.bookings.getItemBookedDates, {
    itemId: item._id,
  });

  const planLimits = useQuery(
    api.profiles.getMyPlanLimits,
    isSignedIn ? {} : "skip"
  );

  const isUnlimitedRentals = planLimits?.maxActiveRentals === -1;
  const atRentalLimit = planLimits && !isUnlimitedRentals &&
    planLimits.activeRentalCount >= planLimits.maxActiveRentals;

  const disabledDates = useMemo(() => {
    if (!bookedDates) return [];

    const dates: Date[] = [];
    for (const booking of bookedDates) {
      const start = parseDate(booking.startDate);
      const end = parseDate(booking.endDate);
      const current = new Date(start);

      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }
    return dates;
  }, [bookedDates]);

  const totalDays = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    const diffTime = dateRange.to.getTime() - dateRange.from.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [dateRange]);

  const totalPrice = totalDays * item.pricePerDay;

  const canBook =
    isSignedIn && dateRange?.from && dateRange?.to && totalDays > 0;

  const handleSubmit = () => {
    if (!canBook || !dateRange?.from || !dateRange?.to) {
      return;
    }
    setError(null);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentMethod: "cash" | "card") => {
    if (!dateRange?.from || !dateRange?.to) {
      throw new Error("Izaberite datum.");
    }

    try {
      await createBooking({
        itemId: item._id,
        startDate: formatDate(dateRange.from),
        endDate: formatDate(dateRange.to),
        deliveryMethod,
        paymentMethod,
      });
      // Wait a bit to show success message, then redirect
      setTimeout(() => {
        router.push("/kontrolna-tabla/zakupi");
      }, 1500);
    } catch (err) {
      // Handle Convex application errors properly
      const errorMessage =
        err instanceof ConvexError
          ? (err.data as string)
          : "Greška pri rezervaciji. Molimo pokušajte ponovo.";
      throw new Error(errorMessage);
    }
  };

  const availableDeliveryMethods = DELIVERY_OPTIONS.filter((option) =>
    item.deliveryMethods.includes(option.value)
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-podeli-accent" />
            Rezerviši
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block text-sm font-medium text-podeli-dark">
              Izaberite period
            </Label>
            <div className="rounded-lg border border-border p-3">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                disabled={[{ before: new Date() }, ...disabledDates]}
                numberOfMonths={1}
                className="mx-auto"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 flex items-center gap-2 text-sm font-medium text-podeli-dark">
              <Truck className="h-4 w-4" />
              Način dostave
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {availableDeliveryMethods.length > 0 ? (
                availableDeliveryMethods.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDeliveryMethod(option.value)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      deliveryMethod === option.value
                        ? "border-podeli-accent bg-podeli-accent/10 text-podeli-accent"
                        : "border-border text-muted-foreground hover:border-podeli-accent/30"
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("licno")}
                  className={`col-span-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    deliveryMethod === "licno"
                      ? "border-podeli-accent bg-podeli-accent/10 text-podeli-accent"
                      : "border-border text-muted-foreground hover:border-podeli-accent/30"
                  }`}
                >
                  Lično preuzimanje
                </button>
              )}
            </div>
          </div>

          {totalDays > 0 && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.pricePerDay.toFixed(0)} RSD × {totalDays} dan
                  {totalDays > 1 && "a"}
                </span>
                <span className="font-semibold text-podeli-dark">
                  {totalPrice.toFixed(0)} RSD
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-podeli-red/10 p-3 text-sm text-podeli-red">
              {error}
            </div>
          )}

          {!isSignedIn ? (
            <p className="text-center text-sm text-muted-foreground">
              Prijavite se da biste rezervisali ovaj predmet.
            </p>
          ) : atRentalLimit ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-[#f0a202]/10 p-3 text-sm text-[#f0a202]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Dostigli ste limit od {planLimits?.maxActiveRentals} aktivnih zakupa za vaš &quot;{planLimits?.planName}&quot; plan.
                </span>
              </div>
              <Button
                asChild
                className="w-full bg-[#f0a202] text-white hover:bg-[#f0a202]/90"
                size="lg"
              >
                <a href="/planovi">Nadogradite plan</a>
              </Button>
            </div>
          ) : (
            <>
              {!canBook && (
                <div className="rounded-lg bg-podeli-accent/10 p-3 text-sm text-podeli-accent">
                  Izaberite period iznajmljivanja na kalendaru (kliknite na
                  početni i krajnji datum).
                </div>
              )}
              <Button
                className="w-full bg-podeli-accent hover:bg-podeli-accent/90 text-podeli-dark"
                size="lg"
                disabled={!canBook}
                onClick={handleSubmit}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Rezerviši
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {showPaymentModal && (
        <PaymentMethodModal
          totalPrice={totalPrice}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
}
