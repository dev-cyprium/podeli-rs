import posthog from "posthog-js";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const hasConsent =
  typeof window !== "undefined" &&
  localStorage.getItem("cookie-consent") === "all";

if (!isLocalhost && hasConsent) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    defaults: "2025-11-30",
  });
}
