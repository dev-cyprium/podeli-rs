import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";

const modules = import.meta.glob("../convex/**/*.{ts,tsx}");
const now = new Date("2026-10-05T10:00:00Z");
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());

async function setup(planSlug = "free", negotiated = false) {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner" });
  const renter = t.withIdentity({ subject: "renter" });
  const image = await t.run(async (ctx) => {
    const planId = await ctx.db.insert("plans", {
      slug: planSlug,
      name: "Legacy",
      description: "Legacy restricted plan",
      maxListings: 1,
      maxActiveRentals: 1,
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
    for (const userId of ["owner", "renter"]) {
      await ctx.db.insert("profiles", {
        userId,
        planId,
        planSlug,
        planActivatedAt: 0,
        planExpiresAt: 1,
        hasBadge: false,
        preferredContactTypes: ["chat"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    return ctx.storage.store(new Blob(["photo"], { type: "image/png" }));
  });
  const input = {
    title: "Mašina za čišćenje",
    description: "Oprema sa uputstvom",
    category: "Alati",
    pricePerDay: negotiated ? 0 : 1200,
    priceByAgreement: negotiated,
    images: [image],
    availabilitySlots: [{ startDate: "2026-10-05", endDate: "2026-10-31" }],
    deliveryMethods: ["licno" as const],
  };
  const itemId = await owner.mutation(api.items.create, input);
  return { t, owner, renter, input, itemId };
}

const request = (
  itemId: Awaited<ReturnType<typeof setup>>["itemId"],
  startDate = "2026-10-06",
  endDate = "2026-10-08",
) => ({ itemId, startDate, endDate, deliveryMethod: "licno" });

describe("free supplier posting", () => {
  it("preserves all ten stored photos during a listing edit and rejects an eleventh", async () => {
    const { t, owner, input, itemId } = await setup();
    const images = [...input.images];
    for (let i = 0; i < 9; i++) {
      images.push(
        await t.run((ctx) =>
          ctx.storage.store(new Blob([`photo ${i}`], { type: "image/png" })),
        ),
      );
    }
    await owner.mutation(api.items.update, { ...input, id: itemId, images });
    await owner.mutation(api.items.update, {
      ...input,
      id: itemId,
      images,
      title: "Ažuriran opis mašine",
    });
    expect((await t.run((ctx) => ctx.db.get(itemId)))?.images).toEqual(images);
    for (const id of images)
      expect(await t.run((ctx) => ctx.storage.getUrl(id))).not.toBeNull();
    await expect(
      owner.mutation(api.items.update, {
        ...input,
        id: itemId,
        images: [...images, images[0]],
      }),
    ).rejects.toThrow("10 fotografija");
  });
  it("keeps contact preferences required even without a commercial plan gate", async () => {
    const { t, owner, input } = await setup();
    await t.run(async (ctx) => {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", "owner"))
        .first();
      await ctx.db.patch(profile!._id, { preferredContactTypes: [] });
    });
    vi.advanceTimersByTime(10_000);
    await expect(owner.mutation(api.items.create, input)).rejects.toThrow(
      "način kontakta",
    );
  });
  it.each(["free", "single", "starter"])(
    "ignores legacy %s caps/expiry but keeps anti-spam",
    async (slug) => {
      const { t, owner, input, itemId } = await setup(slug);
      await expect(owner.mutation(api.items.create, input)).rejects.toThrow(
        "10 sekundi",
      );
      vi.advanceTimersByTime(10_000);
      await owner.mutation(api.items.create, input);
      expect(await owner.query(api.items.listMine)).toHaveLength(2);
      expect(
        (await owner.query(api.profiles.getMyPlanLimits))?.maxListings,
      ).toBe(-1);
      await t.run(async (ctx) => {
        await ctx.db.patch(itemId, { singleListingExpiresAt: 1 });
      });
      expect(await t.query(api.items.listAll, {})).toHaveLength(2);
      const item = await t.run((ctx) => ctx.db.get(itemId));
      expect(
        await t.query(api.items.getByShortId, { shortId: item!.shortId! }),
      ).not.toBeNull();
    },
  );
  it("requires identity and rejects invalid availability rather than dropping it", async () => {
    const { t, owner, input } = await setup();
    vi.advanceTimersByTime(10_000);
    await expect(t.mutation(api.items.create, input)).rejects.toThrow(
      "prijavljeni",
    );
    await expect(
      owner.mutation(api.items.create, {
        ...input,
        availabilitySlots: [{ startDate: "2026-02-29", endDate: "2026-03-01" }],
      }),
    ).rejects.toThrow("važeće datume");
  });
});

describe("booking requests and approval", () => {
  it("completes request, chat, mutual agreement, pickup and return with two identities", async () => {
    const { t, owner, renter, itemId } = await setup();
    const id = await renter.mutation(
      api.bookings.createBooking,
      request(itemId),
    );
    await expect(
      renter.mutation(api.messages.sendMessage, {
        bookingId: id,
        content: "Dogovor?",
      }),
    ).rejects.toThrow("nisu dozvoljene");
    await owner.mutation(api.bookings.approveBooking, { id });
    await owner.mutation(api.messages.sendMessage, {
      bookingId: id,
      content: "Preuzimanje u 10h, 3600 RSD, bez depozita.",
    });
    await renter.mutation(api.messages.sendMessage, {
      bookingId: id,
      content: "Važi.",
    });
    await owner.mutation(api.bookings.agreeToBooking, { id });
    expect((await t.run((ctx) => ctx.db.get(id)))?.status).toBe("confirmed");
    await renter.mutation(api.bookings.agreeToBooking, { id });
    expect((await t.run((ctx) => ctx.db.get(id)))?.status).toBe(
      "nije_isporucen",
    );
    await expect(
      renter.mutation(api.bookings.markAsDelivered, { id }),
    ).rejects.toThrow("vlasnik");
    await owner.mutation(api.bookings.markAsDelivered, { id });
    await owner.mutation(api.bookings.markAsReturned, { id });
    expect((await t.run((ctx) => ctx.db.get(id)))?.status).toBe("vracen");
    expect(
      await t.query(api.bookings.getItemBookedDates, { itemId }),
    ).toHaveLength(0);
    expect(
      await t.run((ctx) => ctx.db.query("messages").collect()),
    ).not.toHaveLength(0);
  });
  it("rejects impossible, past, reversed and out-of-window requests", async () => {
    const { renter, itemId } = await setup();
    for (const [start, end] of [
      ["2026-02-29", "2026-03-01"],
      ["2026-10-04", "2026-10-06"],
      ["2026-10-08", "2026-10-06"],
      ["2026-10-31", "2026-11-01"],
    ]) {
      await expect(
        renter.mutation(
          api.bookings.createBooking,
          request(itemId, start, end),
        ),
      ).rejects.toThrow();
    }
  });
  it("permits pending competitors but only one can be approved", async () => {
    const { t, owner, renter, itemId } = await setup();
    const first = await renter.mutation(
      api.bookings.createBooking,
      request(itemId),
    );
    const second = await t
      .withIdentity({ subject: "other-renter" })
      .mutation(api.bookings.createBooking, request(itemId));
    await expect(
      renter.mutation(api.bookings.approveBooking, { id: first }),
    ).rejects.toThrow("vlasnik");
    const approvals = await Promise.allSettled([
      owner.mutation(api.bookings.approveBooking, { id: first }),
      owner.mutation(api.bookings.approveBooking, { id: second }),
    ]);
    expect(approvals.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(approvals.filter((result) => result.status === "rejected")).toHaveLength(1);
    await expect(
      renter.mutation(
        api.bookings.createBooking,
        request(itemId, "2026-10-08", "2026-10-09"),
      ),
    ).rejects.toThrow("rezervisan");
    await renter.mutation(
      api.bookings.createBooking,
      request(itemId, "2026-10-09", "2026-10-10"),
    );
  });
  it("rechecks current availability on approval and protects accepted commitments on edit", async () => {
    const { owner, renter, input, itemId } = await setup();
    const id = await renter.mutation(
      api.bookings.createBooking,
      request(itemId),
    );
    await owner.mutation(api.items.update, {
      ...input,
      id: itemId,
      availabilitySlots: [{ startDate: "2026-10-10", endDate: "2026-10-31" }],
    });
    await expect(
      owner.mutation(api.bookings.approveBooking, { id }),
    ).rejects.toThrow("celog");
    await owner.mutation(api.items.update, { ...input, id: itemId });
    await owner.mutation(api.bookings.approveBooking, { id });
    await expect(
      owner.mutation(api.items.update, {
        ...input,
        id: itemId,
        availabilitySlots: [{ startDate: "2026-10-10", endDate: "2026-10-31" }],
      }),
    ).rejects.toThrow("prihvaćene");
  });
  it("snapshots negotiated pricing and sends an in-app request notification", async () => {
    const { t, renter, itemId } = await setup("free", true);
    const id = await renter.mutation(
      api.bookings.createBooking,
      request(itemId),
    );
    const booking = await t.run((ctx) => ctx.db.get(id));
    expect(booking).toMatchObject({
      priceByAgreement: true,
      totalDays: 3,
      totalPrice: 0,
      status: "pending",
    });
    expect(
      await t.run((ctx) => ctx.db.query("notifications").collect()),
    ).toHaveLength(1);
  });
});
