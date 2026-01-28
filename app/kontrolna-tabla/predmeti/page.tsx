import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { ItemsList } from "@/components/kontrolna-tabla/predmeti/ItemsList";
import { IncomingBookings } from "@/components/kontrolna-tabla/predmeti/IncomingBookings";
import { PlanUsageWidget } from "@/components/kontrolna-tabla/PlanUsageWidget";

export default function PredmetiPage() {
  return (
    <DashboardShell mode="podeli">
      <div className="space-y-8">
        <PlanUsageWidget />
        <ItemsList />
        <IncomingBookings />
      </div>
    </DashboardShell>
  );
}
