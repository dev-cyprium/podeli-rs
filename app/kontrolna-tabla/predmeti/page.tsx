import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { ItemsList } from "@/components/kontrolna-tabla/predmeti/ItemsList";
import { IncomingBookings } from "@/components/kontrolna-tabla/predmeti/IncomingBookings";
import { ContactPreferencesPanel } from "@/components/kontrolna-tabla/predmeti/ContactPreferencesPanel";
import { PlanUsageWidget } from "@/components/kontrolna-tabla/PlanUsageWidget";
import { ClaimedOffersList } from "@/components/offers/ClaimedOffersList";

export default function PredmetiPage() {
  return (
    <DashboardShell context="podeli" section="main">
      <div className="space-y-8">
        <ClaimedOffersList />
        <ContactPreferencesPanel />
        <PlanUsageWidget />
        <ItemsList />
        <IncomingBookings />
      </div>
    </DashboardShell>
  );
}
