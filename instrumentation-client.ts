import posthog from "posthog-js";
import { posthogOptions } from "./lib/posthog-options";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const hasConsent =
  typeof window !== "undefined" &&
  localStorage.getItem("cookie-consent") === "all";

if (!isLocalhost && hasConsent) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, posthogOptions);
}
