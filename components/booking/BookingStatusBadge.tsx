"use client";

import { cn } from "@/lib/utils";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "nije_isporucen"
  | "isporucen"
  | "vracen"
  | "cancelled";

const statusLabels: Record<BookingStatus, string> = {
  pending: "Čeka odobrenje",
  confirmed: "Potvrđeno",
  nije_isporucen: "Čeka preuzimanje",
  isporucen: "Isporučeno",
  vracen: "Vraćeno",
  cancelled: "Otkazano",
};

const statusColors: Record<BookingStatus, string> = {
  pending: "bg-podeli-accent/10 text-podeli-accent border-podeli-accent/30",
  confirmed: "bg-green-100 text-green-700 border-green-300",
  nije_isporucen: "bg-amber-100 text-amber-700 border-amber-300",
  isporucen: "bg-purple-100 text-purple-700 border-purple-300",
  vracen: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-podeli-red/10 text-podeli-red border-podeli-red/30",
};

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusBadge({
  status,
  className,
}: BookingStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusColors[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
