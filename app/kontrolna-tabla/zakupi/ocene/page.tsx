import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { MyRenterReviews } from "@/components/kontrolna-tabla/zakupi/MyRenterReviews";

export default function ZakupiOcenePage() {
  return (
    <DashboardShell context="zakupi" section="ocene">
      <MyRenterReviews />
    </DashboardShell>
  );
}
