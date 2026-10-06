import type { PostHogConfig } from "posthog-js";
import { redactOfferLinks } from "./offer-privacy";

export const posthogOptions: Partial<PostHogConfig> = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
  defaults: "2025-11-30",
  before_send: (event) => redactOfferLinks(event),
};
