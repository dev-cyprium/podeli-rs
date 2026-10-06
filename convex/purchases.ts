import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";
import { offersSale } from "@/lib/listing-types";
import { notifyInquiry } from "./inquiryNotifications";

function validText(text: string) {
  const value = text.trim();
  if (!value || value.length > 2000)
    throw new ConvexError("Unesite tekst od 1 do 2000 karaktera.");
  return value;
}
export const create = mutation({
  args: { itemId: v.id("items"), question: v.string() },
  returns: v.id("purchaseInquiries"),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item || !offersSale(item) || item.soldAt !== undefined)
      throw new ConvexError("Predmet nije dostupan za prodaju.");
    if (item.ownerId === identity.subject)
      throw new ConvexError("Ne možete poslati upit za sopstveni predmet.");
    const question = validText(args.question);
    const existing = await ctx.db
      .query("purchaseInquiries")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();
    if (
      existing.some(
        (i) =>
          i.buyerId === identity.subject &&
          ["pending", "accepted"].includes(i.status),
      )
    ) {
      throw new ConvexError("Već imate otvoren upit za ovaj predmet.");
    }
    if (!item.salePrice || !Number.isFinite(item.salePrice))
      throw new ConvexError("Prodajna cena nije postavljena.");
    const now = Date.now();
    const id = await ctx.db.insert("purchaseInquiries", {
      itemId: item._id,
      ownerId: item.ownerId,
      buyerId: identity.subject,
      salePrice: item.salePrice,
      question,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    await notifyInquiry(ctx, {
      userId: item.ownerId,
      message: `Nov upit za kupovinu „${item.title}“: ${question}`,
      link: "/kontrolna-tabla/predmeti",
      request: true,
    });
    return id;
  },
});
export const respond = mutation({
  args: {
    id: v.id("purchaseInquiries"),
    decision: v.union(v.literal("accepted"), v.literal("rejected")),
    response: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const inquiry = await ctx.db.get(args.id);
    if (!inquiry || inquiry.ownerId !== identity.subject)
      throw new ConvexError("Samo ponuđač može odgovoriti na upit.");
    if (inquiry.status !== "pending")
      throw new ConvexError("Upit već ima odgovor.");
    const item = await ctx.db.get(inquiry.itemId);
    if (
      args.decision === "accepted" &&
      (!item || !offersSale(item) || item.soldAt !== undefined)
    )
      throw new ConvexError("Predmet nije dostupan za prodaju.");
    const response = validText(args.response);
    const now = Date.now();
    await ctx.db.patch(inquiry._id, {
      status: args.decision,
      response,
      respondedAt: now,
      updatedAt: now,
    });
    await notifyInquiry(ctx, {
      userId: inquiry.buyerId,
      message: `Upit za kupovinu „${item?.title ?? "predmet"}“ je ${args.decision === "accepted" ? "prihvaćen" : "odbijen"}: ${response}`,
      link: "/kontrolna-tabla/zakupi",
      request: false,
    });
    return null;
  },
});
export const recordOutcome = mutation({
  args: { id: v.id("purchaseInquiries"), purchased: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const inquiry = await ctx.db.get(args.id);
    if (!inquiry || inquiry.buyerId !== identity.subject)
      throw new ConvexError("Samo kupac može zabeležiti ishod.");
    if (inquiry.status !== "accepted")
      throw new ConvexError("Ishod se beleži nakon prihvaćenog upita.");
    const item = await ctx.db.get(inquiry.itemId);
    const now = Date.now();
    if (args.purchased) {
      if (!item || !offersSale(item) || item.soldAt !== undefined)
        throw new ConvexError("Predmet je već prodat ili uklonjen.");
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_item", (q) => q.eq("itemId", inquiry.itemId))
        .collect();
      if (
        bookings.some((b) =>
          ["confirmed", "nije_isporucen", "isporucen"].includes(b.status),
        )
      )
        throw new ConvexError(
          "Prodaja se ne može završiti dok postoje prihvaćene rezervacije.",
        );
      await ctx.db.patch(item._id, { soldAt: now, updatedAt: now });
      const others = await ctx.db
        .query("purchaseInquiries")
        .withIndex("by_item", (q) => q.eq("itemId", inquiry.itemId))
        .collect();
      for (const other of others) {
        if (
          other._id === inquiry._id ||
          !["pending", "accepted"].includes(other.status)
        )
          continue;
        const response = "Predmet je prodat drugom kupcu.";
        await ctx.db.patch(other._id, {
          status: "rejected",
          response,
          respondedAt: now,
          updatedAt: now,
        });
        await notifyInquiry(ctx, {
          userId: other.buyerId,
          message: response,
          link: "/kontrolna-tabla/zakupi",
          request: false,
        });
      }
    }
    await ctx.db.patch(inquiry._id, {
      status: args.purchased ? "purchased" : "not_purchased",
      updatedAt: now,
    });
    await notifyInquiry(ctx, {
      userId: inquiry.ownerId,
      message: `Kupac je zabeležio ishod za „${item?.title ?? "predmet"}“: ${args.purchased ? "kupljeno" : "kupovina nije realizovana"}.`,
      link: "/kontrolna-tabla/predmeti",
      request: false,
    });
    return null;
  },
});
export const listMine = query({
  args: { role: v.union(v.literal("owner"), v.literal("buyer")) },
  returns: v.array(
    v.object({
      _id: v.id("purchaseInquiries"),
      _creationTime: v.number(),
      itemId: v.id("items"),
      ownerId: v.string(),
      buyerId: v.string(),
      salePrice: v.number(),
      question: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("purchased"),
        v.literal("not_purchased"),
      ),
      response: v.optional(v.string()),
      respondedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      item: v.union(
        v.object({
          _id: v.id("items"),
          title: v.string(),
          shortId: v.optional(v.string()),
          slug: v.optional(v.string()),
        }),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const inquiries =
      args.role === "owner"
        ? await ctx.db
            .query("purchaseInquiries")
            .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
            .order("desc")
            .collect()
        : await ctx.db
            .query("purchaseInquiries")
            .withIndex("by_buyer", (q) => q.eq("buyerId", identity.subject))
            .order("desc")
            .collect();
    return await Promise.all(
      inquiries.map(async (inquiry) => {
        const item = await ctx.db.get(inquiry.itemId);
        return {
          ...inquiry,
          item: item
            ? {
                _id: item._id,
                title: item.title,
                shortId: item.shortId,
                slug: item.slug,
              }
            : null,
        };
      }),
    );
  },
});
