import { DashboardShell } from "@/components/kontrolna-tabla/DashboardShell";
import { ChatPanel } from "@/components/kontrolna-tabla/poruke/ChatPanel";
import { Id } from "@/convex/_generated/dataModel";

interface ChatPageProps {
  params: Promise<{
    bookingId: string;
  }>;
}

export default async function ZakupiChatPage({ params }: ChatPageProps) {
  const { bookingId } = await params;

  return (
    <DashboardShell context="zakupi" section="poruke">
      <ChatPanel bookingId={bookingId as Id<"bookings">} context="zakupi" />
    </DashboardShell>
  );
}
