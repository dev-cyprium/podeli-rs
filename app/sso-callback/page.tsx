"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-podeli-light">
      <div id="clerk-captcha" />
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-podeli-accent border-t-transparent"
        aria-hidden
      />
      <p className="text-sm font-medium text-podeli-dark">Prijavljivanje...</p>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
