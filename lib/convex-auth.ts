import { UserIdentity } from "convex/server";

export async function requireIdentity(ctx: {
  auth: { getUserIdentity: () => Promise<UserIdentity | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Morate biti prijavljeni.");
  }
  return identity;
}
