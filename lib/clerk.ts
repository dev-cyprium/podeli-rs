import { clerkClient } from "@clerk/nextjs/server";
import { UserIdentity } from "convex/server";

export async function getUsersByIdsUncaped(ids: string[]) {
  const client = await clerkClient();
  const paginated = await client.users.getUserList({
    userId: ids,
    limit: ids.length,
  });

  return paginated.data;
}

export async function requireIdentity(ctx: {
  auth: { getUserIdentity: () => Promise<UserIdentity | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Morate biti prijavljeni.");
  }
  return identity;
}
