"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Check, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanCardProps {
  plan: Doc<"plans">;
  isCurrentPlan: boolean;
}

const DELIVERY_LABELS: Record<string, string> = {
  licno: "Lično preuzimanje",
  glovo: "Glovo",
  wolt: "Wolt",
  cargo: "Cargo",
};

export function PlanCard({ plan, isCurrentPlan }: PlanCardProps) {
  const isLifetime = plan.slug === "lifetime";
  const isStarter = plan.slug === "starter";
  const isUltimate = plan.slug === "ultimate";
  const isSingleListing = plan.slug === "single_listing";
  const isFree = plan.slug === "free";

  const cardClasses = [
    "relative flex flex-col rounded-2xl border p-6 transition-all",
    isLifetime
      ? "bg-gradient-to-b from-[#f0a202]/10 to-[#f8f7ff] border-[#f0a202] shadow-[0_4px_32px_0_rgba(240,162,2,0.15)]"
      : isStarter
        ? "border-[#f0a202]/30 bg-[#f8f7ff]"
        : isUltimate
          ? "border-[#f0a202]/60 bg-[#f8f7ff]"
          : isSingleListing
            ? "border-border bg-[#f8f7ff] opacity-90"
            : "border-border bg-[#f8f7ff]",
    isCurrentPlan && "ring-2 ring-[#006992]",
  ]
    .filter(Boolean)
    .join(" ");

  const features = [
    plan.maxListings === -1
      ? "Neograničen broj oglasa"
      : `${plan.maxListings} oglas${plan.maxListings > 1 ? "a" : ""}`,
    ...plan.allowedDeliveryMethods.map(
      (m) => DELIVERY_LABELS[m] ?? m
    ),
    plan.hasBadge && plan.badgeLabel
      ? `${plan.badgeLabel} bedž`
      : null,
    plan.listingDurationDays
      ? `Trajanje: ${plan.listingDurationDays} dana`
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className={cardClasses}>
      {isStarter && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#f0a202] px-3 py-1 text-xs font-bold text-white">
          Najpopularniji
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4 rounded-full bg-[#006992] px-3 py-1 text-xs font-bold text-white">
          Vaš plan
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-2">
          {isLifetime && <Crown className="h-5 w-5 text-[#f0a202]" />}
          <h3 className={`text-lg font-bold ${isSingleListing ? "text-muted-foreground" : "text-[#02020a]"}`}>
            {plan.name}
          </h3>
        </div>
        <p className={`mt-1 text-sm ${isSingleListing ? "text-muted-foreground" : "text-muted-foreground"}`}>
          {plan.description}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold ${isSingleListing ? "text-muted-foreground" : "text-[#02020a]"}`}>
            {plan.priceAmount === 0 ? "Besplatno" : `${plan.priceAmount}`}
          </span>
          {plan.priceAmount > 0 && (
            <span className="text-sm text-muted-foreground">
              {plan.priceCurrency} / {plan.priceInterval}
            </span>
          )}
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-[#02020a]">
            <Check className="h-4 w-4 shrink-0 text-[#f0a202]" />
            {feature}
          </li>
        ))}
        {isFree && (
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            Kurirska dostava nije dostupna
          </li>
        )}
      </ul>

      {isCurrentPlan ? (
        <Button disabled className="w-full" variant="outline">
          Trenutni plan
        </Button>
      ) : (
        <Button
          asChild
          className={
            isLifetime || isStarter
              ? "w-full bg-[#f0a202] text-white hover:bg-[#f0a202]/90"
              : "w-full bg-[#02020a] text-white hover:bg-[#02020a]/90"
          }
        >
          <a href="mailto:kontakt@podeli.rs?subject=Zainteresovan/a sam za plan: ${plan.name}">
            Kontaktirajte nas
          </a>
        </Button>
      )}
    </div>
  );
}
