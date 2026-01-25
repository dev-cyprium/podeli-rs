"use client";

import { cn } from "@/lib/utils";

type BookingStatus = "confirmed" | "active" | "completed" | "cancelled";
type PaymentStatus = "pending" | "paid" | "refunded";

const statusLabels: Record<BookingStatus, string> = {
  confirmed: "Potvrđeno",
  active: "Aktivno",
  completed: "Završeno",
  cancelled: "Otkazano",
};

const statusColors: Record<BookingStatus, string> = {
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  active: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Čeka plaćanje",
  paid: "Plaćeno",
  refunded: "Refundirano",
};

const paymentColors: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  refunded: "bg-slate-100 text-slate-700 border-slate-200",
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
