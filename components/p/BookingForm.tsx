"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarDays, Truck, CreditCard } from "lucide-react";
import { DateRange } from "react-day-picker";
import { PaymentPlaceholder } from "@/components/booking/PaymentPlaceholder";

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
  const [showPayment, setShowPayment] = useState(false);
  const [bookingId, setBookingId] = useState<Id<"bookings"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = useMutation(api.bookings.createBooking);
  const bookedDates = useQuery(api.bookings.getItemBookedDates, {
    itemId: item._id,
  });

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

  const handleSubmit = async () => {
    if (!canBook || !dateRange?.from || !dateRange?.to) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const id = await createBooking({
        itemId: item._id,
        startDate: formatDate(dateRange.from),
        endDate: formatDate(dateRange.to),
        deliveryMethod,
      });
      setBookingId(id);
      setShowPayment(true);
    } catch (err) {
      // Handle Convex application errors properly
      const errorMessage =
        err instanceof ConvexError
          ? // Access data and cast it to the type we expect (string in this case)
            (err.data as string)
          : // Must be some developer error, and prod deployments will not
            // reveal any more information about it to the client
            "Greška pri rezervaciji. Molimo pokušajte ponovo.";
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    router.push("/kontrolna-tabla/zakupi");
  };

  const availableDeliveryMethods = DELIVERY_OPTIONS.filter((option) =>
    item.deliveryMethods.includes(option.value)
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-500" />
            Rezerviši
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block text-sm font-medium text-slate-700">
              Izaberite period
            </Label>
            <div className="rounded-lg border border-slate-200 p-3">
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
            <Label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
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
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
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
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  Lično preuzimanje
                </button>
              )}
            </div>
          </div>

          {totalDays > 0 && (
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {item.pricePerDay.toFixed(0)} RSD × {totalDays} dan
                  {totalDays > 1 && "a"}
                </span>
                <span className="font-semibold text-slate-900">
                  {totalPrice.toFixed(0)} RSD
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {!isSignedIn ? (
            <p className="text-center text-sm text-slate-500">
              Prijavite se da biste rezervisali ovaj predmet.
            </p>
          ) : (
            <>
              {!canBook && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                  Izaberite period iznajmljivanja na kalendaru (kliknite na
                  početni i krajnji datum).
                </div>
              )}
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600"
                size="lg"
                disabled={!canBook || isSubmitting}
                onClick={handleSubmit}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {isSubmitting ? "Rezervisanje..." : "Rezerviši"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {showPayment && bookingId && (
        <PaymentPlaceholder
          bookingId={bookingId}
          totalPrice={totalPrice}
          onComplete={handlePaymentComplete}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </>
  );
}
