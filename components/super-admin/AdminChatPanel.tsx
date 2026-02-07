"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { MessageBubble } from "@/components/kontrolna-tabla/poruke/MessageBubble";
import { formatSerbianDate } from "@/lib/serbian-date";
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

function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getDateSeparatorLabel(timestamp: number): string {
  const msgDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    msgDate.getFullYear() === today.getFullYear() &&
    msgDate.getMonth() === today.getMonth() &&
    msgDate.getDate() === today.getDate()
  ) {
    return "Danas";
  }
  if (
    msgDate.getFullYear() === yesterday.getFullYear() &&
    msgDate.getMonth() === yesterday.getMonth() &&
    msgDate.getDate() === yesterday.getDate()
  ) {
    return "Juče";
  }
  return formatSerbianDate(timestamp, "short");
}

export function AdminChatPanel({ bookingId }: AdminChatPanelProps) {
  const [systemContent, setSystemContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatData = useQuery(api.adminChat.getBookingForChatAdmin, { bookingId });
  const messages = useQuery(api.adminChat.getMessagesForBookingAdmin, { bookingId });

  const sendSystemMessage = useMutation(api.messages.sendSystemMessage);
  const unblockUser = useMutation(api.chatBlocks.unblockUser);

  if (chatData === undefined || messages === undefined) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl bg-[#f0f0f0]">
        <p className="text-sm text-muted-foreground">Učitavanje...</p>
      </div>
    );
  }

  if (chatData === null) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl bg-[#f0f0f0]">
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

  // Build grouped messages with date separators
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            Nema poruka u ovom razgovoru.
          </p>
        </div>
      );
    }

    const elements: React.ReactNode[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const prevMsg = i > 0 ? messages[i - 1] : null;
      const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;

      // Date separator
      if (!prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt)) {
        elements.push(
          <div key={`date-${msg.createdAt}`} className="flex justify-center py-2">
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-muted-foreground shadow-sm">
              {getDateSeparatorLabel(msg.createdAt)}
            </span>
          </div>
        );
      }

      const isSystem = msg.type === "system" || msg.senderId === "SYSTEM";
      // In admin view, show owner messages on left and renter messages on right
      const isOwnerMessage = msg.senderId === owner?.userId;

      const sameSenderAsPrev =
        prevMsg &&
        prevMsg.senderId === msg.senderId &&
        !isSystem &&
        prevMsg.type !== "system" &&
        prevMsg.senderId !== "SYSTEM" &&
        isSameDay(prevMsg.createdAt, msg.createdAt);
      const sameSenderAsNext =
        nextMsg &&
        nextMsg.senderId === msg.senderId &&
        !isSystem &&
        nextMsg.type !== "system" &&
        nextMsg.senderId !== "SYSTEM" &&
        isSameDay(nextMsg.createdAt, msg.createdAt);

      const isFirstInGroup = !sameSenderAsPrev;
      const isLastInGroup = !sameSenderAsNext;

      elements.push(
        <div key={msg._id} className={isFirstInGroup ? "mt-3" : "mt-0.5"}>
          <MessageBubble
            content={msg.content}
            senderName={msg.senderProfile?.firstName}
            senderImage={msg.senderProfile?.imageUrl}
            createdAt={msg.createdAt}
            isOwnMessage={!isOwnerMessage && !isSystem}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
            isSystemMessage={isSystem}
          />
        </div>
      );
    }

    return <>{elements}</>;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-[#f0f0f0]">
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
        {renderMessages()}
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
