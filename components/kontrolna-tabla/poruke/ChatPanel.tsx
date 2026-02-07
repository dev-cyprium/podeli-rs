"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { AgreementStatus } from "@/components/booking/AgreementStatus";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MessageSquare,
  Handshake,
  ExternalLink,
  Calendar,
  MoreVertical,
  ShieldBan,
  ShieldOff,
  XCircle,
  Mail,
  Loader2,
} from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";
import { getItemUrl } from "@/lib/utils";
import { formatSerbianDate } from "@/lib/serbian-date";

interface ChatPanelProps {
  bookingId: Id<"bookings">;
  context: "podeli" | "zakupi";
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

function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatLastSeen(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMins < 1) return "Viđen/a upravo";
  if (diffMins < 60) return `Viđen/a pre ${diffMins} min`;
  if (diffHours < 24) return `Viđen/a pre ${diffHours} h`;
  return `Viđen/a ${formatSerbianDate(timestamp, "short")}`;
}

export function ChatPanel({ bookingId, context }: ChatPanelProps) {
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [nudgeSent, setNudgeSent] = useState(false);
  const [nudgeSending, setNudgeSending] = useState(false);

  const backUrl =
    context === "podeli"
      ? "/kontrolna-tabla/predmeti/poruke"
      : "/kontrolna-tabla/zakupi/poruke";

  const chatData = useQuery(api.messages.getBookingForChat, { bookingId });
  const messages = useQuery(api.messages.getMessagesForBooking, { bookingId });
  const hasMessages = useQuery(api.messages.hasMessages, { bookingId });
  const blockStatus = useQuery(api.chatBlocks.getBlockStatus, { bookingId });
  const presence = useQuery(api.messages.getOtherPartyPresence, { bookingId });

  const sendMessage = useMutation(api.messages.sendMessage);
  const agreeToBooking = useMutation(api.bookings.agreeToBooking);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);
  const blockUser = useMutation(api.chatBlocks.blockUser);
  const unblockUser = useMutation(api.chatBlocks.unblockUser);
  const cancelBooking = useMutation(api.bookings.cancelBooking);
  const sendEmailNudge = useMutation(api.messages.sendEmailNudge);

  // Mark messages as read and update presence periodically
  useEffect(() => {
    if (!chatData) return;

    // Mark as read immediately when chat opens
    markAsRead({ bookingId });

    // Refresh presence every 30 seconds while viewing the chat
    const interval = setInterval(() => {
      markAsRead({ bookingId });
    }, 30000);

    return () => clearInterval(interval);
  }, [bookingId, chatData, markAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Chat uses viewport height minus the dashboard header (4rem)
  const chatHeight = "h-[calc(100dvh-4rem)]";

  if (chatData === undefined || messages === undefined) {
    return (
      <div className={`flex ${chatHeight} items-center justify-center rounded-xl bg-[#f0f0f0]`}>
        <p className="text-sm text-muted-foreground">Učitavanje...</p>
      </div>
    );
  }

  if (chatData === null) {
    return (
      <div className={`flex ${chatHeight} flex-col items-center justify-center gap-4 rounded-xl bg-[#f0f0f0]`}>
        <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Razgovor nije pronađen ili nemate pristup.
        </p>
        <Button variant="outline" asChild>
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Nazad na poruke
          </Link>
        </Button>
      </div>
    );
  }

  const { booking, item, otherParty, isOwner, canChat } = chatData;
  const itemUrl =
    item?.shortId && item?.slug
      ? getItemUrl({ shortId: item.shortId, slug: item.slug })
      : "#";

  const myAgreed = isOwner ? booking.ownerAgreed : booking.renterAgreed;
  const canAgree = booking.status === "confirmed" && !myAgreed && hasMessages;

  const isBlocked = blockStatus?.isBlocked ?? false;
  const blockedByMe = blockStatus?.blockedByMe ?? false;
  const blockedByOther = blockStatus?.blockedByOther ?? false;

  // Owner can decline/cancel a confirmed booking from chat
  const canDecline = isOwner && booking.status === "confirmed";

  const handleSendMessage = async (content: string) => {
    await sendMessage({ bookingId, content });
  };

  const handleAgree = async () => {
    await agreeToBooking({ id: bookingId });
  };

  const handleBlock = async () => {
    await blockUser({ bookingId, reason: blockReason || undefined });
    setBlockDialogOpen(false);
    setBlockReason("");
  };

  const handleUnblock = async () => {
    await unblockUser({ bookingId });
  };

  const handleDecline = async () => {
    await cancelBooking({ id: bookingId });
    setDeclineDialogOpen(false);
  };

  const handleEmailNudge = async () => {
    setNudgeSending(true);
    try {
      await sendEmailNudge({ bookingId });
      setNudgeSent(true);
    } catch (error) {
      console.error("Failed to send email nudge:", error);
    } finally {
      setNudgeSending(false);
    }
  };

  // Show nudge button when other party has been offline for 1+ hour
  const ONE_HOUR = 60 * 60 * 1000;
  const showNudge =
    canChat &&
    !isBlocked &&
    !nudgeSent &&
    presence &&
    !presence.isOnline &&
    Date.now() - presence.lastSeenAt >= ONE_HOUR;

  // Build grouped messages with date separators
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            Nema poruka u ovom razgovoru.
          </p>
          {canChat && !isBlocked && (
            <p className="mt-1 text-xs text-muted-foreground">
              Pošaljite prvu poruku da započnete razgovor.
            </p>
          )}
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
      const isOwnMessage = msg.senderId === user?.id;

      // Grouping: same sender, same day, not system
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
        <div
          key={msg._id}
          className={isFirstInGroup ? "mt-3" : "mt-0.5"}
        >
          <MessageBubble
            content={msg.content}
            senderName={msg.senderProfile?.firstName}
            senderImage={msg.senderProfile?.imageUrl}
            createdAt={msg.createdAt}
            isOwnMessage={isOwnMessage}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
            isSystemMessage={isSystem}
          />
        </div>
      );
    }

    return <>{elements}</>;
  };

  const inputDisabled = isBlocked || !canChat;

  return (
    <div className={`flex ${chatHeight} flex-col overflow-hidden rounded-xl border border-border bg-[#f0f0f0]`}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card p-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={backUrl}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex flex-1 items-center gap-3 overflow-hidden">
          <Link href={itemUrl} className="shrink-0">
            <ItemThumbnail images={item?.images ?? []} />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={itemUrl}
                className="truncate font-semibold text-podeli-dark hover:text-podeli-accent"
              >
                {item?.title ?? "Predmet"}
              </Link>
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground">
                {isOwner ? "Zakupac" : "Vlasnik"}:{" "}
                {otherParty?.firstName ?? "Korisnik"}
              </p>
              {/* Online status */}
              {presence?.isOnline && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[10px] text-green-600">Na mreži</span>
                </span>
              )}
              {presence && !presence.isOnline && (
                <span className="text-[10px] text-muted-foreground">
                  {formatLastSeen(presence.lastSeenAt)}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-podeli-accent/10 px-2 py-1 text-xs">
                <Calendar className="h-3.5 w-3.5 text-podeli-accent" />
                <span className="font-semibold text-podeli-dark">Preuzimanje:</span>
                <span className="font-bold text-podeli-accent">
                  <DateDisplay value={booking.startDate} format="short" />
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-podeli-blue/10 px-2 py-1 text-xs">
                <Calendar className="h-3.5 w-3.5 text-podeli-blue" />
                <span className="font-semibold text-podeli-dark">Vraćanje:</span>
                <span className="font-bold text-podeli-blue">
                  <DateDisplay value={booking.endDate} format="short" />
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BookingStatusBadge status={booking.status as "pending" | "confirmed" | "agreed" | "nije_isporucen" | "isporucen" | "vracen" | "cancelled"} />

            {/* 3-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isBlocked && (
                  <DropdownMenuItem
                    onClick={() => setBlockDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <ShieldBan className="mr-2 h-4 w-4" />
                    Blokiraj korisnika
                  </DropdownMenuItem>
                )}
                {blockedByMe && (
                  <DropdownMenuItem onClick={handleUnblock}>
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Odblokiraj
                  </DropdownMenuItem>
                )}
                {canDecline && (
                  <DropdownMenuItem
                    onClick={() => setDeclineDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Odbij rezervaciju
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Block banner */}
      {isBlocked && (
        <div className="border-b border-border bg-red-50 px-4 py-2">
          {blockedByMe ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700">Blokirali ste ovog korisnika.</p>
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
          ) : blockedByOther ? (
            <p className="text-sm text-red-700">Ovaj korisnik vas je blokirao.</p>
          ) : null}
        </div>
      )}

      {/* Agreement banner for confirmed bookings */}
      {booking.status === "confirmed" && (
        <div className="border-b border-border bg-amber-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-800">
                Dogovorite se pre nastavka
              </p>
              <AgreementStatus
                renterAgreed={booking.renterAgreed}
                ownerAgreed={booking.ownerAgreed}
                isOwner={isOwner}
                className="mt-1"
              />
            </div>
            {canAgree && (
              <Button
                size="sm"
                onClick={handleAgree}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Handshake className="mr-1 h-4 w-4" />
                Potvrdi dogovor
              </Button>
            )}
          </div>
          {!hasMessages && (
            <p className="mt-2 text-xs text-amber-700">
              Razmenite barem jednu poruku pre potvrde dogovora.
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      {/* Email nudge banner */}
      {showNudge && (
        <div className="flex items-center justify-between border-t border-border bg-podeli-blue/5 px-4 py-2">
          <p className="text-xs text-muted-foreground">
            {otherParty?.firstName ?? "Korisnik"} nije na mreži već duže vreme.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEmailNudge}
            disabled={nudgeSending}
            className="text-podeli-blue border-podeli-blue/30 hover:bg-podeli-blue/10"
          >
            {nudgeSending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mail className="mr-1.5 h-3.5 w-3.5" />
            )}
            Pošalji email
          </Button>
        </div>
      )}
      {nudgeSent && (
        <div className="border-t border-border bg-green-50 px-4 py-2 text-center">
          <p className="text-xs text-green-700">
            Email obaveštenje je poslato.
          </p>
        </div>
      )}

      {/* Input */}
      {!inputDisabled ? (
        <ChatInput onSend={handleSendMessage} />
      ) : (
        <div className="border-t border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          {isBlocked
            ? "Razgovor je blokiran. Poruke nisu moguće."
            : booking.status === "vracen"
              ? "Razgovor je završen. Predmet je vraćen."
              : booking.status === "cancelled"
                ? "Rezervacija je otkazana."
                : "Poruke nisu dozvoljene za ovu rezervaciju."}
        </div>
      )}

      {/* Block dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blokiraj korisnika</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da blokirate ovog korisnika? Neće moći da vam šalje poruke u ovom razgovoru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Razlog blokiranja (opciono)"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="mt-2"
            rows={2}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <ShieldBan className="mr-1.5 h-4 w-4" />
              Blokiraj
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline booking dialog */}
      <AlertDialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odbij rezervaciju</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da odbijete ovu rezervaciju? Ova akcija se ne može poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDecline}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Odbij
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ItemThumbnail({ images }: { images: Id<"_storage">[] }) {
  const imageUrl = useQuery(
    api.items.getImageUrl,
    images[0] ? { storageId: images[0] } : "skip"
  );

  return (
    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-muted">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="Predmet"
          fill
          sizes="40px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
          Nema
        </div>
      )}
    </div>
  );
}
