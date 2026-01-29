import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getConvexAuthToken(): Promise<string | undefined> {
  const authObj = await auth();
  const token = await authObj.getToken({ template: "convex" });
  return token ?? undefined;
}

export async function getUsersByIdsUncaped(ids: string[]) {
  const client = await clerkClient();
  const paginated = await client.users.getUserList({
    userId: ids,
    limit: ids.length,
  });

  return paginated.data;
}
