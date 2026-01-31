import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { ConversationList } from "@/components/kontrolna-tabla/poruke/ConversationList";

export default function ZakupiPorukePage() {
  return (
    <DashboardShell context="zakupi" section="poruke">
      <ConversationList />
    </DashboardShell>
  );
}
