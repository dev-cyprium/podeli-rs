import { DashboardShell } from "../_components/DashboardShell";
import { ZakupiEmptyState } from "../_components/ZakupiEmptyState";

export default function ZakupiPage() {
  return (
    <DashboardShell mode="zakupi">
      <ZakupiEmptyState />
    </DashboardShell>
  );
}
