import { clerkClient } from "@clerk/nextjs/server";

export async function getUsersByIdsUncaped(ids: string[]) {
  const client = await clerkClient();
  const paginated = await client.users.getUserList({
    userId: ids,
    limit: ids.length,
  });

  return paginated.data;
}
