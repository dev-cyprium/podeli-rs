import { v, ConvexError } from "convex/values";
import { query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireIdentity } from "@/lib/convex-auth";

async function requireSuperAdmin(ctx: QueryCtx) {
  const identity = await requireIdentity(ctx);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .first();
  if (!profile?.superAdmin) {
    throw new ConvexError("Samo super-admin može pristupiti.");
  }
  return identity;
}

/**
 * Get all conversations for admin panel
 */
export const getAllConversations = query({
  args: {},
  returns: v.array(
    v.object({
      bookingId: v.id("bookings"),
      booking: v.object({
        _id: v.id("bookings"),
        status: v.string(),
        startDate: v.string(),
        endDate: v.string(),
        totalPrice: v.number(),
      }),
      item: v.union(
        v.object({
          _id: v.id("items"),
          title: v.string(),
          images: v.array(v.id("_storage")),
        }),
        v.null()
      ),
      owner: v.union(
        v.object({
          userId: v.string(),
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
        v.null()
      ),
      renter: v.union(
        v.object({
          userId: v.string(),
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
        v.null()
      ),
      lastMessage: v.union(
        v.object({
          content: v.string(),
          createdAt: v.number(),
          senderId: v.string(),
          isSystem: v.boolean(),
        }),
        v.null()
      ),
      messageCount: v.number(),
      isBlocked: v.boolean(),
      blockReason: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    // Get all bookings that have messages
    const allMessages = await ctx.db.query("messages").collect();

    // Group by bookingId and get unique booking IDs
    const bookingMessageMap = new Map<Id<"bookings">, typeof allMessages>();
    for (const msg of allMessages) {
      if (!bookingMessageMap.has(msg.bookingId)) {
        bookingMessageMap.set(msg.bookingId, []);
      }
      bookingMessageMap.get(msg.bookingId)!.push(msg);
    }

    const conversations = await Promise.all(
      Array.from(bookingMessageMap.entries()).map(async ([bookingId, messages]) => {
        const booking = await ctx.db.get(bookingId);
        if (!booking) return null;

        // Sort messages by createdAt
        messages.sort((a, b) => a.createdAt - b.createdAt);
        const lastMessage = messages[messages.length - 1];

        // Check block status
        const block = await ctx.db
          .query("chatBlocks")
          .withIndex("by_bookingId", (q) => q.eq("bookingId", bookingId))
          .first();

        // Get item
        const item = await ctx.db.get(booking.itemId);

        // Get owner and renter profiles
        const ownerProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", booking.ownerId))
          .first();
        const renterProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", booking.renterId))
          .first();

        return {
          bookingId: booking._id,
          booking: {
            _id: booking._id,
            status: booking.status,
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalPrice: booking.totalPrice,
          },
          item: item
            ? { _id: item._id, title: item.title, images: item.images }
            : null,
          owner: ownerProfile
            ? {
                userId: booking.ownerId,
                firstName: ownerProfile.firstName,
                lastName: ownerProfile.lastName,
                imageUrl: ownerProfile.imageUrl,
              }
            : null,
          renter: renterProfile
            ? {
                userId: booking.renterId,
                firstName: renterProfile.firstName,
                lastName: renterProfile.lastName,
                imageUrl: renterProfile.imageUrl,
              }
            : null,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
                isSystem: lastMessage.type === "system" || lastMessage.senderId === "SYSTEM",
              }
            : null,
          messageCount: messages.length,
          isBlocked: block !== null,
          blockReason: block?.reason,
        };
      })
    );

    return conversations
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0));
  },
});

/**
 * Get messages for a booking (admin view - no participant auth)
 */
export const getMessagesForBookingAdmin = query({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      bookingId: v.id("bookings"),
      senderId: v.string(),
      content: v.string(),
      read: v.boolean(),
      type: v.optional(v.union(v.literal("user"), v.literal("system"))),
      createdAt: v.number(),
      senderProfile: v.union(
        v.object({
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
        v.null()
      ),
    })
  ),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_booking_and_created", (q) => q.eq("bookingId", args.bookingId))
      .collect();

    const messagesWithProfiles = await Promise.all(
      messages.map(async (message) => {
        if (message.senderId === "SYSTEM" || message.type === "system") {
          return {
            ...message,
            senderProfile: {
              firstName: "PODELI.RS" as string | undefined,
              lastName: undefined,
              imageUrl: undefined,
            },
          };
        }

        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", message.senderId))
          .first();
        return {
          ...message,
          senderProfile: profile
            ? {
                firstName: profile.firstName,
                lastName: profile.lastName,
                imageUrl: profile.imageUrl,
              }
            : null,
        };
      })
    );

    return messagesWithProfiles;
  },
});

/**
 * Get booking details for admin chat view
 */
export const getBookingForChatAdmin = query({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.union(
    v.object({
      booking: v.object({
        _id: v.id("bookings"),
        status: v.string(),
        startDate: v.string(),
        endDate: v.string(),
        totalPrice: v.number(),
      }),
      item: v.union(
        v.object({
          _id: v.id("items"),
          title: v.string(),
          images: v.array(v.id("_storage")),
          shortId: v.optional(v.string()),
          slug: v.optional(v.string()),
        }),
        v.null()
      ),
      owner: v.union(
        v.object({
          userId: v.string(),
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
        v.null()
      ),
      renter: v.union(
        v.object({
          userId: v.string(),
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
        v.null()
      ),
      isBlocked: v.boolean(),
      blockReason: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    const item = await ctx.db.get(booking.itemId);

    const ownerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", booking.ownerId))
      .first();
    const renterProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", booking.renterId))
      .first();

    const block = await ctx.db
      .query("chatBlocks")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .first();

    return {
      booking: {
        _id: booking._id,
        status: booking.status,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
      },
      item: item
        ? {
            _id: item._id,
            title: item.title,
            images: item.images,
            shortId: item.shortId,
            slug: item.slug,
          }
        : null,
      owner: ownerProfile
        ? {
            userId: booking.ownerId,
            firstName: ownerProfile.firstName,
            lastName: ownerProfile.lastName,
            imageUrl: ownerProfile.imageUrl,
          }
        : null,
      renter: renterProfile
        ? {
            userId: booking.renterId,
            firstName: renterProfile.firstName,
            lastName: renterProfile.lastName,
            imageUrl: renterProfile.imageUrl,
          }
        : null,
      isBlocked: block !== null,
      blockReason: block?.reason,
    };
  },
});
