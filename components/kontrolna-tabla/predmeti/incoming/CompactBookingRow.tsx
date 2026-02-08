"use client";

import Image from "next/image";
import { Star, User } from "lucide-react";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { DateDisplay } from "@/components/ui/date-display";
import { BookingTimelineBar } from "./BookingTimelineBar";
import { BookingActions } from "./BookingActions";
import type { BookingWithItem } from "./useBookingGroups";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "nije_isporucen"
  | "isporucen"
  | "vracen"
  | "cancelled";

const BORDER_COLORS: Record<BookingStatus, string> = {
  pending: "border-l-[#f0a202]",
  confirmed: "border-l-green-500",
  nije_isporucen: "border-l-amber-500",
  isporucen: "border-l-purple-500",
  vracen: "border-l-gray-300",
  cancelled: "border-l-red-300",
};

interface CompactBookingRowProps {
  booking: BookingWithItem;
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
}

export function CompactBookingRow({ booking }: CompactBookingRowProps) {
  const status = booking.status as BookingStatus;
  const isPending = status === "pending";
  const days = daysBetween(booking.startDate, booking.endDate);

  return (
    <div
      className={`rounded-lg border border-border border-l-4 bg-card p-3 ${BORDER_COLORS[status]} ${
        isPending ? "bg-[#f0a202]/5" : ""
      }`}
    >
      {/* Top section: renter info + dates + price */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        {/* Renter */}
        <div className="flex items-center gap-2">
          <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-muted">
            {booking.renter?.imageUrl ? (
              <Image
                src={booking.renter.imageUrl}
                alt={booking.renter.firstName ?? "Zakupac"}
                fill
                sizes="28px"
                className="object-cover"
              />
            ) : (
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          <span className="text-sm font-medium text-[#02020a]">
            {booking.renter?.firstName ?? "Korisnik"}
          </span>
          {booking.renterRating ? (
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-xs font-medium">
                {booking.renterRating.average.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({booking.renterRating.count})
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Bez ocena</span>
          )}
        </div>

        {/* Date range + price */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            <DateDisplay value={booking.startDate} format="short" />
            {" – "}
            <DateDisplay value={booking.endDate} format="short" />
            <span className="ml-1 text-[#02020a]">
              ({days}d)
            </span>
          </span>
          <span className="font-semibold text-[#f0a202]">
            {booking.totalPrice.toFixed(0)} RSD
          </span>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="mt-2">
        <BookingTimelineBar
          startDate={booking.startDate}
          endDate={booking.endDate}
          status={booking.status}
        />
      </div>

      {/* Status badge row */}
      <div className="mt-2 flex items-center gap-2">
        <BookingStatusBadge status={status} />
        {(booking.renterCompletedRentals ?? 0) > 0 && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {booking.renterCompletedRentals} završen
            {booking.renterCompletedRentals === 1 ? "a" : "e"} rezervacij
            {booking.renterCompletedRentals === 1 ? "a" : "e"}
          </span>
        )}
      </div>

      {/* Actions */}
      <BookingActions booking={booking} />
    </div>
  );
}
