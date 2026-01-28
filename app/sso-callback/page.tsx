"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-podeli-light">
      <div id="clerk-captcha" />
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
