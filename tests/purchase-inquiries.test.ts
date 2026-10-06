import { convexTest } from "convex-test";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.{ts,tsx}");
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-06T10:00:00Z"));
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
async function setup(type: "rent" | "sale" | "both" = "both", emails = false) {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner" });
  const buyer = t.withIdentity({ subject: "buyer" });
  const other = t.withIdentity({ subject: "other" });
  const images = await t.run(async (ctx) => {
    const planId = await ctx.db.insert("plans", {
      slug: "free",
      name: "Free",
      description: "",
      maxListings: -1,
      maxActiveRentals: -1,
      allowedDeliveryMethods: ["licno"],
      hasBadge: false,
      priceAmount: 0,
      priceCurrency: "RSD",
      priceInterval: "mesečno",
      isSubscription: false,
      order: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    for (const userId of ["owner", "buyer", "other"]) {
      await ctx.db.insert("profiles", {
        userId,
        planId,
        planSlug: "free",
        planActivatedAt: 0,
        hasBadge: false,
        email: `${userId}@example.com`,
        preferredContactTypes: ["chat"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("notificationPreferences", {
        userId,
        emailOnBookingRequest: emails,
        emailOnNewMessage: emails,
        emailOnInquiryResponse: emails,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    return [
      await ctx.storage.store(new Blob(["photo"], { type: "image/png" })),
    ];
  });
  const input = {
    title: "Bušilica",
    description: "Očuvana",
    category: "Alati",
    listingType: type,
    salePrice: type === "rent" ? undefined : 5000,
    pricePerDay: type === "sale" ? 0 : 1000,
    images,
    availabilitySlots:
      type === "sale"
        ? []
        : [{ startDate: "2026-10-06", endDate: "2026-10-31" }],
    deliveryMethods: ["licno" as const],
  };
  const itemId = await owner.mutation(api.items.create, input);
  return { t, owner, buyer, other, itemId, input };
}
const queryInput = { paginationOpts: { cursor: null, numItems: 20 } };
const rental = (itemId: Awaited<ReturnType<typeof setup>>["itemId"]) => ({
  itemId,
  startDate: "2026-10-07",
  endDate: "2026-10-08",
  deliveryMethod: "licno",
});
async function scheduled(t: Awaited<ReturnType<typeof setup>>["t"]) {
  return t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
}
describe("sales and inquiry lifecycle", () => {
  it("creates sale-only listings without dates, filters offers and prevents rental requests", async () => {
    const { t, buyer, itemId } = await setup("sale");
    expect(
      (
        await t.query(api.items.searchItems, {
          ...queryInput,
          listingType: "sale",
        })
      ).page,
    ).toHaveLength(1);
    expect(
      (
        await t.query(api.items.searchItems, {
          ...queryInput,
          listingType: "rent",
        })
      ).page,
    ).toHaveLength(0);
    expect(
      (
        await t.query(api.items.searchItems, {
          ...queryInput,
          query: "Bušilica",
          listingType: "sale",
        })
      ).page,
    ).toHaveLength(1);
    await expect(
      buyer.mutation(api.bookings.createBooking, rental(itemId)),
    ).rejects.toThrow("iznajmljivanje");
    await buyer.mutation(api.purchases.create, {
      itemId,
      question: "Kada mogu da preuzmem?",
    });
  });
  it("keeps legacy rental listings and rejects missing/invalid sale prices", async () => {
    const { t, owner, buyer, input, itemId } = await setup("rent");
    await t.run((ctx) => ctx.db.patch(itemId, { listingType: undefined }));
    expect(
      (
        await t.query(api.items.searchItems, {
          ...queryInput,
          listingType: "rent",
        })
      ).page,
    ).toHaveLength(1);
    await expect(
      buyer.mutation(api.purchases.create, { itemId, question: "Kupovina?" }),
    ).rejects.toThrow("prodaju");
    for (const salePrice of [undefined, 0, -1]) {
      await expect(
        owner.mutation(api.items.update, {
          ...input,
          id: itemId,
          listingType: "both",
          salePrice,
        }),
      ).rejects.toThrow("Prodajna cena");
    }
  });
  it("allows only the supplier to respond, exposes the same response to both parties and prevents duplicate notifications", async () => {
    const { t, owner, buyer, other, itemId } = await setup("both", true);
    const id = await buyer.mutation(api.purchases.create, {
      itemId,
      question: "Može preuzimanje sutra?",
    });
    await expect(
      buyer.mutation(api.purchases.create, { itemId, question: "Ponovo" }),
    ).rejects.toThrow("otvoren upit");
    await expect(
      other.mutation(api.purchases.respond, {
        id,
        decision: "accepted",
        response: "Da",
      }),
    ).rejects.toThrow("ponuđač");
    await expect(
      owner.mutation(api.purchases.respond, {
        id,
        decision: "accepted",
        response: " ",
      }),
    ).rejects.toThrow("tekst");
    await owner.mutation(api.purchases.respond, {
      id,
      decision: "accepted",
      response: "Da, javite se na preuzimanju.",
    });
    const received = await buyer.query(api.purchases.listMine, {
      role: "buyer",
    });
    const sent = await owner.query(api.purchases.listMine, { role: "owner" });
    expect(received[0]).toEqual(sent[0]);
    expect(received[0]).toMatchObject({
      status: "accepted",
      response: "Da, javite se na preuzimanju.",
      salePrice: 5000,
    });
    expect(
      await other.query(api.purchases.listMine, { role: "buyer" }),
    ).toHaveLength(0);
    await expect(
      owner.mutation(api.purchases.respond, {
        id,
        decision: "accepted",
        response: "Da",
      }),
    ).rejects.toThrow("već ima odgovor");
    expect(await scheduled(t)).toHaveLength(2);
    expect(
      await t.run((ctx) => ctx.db.query("notifications").collect()),
    ).toHaveLength(2);
  });
  it("protects accepted rentals and allows a sale after rental completion", async () => {
    const { t, owner, buyer, itemId, input } = await setup();
    const bookingId = await buyer.mutation(
      api.bookings.createBooking,
      rental(itemId),
    );
    await owner.mutation(api.bookings.approveBooking, { id: bookingId });
    const id = await buyer.mutation(api.purchases.create, {
      itemId,
      question: "Kupovina?",
    });
    await owner.mutation(api.purchases.respond, {
      id,
      decision: "accepted",
      response: "Da, nakon povratka.",
    });
    await expect(
      owner.mutation(api.items.update, {
        ...input,
        id: itemId,
        listingType: "sale",
        availabilitySlots: [],
      }),
    ).rejects.toThrow("prihvaćene rezervacije");
    await expect(
      buyer.mutation(api.purchases.recordOutcome, { id, purchased: true }),
    ).rejects.toThrow("prihvaćene rezervacije");
    expect((await t.run((ctx) => ctx.db.get(bookingId)))?.status).toBe(
      "confirmed",
    );
    await t.run((ctx) => ctx.db.patch(bookingId, { status: "vracen" }));
    await buyer.mutation(api.purchases.recordOutcome, { id, purchased: true });
    expect((await t.run((ctx) => ctx.db.get(bookingId)))?.status).toBe(
      "vracen",
    );
    expect((await t.run((ctx) => ctx.db.get(itemId)))?.soldAt).toBeDefined();
    expect(
      (await t.query(api.items.searchItems, queryInput)).page,
    ).toHaveLength(0);
    expect(await t.query(api.items.listAll, {})).toHaveLength(0);
    await expect(
      buyer.mutation(api.bookings.createBooking, rental(itemId)),
    ).rejects.toThrow("iznajmljivanje");
  });
  it("serializes sale completion against approval of a pending rental", async () => {
    const { t, owner, buyer, other, itemId } = await setup();
    const bookingId = await other.mutation(
      api.bookings.createBooking,
      rental(itemId),
    );
    const id = await buyer.mutation(api.purchases.create, {
      itemId,
      question: "Kupujem",
    });
    await owner.mutation(api.purchases.respond, {
      id,
      decision: "accepted",
      response: "Dogovoreno",
    });
    const results = await Promise.allSettled([
      buyer.mutation(api.purchases.recordOutcome, { id, purchased: true }),
      owner.mutation(api.bookings.approveBooking, { id: bookingId }),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const item = await t.run((ctx) => ctx.db.get(itemId));
    const booking = await t.run((ctx) => ctx.db.get(bookingId));
    expect(item?.soldAt !== undefined && booking?.status === "confirmed").toBe(
      false,
    );
    expect(["pending", "confirmed"]).toContain(booking?.status);
  });
  it("records non-purchase without withdrawing the listing and limits outcome writes to the buyer", async () => {
    const { t, owner, buyer, itemId } = await setup();
    const id = await buyer.mutation(api.purchases.create, {
      itemId,
      question: "Kupovina?",
    });
    await expect(
      buyer.mutation(api.purchases.recordOutcome, { id, purchased: true }),
    ).rejects.toThrow("prihvaćenog");
    await owner.mutation(api.purchases.respond, {
      id,
      decision: "accepted",
      response: "Da",
    });
    await expect(
      owner.mutation(api.purchases.recordOutcome, { id, purchased: false }),
    ).rejects.toThrow("kupac");
    await buyer.mutation(api.purchases.recordOutcome, { id, purchased: false });
    expect((await t.run((ctx) => ctx.db.get(itemId)))?.soldAt).toBeUndefined();
    expect(
      (await buyer.query(api.purchases.listMine, { role: "buyer" }))[0].status,
    ).toBe("not_purchased");
    await buyer.mutation(api.purchases.create, {
      itemId,
      question: "Predomislio sam se",
    });
  });
  it("rejects competing open inquiries when sold and does not notify twice on outcome retries", async () => {
    const { t, owner, buyer, other, itemId } = await setup();
    const id = await buyer.mutation(api.purchases.create, {
      itemId,
      question: "Kupujem",
    });
    const competing = await other.mutation(api.purchases.create, {
      itemId,
      question: "I ja",
    });
    await owner.mutation(api.purchases.respond, {
      id,
      decision: "accepted",
      response: "Dogovoreno",
    });
    await buyer.mutation(api.purchases.recordOutcome, { id, purchased: true });
    expect((await t.run((ctx) => ctx.db.get(competing)))?.status).toBe(
      "rejected",
    );
    const before = await t.run((ctx) =>
      ctx.db.query("notifications").collect(),
    );
    await expect(
      buyer.mutation(api.purchases.recordOutcome, { id, purchased: true }),
    ).rejects.toThrow();
    expect(
      await t.run((ctx) => ctx.db.query("notifications").collect()),
    ).toHaveLength(before.length);
    expect(await scheduled(t)).toHaveLength(0);
    await expect(
      other.mutation(api.purchases.create, { itemId, question: "Ponovo" }),
    ).rejects.toThrow("prodaju");
  });
  it("uses the response preference independently from the new-request preference", async () => {
    const { t, owner, buyer, itemId } = await setup("sale", true);
    await buyer.mutation(api.notificationPreferences.updatePreferences, {
      emailOnInquiryResponse: false,
    });
    const id = await buyer.mutation(api.purchases.create, {
      itemId,
      question: "Dostupno?",
    });
    await owner.mutation(api.purchases.respond, {
      id,
      decision: "accepted",
      response: "Da",
    });
    expect(await scheduled(t)).toHaveLength(1);
    expect(
      await t.run((ctx) => ctx.db.query("notifications").collect()),
    ).toHaveLength(2);
    expect(
      await buyer.query(api.notificationPreferences.getMyPreferences),
    ).toMatchObject({
      emailOnBookingRequest: true,
      emailOnInquiryResponse: false,
    });
  });
  it("sends in-app responses while disabled email preferences prevent scheduled email", async () => {
    const { t, owner, buyer, itemId } = await setup();
    const id = await buyer.mutation(api.purchases.create, {
      itemId,
      question: "Prodaja?",
    });
    await owner.mutation(api.purchases.respond, {
      id,
      decision: "rejected",
      response: "Nije dostupno.",
    });
    expect(await scheduled(t)).toHaveLength(0);
    expect(
      await t.run((ctx) => ctx.db.query("notifications").collect()),
    ).toHaveLength(2);
  });
});
describe("rental responses and message notifications", () => {
  it.each(["approveBooking", "rejectBooking"] as const)(
    "persists %s responses for both parties once",
    async (action) => {
      const { t, owner, buyer, itemId } = await setup("rent", true);
      const id = await buyer.mutation(
        api.bookings.createBooking,
        rental(itemId),
      );
      await expect(
        buyer.mutation(api.bookings.createBooking, rental(itemId)),
      ).rejects.toThrow("otvoren zahtev");
      await owner.mutation(api.bookings[action], {
        id,
        response: "Odgovor ponuđača.",
      });
      expect(
        (await buyer.query(api.bookings.getBookingsAsRenter, {}))[0]
          .inquiryResponse?.text,
      ).toBe("Odgovor ponuđača.");
      expect(
        (await owner.query(api.bookings.getBookingsAsOwner, {}))[0]
          .inquiryResponse?.text,
      ).toBe("Odgovor ponuđača.");
      await expect(
        owner.mutation(api.bookings[action], { id }),
      ).rejects.toThrow();
      expect(await scheduled(t)).toHaveLength(2);
    },
  );
  it("sends a single email for unread messages and honors recipient preferences for nudges", async () => {
    const { t, owner, buyer, itemId } = await setup("rent", true);
    const id = await buyer.mutation(api.bookings.createBooking, rental(itemId));
    await owner.mutation(api.bookings.approveBooking, { id });
    await owner.mutation(api.messages.sendMessage, {
      bookingId: id,
      content: "Prva",
    });
    await owner.mutation(api.messages.sendMessage, {
      bookingId: id,
      content: "Druga",
    });
    expect(await scheduled(t)).toHaveLength(3);
    expect(
      await owner.mutation(api.messages.sendEmailNudge, { bookingId: id }),
    ).toBe(false);
    // The return validator must allow email-delivery metadata on messages.
    expect(
      await buyer.query(api.messages.getMessagesForBooking, { bookingId: id }),
    ).toHaveLength(2);
    await buyer.mutation(api.messages.markMessagesAsRead, { bookingId: id });
    vi.advanceTimersByTime(61_000);
    await buyer.mutation(api.notificationPreferences.updatePreferences, {
      emailOnNewMessage: false,
    });
    await owner.mutation(api.messages.sendMessage, {
      bookingId: id,
      content: "Treća",
    });
    expect(
      await owner.mutation(api.messages.sendEmailNudge, { bookingId: id }),
    ).toBe(false);
    expect(await scheduled(t)).toHaveLength(3);
    await buyer.mutation(api.notificationPreferences.updatePreferences, {
      emailOnNewMessage: true,
    });
    vi.advanceTimersByTime(3_600_000);
    await expect(
      owner.mutation(api.messages.sendEmailNudge, { bookingId: id }),
    ).resolves.toBe(true);
    expect(
      await owner.mutation(api.messages.sendEmailNudge, { bookingId: id }),
    ).toBe(false);
  });
});
