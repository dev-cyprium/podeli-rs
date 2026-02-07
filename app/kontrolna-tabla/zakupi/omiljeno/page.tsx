import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { FavoritesList } from "@/components/kontrolna-tabla/zakupi/FavoritesList";

export default function OmiljenoPage() {
  return (
    <DashboardShell context="zakupi" section="omiljeno">
      <FavoritesList />
    </DashboardShell>
  );
}
