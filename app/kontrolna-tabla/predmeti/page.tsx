import { DashboardShell } from "../_components/DashboardShell";
import { ItemsList } from "./_components/ItemsList";
import { IncomingBookings } from "./_components/IncomingBookings";

export default function PredmetiPage() {
  return (
    <DashboardShell mode="podeli">
      <div className="space-y-8">
        <ItemsList />
        <IncomingBookings />
      </div>
    </DashboardShell>
  );
}
