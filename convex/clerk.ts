"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { clerkClient } from "@clerk/nextjs/server";
import { api, internal } from "./_generated/api";

export const getUsersByIds = action({
  args: {
    userIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const client = await clerkClient();
    const paginated = await client.users.getUserList({
      userId: args.userIds,
      limit: args.userIds.length,
    });

    // Transform Clerk User objects to simple snapshots
    return paginated.data.map((user) => ({
      id: user.id,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      email: user.emailAddresses[0]?.emailAddress || null,
      imageUrl: user.imageUrl || null,
    }));
  },
});

/** Sync missing Clerk users into profiles. Super-admin only. */
export const syncMissingProfilesFromClerk = action({
  args: {},
  returns: v.object({ created: v.number(), total: v.number() }),
  handler: async (ctx) => {
    const isSuperAdmin = await ctx.runQuery(
      api.profiles.getIsCurrentUserSuperAdmin,
      {}
    );
    if (!isSuperAdmin) {
      throw new Error("Samo super-admin može pokrenuti ovu akciju.");
    }

    const client = await clerkClient();
    const limit = 100;
    let offset = 0;
    let totalFetched = 0;
    let totalCreated = 0;

    while (true) {
      const paginated = await client.users.getUserList({
        limit,
        offset,
      });

      if (paginated.data.length === 0) break;

      const users = paginated.data.map((u) => ({
        userId: u.id,
        firstName: u.firstName ?? null,
        lastName: u.lastName ?? null,
        email: u.emailAddresses[0]?.emailAddress ?? null,
        imageUrl: u.imageUrl ?? null,
      }));

      const result = await ctx.runMutation(internal.profiles.createProfilesForUsers, {
        users,
      });

      totalFetched += paginated.data.length;
      totalCreated += result.created;

      if (paginated.data.length < limit) break;
      offset += limit;
    }

    return { created: totalCreated, total: totalFetched };
  },
});
