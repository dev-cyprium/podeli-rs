"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * When Clerk uses hash routing (e.g. from SignInButton modal), after sign-up/sign-in
 * it redirects to /#/sso-callback?... so the path stays "/" and Next.js serves
 * the home page. The /sso-callback page (and AuthenticateWithRedirectCallback)
 * never runs, so the session isn't established until the user clicks "Prijavi se" again.
 *
 * This component detects /#/sso-callback and redirects to /sso-callback?<query>
 * so the callback page runs and completes the session in one go.
 */
export function SSOCallbackHashRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (pathname !== "/" || !hash.startsWith("#/sso-callback")) return;

    const queryStart = hash.indexOf("?");
    const search = queryStart !== -1 ? hash.slice(queryStart) : "";
    window.location.replace(`/sso-callback${search}`);
  }, [pathname]);

  return null;
}
