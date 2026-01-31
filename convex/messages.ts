import { v, ConvexError } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { requireIdentity } from "@/lib/convex-auth";

// Statuses that allow messaging
const CHAT_ALLOWED_STATUSES = [
  "confirmed",
  "agreed",
  "nije_isporucen",
  "isporucen",
] as const;

/**
 * Send a message in a booking conversation
 */
export const sendMessage = mutation({
  args: {
    bookingId: v.id("bookings"),
    content: v.string(),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError("Rezervacija nije pronađena.");
    }

    // User must be renter or owner
    const isRenter = booking.renterId === userId;
    const isOwner = booking.ownerId === userId;
    if (!isRenter && !isOwner) {
      throw new ConvexError("Nemate pristup ovoj rezervaciji.");
    }

    // Check booking status allows chat
    if (!CHAT_ALLOWED_STATUSES.includes(booking.status as typeof CHAT_ALLOWED_STATUSES[number])) {
      throw new ConvexError("Poruke nisu dozvoljene za ovu rezervaciju.");
    }

    const content = args.content.trim();
    if (!content) {
      throw new ConvexError("Poruka ne može biti prazna.");
    }

    if (content.length > 2000) {
      throw new ConvexError("Poruka je predugačka (maksimalno 2000 karaktera).");
    }

    const now = Date.now();

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      bookingId: args.bookingId,
      senderId: userId,
      content,
      read: false,
      createdAt: now,
    });

    // Check if recipient is currently viewing this chat
    const recipientId = isRenter ? booking.ownerId : booking.renterId;
    const recipientPresence = await ctx.db
      .query("chatPresence")
      .withIndex("by_booking_and_user", (q) =>
        q.eq("bookingId", args.bookingId).eq("userId", recipientId)
      )
      .first();

    // Only send notification if recipient hasn't viewed chat in the last 60 seconds
    const PRESENCE_THRESHOLD = 60 * 1000; // 60 seconds
    const isRecipientViewing =
      recipientPresence && now - recipientPresence.lastSeenAt < PRESENCE_THRESHOLD;

    if (!isRecipientViewing) {
      const item = await ctx.db.get(booking.itemId);

      // Get sender's profile for name
      const senderProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      const senderName = senderProfile?.firstName ?? "Korisnik";

      // Determine the correct link based on who's receiving (owner vs renter)
      const recipientIsOwner = recipientId === booking.ownerId;
      const chatLink = recipientIsOwner
        ? `/kontrolna-tabla/predmeti/poruke/${args.bookingId}`
        : `/kontrolna-tabla/zakupi/poruke/${args.bookingId}`;

      await ctx.db.insert("notifications", {
        userId: recipientId,
        message: `Nova poruka od ${senderName} za "${item?.title ?? "predmet"}".`,
        type: "message_received",
        link: chatLink,
        createdAt: now,
        updatedAt: now,
      });
    }

    return messageId;
  },
});

/**
 * Get messages for a booking conversation
 */
export const getMessagesForBooking = query({
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
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return [];
    }

    // User must be renter or owner
    if (booking.renterId !== userId && booking.ownerId !== userId) {
      throw new ConvexError("Nemate pristup ovoj rezervaciji.");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_booking_and_created", (q) => q.eq("bookingId", args.bookingId))
      .collect();

    // Fetch sender profiles
    const messagesWithProfiles = await Promise.all(
      messages.map(async (message) => {
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
 * Mark messages as read for a booking and update presence
 */
export const markMessagesAsRead = mutation({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return 0;
    }

    // User must be renter or owner
    if (booking.renterId !== userId && booking.ownerId !== userId) {
      return 0;
    }

    const now = Date.now();

    // Update chat presence to indicate user is viewing this chat
    const existingPresence = await ctx.db
      .query("chatPresence")
      .withIndex("by_booking_and_user", (q) =>
        q.eq("bookingId", args.bookingId).eq("userId", userId)
      )
      .first();

    if (existingPresence) {
      await ctx.db.patch(existingPresence._id, { lastSeenAt: now });
    } else {
      await ctx.db.insert("chatPresence", {
        bookingId: args.bookingId,
        userId,
        lastSeenAt: now,
      });
    }

    const otherPartyId = booking.renterId === userId ? booking.ownerId : booking.renterId;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .collect();

    let markedCount = 0;
    for (const message of messages) {
      if (message.senderId === otherPartyId && !message.read) {
        await ctx.db.patch(message._id, { read: true });
        markedCount++;
      }
    }

    return markedCount;
  },
});

/**
 * Get all conversations for the current user
 */
export const getConversations = query({
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
      otherParty: v.union(
        v.object({
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
        }),
        v.null()
      ),
      unreadCount: v.number(),
      isOwner: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    // Get all bookings where user is renter or owner with chat-eligible statuses
    const asRenter = await ctx.db
      .query("bookings")
      .withIndex("by_renter", (q) => q.eq("renterId", userId))
      .collect();

    const asOwner = await ctx.db
      .query("bookings")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const allBookings = [...asRenter, ...asOwner];

    // Filter to only bookings with messages or chat-eligible status
    const conversations = await Promise.all(
      allBookings
        .filter((b) =>
          CHAT_ALLOWED_STATUSES.includes(b.status as typeof CHAT_ALLOWED_STATUSES[number]) ||
          b.status === "vracen" // Allow viewing old conversations
        )
        .map(async (booking) => {
          const isOwner = booking.ownerId === userId;
          const otherPartyId = isOwner ? booking.renterId : booking.ownerId;

          // Get messages for this booking
          const messages = await ctx.db
            .query("messages")
            .withIndex("by_booking_and_created", (q) => q.eq("bookingId", booking._id))
            .collect();

          // Skip if no messages
          if (messages.length === 0) {
            return null;
          }

          const lastMessage = messages[messages.length - 1];
          const unreadCount = messages.filter(
            (m) => m.senderId === otherPartyId && !m.read
          ).length;

          // Get item
          const item = await ctx.db.get(booking.itemId);

          // Get other party profile
          const otherProfile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", otherPartyId))
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
              ? {
                  _id: item._id,
                  title: item.title,
                  images: item.images,
                }
              : null,
            otherParty: otherProfile
              ? {
                  firstName: otherProfile.firstName,
                  lastName: otherProfile.lastName,
                  imageUrl: otherProfile.imageUrl,
                }
              : null,
            lastMessage: lastMessage
              ? {
                  content: lastMessage.content,
                  createdAt: lastMessage.createdAt,
                  senderId: lastMessage.senderId,
                }
              : null,
            unreadCount,
            isOwner,
          };
        })
    );

    // Filter nulls and sort by last message time
    return conversations
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0));
  },
});

/**
 * Get total unread message count for the current user
 */
export const getUnreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }
    const userId = identity.subject;

    // Get all bookings where user is renter or owner
    const asRenter = await ctx.db
      .query("bookings")
      .withIndex("by_renter", (q) => q.eq("renterId", userId))
      .collect();

    const asOwner = await ctx.db
      .query("bookings")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const allBookings = [...asRenter, ...asOwner];

    let totalUnread = 0;

    for (const booking of allBookings) {
      const otherPartyId = booking.ownerId === userId ? booking.renterId : booking.ownerId;

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .collect();

      totalUnread += messages.filter(
        (m) => m.senderId === otherPartyId && !m.read
      ).length;
    }

    return totalUnread;
  },
});

/**
 * Check if any messages exist for a booking (used for agreement guard)
 */
export const hasMessages = query({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return false;
    }

    // User must be renter or owner
    if (booking.renterId !== userId && booking.ownerId !== userId) {
      return false;
    }

    const message = await ctx.db
      .query("messages")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .first();

    return message !== null;
  },
});

/**
 * Internal query to check if messages exist (for use in mutations)
 */
export const hasMessagesInternal = internalQuery({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query("messages")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .first();

    return message !== null;
  },
});

/**
 * Get booking details for chat header
 */
export const getBookingForChat = query({
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
        renterAgreed: v.optional(v.boolean()),
        ownerAgreed: v.optional(v.boolean()),
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
      otherParty: v.union(
        v.object({
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
        v.null()
      ),
      isOwner: v.boolean(),
      canChat: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return null;
    }

    // User must be renter or owner
    const isOwner = booking.ownerId === userId;
    const isRenter = booking.renterId === userId;
    if (!isOwner && !isRenter) {
      return null;
    }

    const otherPartyId = isOwner ? booking.renterId : booking.ownerId;

    // Get item
    const item = await ctx.db.get(booking.itemId);

    // Get other party profile
    const otherProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", otherPartyId))
      .first();

    const canChat = CHAT_ALLOWED_STATUSES.includes(
      booking.status as typeof CHAT_ALLOWED_STATUSES[number]
    );

    return {
      booking: {
        _id: booking._id,
        status: booking.status,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
        renterAgreed: booking.renterAgreed,
        ownerAgreed: booking.ownerAgreed,
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
      otherParty: otherProfile
        ? {
            firstName: otherProfile.firstName,
            lastName: otherProfile.lastName,
            imageUrl: otherProfile.imageUrl,
          }
        : null,
      isOwner,
      canChat,
    };
  },
});
