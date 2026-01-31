import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { ItemsList } from "@/components/kontrolna-tabla/predmeti/ItemsList";
import { IncomingBookings } from "@/components/kontrolna-tabla/predmeti/IncomingBookings";
import { ContactPreferencesPanel } from "@/components/kontrolna-tabla/predmeti/ContactPreferencesPanel";
import { PlanUsageWidget } from "@/components/kontrolna-tabla/PlanUsageWidget";

export default function PredmetiPage() {
  return (
    <DashboardShell context="podeli" section="main">
      <div className="space-y-8">
        <ContactPreferencesPanel />
        <PlanUsageWidget />
        <ItemsList />
        <IncomingBookings />
      </div>
    </DashboardShell>
  );
}
