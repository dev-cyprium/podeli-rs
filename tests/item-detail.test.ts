import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Preloaded } from "convex/react";
import { api } from "../convex/_generated/api";
import { ItemDetailContent } from "../components/p/ItemDetailContent";
const subscription = vi.hoisted(() => ({
  item: null as Record<string, unknown> | null,
}));
vi.mock("convex/react", () => ({ usePreloadedQuery: () => subscription.item }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("../components/p/ItemImageGallery", () => ({
  ItemImageGallery: () => null,
}));
vi.mock("../components/p/ReviewsList", () => ({ ReviewsList: () => null }));
vi.mock("../components/p/FavoriteButton", () => ({
  FavoriteButton: () => null,
}));
vi.mock("../components/p/PurchaseForm", () => ({
  PurchaseForm: () => createElement("aside", null, "Purchase"),
}));
vi.mock("../components/p/BookingForm", () => ({
  BookingForm: ({
    item,
  }: {
    item: {
      pricePerDay: number;
      priceByAgreement: boolean;
      availabilitySlots: unknown[];
    };
  }) =>
    createElement(
      "aside",
      {
        "data-price": item.pricePerDay,
        "data-negotiated": item.priceByAgreement,
        "data-slots": item.availabilitySlots.length,
      },
      "Booking",
    ),
}));
const initial = {
  _id: "item",
  shortId: "bicycle",
  slug: "bicikl",
  title: "Bicikl",
  category: "Bicikli",
  description: "Stari opis",
  pricePerDay: 1000,
  priceByAgreement: false,
  images: [],
  deliveryMethods: ["licno"],
  availabilitySlots: [],
  deposit: 1000,
};
function render() {
  return renderToStaticMarkup(
    createElement(ItemDetailContent, {
      preloadedItem: {} as Preloaded<typeof api.items.getByShortId>,
      slug: "bicikl",
      ownerCard: createElement("div", null, "Vlasnik"),
    }),
  );
}
describe("reactive product details", () => {
  beforeEach(() => {
    subscription.item = initial;
  });
  it("renders the preloaded description and price for the initial HTML", () => {
    const html = render();
    expect(html).toContain("Stari opis");
    expect(html).toContain("1000 RSD");
    expect(html).toContain('data-price="1000"');
  });
  it("renders new subscription values in both details and booking form", () => {
    render();
    subscription.item = {
      ...initial,
      description: "Novi opis",
      pricePerDay: 2500,
      deposit: 5000,
      availabilitySlots: [{ startDate: "2026-10-10", endDate: "2026-10-12" }],
    };
    const html = render();
    expect(html).toContain("Novi opis");
    expect(html).not.toContain("Stari opis");
    expect(html).toContain("2500 RSD");
    expect(html).toContain("Depozit: 5000 RSD");
    expect(html).toContain('data-price="2500"');
    expect(html).toContain('data-slots="1"');
    subscription.item = { ...initial, priceByAgreement: true };
    expect(render()).toContain("Po dogovoru");
  });
  it("renders the saved public location and labels legacy listings without inventing a city", () => {
    expect(render()).toContain("Lokacija nije navedena");
    subscription.item = {
      ...initial,
      city: "Novi Sad",
      municipality: "Petrovaradin",
    };
    expect(render()).toContain("Novi Sad, Petrovaradin");
    expect(render()).not.toContain("Beograd");
  });
  it("renders sale-only and combined prices and the appropriate forms", () => {
    subscription.item = {
      ...initial,
      listingType: "sale",
      salePrice: 8000,
      pricePerDay: 0,
    };
    let html = render();
    expect(html).toContain("Prodaja: 8000 RSD");
    expect(html).toContain("Purchase");
    expect(html).not.toContain("Booking");
    expect(html).not.toContain("Depozit:");
    subscription.item = { ...initial, listingType: "both", salePrice: 8000 };
    html = render();
    expect(html).toContain("Prodaja: 8000 RSD");
    expect(html).toContain("1000 RSD");
    expect(html).toContain("Booking");
    expect(html).toContain("Purchase");
    subscription.item = {
      ...initial,
      listingType: "both",
      salePrice: 8000,
      soldAt: Date.now(),
    };
    html = render();
    expect(html).toContain("Predmet je prodat.");
    expect(html).not.toContain("Booking");
    expect(html).not.toContain("Purchase");
  });
  it("removes booking controls when the live item is deleted", () => {
    subscription.item = null;
    const html = render();
    expect(html).toContain("Predmet nije pronađen");
    expect(html).not.toContain("Booking");
  });
});
