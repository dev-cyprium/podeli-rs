/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
import { initialProspects } from "../lib/outreach-prospects";
import {
  belgradeToday,
  isToCallToday,
  csvColumns,
  encodeCsv,
  parseCsv,
  prospectKey,
  validFollowUp,
} from "../lib/outreach";
const modules = import.meta.glob("../convex/**/*.ts");
async function setup(admin = true) {
  const t = convexTest(schema, modules);
  const profileId = await t.run(async (ctx) => {
    const planId = await ctx.db.insert("plans", {
      slug: "test",
      name: "Test",
      description: "Test",
      maxListings: -1,
      maxActiveRentals: -1,
      allowedDeliveryMethods: [],
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
    return ctx.db.insert("profiles", {
      userId: "admin",
      planId,
      planSlug: "test",
      planActivatedAt: 0,
      hasBadge: false,
      superAdmin: admin,
      createdAt: 0,
      updatedAt: 0,
    });
  });
  return { t, admin: t.withIdentity({ subject: "admin" }), profileId };
}
describe("outreach permissions and data", () => {
  it("rejects unauthenticated and ordinary users on every endpoint", async () => {
    const { t, admin } = await setup(false);
    for (const client of [t, admin]) {
      await expect(client.query(api.outreach.list, {})).rejects.toThrow();
      await expect(client.query(api.outreach.suppliers, {})).rejects.toThrow();
      await expect(
        client.mutation(api.outreach.importProspects, {
          rows: initialProspects,
        }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.outreach.save, {
          prospect: initialProspects[0],
          note: "",
        }),
      ).rejects.toThrow();
    }
    const allowed = await setup();
    const id = await allowed.admin.mutation(api.outreach.save, {
      prospect: initialProspects[0],
      note: "",
    });
    await expect(
      allowed.t.query(api.outreach.history, { id }),
    ).rejects.toThrow();
    await allowed.t.run(async (ctx) => {
      await ctx.db.patch(allowed.profileId, { superAdmin: false });
    });
    await expect(
      allowed.admin.query(api.outreach.history, { id }),
    ).rejects.toThrow();
  });
  it("imports 18 once and never overwrites existing notes or status", async () => {
    const { admin } = await setup();
    expect(
      await admin.mutation(api.outreach.importProspects, {
        rows: initialProspects,
      }),
    ).toEqual({ imported: 18, skipped: 0 });
    const first = (await admin.query(api.outreach.list, {}))[0];
    await admin.mutation(api.outreach.save, {
      id: first._id,
      prospect: { ...initialProspects[0], status: "interested" },
      note: "Dogovorena saradnja",
    });
    expect(
      await admin.mutation(api.outreach.importProspects, {
        rows: initialProspects,
      }),
    ).toEqual({ imported: 0, skipped: 18 });
    expect(
      (await admin.query(api.outreach.list, {})).find(
        (p) => p._id === first._id,
      )?.status,
    ).toBe("interested");
    expect(
      (await admin.query(api.outreach.history, { id: first._id }))[0].note,
    ).toBe("Dogovorena saradnja");
  });
  it("validates dates and rolls back invalid imports atomically", async () => {
    const { admin } = await setup();
    await expect(
      admin.mutation(api.outreach.importProspects, {
        rows: [
          initialProspects[0],
          { ...initialProspects[1], followUpDate: "2026-02-30" },
        ],
      }),
    ).rejects.toThrow();
    expect(await admin.query(api.outreach.list, {})).toHaveLength(0);
    await expect(
      admin.mutation(api.outreach.save, {
        prospect: { ...initialProspects[0], status: "follow_up" },
        note: "",
      }),
    ).rejects.toThrow();
    await expect(
      admin.mutation(api.outreach.save, {
        prospect: { ...initialProspects[0], website: "javascript:alert(1)" },
        note: "",
      }),
    ).rejects.toThrow();
  });
  it("records repeated call outcomes and supports linking and unlinking supplier accounts", async () => {
    const { admin, profileId } = await setup();
    const prospect = { ...initialProspects[0], supplierProfileId: profileId };
    const id = await admin.mutation(api.outreach.save, {
      prospect,
      note: "Prvi poziv",
      outcome: "new",
    });
    await admin.mutation(api.outreach.save, {
      id,
      prospect: initialProspects[0],
      note: "",
      outcome: "new",
    });
    expect(await admin.query(api.outreach.history, { id })).toHaveLength(2);
    expect(
      (await admin.query(api.outreach.list, {}))[0].supplierProfileId,
    ).toBeUndefined();
    await expect(
      admin.mutation(api.outreach.save, {
        prospect: initialProspects[0],
        note: "",
      }),
    ).rejects.toThrow("Kontakt već postoji");
  });
});
describe("dates and CSV", () => {
  it("uses Belgrade calendar dates across UTC midnight and DST", () => {
    expect(belgradeToday(new Date("2026-10-04T22:30:00Z"))).toBe("2026-10-05");
    expect(belgradeToday(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
    expect(validFollowUp("2026-02-29")).toBe(false);
    expect(validFollowUp("2028-02-29")).toBe(true);
  });
  it("round trips Serbian text, quoted commas and multiline cells", () => {
    const rows = [
      [...csvColumns],
      [
        'Čarolija, "Beograd"',
        "Odela",
        "060123",
        "https://example.com",
        "",
        "new",
        "Poziv\nzatim poruka",
        "",
      ],
    ];
    expect(parseCsv(encodeCsv(rows))).toEqual(rows);
    expect(() => parseCsv('name\n"unfinished')).toThrow();
    expect(prospectKey(" Clean   Rent ", "+381 60 361 6880")).toBe(
      prospectKey("clean rent", "0603616880"),
    );
  });
});

it("shows overdue and new contacts today, excluding future and closed contacts", () => {
  const today = "2026-10-05";
  expect(isToCallToday({ status: "new", followUpDate: "" }, today)).toBe(true);
  expect(
    isToCallToday({ status: "follow_up", followUpDate: "2026-10-04" }, today),
  ).toBe(true);
  expect(
    isToCallToday({ status: "interested", followUpDate: today }, today),
  ).toBe(true);
  expect(
    isToCallToday({ status: "follow_up", followUpDate: "2026-10-06" }, today),
  ).toBe(false);
  expect(
    isToCallToday({ status: "not_interested", followUpDate: today }, today),
  ).toBe(false);
  expect(
    isToCallToday({ status: "onboarded", followUpDate: today }, today),
  ).toBe(false);
});
