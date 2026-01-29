import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getConvexAuthToken } from "@/lib/clerk";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { CouponsPanel } from "@/components/super-admin/CouponsPanel";

export default async function SuperAdminPage() {
  const token = await getConvexAuthToken();
  const isSuperAdmin = await fetchQuery(
    api.profiles.getIsCurrentUserSuperAdmin,
    {},
    { token },
  );

  if (!isSuperAdmin) {
    redirect("/kontrolna-tabla");
  }

  return (
    <SuperAdminShell>
      <CouponsPanel />
    </SuperAdminShell>
  );
}
