"use client";

import { cn } from "@/lib/utils";

type BookingStatus = "pending" | "confirmed" | "active" | "completed" | "cancelled";
type PaymentStatus = "pending" | "paid" | "refunded";

const statusLabels: Record<BookingStatus, string> = {
  pending: "Čeka odobrenje",
  confirmed: "Potvrđeno",
  active: "Aktivno",
  completed: "Završeno",
  cancelled: "Otkazano",
};

const statusColors: Record<BookingStatus, string> = {
  pending: "bg-podeli-accent/10 text-podeli-accent border-podeli-accent/30",
  confirmed: "bg-podeli-blue/10 text-podeli-blue border-podeli-blue/30",
  active: "bg-podeli-blue/10 text-podeli-blue border-podeli-blue/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-podeli-red/10 text-podeli-red border-podeli-red/30",
};

const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Čeka plaćanje",
  paid: "Plaćeno",
  refunded: "Refundirano",
};

const paymentColors: Record<PaymentStatus, string> = {
  pending: "bg-podeli-accent/10 text-podeli-accent border-podeli-accent/30",
  paid: "bg-podeli-blue/10 text-podeli-blue border-podeli-blue/30",
  refunded: "bg-muted text-muted-foreground border-border",
};

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
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

export function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        paymentColors[status],
        className
      )}
    >
      {paymentLabels[status]}
    </span>
  );
}
