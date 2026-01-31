import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { MyOwnerReviews } from "@/components/kontrolna-tabla/predmeti/MyOwnerReviews";

export default function PredmetiOcenePage() {
  return (
    <DashboardShell context="podeli" section="ocene">
      <MyOwnerReviews />
    </DashboardShell>
  );
}
