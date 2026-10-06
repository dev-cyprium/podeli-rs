import { ConvexError, v } from "convex/values";
import { query, mutation, type MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireIdentity } from "../lib/convex-auth";
import { normalizeEmail, recipientHint } from "../lib/listing-offers";
import { requireAdmin } from "./adminAuth";
import { itemInput } from "./itemModel";
import { createItem } from "./itemCreation";
import { imageFocalPointsError } from "../lib/item-photos";
import { offerDocument } from "./listingOfferModel";
import { validFollowUp } from "../lib/outreach";

async function record(
  ctx: MutationCtx,
  offer: Pick<Doc<"listingOffers">, "prospectId">,
  authorId: string,
  status: Doc<"prospects">["status"],
  nextStep: Doc<"prospects">["nextStep"],
  note: string,
) {
  const previous = await ctx.db.get(offer.prospectId);
  const oldTask = previous?.nextAction
    ? `\nPrethodno zabeležen zadatak: ${previous.nextAction}`
    : "";
  await ctx.db.patch(offer.prospectId, {
    status,
    nextStep,
    nextAction: "",
    followUpDate: "",
    updatedAt: Date.now(),
  });
  await ctx.db.insert("prospectActivities", {
    prospectId: offer.prospectId,
    authorId,
    outcome: status,
    note: note + oldTask,
    createdAt: Date.now(),
  });
}

function requireEditable(offer: Doc<"listingOffers">) {
  if (offer.claimedBy)
    throw new ConvexError(
      "Ponuđač je preuzeo ponudu. Izmene sada pravi sa svog naloga.",
    );
}

function validateDraft(data: Doc<"listingOffers">["data"]) {
  if (!data.title.trim() || !data.description.trim() || !data.category.trim())
    throw new ConvexError("Unesite naziv, opis i kategoriju ponude.");
  if (
    data.title.length > 200 ||
    data.description.length > 10_000 ||
    data.category.length > 100 ||
    data.city.length > 100 ||
    data.municipality.length > 100
  )
    throw new ConvexError("Podaci ponude su predugački.");
  if (
    !Number.isFinite(data.pricePerDay) ||
    (!data.priceByAgreement && data.pricePerDay <= 0)
  )
    throw new ConvexError("Unesite cenu ili izaberite cenu po dogovoru.");
  if (
    data.deposit !== undefined &&
    (!Number.isFinite(data.deposit) || data.deposit < 0)
  )
    throw new ConvexError("Depozit mora biti pozitivan broj ili nula.");
  if (data.images.length > 10)
    throw new ConvexError("Maksimalno 10 fotografija po ponudi.");
  const error = imageFocalPointsError(data.images, data.imageFocalPoints);
  if (error) throw new ConvexError(error);
}

export const getForProspect = query({
  args: { prospectId: v.id("prospects") },
  returns: v.union(offerDocument, v.null()),
  handler: async (ctx, { prospectId }) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("listingOffers")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .unique();
  },
});

export const saveDraft = mutation({
  args: { prospectId: v.id("prospects"), data: itemInput },
  returns: v.id("listingOffers"),
  handler: async (ctx, { prospectId, data }) => {
    const identity = await requireAdmin(ctx);
    const prospect = await ctx.db.get(prospectId);
    if (!prospect) throw new ConvexError("Firma nije pronađena.");
    validateDraft(data);
    const existing = await ctx.db
      .query("listingOffers")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .unique();
    if (existing) requireEditable(existing);
    // Availability is always confirmed by the supplier, not by the administrator.
    const draft = { ...data, availabilitySlots: [] };
    const now = Date.now();
    const id = existing
      ? existing._id
      : await ctx.db.insert("listingOffers", {
          prospectId,
          data: draft,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        });
    if (existing)
      await ctx.db.patch(id, {
        data: draft,
        status: "draft",
        token: undefined,
        recipientEmail: undefined,
        expiresAt: undefined,
        updatedAt: now,
      });
    await record(
      ctx,
      { prospectId },
      identity.subject,
      "offer_ready",
      "send_offer",
      "Pripremljen nejavni predlog oglasa. Link treba napraviti pre slanja.",
    );
    return id;
  },
});

export const createLink = mutation({
  args: { id: v.id("listingOffers"), token: v.string() },
  returns: v.null(),
  handler: async (ctx, { id, token }) => {
    const identity = await requireAdmin(ctx);
    const offer = await ctx.db.get(id);
    if (!offer) throw new ConvexError("Ponuda nije pronađena.");
    requireEditable(offer);
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new ConvexError("Neispravan link ponude.");
    if (
      await ctx.db
        .query("listingOffers")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique()
    )
      throw new ConvexError("Link već postoji. Napravite novi.");
    const prospect = await ctx.db.get(offer.prospectId);
    const email = normalizeEmail(prospect?.email ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new ConvexError(
        "Prvo dopunite mejl firme preko dugmeta Izmeni firmu.",
      );
    await ctx.db.patch(id, {
      token,
      recipientEmail: email,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      status: "ready",
      updatedAt: Date.now(),
    });
    await record(
      ctx,
      offer,
      identity.subject,
      "offer_ready",
      "send_offer",
      "Napravljen link za pregled i preuzimanje ponude. Prethodni link više ne važi.",
    );
    return null;
  },
});

export const revokeLink = mutation({
  args: { id: v.id("listingOffers") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const identity = await requireAdmin(ctx);
    const offer = await ctx.db.get(id);
    if (!offer) throw new ConvexError("Ponuda nije pronađena.");
    requireEditable(offer);
    await ctx.db.patch(id, {
      token: undefined,
      recipientEmail: undefined,
      expiresAt: undefined,
      status: "draft",
      updatedAt: Date.now(),
    });
    await record(
      ctx,
      offer,
      identity.subject,
      "offer_ready",
      "send_offer",
      "Link ponude je povučen.",
    );
    return null;
  },
});

export const markSent = mutation({
  args: { id: v.id("listingOffers"), followUpDate: v.string() },
  returns: v.null(),
  handler: async (ctx, { id, followUpDate }) => {
    const identity = await requireAdmin(ctx);
    const offer = await ctx.db.get(id);
    if (
      !offer ||
      !offer.token ||
      !offer.expiresAt ||
      offer.expiresAt <= Date.now()
    )
      throw new ConvexError("Prvo napravite važeći link ponude.");
    requireEditable(offer);
    if (!validFollowUp(followUpDate))
      throw new ConvexError("Neispravan datum.");
    if (offer.status === "sent") return null;
    await ctx.db.patch(id, { status: "sent", updatedAt: Date.now() });
    await record(
      ctx,
      offer,
      identity.subject,
      "offer_sent",
      "await_reply",
      "Administrator je označio da je link ponude poslat. Slanje nije automatsko.",
    );
    await ctx.db.patch(offer.prospectId, { followUpDate });
    return null;
  },
});

export const preview = query({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      id: v.id("listingOffers"),
      company: v.string(),
      data: itemInput,
      recipientHint: v.string(),
      expiresAt: v.number(),
      mine: v.boolean(),
      claimed: v.boolean(),
      published: v.boolean(),
      canClaim: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, { token }) => {
    if (!/^[a-f0-9]{64}$/.test(token)) return null;
    const offer = await ctx.db
      .query("listingOffers")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (
      !offer ||
      !offer.expiresAt ||
      offer.expiresAt <= Date.now() ||
      !offer.recipientEmail
    )
      return null;
    const identity = await ctx.auth.getUserIdentity();
    const mine = Boolean(identity && offer.claimedBy === identity.subject);
    if (offer.claimedBy && !mine) return null;
    const prospect = await ctx.db.get(offer.prospectId);
    if (!prospect) return null;
    return {
      id: offer._id,
      company: prospect.name,
      data: offer.data,
      recipientHint: recipientHint(offer.recipientEmail),
      expiresAt: offer.expiresAt,
      mine,
      claimed: Boolean(offer.claimedBy),
      published: offer.status === "published",
      canClaim: Boolean(
        identity?.emailVerified === true &&
        normalizeEmail(identity.email ?? "") === offer.recipientEmail,
      ),
    };
  },
});

export const claim = mutation({
  args: { token: v.string() },
  returns: v.id("listingOffers"),
  handler: async (ctx, { token }) => {
    const identity = await requireIdentity(ctx);
    const offer = await ctx.db
      .query("listingOffers")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!offer || !offer.expiresAt || offer.expiresAt <= Date.now())
      throw new ConvexError("Link nije važeći. Zatražite novi od Podelija.");
    if (
      identity.emailVerified !== true ||
      !identity.email ||
      normalizeEmail(identity.email) !== offer.recipientEmail
    )
      throw new ConvexError(
        "Preuzmite ponudu nalogom sa potvrđenom mejl adresom kojoj je ponuda poslata.",
      );
    if (offer.claimedBy && offer.claimedBy !== identity.subject)
      throw new ConvexError("Ponuda je već preuzeta.");
    if (offer.claimedBy === identity.subject) return offer._id;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile)
      throw new ConvexError(
        "Profil se još priprema. Pokušajte ponovo za trenutak.",
      );
    await ctx.db.patch(offer._id, {
      claimedBy: identity.subject,
      status: "claimed",
      updatedAt: Date.now(),
    });
    await record(
      ctx,
      offer,
      identity.subject,
      "offer_claimed",
      "help_publish",
      "Ponuđač je preuzeo ponudu svojim nalogom. Oglas još nije objavljen.",
    );
    await ctx.db.patch(offer.prospectId, { supplierProfileId: profile._id });
    return offer._id;
  },
});

export const getMine = query({
  args: { id: v.id("listingOffers") },
  returns: v.union(offerDocument, v.null()),
  handler: async (ctx, { id }) => {
    const identity = await requireIdentity(ctx);
    const offer = await ctx.db.get(id);
    if (!offer || offer.claimedBy !== identity.subject) return null;
    return offer;
  },
});

export const listMine = query({
  args: {},
  returns: v.array(offerDocument),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const offers = await ctx.db
      .query("listingOffers")
      .withIndex("by_claimedBy", (q) => q.eq("claimedBy", identity.subject))
      .collect();
    return offers.filter((offer) => offer.status === "claimed");
  },
});

export const publish = mutation({
  args: { id: v.id("listingOffers"), data: itemInput },
  returns: v.id("items"),
  handler: async (ctx, { id, data }) => {
    const identity = await requireIdentity(ctx);
    const offer = await ctx.db.get(id);
    if (!offer || offer.claimedBy !== identity.subject)
      throw new ConvexError("Nemate dozvolu za objavu ove ponude.");
    if (offer.itemId) return offer.itemId;
    const itemId = await createItem(ctx, data);
    await ctx.db.patch(id, {
      status: "published",
      itemId,
      data,
      updatedAt: Date.now(),
    });
    await record(
      ctx,
      offer,
      identity.subject,
      "onboarded",
      undefined,
      "Ponuđač je potvrdio podatke i objavio oglas.",
    );
    return itemId;
  },
});
