"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { AgreementStatus } from "@/components/booking/AgreementStatus";
import {
  Calendar,
  Clock,
  Inbox,
  X,
  Check,
  MessageSquare,
  Package,
  Truck,
  RotateCcw,
  Handshake,
  Star,
  User,
} from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";
import { getItemUrl } from "@/lib/utils";
import { parseDateString } from "@/lib/date-utils";

type BookingWithItem = Doc<"bookings"> & {
  item: Doc<"items"> | null;
  renter?: {
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  } | null;
  renterRating?: {
    average: number;
    count: number;
  } | null;
  renterCompletedRentals?: number;
};

export function IncomingBookings() {
  return (
    <>
      <SignedOut>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
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
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        Učitavanje rezervacija...
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const activeBookings = bookings.filter(
    (b) =>
      b.status === "confirmed" ||
      b.status === "agreed" ||
      b.status === "nije_isporucen" ||
      b.status === "isporucen"
  );
  const completedBookings = bookings.filter(
    (b) => b.status === "vracen" || b.status === "cancelled"
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-podeli-accent" />
            Dolazne rezervacije
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Rezervacije za vaše predmete.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nemate dolaznih rezervacija.
          </div>
        ) : (
          <div className="space-y-6">
            {pendingBookings.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-podeli-accent">
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
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Aktivne ({activeBookings.length})
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
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
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
  const [error, setError] = useState<string | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const agreeToBooking = useMutation(api.bookings.agreeToBooking);
  const markAsReady = useMutation(api.bookings.markAsReady);
  const markAsDelivered = useMutation(api.bookings.markAsDelivered);
  const markAsReturned = useMutation(api.bookings.markAsReturned);
  const cancelBooking = useMutation(api.bookings.cancelBooking);
  const createRenterReview = useMutation(api.reviews.createRenterReview);
  const resetReminderFlag = useMutation(api.cronHandlers.resetReminderFlag);

  const hasMessages = useQuery(api.messages.hasMessages, {
    bookingId: booking._id,
  });

  // For debug: check if super-admin (only in dev)
  const isSuperAdmin = useQuery(api.profiles.getIsCurrentUserSuperAdmin);

  const existingRenterReview = useQuery(
    api.reviews.getRenterReviewByBooking,
    booking.status === "vracen" ? { bookingId: booking._id } : "skip"
  );

  const imageUrl = useQuery(
    api.items.getImageUrl,
    booking.item?.images[0]
      ? { storageId: booking.item.images[0] as Id<"_storage"> }
      : "skip"
  );

  // Get time override for debugging (if set by super-admin)
  const timeOverride = useQuery(api.debug.getTimeOverride);

  const canChat =
    booking.status === "confirmed" ||
    booking.status === "agreed" ||
    booking.status === "nije_isporucen" ||
    booking.status === "isporucen";

  const canAgree =
    booking.status === "confirmed" &&
    !booking.ownerAgreed &&
    booking.renterAgreed &&
    hasMessages;

  const canMarkReady = booking.status === "agreed";
  const canMarkDelivered = booking.status === "nije_isporucen";

  // Can mark as returned on the last day (end date) or after
  // Use time override if set (for debugging), otherwise use current time
  const currentTime = timeOverride?.timestamp ? new Date(timeOverride.timestamp) : new Date();
  const isReturnDay = parseDateString(booking.endDate) <= currentTime;
  const canMarkReturned = booking.status === "isporucen" && isReturnDay;

  const canCancel =
    booking.status === "pending" || booking.status === "confirmed";
  const canRateRenter =
    booking.status === "vracen" && existingRenterReview === null;

  const handleSubmitRating = async () => {
    if (selectedRating === 0) return;
    setIsSubmittingRating(true);
    try {
      await createRenterReview({
        bookingId: booking._id,
        rating: selectedRating,
      });
      setShowRatingForm(false);
      setSelectedRating(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri ocenjivanju");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleAgree = async () => {
    setError(null);
    setIsUpdating(true);
    try {
      await agreeToBooking({ id: booking._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkReady = async () => {
    setError(null);
    setIsUpdating(true);
    try {
      await markAsReady({ id: booking._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkDelivered = async () => {
    setError(null);
    setIsUpdating(true);
    try {
      await markAsDelivered({ id: booking._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkReturned = async () => {
    setError(null);
    setIsUpdating(true);
    try {
      await markAsReturned({ id: booking._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Da li ste sigurni da želite da otkažete ovu rezervaciju?")) {
      return;
    }
    setError(null);
    setIsUpdating(true);
    try {
      await cancelBooking({ id: booking._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetReminder = async () => {
    setIsUpdating(true);
    try {
      await resetReminderFlag({ bookingId: booking._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška");
    } finally {
      setIsUpdating(false);
    }
  };

  const itemUrl = booking.item ? getItemUrl(booking.item) : "#";
  const showDebugReset = isSuperAdmin && process.env.NODE_ENV !== "production" && booking.returnReminderSent;

  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-3">
      <Link
        href={itemUrl}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={booking.item?.title ?? "Predmet"}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Nema
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <Link
            href={itemUrl}
            className="text-sm font-semibold text-podeli-dark hover:text-podeli-accent"
          >
            {booking.item?.title ?? "Predmet nije dostupan"}
          </Link>
          <BookingStatusBadge status={booking.status as "pending" | "confirmed" | "agreed" | "nije_isporucen" | "isporucen" | "vracen" | "cancelled"} />
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              <DateDisplay value={booking.startDate} format="short" /> –{" "}
              <DateDisplay value={booking.endDate} format="short" />
            </span>
          </div>
          <span className="font-medium text-podeli-accent">
            {booking.totalPrice.toFixed(0)} RSD
          </span>
        </div>

        {/* Renter info */}
        <div className="mt-2 flex items-center gap-2 text-xs">
          <div className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-muted">
            {booking.renter?.imageUrl ? (
              <Image
                src={booking.renter.imageUrl}
                alt={booking.renter.firstName ?? "Zakupac"}
                fill
                sizes="20px"
                className="object-cover"
              />
            ) : (
              <User className="h-2.5 w-2.5 text-muted-foreground" />
            )}
          </div>
          <span className="text-muted-foreground">
            {booking.renter?.firstName ?? "Korisnik"}
          </span>
          {booking.renterRating && (
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              <span className="font-medium">
                {booking.renterRating.average.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Agreement status for confirmed bookings */}
        {booking.status === "confirmed" && (
          <AgreementStatus
            renterAgreed={booking.renterAgreed}
            ownerAgreed={booking.ownerAgreed}
            isOwner={true}
            className="mt-2"
          />
        )}

        {error && (
          <div className="mt-2 rounded bg-podeli-red/10 p-2 text-xs text-podeli-red">
            {error}
          </div>
        )}

        {/* Actions based on status */}
        <div className="mt-2 flex flex-wrap gap-2">
          {canChat && (
            <Button
              size="xs"
              variant="outline"
              asChild
              className="text-podeli-blue hover:bg-podeli-blue/10"
            >
              <Link href={`/kontrolna-tabla/predmeti/poruke/${booking._id}`}>
                <MessageSquare className="mr-1 h-3 w-3" />
                Otvori chat
              </Link>
            </Button>
          )}

          {canAgree && (
            <Button
              size="xs"
              variant="outline"
              onClick={handleAgree}
              disabled={isUpdating}
              className="text-green-600 hover:bg-green-50"
            >
              <Handshake className="mr-1 h-3 w-3" />
              Potvrdi dogovor
            </Button>
          )}

          {canMarkReady && (
            <Button
              size="xs"
              variant="outline"
              onClick={handleMarkReady}
              disabled={isUpdating}
              className="text-amber-600 hover:bg-amber-50"
            >
              <Package className="mr-1 h-3 w-3" />
              Spreman za preuzimanje
            </Button>
          )}

          {canMarkDelivered && (
            <Button
              size="xs"
              variant="outline"
              onClick={handleMarkDelivered}
              disabled={isUpdating}
              className="text-purple-600 hover:bg-purple-50"
            >
              <Truck className="mr-1 h-3 w-3" />
              Potvrdi isporuku
            </Button>
          )}

          {canMarkReturned && (
            <Button
              size="xs"
              variant="outline"
              onClick={handleMarkReturned}
              disabled={isUpdating}
              className="text-green-600 hover:bg-green-50"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Potvrdi povratak
            </Button>
          )}

          {/* Show when return will be available */}
          {booking.status === "isporucen" && !isReturnDay && (
            <span className="text-xs text-muted-foreground">
              Povratak moguć od <DateDisplay value={booking.endDate} format="short" />
            </span>
          )}

          {canCancel && (
            <Button
              size="xs"
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
              className="text-podeli-red hover:bg-podeli-red/10"
            >
              <X className="mr-1 h-3 w-3" />
              Otkaži
            </Button>
          )}

          {canRateRenter && !showRatingForm && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => setShowRatingForm(true)}
              className="text-amber-600 hover:bg-amber-50"
            >
              <Star className="mr-1 h-3 w-3" />
              Oceni zakupca
            </Button>
          )}

          {existingRenterReview && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Ocenili ste:</span>
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                <span className="font-medium">{existingRenterReview.rating}</span>
              </div>
            </div>
          )}

          {/* Debug: reset reminder flag */}
          {showDebugReset && (
            <Button
              size="xs"
              variant="outline"
              onClick={handleResetReminder}
              disabled={isUpdating}
              className="text-purple-600 hover:bg-purple-50"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset podsetnik
            </Button>
          )}
        </div>

        {/* Rating form */}
        {showRatingForm && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 text-xs font-medium text-amber-800">
              Ocenite zakupca {booking.renter?.firstName ?? ""}
            </p>
            <div className="mb-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                // eslint-disable-next-line react/forbid-elements
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 focus:outline-none"
                  disabled={isSubmittingRating}
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      star <= (hoverRating || selectedRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="xs"
                onClick={handleSubmitRating}
                disabled={selectedRating === 0 || isSubmittingRating}
                className="bg-amber-500 text-white hover:bg-amber-600"
              >
                {isSubmittingRating ? "Šaljem..." : "Pošalji ocenu"}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setShowRatingForm(false);
                  setSelectedRating(0);
                }}
                disabled={isSubmittingRating}
              >
                Otkaži
              </Button>
            </div>
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
    <div className="flex gap-3 rounded-lg border border-podeli-accent/30 bg-podeli-accent/10 p-3">
      <Link
        href={itemUrl}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={booking.item?.title ?? "Predmet"}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Nema
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <Link
            href={itemUrl}
            className="text-sm font-semibold text-podeli-dark hover:text-podeli-accent"
          >
            {booking.item?.title ?? "Predmet nije dostupan"}
          </Link>
          <BookingStatusBadge status={booking.status as "pending" | "confirmed" | "agreed" | "nije_isporucen" | "isporucen" | "vracen" | "cancelled"} />
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              <DateDisplay value={booking.startDate} format="short" /> –{" "}
              <DateDisplay value={booking.endDate} format="short" />
            </span>
          </div>
          <span className="font-medium text-podeli-accent">
            {booking.totalPrice.toFixed(0)} RSD
          </span>
        </div>

        {/* Renter info */}
        <div className="mt-2 flex items-center gap-2 rounded-md bg-white/50 px-2 py-1.5">
          <div className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-muted">
            {booking.renter?.imageUrl ? (
              <Image
                src={booking.renter.imageUrl}
                alt={booking.renter.firstName ?? "Zakupac"}
                fill
                sizes="24px"
                className="object-cover"
              />
            ) : (
              <User className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-1 items-center gap-2 text-xs">
            <span className="font-medium text-podeli-dark">
              {booking.renter?.firstName ?? "Korisnik"}
            </span>
            {booking.renterRating ? (
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                <span className="font-semibold">
                  {booking.renterRating.average.toFixed(1)}
                </span>
                <span className="text-muted-foreground">
                  ({booking.renterRating.count})
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">Bez ocena</span>
            )}
            {(booking.renterCompletedRentals ?? 0) > 0 && (
              <span className="text-muted-foreground">
                • {booking.renterCompletedRentals} završen{booking.renterCompletedRentals === 1 ? "a" : "e"} rezervacij{booking.renterCompletedRentals === 1 ? "a" : "e"}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-2 rounded bg-podeli-red/10 p-2 text-xs text-podeli-red">
            {error}
          </div>
        )}

        <div className="mt-2 flex gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={handleApprove}
            disabled={isUpdating}
            className="text-podeli-blue hover:bg-podeli-blue/10"
          >
            <Check className="mr-1 h-3 w-3" />
            Odobri
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={handleReject}
            disabled={isUpdating}
            className="text-podeli-red hover:bg-podeli-red/10"
          >
            <X className="mr-1 h-3 w-3" />
            Odbij
          </Button>
        </div>
      </div>
    </div>
  );
}
