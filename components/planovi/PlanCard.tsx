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
      ? "bg-gradient-to-b from-primary/10 to-card border-primary shadow-[0_4px_32px_0_rgba(233,138,0,0.15)]"
      : isStarter
        ? "border-primary/30 bg-card"
        : isUltimate
          ? "border-primary/60 bg-card"
          : isSingleListing
            ? "border-border bg-card opacity-90"
            : "border-border bg-card",
    isCurrentPlan && "ring-2 ring-accent",
  ]
    .filter(Boolean)
    .join(" ");

  // Check if plan has courier delivery (any method other than "licno")
  const hasCourierDelivery = plan.allowedDeliveryMethods.some(m => m !== "licno");

  const features = [
    plan.maxListings === -1
      ? "Neograničen broj oglasa"
      : `${plan.maxListings} oglas${plan.maxListings > 1 ? "a" : ""}`,
    // Only show "Lično preuzimanje" for delivery
    plan.allowedDeliveryMethods.includes("licno") ? "Lično preuzimanje" : null,
    plan.hasBadge && plan.badgeLabel
      ? `${plan.badgeLabel} bedž`
      : null,
    plan.listingDurationDays
      ? `Trajanje: ${plan.listingDurationDays} dana`
      : null,
  ].filter(Boolean) as string[];

  const hasTopBadges = isStarter || isCurrentPlan;

  return (
    <div className={cardClasses}>
      {isStarter && (
        <div
          className={`absolute -top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white ${
            isCurrentPlan ? "left-4" : "left-1/2 -translate-x-1/2"
          }`}
        >
          Najpopularniji
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
          Vaš plan
        </div>
      )}

      <div className={`mb-4 ${hasTopBadges ? "pt-2" : ""}`}>
        <div className="flex items-center gap-2">
          {isLifetime && <Crown className="h-5 w-5 text-primary" />}
          <h3 className={`text-lg font-bold ${isSingleListing ? "text-muted-foreground" : "text-foreground"}`}>
            {plan.name}
          </h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {plan.description}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold ${isSingleListing ? "text-muted-foreground" : "text-foreground"}`}>
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
          <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            {feature}
          </li>
        ))}
        {isFree ? (
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            Kurirska dostava nije dostupna
          </li>
        ) : hasCourierDelivery ? (
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            Kurirska služba (Uskoro)
          </li>
        ) : null}
      </ul>

      {isCurrentPlan ? (
        <Button disabled className="w-full" variant="outline">
          Trenutni plan
        </Button>
      ) : (
        <Button
          asChild
          className="w-full bg-primary text-white hover:bg-primary/90"
        >
          <a href="mailto:kontakt@podeli.rs?subject=Zainteresovan/a sam za plan: ${plan.name}">
            Kontaktirajte nas
          </a>
        </Button>
      )}
    </div>
  );
}
