"use client";

import { Clock } from "lucide-react";

interface PendingActionBannerProps {
  count: number;
}

export function PendingActionBanner({ count }: PendingActionBannerProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-[#f0a202]/10 px-4 py-3">
      <Clock className="h-4 w-4 shrink-0 text-[#f0a202]" />
      <span className="text-sm font-medium text-[#02020a]">
        {count} {count === 1 ? "zahtev čeka" : "zahteva čekaju"} vaše
        odobrenje
      </span>
    </div>
  );
}
