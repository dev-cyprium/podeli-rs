import { DashboardShell } from "../_components/DashboardShell";
import { ItemsList } from "./_components/ItemsList";

export default function PredmetiPage() {
  return (
    <DashboardShell mode="podeli">
      <ItemsList />
    </DashboardShell>
  );
}
