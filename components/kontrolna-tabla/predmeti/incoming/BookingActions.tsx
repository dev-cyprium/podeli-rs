"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AgreementStatus } from "@/components/booking/AgreementStatus";
import {
  Check,
  Handshake,
  Info,
  MessageSquare,
  RotateCcw,
  ShieldBan,
  Star,
  Truck,
  X,
} from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";
import { parseDateString } from "@/lib/date-utils";
import type { BookingWithItem } from "./useBookingGroups";

interface BookingActionsProps {
  booking: BookingWithItem;
}

export function BookingActions({ booking }: BookingActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const approveBooking = useMutation(api.bookings.approveBooking);
  const rejectBooking = useMutation(api.bookings.rejectBooking);
  const agreeToBooking = useMutation(api.bookings.agreeToBooking);
  const confirmOffPlatformDeal = useMutation(
    api.bookings.confirmOffPlatformDeal
  );
  const markAsDelivered = useMutation(api.bookings.markAsDelivered);
  const markAsReturned = useMutation(api.bookings.markAsReturned);
  const cancelBooking = useMutation(api.bookings.cancelBooking);
  const createRenterReview = useMutation(api.reviews.createRenterReview);
  const resetReminderFlag = useMutation(api.cronHandlers.resetReminderFlag);

  const hasMessages = useQuery(api.messages.hasMessages, {
    bookingId: booking._id,
  });

  const isSuperAdmin = useQuery(api.profiles.getIsCurrentUserSuperAdmin);

  const existingRenterReview = useQuery(
    api.reviews.getRenterReviewByBooking,
    booking.status === "vracen" ? { bookingId: booking._id } : "skip"
  );

  const blockStatus = useQuery(api.chatBlocks.getBlockStatus, {
    bookingId: booking._id,
  });

  const isBlocked = blockStatus?.isBlocked ?? false;
  const timeOverride = useQuery(api.debug.getTimeOverride);
  const ownerChatEnabled = booking.ownerChatEnabled !== false;

  const isPending = booking.status === "pending";

  const canChat =
    ownerChatEnabled &&
    (booking.status === "confirmed" ||
      booking.status === "nije_isporucen" ||
      booking.status === "isporucen");

  const canAgree =
    booking.status === "confirmed" &&
    !booking.ownerAgreed &&
    booking.renterAgreed &&
    hasMessages &&
    !isBlocked &&
    ownerChatEnabled;

  const canConfirmOffPlatform =
    booking.status === "confirmed" && !ownerChatEnabled && !isBlocked;

  const canMarkDelivered = booking.status === "nije_isporucen";

  const currentTime = timeOverride?.timestamp
    ? new Date(timeOverride.timestamp)
    : new Date();
  const isReturnDay = parseDateString(booking.endDate) <= currentTime;
  const canMarkReturned = booking.status === "isporucen" && isReturnDay;

  const canCancel =
    booking.status === "pending" || booking.status === "confirmed";
  const canRateRenter =
    booking.status === "vracen" && existingRenterReview === null;

  const showDebugReset =
    isSuperAdmin &&
    process.env.NODE_ENV !== "production" &&
    booking.returnReminderSent;

  const handleAction = async (
    action: () => Promise<unknown>,
    errorMsg: string
  ) => {
    setError(null);
    setIsUpdating(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitRating = async () => {
    if (selectedRating === 0) return;
    setIsSubmittingRating(true);
    try {
      await createRenterReview({
        bookingId: booking._id,
        rating: selectedRating,
      });
      setShowRatingDialog(false);
      setSelectedRating(0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri ocenjivanju"
      );
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <>
      {/* Agreement status for confirmed bookings */}
      {booking.status === "confirmed" && !isBlocked && ownerChatEnabled && (
        <AgreementStatus
          renterAgreed={booking.renterAgreed}
          ownerAgreed={booking.ownerAgreed}
          isOwner={true}
          className="mt-2"
        />
      )}

      {/* Off-platform deal info banner */}
      {booking.status === "confirmed" && !isBlocked && !ownerChatEnabled && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#006992]/5 px-3 py-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 text-[#006992]" />
          <span className="text-xs text-[#02020a]">
            Dogovorite se van platforme i potvrdite dogovor.
          </span>
        </div>
      )}

      {/* Block status banner */}
      {isBlocked && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5">
          <ShieldBan className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <div className="text-xs text-red-700">
            <span className="font-medium">
              {blockStatus?.blockedByMe
                ? "Blokirali ste ovog korisnika."
                : "Zakupac vas je blokirao."}
            </span>
            {blockStatus?.blockedByOther && blockStatus?.reason && (
              <span className="text-red-500"> — {blockStatus.reason}</span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 rounded bg-[#dd1c1a]/10 p-2 text-xs text-[#dd1c1a]">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {/* Pending: approve + reject */}
        {isPending && (
          <>
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                handleAction(
                  () => approveBooking({ id: booking._id }),
                  "Greška pri odobravanju."
                )
              }
              disabled={isUpdating}
              className="text-[#006992] hover:bg-[#006992]/10"
            >
              <Check className="mr-1 h-3 w-3" />
              Odobri
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={isUpdating}
                  className="text-[#dd1c1a] hover:bg-[#dd1c1a]/10"
                >
                  <X className="mr-1 h-3 w-3" />
                  Odbij
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Odbijanje rezervacije</AlertDialogTitle>
                  <AlertDialogDescription>
                    Da li ste sigurni da želite da odbijete ovu rezervaciju?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Ne</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      handleAction(
                        () => rejectBooking({ id: booking._id }),
                        "Greška pri odbijanju."
                      )
                    }
                    className="bg-[#dd1c1a] text-white hover:bg-[#dd1c1a]/90"
                  >
                    Da, odbij
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {canChat && (
          <Button
            size="xs"
            variant="outline"
            asChild
            className="text-[#006992] hover:bg-[#006992]/10"
          >
            <Link href={`/kontrolna-tabla/predmeti/poruke/${booking._id}`}>
              <MessageSquare className="mr-1 h-3 w-3" />
              Chat
            </Link>
          </Button>
        )}

        {canAgree && (
          <Button
            size="xs"
            variant="outline"
            onClick={() =>
              handleAction(
                () => agreeToBooking({ id: booking._id }),
                "Greška"
              )
            }
            disabled={isUpdating}
            className="text-green-600 hover:bg-green-50"
          >
            <Handshake className="mr-1 h-3 w-3" />
            Potvrdi dogovor
          </Button>
        )}

        {canConfirmOffPlatform && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="xs"
                variant="outline"
                disabled={isUpdating}
                className="text-green-600 hover:bg-green-50"
              >
                <Handshake className="mr-1 h-3 w-3" />
                Potvrdi dogovor
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Potvrda dogovora van platforme
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Potvrđujete da ste se dogovorili sa zakupcem van platforme
                  (telefonom, emailom ili uživo). Predmet će preći u status
                  &quot;čeka preuzimanje&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Otkaži</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    handleAction(
                      () => confirmOffPlatformDeal({ id: booking._id }),
                      "Greška"
                    )
                  }
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Da, potvrdi
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {canMarkDelivered && (
          <Button
            size="xs"
            variant="outline"
            onClick={() =>
              handleAction(
                () => markAsDelivered({ id: booking._id }),
                "Greška"
              )
            }
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
            onClick={() =>
              handleAction(
                () => markAsReturned({ id: booking._id }),
                "Greška"
              )
            }
            disabled={isUpdating}
            className="text-green-600 hover:bg-green-50"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Potvrdi povratak
          </Button>
        )}

        {booking.status === "isporucen" && !isReturnDay && (
          <span className="text-xs text-muted-foreground">
            Povratak moguć od{" "}
            <DateDisplay value={booking.endDate} format="short" />
          </span>
        )}

        {canCancel && !isPending && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="xs"
                variant="outline"
                disabled={isUpdating}
                className="text-[#dd1c1a] hover:bg-[#dd1c1a]/10"
              >
                <X className="mr-1 h-3 w-3" />
                Otkaži
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
                  onClick={() =>
                    handleAction(
                      () => cancelBooking({ id: booking._id }),
                      "Greška"
                    )
                  }
                  className="bg-[#dd1c1a] text-white hover:bg-[#dd1c1a]/90"
                >
                  Da, otkaži
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {canRateRenter && (
          <Button
            size="xs"
            variant="outline"
            onClick={() => setShowRatingDialog(true)}
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
              <span className="font-medium">
                {existingRenterReview.rating}
              </span>
            </div>
          </div>
        )}

        {showDebugReset && (
          <Button
            size="xs"
            variant="outline"
            onClick={() =>
              handleAction(
                () => resetReminderFlag({ bookingId: booking._id }),
                "Greška"
              )
            }
            disabled={isUpdating}
            className="text-purple-600 hover:bg-purple-50"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset podsetnik
          </Button>
        )}
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ocenite zakupca</DialogTitle>
            <DialogDescription>
              Ocenite zakupca {booking.renter?.firstName ?? ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-1 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={isSubmittingRating}
                className="p-1"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hoverRating || selectedRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  }`}
                />
              </Button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowRatingDialog(false);
                setSelectedRating(0);
              }}
              disabled={isSubmittingRating}
            >
              Otkaži
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitRating}
              disabled={selectedRating === 0 || isSubmittingRating}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              {isSubmittingRating ? "Šaljem..." : "Pošalji ocenu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
