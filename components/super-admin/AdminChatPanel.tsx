"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { ChatMessageList } from "@/components/kontrolna-tabla/poruke/ChatMessageList";
import {
  ArrowLeft,
  MessageSquare,
  ShieldAlert,
  ShieldBan,
  ShieldOff,
  Send,
  Loader2,
} from "lucide-react";

interface AdminChatPanelProps {
  bookingId: Id<"bookings">;
}

export function AdminChatPanel({ bookingId }: AdminChatPanelProps) {
  const [systemContent, setSystemContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatData = useQuery(api.adminChat.getBookingForChatAdmin, { bookingId });
  const messages = useQuery(api.adminChat.getMessagesForBookingAdmin, { bookingId });

  const sendSystemMessage = useMutation(api.messages.sendSystemMessage);
  const unblockUser = useMutation(api.chatBlocks.unblockUser);

  // Viewport height minus SuperAdmin header (4rem) and main padding (1.5rem top + 1.5rem bottom = 3rem, sm: 2rem + 2rem = 4rem)
  // Use negative margins to break out of the shell padding
  const chatHeight = "h-[calc(100dvh-4rem)]";

  if (chatData === undefined || messages === undefined) {
    return (
      <div className={`-mx-4 -my-6 sm:-mx-6 sm:-my-8 flex ${chatHeight} items-center justify-center bg-[#f0f0f0]`}>
        <p className="text-sm text-muted-foreground">Učitavanje...</p>
      </div>
    );
  }

  if (chatData === null) {
    return (
      <div className={`-mx-4 -my-6 sm:-mx-6 sm:-my-8 flex ${chatHeight} flex-col items-center justify-center gap-4 bg-[#f0f0f0]`}>
        <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Razgovor nije pronađen.
        </p>
        <Button variant="outline" asChild>
          <Link href="/super-admin/poruke">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Nazad
          </Link>
        </Button>
      </div>
    );
  }

  const { booking, item, owner, renter, isBlocked, blockReason } = chatData;

  const handleSendSystem = async () => {
    const trimmed = systemContent.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      await sendSystemMessage({ bookingId, content: trimmed });
      setSystemContent("");
    } catch (error) {
      console.error("Failed to send system message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleUnblock = async () => {
    await unblockUser({ bookingId });
  };

  return (
    <div className={`-mx-4 -my-6 sm:-mx-6 sm:-my-8 flex ${chatHeight} flex-col overflow-hidden border-x border-border bg-[#f0f0f0]`}>
      {/* Header */}
      <div className="border-b border-border bg-card p-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/super-admin/poruke">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-podeli-dark">
              {item?.title ?? "Predmet"}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                Vlasnik: <span className="font-medium text-podeli-dark">{owner?.firstName ?? "?"}</span>
              </span>
              <span>
                Zakupac: <span className="font-medium text-podeli-dark">{renter?.firstName ?? "?"}</span>
              </span>
              <BookingStatusBadge status={booking.status as "pending" | "confirmed" | "agreed" | "nije_isporucen" | "isporucen" | "vracen" | "cancelled"} />
            </div>
          </div>
        </div>

        {/* Block status banner */}
        {isBlocked && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <ShieldBan className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">Razgovor je blokiran</span>
              {blockReason && (
                <span className="text-xs text-red-500">— {blockReason}</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnblock}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
              Odblokiraj
            </Button>
          </div>
        )}
      </div>

      {/* Messages - read only */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <ChatMessageList
          messages={messages}
          isOwnMessage={(msg) => {
            // In admin view, show renter messages on right, owner on left
            return msg.senderId !== owner?.userId && msg.senderId !== "SYSTEM";
          }}
        />
      </div>

      {/* System message input */}
      <div className="border-t border-amber-300 bg-amber-50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-800">
            Pošalji upozorenje kao PODELI.RS
          </span>
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            value={systemContent}
            onChange={(e) => setSystemContent(e.target.value)}
            placeholder="Upišite sistemsku poruku..."
            className="min-h-[44px] max-h-32 resize-none border-amber-300 bg-white"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendSystem();
              }
            }}
          />
          <Button
            onClick={handleSendSystem}
            disabled={!systemContent.trim() || isSending}
            size="icon"
            className="h-11 w-11 flex-shrink-0 bg-amber-600 text-white hover:bg-amber-700"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
