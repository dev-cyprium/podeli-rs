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
import { CalendarDays, Truck, Send, Loader2, CheckCircle } from "lucide-react";
import { DateRange } from "react-day-picker";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { parseDateString, formatDateString } from "@/lib/date-utils";

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

export function BookingForm({ item }: BookingFormProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    (item.deliveryMethods[0] as DeliveryMethod) ?? "licno"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = useMutation(api.bookings.createBooking);
  const bookedDates = useQuery(api.bookings.getItemBookedDates, {
    itemId: item._id,
  });

  const disabledDates = useMemo(() => {
    if (!bookedDates) return [];

    const dates: Date[] = [];
    for (const booking of bookedDates) {
      const start = parseDateString(booking.startDate);
      const end = parseDateString(booking.endDate);
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
      await createBooking({
        itemId: item._id,
        startDate: formatDateString(dateRange.from),
        endDate: formatDateString(dateRange.to),
        deliveryMethod,
      });
      setIsComplete(true);
      // Wait a bit to show success message, then redirect
      setTimeout(() => {
        router.push("/kontrolna-tabla/zakupi");
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof ConvexError
          ? (err.data as string)
          : "Greška pri rezervaciji. Molimo pokušajte ponovo.";
      setError(errorMessage);
      setIsSubmitting(false);
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
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    onClick={() => setDeliveryMethod(option.value)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      deliveryMethod === option.value
                        ? "border-podeli-accent bg-podeli-accent/10 text-podeli-accent hover:bg-podeli-accent/10"
                        : "border-border text-muted-foreground hover:border-podeli-accent/30 hover:bg-transparent"
                    }`}
                  >
                    {option.label}
                  </Button>
                ))
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDeliveryMethod("licno")}
                  className={`col-span-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    deliveryMethod === "licno"
                      ? "border-podeli-accent bg-podeli-accent/10 text-podeli-accent hover:bg-podeli-accent/10"
                      : "border-border text-muted-foreground hover:border-podeli-accent/30 hover:bg-transparent"
                  }`}
                >
                  Lično preuzimanje
                </Button>
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
          ) : (
            <>
              {!canBook && (
                <div className="rounded-lg bg-podeli-accent/10 p-3 text-sm text-podeli-accent">
                  Izaberite period iznajmljivanja na kalendaru (kliknite na
                  početni i krajnji datum).
                </div>
              )}
              <Button
                className="w-full bg-podeli-accent hover:bg-podeli-accent/90 text-white"
                size="lg"
                disabled={!canBook || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Slanje zahteva...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Pošalji zahtev
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={isComplete}>
        <DialogContent className="sm:max-w-md" showCloseButton={false} accessibleTitle="Zahtev poslat">
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
        </DialogContent>
      </Dialog>
    </>
  );
}
