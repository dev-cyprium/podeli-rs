"use client";

import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgreementStatusProps {
  renterAgreed?: boolean;
  ownerAgreed?: boolean;
  isOwner: boolean;
  className?: string;
}

export function AgreementStatus({
  renterAgreed,
  ownerAgreed,
  isOwner,
  className,
}: AgreementStatusProps) {
  const myAgreed = isOwner ? ownerAgreed : renterAgreed;
  const otherAgreed = isOwner ? renterAgreed : ownerAgreed;
  const otherLabel = isOwner ? "Zakupac" : "Vlasnik";
  const myLabel = isOwner ? "Vi (vlasnik)" : "Vi (zakupac)";

  return (
    <div className={cn("flex items-center gap-3 text-xs", className)}>
      <div className="flex items-center gap-1">
        {myAgreed ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Clock className="h-3 w-3 text-amber-500" />
        )}
        <span className={myAgreed ? "text-green-600" : "text-amber-600"}>
          {myLabel}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {otherAgreed ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Clock className="h-3 w-3 text-amber-500" />
        )}
        <span className={otherAgreed ? "text-green-600" : "text-amber-600"}>
          {otherLabel}
        </span>
      </div>
    </div>
  );
}
