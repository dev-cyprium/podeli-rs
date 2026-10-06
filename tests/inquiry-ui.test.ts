import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Doc } from "../convex/_generated/dataModel";
import { PurchaseForm } from "../components/p/PurchaseForm";
import { ItemWizardForm } from "../components/kontrolna-tabla/predmeti/ItemWizardForm";
import { RenterBookingCard } from "../components/kontrolna-tabla/zakupi/RenterBookingCard";
import { BookingActions } from "../components/kontrolna-tabla/predmeti/incoming/BookingActions";
vi.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => vi.fn(),
}));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ isSignedIn: true }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
const item = {
  _id: "item",
  title: "Bušilica",
  shortId: "short",
  slug: "busilica",
  category: "Alati",
  description: "Očuvana",
  pricePerDay: 0,
  listingType: "sale",
  salePrice: 5000,
  images: [],
  availabilitySlots: [],
  deliveryMethods: ["licno"],
} as unknown as Doc<"items">;
const booking = {
  _id: "booking",
  itemId: "item",
  renterId: "buyer",
  ownerId: "owner",
  startDate: "2026-10-07",
  endDate: "2026-10-08",
  totalDays: 2,
  totalPrice: 2000,
  status: "cancelled",
  inquiryResponse: {
    decision: "rejected",
    text: "Nije slobodno u tom terminu.",
    respondedAt: Date.now(),
  },
  item,
} as unknown as Doc<"bookings"> & { item: Doc<"items"> };
describe("inquiry UI", () => {
  it("offers a purchase without calendar or delivery dates", () => {
    const html = renderToStaticMarkup(createElement(PurchaseForm, { item }));
    expect(html).toContain("5000 RSD");
    expect(html).toContain("Pošalji upit za kupovinu");
    expect(html).toContain("Kupovina ne zahteva datume");
    expect(html).not.toContain("Izaberite period");
  });
  it("exposes sale type and price in the listing editor without rental prices", () => {
    const html = renderToStaticMarkup(
      createElement(ItemWizardForm, { item, onSave: vi.fn() }),
    );
    expect(html).toContain("Vrsta oglasa");
    expect(html).toContain("Prodajna cena (RSD)");
    expect(html).toContain('value="sale" selected');
    expect(html).not.toContain("Cena po danu (RSD)");
  });
  it("shows rejection and support to renters and the same response to suppliers", () => {
    const renterHtml = renderToStaticMarkup(
      createElement(RenterBookingCard, { booking }),
    );
    const supplierHtml = renderToStaticMarkup(
      createElement(BookingActions, { booking }),
    );
    expect(renterHtml).toContain("Odbijeno");
    expect(renterHtml).toContain(booking.inquiryResponse!.text);
    expect(supplierHtml).toContain(booking.inquiryResponse!.text);
    expect(renterHtml).toContain("mailto:kontakt@podeli.rs?subject=");
    expect(renterHtml).not.toContain("Otkazano");
  });
});
