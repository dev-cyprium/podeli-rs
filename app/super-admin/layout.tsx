import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getConvexAuthToken } from "@/lib/clerk";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getConvexAuthToken();
  const isSuperAdmin = await fetchQuery(
    api.profiles.getIsCurrentUserSuperAdmin,
    {},
    { token },
  );

  if (!isSuperAdmin) {
    redirect("/kontrolna-tabla");
  }

  return <SuperAdminShell>{children}</SuperAdminShell>;
}
