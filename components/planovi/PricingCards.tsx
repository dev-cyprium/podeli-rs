"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PlanCard } from "./PlanCard";

export function PricingCards() {
  const plans = useQuery(api.plans.list);
  const profile = useQuery(api.profiles.getMyProfile);

  if (plans === undefined) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-96 animate-pulse rounded-2xl border border-border bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-12 text-center shadow-sm">
        <p className="text-muted-foreground">
          Planovi trenutno nisu dostupni.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {plans.map((plan) => (
        <PlanCard
          key={plan._id}
          plan={plan}
          isCurrentPlan={profile?.planSlug === plan.slug}
        />
      ))}
    </div>
  );
}
