"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Doc } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { PlanCard } from "./PlanCard";
import { RedeemCodeModal } from "./RedeemCodeModal";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";

interface PricingCardsProps {
  plans: Doc<"plans">[];
}

export function PricingCards({ plans }: PricingCardsProps) {
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const profile = useQuery(api.profiles.getMyProfile);

  if (plans.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-12 text-center shadow-sm">
        <p className="text-muted-foreground">
          Planovi trenutno nisu dostupni.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <p className="text-sm text-muted-foreground">
          Imate promotivni kod?
        </p>
        <Button
          type="button"
          variant="outline"
          className="gap-2 border-[#006992]/30 text-[#006992] hover:bg-[#006992]/10"
          onClick={() => setRedeemModalOpen(true)}
        >
          <Ticket className="h-4 w-4" />
          Unesi kod
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {plans.map((plan) => (
          <PlanCard
            key={plan._id}
            plan={plan}
            isCurrentPlan={profile?.planSlug === plan.slug}
          />
        ))}
      </div>

      <RedeemCodeModal open={redeemModalOpen} onOpenChange={setRedeemModalOpen} />
    </>
  );
}
