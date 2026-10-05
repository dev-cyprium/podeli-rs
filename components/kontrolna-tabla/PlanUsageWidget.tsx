"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";

export function PlanUsageWidget() {
  const limits = useQuery(api.profiles.getMyPlanLimits);
  return (
    <Card>
      <CardContent className="py-5">
        <p className="font-semibold text-podeli-dark">
          Objavljivanje je besplatno
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Bez pretplate i komercijalnog limita oglasa. Do 10 fotografija po
          predmetu.
        </p>
        {limits && (
          <p className="mt-3 text-sm text-muted-foreground">
            Vaši oglasi: {limits.listingCount}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
