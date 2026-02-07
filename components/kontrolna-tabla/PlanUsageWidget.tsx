"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Crown,
  AlertTriangle,
  Circle,
  Diamond,
  Gem,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const planIconMap: Record<string, LucideIcon> = {
  free: Circle,
  starter: Diamond,
  ultimate: Gem,
  lifetime: Crown,
  single_listing: Circle,
};

export function PlanUsageWidget() {
  const limits = useQuery(api.profiles.getMyPlanLimits);
  const [now] = useState(() => Date.now());

  if (limits === undefined) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="h-20 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (limits === null) return null;

  const isUnlimitedListings = limits.maxListings === -1;
  const atListingLimit =
    !isUnlimitedListings && limits.listingCount >= limits.maxListings;
  const isLifetime = limits.planSlug === "lifetime";
  const isTopTier = isLifetime || limits.planSlug === "ultimate";
  const isSingleListing = limits.planSlug === "single_listing";
  const Icon = planIconMap[limits.planSlug] ?? Circle;

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
    <Card
      className={cn(
        "overflow-hidden",
        isTopTier && "border-[#f0a202]/20"
      )}
    >
      {isTopTier && (
        <div className="h-1 w-full bg-gradient-to-r from-[#f0a202]/60 via-[#f0a202] to-[#f0a202]/60" />
      )}
      <CardContent className="py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Plan identity */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
                isTopTier
                  ? "bg-[#f0a202]/15"
                  : "bg-[#f0a202]/10"
              )}
            >
              <Icon
                className={cn(
                  "text-[#f0a202]",
                  isTopTier ? "h-5 w-5 sm:h-6 sm:w-6" : "h-5 w-5"
                )}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Tvoj plan je
              </p>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-[#02020a] sm:text-lg">
                  {limits.planName}
                </p>
                {limits.hasBadge && limits.badgeLabel && (
                  <span className="rounded-full bg-[#f0a202] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {limits.badgeLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Upgrade button */}
          {!isTopTier && (
            <Button
              asChild
              size="sm"
              className="gap-1.5 bg-[#f0a202] text-white hover:bg-[#f0a202]/90"
            >
              <Link href="/planovi">
                Nadogradite
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>

        {/* Usage stats */}
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Oglasi: {limits.listingCount}
              {isUnlimitedListings ? " / ∞" : ` / ${limits.maxListings}`}
            </span>
            {atListingLimit && (
              <span className="flex items-center gap-1 font-medium text-[#f0a202]">
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

          {isSingleListing && daysRemaining !== null && (
            <p className="text-xs text-muted-foreground">
              {daysRemaining > 0
                ? `Preostalo dana: ${daysRemaining}`
                : "Oglas je istekao"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
