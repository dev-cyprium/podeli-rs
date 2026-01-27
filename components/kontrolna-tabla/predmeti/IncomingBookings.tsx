"use client";

import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/booking/BookingStatusBadge";
import { Calendar, Clock, Inbox, X, Check, CheckCircle } from "lucide-react";
import { getItemUrl } from "@/lib/utils";

type BookingWithItem = Doc<"bookings"> & {
  item: Doc<"items"> | null;
};

export function IncomingBookings() {
  return (
    <>
      <SignedOut>
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-600">
            Prijavite se da biste videli dolazne rezervacije.
          </CardContent>
        </Card>
      </SignedOut>
      <SignedIn>
        <IncomingBookingsContent />
      </SignedIn>
    </>
  );
}

function IncomingBookingsContent() {
  const bookings = useQuery(api.bookings.getBookingsAsOwner, {});

  if (bookings === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
        Učitavanje rezervacija...
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const activeBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "active"
  );
  const completedBookings = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled"
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-amber-500" />
            Dolazne rezervacije
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Rezervacije za vaše predmete.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Nemate dolaznih rezervacija.
          </div>
        ) : (
          <div className="space-y-6">
            {pendingBookings.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-yellow-700">
                  <Clock className="h-4 w-4" />
                  Zahtevi na čekanju ({pendingBookings.length})
                </h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {pendingBookings.map((booking) => (
                      <motion.div
                        key={booking._id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{
                          type: "spring",
                          bounce: 0.35,
                          duration: 0.4,
                        }}
                      >
                        <PendingBookingCard booking={booking} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {activeBookings.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-slate-700">
                  Aktivne i potvrđene ({activeBookings.length})
                </h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {activeBookings.map((booking) => (
                      <motion.div
                        key={booking._id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{
                          type: "spring",
                          bounce: 0.35,
                          duration: 0.4,
                        }}
                      >
                        <OwnerBookingCard booking={booking} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {completedBookings.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-slate-700">
                  Istorija ({completedBookings.length})
                </h3>
                <div className="space-y-3">
                  {completedBookings.slice(0, 5).map((booking) => (
                    <OwnerBookingCard key={booking._id} booking={booking} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OwnerBookingCard({ booking }: { booking: BookingWithItem }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = useMutation(api.bookings.updateBookingStatus);
  const imageUrl = useQuery(
    api.items.getImageUrl,
    booking.item?.images[0]
      ? { storageId: booking.item.images[0] as Id<"_storage"> }
      : "skip"
  );

  const canActivate =
    booking.status === "confirmed" && booking.paymentStatus === "paid";
  const canComplete = booking.status === "active";
  const canCancel =
    booking.status === "confirmed" || booking.status === "active";

  const handleStatusChange = async (
    status: "active" | "completed" | "cancelled"
  ) => {
    if (
      status === "cancelled" &&
      !confirm("Da li ste sigurni da želite da otkažete ovu rezervaciju?")
    ) {
      return;
    }
    setIsUpdating(true);
    try {
      await updateStatus({ id: booking._id, status });
    } catch (error) {
      console.error("Failed to update booking status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const itemUrl = booking.item ? getItemUrl(booking.item) : "#";

  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <Link
        href={itemUrl}
        className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={booking.item?.title ?? "Predmet"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            Nema
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <Link
            href={itemUrl}
            className="text-sm font-semibold text-slate-900 hover:text-amber-600"
          >
            {booking.item?.title ?? "Predmet nije dostupan"}
          </Link>
          <div className="flex gap-1.5">
            <BookingStatusBadge status={booking.status} />
            <PaymentStatusBadge status={booking.paymentStatus} />
          </div>
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {booking.startDate} - {booking.endDate}
            </span>
          </div>
          <span className="font-medium text-amber-600">
            {booking.totalPrice.toFixed(0)} RSD
          </span>
        </div>

        {(canActivate || canComplete || canCancel) && (
          <div className="mt-2 flex gap-2">
            {canActivate && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => handleStatusChange("active")}
                disabled={isUpdating}
                className="text-green-600 hover:bg-green-50"
              >
                <Check className="mr-1 h-3 w-3" />
                Aktiviraj
              </Button>
            )}
            {canComplete && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => handleStatusChange("completed")}
                disabled={isUpdating}
                className="text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Završi
              </Button>
            )}
            {canCancel && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => handleStatusChange("cancelled")}
                disabled={isUpdating}
                className="text-red-600 hover:bg-red-50"
              >
                <X className="mr-1 h-3 w-3" />
                Otkaži
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PendingBookingCard({ booking }: { booking: BookingWithItem }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveBooking = useMutation(api.bookings.approveBooking);
  const rejectBooking = useMutation(api.bookings.rejectBooking);
  const imageUrl = useQuery(
    api.items.getImageUrl,
    booking.item?.images[0]
      ? { storageId: booking.item.images[0] as Id<"_storage"> }
      : "skip"
  );

  const handleApprove = async () => {
    setError(null);
    setIsUpdating(true);
    try {
      await approveBooking({ id: booking._id });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Greška pri odobravanju.";
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Da li ste sigurni da želite da odbijete ovu rezervaciju?")) {
      return;
    }
    setError(null);
    setIsUpdating(true);
    try {
      await rejectBooking({ id: booking._id });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Greška pri odbijanju.";
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const itemUrl = booking.item ? getItemUrl(booking.item) : "#";

  return (
    <div className="flex gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
      <Link
        href={itemUrl}
        className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={booking.item?.title ?? "Predmet"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            Nema
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <Link
            href={itemUrl}
            className="text-sm font-semibold text-slate-900 hover:text-amber-600"
          >
            {booking.item?.title ?? "Predmet nije dostupan"}
          </Link>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {booking.startDate} - {booking.endDate}
            </span>
          </div>
          <span className="font-medium text-amber-600">
            {booking.totalPrice.toFixed(0)} RSD
          </span>
        </div>

        {error && (
          <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="mt-2 flex gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={handleApprove}
            disabled={isUpdating}
            className="text-green-600 hover:bg-green-50"
          >
            <Check className="mr-1 h-3 w-3" />
            Odobri
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={handleReject}
            disabled={isUpdating}
            className="text-red-600 hover:bg-red-50"
          >
            <X className="mr-1 h-3 w-3" />
            Odbij
          </Button>
        </div>
      </div>
    </div>
  );
}
