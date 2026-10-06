import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./adminAuth";
import { offerSummary } from "./listingOfferModel";
import { prospectKey, validFollowUp } from "../lib/outreach";
import {
  prospectInput,
  prospectDocument,
  activityDocument,
  outreachStatus,
  outreachChannel,
} from "./outreachModel";
function validate(p: {
  name: string;
  category: string;
  phone: string;
  email?: string;
  contactFormUrl?: string;
  website: string;
  contactPerson: string;
  nextAction: string;
  followUpDate: string;
  status: string;
}) {
  if (!p.name.trim() || !p.category.trim())
    throw new ConvexError("Naziv i kategorija su obavezni.");
  if (
    [
      p.name,
      p.category,
      p.phone,
      p.email ?? "",
      p.contactFormUrl ?? "",
      p.website,
      p.contactPerson,
      p.nextAction,
    ].some((x) => x.length > 500)
  )
    throw new ConvexError("Polje može sadržati najviše 500 znakova.");
  if (!validFollowUp(p.followUpDate))
    throw new ConvexError("Neispravan datum.");
  if (p.status === "follow_up" && !p.followUpDate)
    throw new ConvexError("Izaberite datum ponovnog kontakta.");
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
    throw new ConvexError("Unesite ispravnu mejl adresu.");
  for (const url of [p.website, p.contactFormUrl]) {
    if (!url) continue;
    try {
      if (!["https:", "http:"].includes(new URL(url).protocol))
        throw new Error();
    } catch {
      throw new ConvexError(
        "Unesite HTTP ili HTTPS adresu sajta ili kontakt forme.",
      );
    }
  }
}
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      ...prospectDocument.fields,
      latestActivity: v.union(activityDocument, v.null()),
      offer: v.union(offerSummary, v.null()),
    }),
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const prospects = await ctx.db.query("prospects").collect();
    return await Promise.all(
      prospects.map(async (prospect) => {
        const offer = await ctx.db
          .query("listingOffers")
          .withIndex("by_prospectId", (q) => q.eq("prospectId", prospect._id))
          .unique();
        return {
          ...prospect,
          offer: offer
            ? {
                id: offer._id,
                status: offer.status,
                expiresAt: offer.expiresAt,
              }
            : null,
          latestActivity: await ctx.db
            .query("prospectActivities")
            .withIndex("by_prospectId", (q) => q.eq("prospectId", prospect._id))
            .order("desc")
            .first(),
        };
      }),
    );
  },
});
export const suppliers = query({
  args: {},
  returns: v.array(v.object({ _id: v.id("profiles"), label: v.string() })),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    return profiles.map((p) => ({
      _id: p._id,
      label:
        [p.firstName, p.lastName, p.email].filter(Boolean).join(" · ") ||
        p.userId,
    }));
  },
});
export const history = query({
  args: { id: v.id("prospects") },
  returns: v.array(activityDocument),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("prospectActivities")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", id))
      .order("desc")
      .collect();
  },
});
export const importProspects = mutation({
  args: { rows: v.array(prospectInput) },
  returns: v.object({ imported: v.number(), skipped: v.number() }),
  handler: async (ctx, { rows }) => {
    await requireAdmin(ctx);
    if (rows.length > 200)
      throw new ConvexError("Uvezite najviše 200 kontakata odjednom.");
    let imported = 0,
      skipped = 0;
    for (const row of rows) {
      validate(row);
      if (row.supplierProfileId && !(await ctx.db.get(row.supplierProfileId)))
        throw new ConvexError("Profil nije pronađen.");
      const key = prospectKey(row.name, row.phone);
      const importedBefore = await ctx.db
        .query("prospects")
        .withIndex("by_importKey", (q) => q.eq("importKey", key))
        .first();
      const existing =
        importedBefore ??
        (await ctx.db
          .query("prospects")
          .withIndex("by_key", (q) => q.eq("key", key))
          .first());
      if (existing) {
        skipped++;
        continue;
      }
      const now = Date.now();
      await ctx.db.insert("prospects", {
        ...row,
        name: row.name.trim(),
        category: row.category.trim(),
        key,
        importKey: key,
        createdAt: now,
        updatedAt: now,
      });
      imported++;
    }
    return { imported, skipped };
  },
});
export const save = mutation({
  args: {
    id: v.optional(v.id("prospects")),
    prospect: prospectInput,
    note: v.string(),
    outcome: v.optional(outreachStatus),
    channel: v.optional(outreachChannel),
  },
  returns: v.id("prospects"),
  handler: async (ctx, { id, prospect, note, outcome, channel }) => {
    const identity = await requireAdmin(ctx);
    validate(prospect);
    if (note.length > 5000)
      throw new ConvexError("Beleška može sadržati najviše 5000 znakova.");
    if (
      prospect.supplierProfileId &&
      !(await ctx.db.get(prospect.supplierProfileId))
    )
      throw new ConvexError("Profil nije pronađen.");
    const key = prospectKey(prospect.name, prospect.phone);
    const existing = await ctx.db
      .query("prospects")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing && existing._id !== id)
      throw new ConvexError("Kontakt već postoji.");
    const previous = id ? await ctx.db.get(id) : null;
    if (id && !previous) throw new ConvexError("Kontakt nije pronađen.");
    const now = Date.now();
    const data = {
      ...prospect,
      supplierProfileId: prospect.supplierProfileId,
      preferredChannel: prospect.preferredChannel,
      name: prospect.name.trim(),
      category: prospect.category.trim(),
      key,
      // Retain the initial identity when editing an imported phone/name.
      importKey: previous?.importKey ?? previous?.key,
      nextStep: prospect.nextStep,
      updatedAt: now,
    };
    const savedId =
      id ?? (await ctx.db.insert("prospects", { ...data, createdAt: now }));
    if (id) await ctx.db.patch(id, data);
    if (
      id &&
      previous &&
      (previous.email ?? "").trim().toLowerCase() !==
        (prospect.email ?? "").trim().toLowerCase()
    ) {
      const offer = await ctx.db
        .query("listingOffers")
        .withIndex("by_prospectId", (q) => q.eq("prospectId", id))
        .unique();
      if (offer?.token && !offer.claimedBy) {
        await ctx.db.patch(offer._id, {
          token: undefined,
          recipientEmail: undefined,
          expiresAt: undefined,
          status: "draft",
          updatedAt: now,
        });
        await ctx.db.insert("prospectActivities", {
          prospectId: id,
          authorId: identity.subject,
          outcome: prospect.status,
          note: "Mejl firme je promenjen. Prethodni link ponude je povučen; napravite novi za novu adresu.",
          createdAt: now,
        });
      }
    }
    if (
      note.trim() ||
      outcome ||
      (previous && previous.status !== prospect.status)
    )
      await ctx.db.insert("prospectActivities", {
        prospectId: savedId,
        authorId: identity.subject,
        outcome: outcome ?? prospect.status,
        note: note.trim(),
        channel,
        createdAt: now,
      });
    return savedId;
  },
});
