import { describe, expect, it } from "vitest";
import { redactOfferLinks, redactOfferUrl } from "../lib/offer-privacy";

describe("private offer links in analytics", () => {
  it("redacts ordinary URLs, authentication redirects and replay snapshots without mutating the original", () => {
    const token = "a".repeat(64);
    const url = `https://podeli.rs/ponuda/${token}`;
    const event = {
      properties: {
        $current_url: url,
        $referrer: url,
        snapshots: [{ href: url }],
        token,
      },
    };
    const safe = redactOfferLinks(event);
    expect(JSON.stringify(safe)).not.toContain(token);
    expect(event.properties.$current_url).toBe(url);
    expect(
      redactOfferUrl(`/sign-up?redirect_url=${encodeURIComponent(url)}`),
    ).not.toContain(token);
    expect(redactOfferUrl("https://podeli.rs/pretraga")).toBe(
      "https://podeli.rs/pretraga",
    );
    expect(redactOfferLinks(null)).toBeNull();
  });
});
