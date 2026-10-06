import {
  generateSlug,
  extractShortId,
  generateSearchText,
} from "../lib/item-url";
import { ConvexError } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { ItemInput } from "./itemModel";
import { requireIdentity } from "../lib/convex-auth";
import { locationError, normalizeLocation } from "../lib/item-location";
import { availabilityError } from "../lib/rental-dates";
import { imageFocalPointsError } from "../lib/item-photos";

export async function createItem(ctx: MutationCtx, args: ItemInput) {
  const identity = await requireIdentity(ctx);

  // Publishing is free; a profile and contact preferences are still required.
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .first();

  if (!profile) {
    throw new ConvexError(
      "Profil nije pronađen. Osvežite stranicu i pokušajte ponovo.",
    );
  }

  // Check preferred contact types
  const prefs = profile.preferredContactTypes ?? [];
  if (prefs.length === 0) {
    throw new ConvexError("Postavite način kontakta pre objavljivanja.");
  }

  const latestItem = await ctx.db
    .query("items")
    .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
    .order("desc")
    .first();
  if (latestItem && Date.now() - latestItem.createdAt < 10_000) {
    throw new ConvexError("Sačekajte 10 sekundi između objavljivanja oglasa.");
  }

  const error = locationError(args.city, args.municipality);
  if (error) throw new ConvexError(error);
  const location = {
    city: args.city.trim().replace(/\s+/g, " "),
    municipality: args.municipality.trim().replace(/\s+/g, " "),
    cityKey: normalizeLocation(args.city),
    municipalityKey: normalizeLocation(args.municipality),
  };

  // Validate title
  if (!args.title.trim()) {
    throw new ConvexError("Naziv predmeta je obavezan.");
  }

  // Validate description
  if (!args.description.trim()) {
    throw new ConvexError("Opis predmeta je obavezan.");
  }

  // Validate category
  if (!args.category.trim()) {
    throw new ConvexError("Kategorija je obavezna.");
  }

  // Validate price (skip if price is by agreement)
  if (
    !args.priceByAgreement &&
    (!Number.isFinite(args.pricePerDay) || args.pricePerDay <= 0)
  ) {
    throw new ConvexError("Cena po danu mora biti veća od nule.");
  }

  if (
    args.title.length > 200 ||
    args.description.length > 10_000 ||
    args.category.length > 100
  ) {
    throw new ConvexError("Naziv, opis ili kategorija su predugački.");
  }
  if (
    args.deposit !== undefined &&
    (!Number.isFinite(args.deposit) || args.deposit < 0)
  ) {
    throw new ConvexError("Depozit mora biti pozitivan broj ili nula.");
  }

  // Validate images
  if (args.images.length === 0) {
    throw new ConvexError("Dodajte bar jednu fotografiju.");
  }
  if (args.images.length > 10) {
    throw new ConvexError("Maksimalno 10 fotografija po predmetu.");
  }

  const focalError = imageFocalPointsError(args.images, args.imageFocalPoints);
  if (focalError) throw new ConvexError(focalError);

  const validSlots = args.availabilitySlots;
  const slotError = availabilityError(validSlots);
  if (slotError) throw new ConvexError(slotError);

  // Validate delivery methods
  if (args.deliveryMethods.length === 0) {
    throw new ConvexError("Odaberite bar jedan način dostave.");
  }

  const now = Date.now();

  const itemId = await ctx.db.insert("items", {
    ...args,
    ...location,
    pricePerDay: args.priceByAgreement ? 0 : args.pricePerDay,
    availabilitySlots: validSlots,
    ownerId: identity.subject,
    createdAt: now,
    updatedAt: now,
  });
  // Generate shortId, slug, and searchText after insert
  const shortId = extractShortId(itemId);
  const slug = generateSlug(args.title);
  const searchText = generateSearchText(args.title, args.description);
  await ctx.db.patch(itemId, {
    shortId,
    slug,
    searchText,
  });
  return itemId;
}
