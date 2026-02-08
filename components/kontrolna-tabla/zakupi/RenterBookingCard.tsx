"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { AgreementStatus } from "@/components/booking/AgreementStatus";
import {
  Calendar,
  Info,
  Mail,
  MapPin,
  Phone,
  Star,
  X,
  MessageSquare,
  Handshake,
  ShieldBan,
} from "lucide-react";
import { ReviewModal } from "./ReviewModal";
import { DateDisplay } from "@/components/ui/date-display";
import { getItemUrl } from "@/lib/utils";

type BookingWithItem = Doc<"bookings"> & {
  item: Doc<"items"> | null;
  ownerContact?: {
    email?: string;
    phoneNumber?: string;
    chat: boolean;
  } | null;
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
  const blockStatus = useQuery(api.chatBlocks.getBlockStatus, {
    bookingId: booking._id,
  });

  const isBlocked = blockStatus?.isBlocked ?? false;

  const ownerAllowsChat = booking.ownerContact?.chat !== false;
  const canChat =
    ownerAllowsChat &&
    (booking.status === "confirmed" ||
    booking.status === "nije_isporucen" ||
    booking.status === "isporucen");

  const canCancel =
    booking.status === "pending" || booking.status === "confirmed";

  const canAgree =
    booking.status === "confirmed" &&
    !booking.renterAgreed &&
    hasMessages &&
    !isBlocked &&
    ownerAllowsChat;

  const canReview =
    booking.status === "vracen" && existingReview === null;

  const handleCancel = async () => {
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
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
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
            <BookingStatusBadge status={booking.status as "pending" | "confirmed" | "nije_isporucen" | "isporucen" | "vracen" | "cancelled"} />
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
          {booking.status === "confirmed" && !isBlocked && ownerAllowsChat && (
            <AgreementStatus
              renterAgreed={booking.renterAgreed}
              ownerAgreed={booking.ownerAgreed}
              isOwner={false}
              className="mt-2"
            />
          )}

          {/* Off-platform deal info for renter when owner has no chat */}
          {booking.status === "confirmed" && !isBlocked && !ownerAllowsChat && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-podeli-blue/5 px-3 py-2">
              <Info className="h-4 w-4 shrink-0 text-podeli-blue" />
              <span className="text-xs text-podeli-dark">
                Vlasnik koristi kontakt van platforme. Dogovorite se telefonom ili emailom.
              </span>
            </div>
          )}

          {/* Owner contact info for confirmed+ bookings */}
          {booking.ownerContact && (booking.ownerContact.email || booking.ownerContact.phoneNumber) && (
            <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg bg-podeli-blue/5 px-3 py-2 text-xs">
              <span className="font-medium text-podeli-dark">Kontakt vlasnika:</span>
              {booking.ownerContact.email && (
                <a
                  href={`mailto:${booking.ownerContact.email}`}
                  className="inline-flex items-center gap-1 text-podeli-blue hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {booking.ownerContact.email}
                </a>
              )}
              {booking.ownerContact.phoneNumber && (
                <a
                  href={`tel:${booking.ownerContact.phoneNumber}`}
                  className="inline-flex items-center gap-1 text-podeli-blue hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {booking.ownerContact.phoneNumber}
                </a>
              )}
            </div>
          )}

          {/* Block status banner */}
          {isBlocked && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
              <ShieldBan className="h-4 w-4 shrink-0 text-red-500" />
              <div className="text-xs text-red-700">
                <span className="font-medium">
                  {blockStatus?.blockedByMe
                    ? "Blokirali ste ovog korisnika."
                    : "Vlasnik vas je blokirao."}
                </span>
                {blockStatus?.blockedByOther && blockStatus?.reason && (
                  <span className="text-red-500"> — {blockStatus.reason}</span>
                )}
              </div>
            </div>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isCancelling}
                      className="text-podeli-red hover:bg-podeli-red/10 hover:text-podeli-red"
                    >
                      <X className="mr-1 h-4 w-4" />
                      {isCancelling ? "Otkazivanje..." : "Otkaži"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Otkazivanje rezervacije</AlertDialogTitle>
                      <AlertDialogDescription>
                        Da li ste sigurni da želite da otkažete ovu rezervaciju?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Ne</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="bg-[#dd1c1a] text-white hover:bg-[#dd1c1a]/90"
                      >
                        Da, otkaži
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
