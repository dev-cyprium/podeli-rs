"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { clerkClient } from "@clerk/nextjs/server";

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
    }));
  },
});
