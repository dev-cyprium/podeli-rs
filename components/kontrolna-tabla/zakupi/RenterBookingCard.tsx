"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { AgreementStatus } from "@/components/booking/AgreementStatus";
import {
  Calendar,
  MapPin,
  Star,
  X,
  MessageSquare,
  Handshake,
} from "lucide-react";
import { ReviewModal } from "./ReviewModal";
import { DateDisplay } from "@/components/ui/date-display";
import { getItemUrl } from "@/lib/utils";

type BookingWithItem = Doc<"bookings"> & {
  item: Doc<"items"> | null;
};

interface RenterBookingCardProps {
  booking: BookingWithItem;
}

export function RenterBookingCard({ booking }: RenterBookingCardProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAgreeing, setIsAgreeing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelBooking = useMutation(api.bookings.cancelBooking);
  const agreeToBooking = useMutation(api.bookings.agreeToBooking);

  const existingReview = useQuery(api.reviews.getReviewByBooking, {
    bookingId: booking._id,
  });
  const hasMessages = useQuery(api.messages.hasMessages, {
    bookingId: booking._id,
  });
  const imageUrl = useQuery(
    api.items.getImageUrl,
    booking.item?.images[0]
      ? { storageId: booking.item.images[0] as Id<"_storage"> }
      : "skip"
  );

  const canChat =
    booking.status === "confirmed" ||
    booking.status === "agreed" ||
    booking.status === "nije_isporucen" ||
    booking.status === "isporucen";

  const canCancel =
    booking.status === "pending" || booking.status === "confirmed";

  const canAgree =
    booking.status === "confirmed" &&
    !booking.renterAgreed &&
    hasMessages;

  const canReview =
    booking.status === "vracen" && existingReview === null;

  const handleCancel = async () => {
    if (!confirm("Da li ste sigurni da želite da otkažete ovu rezervaciju?")) {
      return;
    }
    setError(null);
    setIsCancelling(true);
    try {
      await cancelBooking({ id: booking._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri otkazivanju.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAgree = async () => {
    setError(null);
    setIsAgreeing(true);
    try {
      await agreeToBooking({ id: booking._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška");
    } finally {
      setIsAgreeing(false);
    }
  };

  const itemUrl = booking.item ? getItemUrl(booking.item) : "#";

  return (
    <>
      <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
        <Link
          href={itemUrl}
          className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={booking.item?.title ?? "Predmet"}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Nema slike
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between">
            <div>
              <Link
                href={itemUrl}
                className="font-semibold text-podeli-dark hover:text-podeli-accent"
              >
                {booking.item?.title ?? "Predmet nije dostupan"}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>Beograd</span>
              </div>
            </div>
            <BookingStatusBadge status={booking.status as "pending" | "confirmed" | "agreed" | "nije_isporucen" | "isporucen" | "vracen" | "cancelled"} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                <DateDisplay value={booking.startDate} format="short" /> –{" "}
                <DateDisplay value={booking.endDate} format="short" />
              </span>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {booking.totalDays} dan{booking.totalDays > 1 && "a"}
            </span>
          </div>

          {/* Agreement status for confirmed bookings */}
          {booking.status === "confirmed" && (
            <AgreementStatus
              renterAgreed={booking.renterAgreed}
              ownerAgreed={booking.ownerAgreed}
              isOwner={false}
              className="mt-2"
            />
          )}

          {error && (
            <div className="mt-2 rounded bg-podeli-red/10 p-2 text-xs text-podeli-red">
              {error}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="font-bold text-podeli-accent">
              {booking.totalPrice.toFixed(0)} RSD
            </span>

            <div className="flex flex-wrap gap-2">
              {canChat && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-podeli-blue hover:bg-podeli-blue/10"
                >
                  <Link href={`/kontrolna-tabla/zakupi/poruke/${booking._id}`}>
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Otvori chat
                  </Link>
                </Button>
              )}

              {canAgree && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAgree}
                  disabled={isAgreeing}
                  className="text-green-600 hover:bg-green-50"
                >
                  <Handshake className="mr-1 h-4 w-4" />
                  Potvrdi dogovor
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="text-podeli-red hover:bg-podeli-red/10 hover:text-podeli-red"
                >
                  <X className="mr-1 h-4 w-4" />
                  {isCancelling ? "Otkazivanje..." : "Otkaži"}
                </Button>
              )}

              {canReview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReviewModal(true)}
                >
                  <Star className="mr-1 h-4 w-4" />
                  Ostavi recenziju
                </Button>
              )}

              {existingReview && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-podeli-accent text-podeli-accent" />
                  Recenzija ostavljena
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReviewModal && (
        <ReviewModal
          bookingId={booking._id}
          itemTitle={booking.item?.title ?? "Predmet"}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </>
  );
}
