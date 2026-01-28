"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, AlertTriangle } from "lucide-react";

export function PlanUsageWidget() {
  const limits = useQuery(api.profiles.getMyPlanLimits);
  const [now] = useState(() => Date.now());

  if (limits === undefined) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="h-16 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (limits === null) return null;

  const isUnlimitedListings = limits.maxListings === -1;
  const atListingLimit =
    !isUnlimitedListings && limits.listingCount >= limits.maxListings;
  const isLifetime = limits.planSlug === "lifetime";
  const isSingleListing = limits.planSlug === "single_listing";

  // Calculate days remaining for single listing
  let daysRemaining: number | null = null;
  if (isSingleListing && limits.planExpiresAt) {
    daysRemaining = Math.max(
      0,
      Math.ceil((limits.planExpiresAt - now) / (1000 * 60 * 60 * 24))
    );
  }

  const listingProgress = isUnlimitedListings
    ? 0
    : (limits.listingCount / limits.maxListings) * 100;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              {isLifetime && (
                <Crown className="h-4 w-4 text-[#f0a202]" />
              )}
              <span className="text-sm font-semibold text-[#02020a]">
                {limits.planName}
              </span>
              {limits.hasBadge && limits.badgeLabel && (
                <span className="rounded-full bg-gradient-to-r from-[#f0a202] to-[#f0a202]/80 px-2 py-0.5 text-[10px] font-bold text-white">
                  {limits.badgeLabel}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Oglasi: {limits.listingCount}
                  {isUnlimitedListings ? " / ∞" : ` / ${limits.maxListings}`}
                </span>
                {atListingLimit && (
                  <span className="flex items-center gap-1 text-[#f0a202]">
                    <AlertTriangle className="h-3 w-3" />
                    Limit dostignut
                  </span>
                )}
              </div>
              {!isUnlimitedListings && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#f0a202] transition-all"
                    style={{ width: `${Math.min(listingProgress, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {isSingleListing && daysRemaining !== null && (
              <div className="text-xs text-muted-foreground">
                {daysRemaining > 0
                  ? `Preostalo dana: ${daysRemaining}`
                  : "Oglas je istekao"}
              </div>
            )}
          </div>

          {!isLifetime && limits.planSlug !== "ultimate" && (
            <Button
              asChild
              size="sm"
              className="bg-[#f0a202] text-white hover:bg-[#f0a202]/90"
            >
              <Link href="/planovi">Nadogradite</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
