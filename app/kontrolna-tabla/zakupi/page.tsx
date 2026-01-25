import { DashboardShell } from "../_components/DashboardShell";
import { RenterBookingsList } from "./_components/RenterBookingsList";

export default function ZakupiPage() {
  return (
    <DashboardShell mode="zakupi">
      <RenterBookingsList />
    </DashboardShell>
  );
}
