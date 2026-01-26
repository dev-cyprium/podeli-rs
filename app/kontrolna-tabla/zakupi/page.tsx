import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { RenterBookingsList } from "@/components/kontrolna-tabla/zakupi/RenterBookingsList";

export default function ZakupiPage() {
  return (
    <DashboardShell mode="zakupi">
      <RenterBookingsList />
    </DashboardShell>
  );
}
