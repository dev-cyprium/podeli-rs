"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "cookie-consent";

export type ConsentValue = "all" | "necessary";

export function getConsentValue(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === "all" || value === "necessary") return value;
  return null;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getConsentValue();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  function handleConsent(value: ConsentValue) {
    localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);

    // If user accepted all cookies, initialize PostHog dynamically
    if (value === "all") {
      import("posthog-js").then(({ default: posthog }) => {
        if (
          process.env.NEXT_PUBLIC_POSTHOG_KEY &&
          process.env.NEXT_PUBLIC_POSTHOG_HOST
        ) {
          posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            defaults: "2025-11-30",
          });
        }
      });
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-podeli-light p-5 shadow-xl shadow-podeli-dark/10 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="hidden flex-none rounded-xl bg-podeli-accent/10 p-2.5 sm:block">
            <Cookie className="h-5 w-5 text-podeli-accent" />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm leading-relaxed text-podeli-dark">
              Koristimo kolačiće kako bismo osigurali pravilno funkcionisanje
              platforme i poboljšali vaše iskustvo. Analitički kolačići nam
              pomažu da razumemo kako koristite sajt.{" "}
              <Link
                href="/cookie-policy"
                className="font-medium text-[#006992] underline underline-offset-2 hover:text-[#006992]/80"
              >
                Saznajte više
              </Link>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => handleConsent("all")}
                className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
              >
                Prihvatam sve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleConsent("necessary")}
              >
                Samo neophodni
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
