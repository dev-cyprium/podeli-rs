import { convexTest } from "convex-test";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
import { initialProspects } from "../lib/outreach-prospects";
import { createOfferToken, offerEmail } from "../lib/listing-offers";

const modules = import.meta.glob("../convex/**/*.{ts,tsx}");
const token = "a".repeat(64);
const nextToken = "b".repeat(64);
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-06T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

async function setup(email = "owner@example.com") {
  const t = convexTest(schema, modules);
  const admin = t.withIdentity({ subject: "admin" });
  const owner = t.withIdentity({
    subject: "owner",
    email,
    emailVerified: true,
  });
  const stranger = t.withIdentity({
    subject: "stranger",
    email: "stranger@example.com",
    emailVerified: true,
  });
  const { image, ownerProfile } = await t.run(async (ctx) => {
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
      priceInterval: "none",
      isSubscription: false,
      order: 0,
      isActive: true,
      createdAt: 0,
      updatedAt: 0,
    });
    let ownerProfile;
    for (const userId of ["admin", "owner", "stranger"]) {
      const id = await ctx.db.insert("profiles", {
        userId,
        planId,
        planSlug: "free",
        planActivatedAt: 0,
        hasBadge: false,
        superAdmin: userId === "admin",
        preferredContactTypes: ["chat"],
        createdAt: 0,
        updatedAt: 0,
      });
      if (userId === "owner") ownerProfile = id;
    }
    return {
      image: await ctx.storage.store(
        new Blob(["photo"], { type: "image/png" }),
      ),
      ownerProfile: ownerProfile!,
    };
  });
  const prospect = {
    ...initialProspects[0],
    email,
    nextAction: "Stari drugi poziv",
  };
  const prospectId = await admin.mutation(api.outreach.save, {
    prospect,
    note: "Prethodna istorija",
  });
  const data = {
    title: "PlayStation 5",
    description: "Konzola sa dva kontrolera",
    category: "Konzole",
    city: "Beograd",
    municipality: "Zvezdara",
    pricePerDay: 1500,
    images: [image],
    imageFocalPoints: { [image]: { x: 25, y: 75 } },
    availabilitySlots: [],
    deliveryMethods: ["licno" as const],
  };
  const id = await admin.mutation(api.listingOffers.saveDraft, {
    prospectId,
    data,
  });
  return {
    t,
    admin,
    owner,
    stranger,
    id,
    prospectId,
    data,
    prospect,
    ownerProfile,
  };
}

describe("supplier offer ownership and publishing", () => {
  it("atomically accepts and publishes edited data with verified ownership and explicit contact consent", async () => {
    const { t, admin, owner, stranger, id, data, ownerProfile } = await setup();
    await admin.mutation(api.listingOffers.createLink, { id, token });
    await t.run((ctx) =>
      ctx.db.patch(ownerProfile, { preferredContactTypes: [] }),
    );
    const edited = {
      ...data,
      title: "Potvrđen naziv",
      availabilitySlots: [{ startDate: "2026-10-07", endDate: "2026-10-31" }],
    };
    const unverified = t.withIdentity({
      subject: "owner",
      email: "owner@example.com",
      emailVerified: false,
    });
    for (const client of [t, stranger, unverified])
      await expect(
        client.mutation(api.listingOffers.claimAndPublish, {
          token,
          data: edited,
          confirmEmailContact: true,
        }),
      ).rejects.toThrow();
    await expect(
      owner.mutation(api.listingOffers.claimAndPublish, {
        token,
        data: edited,
        confirmEmailContact: false,
      }),
    ).rejects.toThrow();
    await expect(
      owner.mutation(api.listingOffers.claimAndPublish, {
        token,
        data: { ...edited, images: [] },
        confirmEmailContact: true,
      }),
    ).rejects.toThrow();
    expect(
      (
        await admin.query(api.listingOffers.getForProspect, {
          prospectId: (await admin.query(api.outreach.list, {}))[0]._id,
        })
      )?.status,
    ).toBe("ready");
    expect(
      (await owner.query(api.profiles.getMyProfile, {}))?.preferredContactTypes,
    ).toEqual([]);
    expect(await t.query(api.items.listAll, {})).toEqual([]);
    const itemId = await owner.mutation(api.listingOffers.claimAndPublish, {
      token,
      data: edited,
      confirmEmailContact: true,
    });
    expect(
      await owner.mutation(api.listingOffers.claimAndPublish, {
        token,
        data: edited,
        confirmEmailContact: true,
      }),
    ).toBe(itemId);
    expect((await t.query(api.items.listAll, {}))[0]).toMatchObject({
      title: edited.title,
      ownerId: "owner",
    });
    expect(
      (await owner.query(api.profiles.getMyProfile, {}))?.preferredContactTypes,
    ).toEqual(["email", "chat"]);
  });

  it("publishes a prepared sale without dates and preserves combined location/type filters", async () => {
    const { t, admin, owner, id, prospectId, data } = await setup();
    const sale = {
      ...data,
      listingType: "sale" as const,
      salePrice: 35_000,
      pricePerDay: 0,
    };
    await admin.mutation(api.listingOffers.saveDraft, {
      prospectId,
      data: sale,
    });
    await admin.mutation(api.listingOffers.createLink, { id, token });
    await owner.mutation(api.listingOffers.claim, { token });
    await owner.mutation(api.listingOffers.publish, { id, data: sale });
    const search = {
      listingType: "sale" as const,
      paginationOpts: { cursor: null, numItems: 20 },
    };
    expect(
      (await t.query(api.items.searchItems, { ...search, city: "Beograd" }))
        .page,
    ).toHaveLength(1);
    expect(
      (await t.query(api.items.searchItems, { ...search, city: "Novi Sad" }))
        .page,
    ).toHaveLength(0);
    expect(
      (
        await t.query(api.items.searchItems, {
          ...search,
          query: "PlayStation",
          city: "Beograd",
        })
      ).page,
    ).toHaveLength(1);
    expect(
      (await t.query(api.items.searchItems, { ...search, listingType: "rent" }))
        .page,
    ).toHaveLength(0);
  });
  it("keeps drafts out of public listings and publishes once after authenticated approval", async () => {
    const { t, admin, owner, id, prospectId, data, ownerProfile } =
      await setup();
    expect(await t.query(api.items.listAll, {})).toEqual([]);
    expect(await t.query(api.items.listForSitemap, {})).toEqual([]);
    await admin.mutation(api.listingOffers.createLink, { id, token });
    const preview = await t.query(api.listingOffers.preview, { token });
    expect(preview).toMatchObject({
      company: initialProspects[0].name,
      recipientHint: "o***@example.com",
      canClaim: false,
    });
    expect(preview).not.toHaveProperty("recipientEmail");
    expect(preview).not.toHaveProperty("prospectId");
    expect(preview).not.toHaveProperty("claimedBy");
    await admin.mutation(api.listingOffers.markSent, {
      id,
      followUpDate: "2026-10-09",
    });
    expect(await owner.mutation(api.listingOffers.claim, { token })).toBe(id);
    expect(await owner.mutation(api.listingOffers.claim, { token })).toBe(id);
    const crm = (await admin.query(api.outreach.list, {}))[0];
    expect(crm).toMatchObject({
      status: "offer_claimed",
      nextStep: "help_publish",
      supplierProfileId: ownerProfile,
    });
    expect(await owner.query(api.listingOffers.listMine, {})).toHaveLength(1);
    expect(await t.query(api.items.listAll, {})).toEqual([]);
    const input = {
      ...data,
      availabilitySlots: [{ startDate: "2026-10-07", endDate: "2026-10-31" }],
    };
    const itemId = await owner.mutation(api.listingOffers.publish, {
      id,
      data: input,
    });
    expect(
      await owner.mutation(api.listingOffers.publish, { id, data: input }),
    ).toBe(itemId);
    const items = await t.query(api.items.listAll, {});
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      ownerId: "owner",
      imageFocalPoints: data.imageFocalPoints,
    });
    expect(items[0].slug).toBe("playstation-5");
    expect(
      await owner.query(api.listingOffers.preview, { token }),
    ).toMatchObject({ published: true, mine: true });
    expect(await owner.query(api.listingOffers.listMine, {})).toEqual([]);
    expect((await admin.query(api.outreach.list, {}))[0]).toMatchObject({
      status: "onboarded",
      offer: { status: "published" },
    });
    expect(
      (await admin.query(api.outreach.history, { id: prospectId })).some(
        (entry) => entry.note === "Prethodna istorija",
      ),
    ).toBe(true);
  });

  it("rejects anonymous, mismatched and unverified claims, and protects the editor", async () => {
    const { t, admin, owner, stranger, id, prospectId, data } = await setup();
    await admin.mutation(api.listingOffers.createLink, { id, token });
    const unverified = t.withIdentity({
      subject: "owner",
      email: "owner@example.com",
      emailVerified: false,
    });
    const missingClaim = t.withIdentity({
      subject: "owner",
      email: "owner@example.com",
    });
    for (const client of [t, stranger, unverified, missingClaim]) {
      await expect(
        client.mutation(api.listingOffers.claim, { token }),
      ).rejects.toThrow();
    }
    await expect(
      stranger.mutation(api.listingOffers.publish, { id, data }),
    ).rejects.toThrow();
    expect(await stranger.query(api.listingOffers.getMine, { id })).toBeNull();
    await owner.mutation(api.listingOffers.claim, { token });
    expect(
      await stranger.query(api.listingOffers.preview, { token }),
    ).toBeNull();
    expect(await t.query(api.listingOffers.preview, { token })).toBeNull();
    for (const operation of [
      () => admin.mutation(api.listingOffers.saveDraft, { prospectId, data }),
      () =>
        admin.mutation(api.listingOffers.createLink, { id, token: nextToken }),
      () => admin.mutation(api.listingOffers.revokeLink, { id }),
    ])
      await expect(operation()).rejects.toThrow();
  });

  it("permits only one identity to take ownership even if both tokens claim the same email", async () => {
    const { t, admin, owner, stranger, id } = await setup();
    await admin.mutation(api.listingOffers.createLink, { id, token });
    await owner.mutation(api.listingOffers.claim, { token });
    const other = t.withIdentity({
      subject: "stranger",
      email: "owner@example.com",
      emailVerified: true,
    });
    await expect(
      other.mutation(api.listingOffers.claim, { token }),
    ).rejects.toThrow("već preuzeta");
    expect(await stranger.query(api.listingOffers.getMine, { id })).toBeNull();
  });

  it("enforces the normal contact and availability rules atomically on publication", async () => {
    const { t, admin, owner, id, data, ownerProfile } = await setup();
    await admin.mutation(api.listingOffers.createLink, { id, token });
    await owner.mutation(api.listingOffers.claim, { token });
    await expect(
      owner.mutation(api.listingOffers.publish, { id, data }),
    ).rejects.toThrow();
    await t.run((ctx) =>
      ctx.db.patch(ownerProfile, { preferredContactTypes: [] }),
    );
    const valid = {
      ...data,
      availabilitySlots: [{ startDate: "2026-10-07", endDate: "2026-10-08" }],
    };
    await expect(
      owner.mutation(api.listingOffers.publish, { id, data: valid }),
    ).rejects.toThrow("Postavite način kontakta");
    expect(await t.query(api.items.listAll, {})).toEqual([]);
    expect((await owner.query(api.listingOffers.getMine, { id }))?.status).toBe(
      "claimed",
    );
  });
});

describe("offer links and CRM editing", () => {
  it("rotates and revokes links, expires access, and retains claimed offers after expiry", async () => {
    const { t, admin, owner, id } = await setup();
    await admin.mutation(api.listingOffers.createLink, { id, token });
    await admin.mutation(api.listingOffers.createLink, {
      id,
      token: nextToken,
    });
    expect(await t.query(api.listingOffers.preview, { token })).toBeNull();
    await expect(
      owner.mutation(api.listingOffers.claim, { token }),
    ).rejects.toThrow();
    await admin.mutation(api.listingOffers.revokeLink, { id });
    expect(
      await t.query(api.listingOffers.preview, { token: nextToken }),
    ).toBeNull();
    await admin.mutation(api.listingOffers.createLink, { id, token });
    vi.advanceTimersByTime(31 * 24 * 60 * 60 * 1000);
    expect(await t.query(api.listingOffers.preview, { token })).toBeNull();
    await expect(
      owner.mutation(api.listingOffers.claim, { token }),
    ).rejects.toThrow();
    await admin.mutation(api.listingOffers.createLink, {
      id,
      token: nextToken,
    });
    await owner.mutation(api.listingOffers.claim, { token: nextToken });
    vi.advanceTimersByTime(31 * 24 * 60 * 60 * 1000);
    expect(await owner.query(api.listingOffers.getMine, { id })).not.toBeNull();
  });

  it("allows email enrichment of imported phone contacts and requires a recipient for sharing", async () => {
    const { t, admin, owner, id, prospectId, prospect, data } = await setup("");
    await expect(
      admin.mutation(api.listingOffers.createLink, { id, token }),
    ).rejects.toThrow("dopunite mejl");
    await admin.mutation(api.outreach.save, {
      id: prospectId,
      prospect: {
        ...prospect,
        email: "owner@example.com",
        phone: "",
        nextStep: "prepare_offer",
      },
      note: "Dopunjen mejl",
    });
    await admin.mutation(api.listingOffers.createLink, { id, token });
    await admin.mutation(api.outreach.save, {
      id: prospectId,
      prospect: { ...prospect, email: "new@example.com" },
      note: "",
    });
    // Changing a recipient revokes the old link rather than transferring its authority.
    expect(await t.query(api.listingOffers.preview, { token })).toBeNull();
    const newOwner = t.withIdentity({
      subject: "owner",
      email: "new@example.com",
      emailVerified: true,
    });
    await expect(
      newOwner.mutation(api.listingOffers.claim, { token }),
    ).rejects.toThrow();
    await admin.mutation(api.listingOffers.saveDraft, {
      prospectId,
      data: { ...data, title: "Izmenjena ponuda" },
    });
    expect(await t.query(api.listingOffers.preview, { token })).toBeNull();
    expect(
      (await admin.query(api.listingOffers.getForProspect, { prospectId }))
        ?.data.title,
    ).toBe("Izmenjena ponuda");
    expect(
      (await admin.query(api.outreach.history, { id: prospectId })).some(
        (entry) => entry.note === "Prethodna istorija",
      ),
    ).toBe(true);
    await expect(
      owner.mutation(api.listingOffers.claim, { token }),
    ).rejects.toThrow();
  });

  it("guards every administration endpoint and validates reminder dates", async () => {
    const { t, admin, owner, stranger, id, prospectId, data } = await setup();
    for (const client of [t, owner, stranger]) {
      await expect(
        client.query(api.listingOffers.getForProspect, { prospectId }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.listingOffers.saveDraft, { prospectId, data }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.listingOffers.createLink, { id, token }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.listingOffers.revokeLink, { id }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.listingOffers.markSent, { id, followUpDate: "" }),
      ).rejects.toThrow();
    }
    await admin.mutation(api.listingOffers.createLink, { id, token });
    await expect(
      admin.mutation(api.listingOffers.markSent, {
        id,
        followUpDate: "2026-02-30",
      }),
    ).rejects.toThrow();
    expect(
      (await admin.query(api.listingOffers.getForProspect, { prospectId }))
        ?.status,
    ).toBe("ready");
  });

  it("makes opaque random links and an honest email that does not claim publication or demand", () => {
    const a = createOfferToken();
    const b = createOfferToken();
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).not.toBe(b);
    const email = offerEmail(
      "Firma",
      "PS5",
      "https://podeli.rs/ponuda/example",
    );
    expect(email.body).toContain("Oglas još nije objavljen");
    expect(email.body).toContain("ne mogu da obećam broj upita");
  });
});
