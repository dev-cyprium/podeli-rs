import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { requireIdentity } from "../lib/convex-auth";

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await requireIdentity(ctx);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .first();
  if (!profile?.superAdmin)
    throw new ConvexError("Samo super-admin može pristupiti.");
  return identity;
}
