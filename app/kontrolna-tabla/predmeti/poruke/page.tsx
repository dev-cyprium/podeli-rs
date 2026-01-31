import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { ConversationList } from "@/components/kontrolna-tabla/poruke/ConversationList";

export default function PodeliPorukePage() {
  return (
    <DashboardShell context="podeli" section="poruke">
      <ConversationList />
    </DashboardShell>
  );
}
