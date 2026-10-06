"use client";

import { Analytics } from "@vercel/analytics/next";
import { redactOfferUrl } from "@/lib/offer-privacy";

export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => ({ ...event, url: redactOfferUrl(event.url) })}
    />
  );
}
