import { PurchaseInquiries } from "@/components/kontrolna-tabla/PurchaseInquiries";
import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { RenterBookingsList } from "@/components/kontrolna-tabla/zakupi/RenterBookingsList";

export default function ZakupiPage() {
  return (
    <DashboardShell context="zakupi" section="main">
      <RenterBookingsList />
      <PurchaseInquiries role="buyer" />
    </DashboardShell>
  );
}
