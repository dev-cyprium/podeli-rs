import { AdminChatPanel } from "@/components/super-admin/AdminChatPanel";
import { Id } from "@/convex/_generated/dataModel";

interface AdminChatPageProps {
  params: Promise<{
    bookingId: string;
  }>;
}

export default async function AdminChatPage({ params }: AdminChatPageProps) {
  const { bookingId } = await params;

  return <AdminChatPanel bookingId={bookingId as Id<"bookings">} />;
}
