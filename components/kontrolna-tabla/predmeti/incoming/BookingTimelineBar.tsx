"use client";

import { useState } from "react";
import { parseDateString } from "@/lib/date-utils";

interface BookingTimelineBarProps {
  startDate: string;
  endDate: string;
  status: string;
}

function computeProgress(startDate: string, endDate: string): number {
  const start = parseDateString(startDate).getTime();
  const end = parseDateString(endDate).getTime();
  const total = end - start;
  if (total <= 0) return 0;
  const elapsed = Math.max(0, Math.min(Date.now() - start, total));
  return Math.round((elapsed / total) * 100);
}

export function BookingTimelineBar({
  startDate,
  endDate,
  status,
}: BookingTimelineBarProps) {
  const isFinished = status === "vracen" || status === "cancelled";

  // Capture progress once on mount (Date.now() is impure, so we use useState initializer)
  const [progress] = useState(() => computeProgress(startDate, endDate));

  const barColor = isFinished
    ? "bg-green-400"
    : status === "pending"
      ? "bg-[#f0a202]/60"
      : "bg-[#006992]";

  return (
    <div className="hidden h-1 w-full overflow-hidden rounded-full bg-gray-200 sm:block">
      <div
        className={`h-full rounded-full transition-all ${barColor}`}
        style={{ width: `${isFinished ? 100 : progress}%` }}
      />
    </div>
  );
}
