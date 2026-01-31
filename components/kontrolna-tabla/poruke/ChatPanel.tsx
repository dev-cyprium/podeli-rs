"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { AgreementStatus } from "@/components/booking/AgreementStatus";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import {
  ArrowLeft,
  MessageSquare,
  Handshake,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";
import { getItemUrl } from "@/lib/utils";

interface ChatPanelProps {
  bookingId: Id<"bookings">;
}

export function ChatPanel({ bookingId }: ChatPanelProps) {
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatData = useQuery(api.messages.getBookingForChat, { bookingId });
  const messages = useQuery(api.messages.getMessagesForBooking, { bookingId });
  const hasMessages = useQuery(api.messages.hasMessages, { bookingId });

  const sendMessage = useMutation(api.messages.sendMessage);
  const agreeToBooking = useMutation(api.bookings.agreeToBooking);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);

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

  if (chatData === undefined || messages === undefined) {
    return (
      <Card className="flex h-[600px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Učitavanje...</p>
      </Card>
    );
  }

  if (chatData === null) {
    return (
      <Card className="flex h-[600px] flex-col items-center justify-center gap-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Razgovor nije pronađen ili nemate pristup.
        </p>
        <Button variant="outline" asChild>
          <Link href="/kontrolna-tabla/poruke">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Nazad na poruke
          </Link>
        </Button>
      </Card>
    );
  }

  const { booking, item, otherParty, isOwner, canChat } = chatData;
  const itemUrl =
    item?.shortId && item?.slug
      ? getItemUrl({ shortId: item.shortId, slug: item.slug })
      : "#";

  const myAgreed = isOwner ? booking.ownerAgreed : booking.renterAgreed;

  const canAgree = booking.status === "confirmed" && !myAgreed && hasMessages;

  const handleSendMessage = async (content: string) => {
    await sendMessage({ bookingId, content });
  };

  const handleAgree = async () => {
    await agreeToBooking({ id: bookingId });
  };

  return (
    <Card className="flex h-[600px] flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/kontrolna-tabla/poruke">
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
            <p className="text-xs text-muted-foreground">
              {isOwner ? "Zakupac" : "Vlasnik"}:{" "}
              {otherParty?.firstName ?? "Korisnik"}
            </p>
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

          <BookingStatusBadge status={booking.status as "pending" | "confirmed" | "agreed" | "nije_isporucen" | "isporucen" | "vracen" | "cancelled"} />
        </div>
      </div>

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
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Nema poruka u ovom razgovoru.
            </p>
            {canChat && (
              <p className="mt-1 text-xs text-muted-foreground">
                Pošaljite prvu poruku da započnete razgovor.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                content={message.content}
                senderName={message.senderProfile?.firstName}
                senderImage={message.senderProfile?.imageUrl}
                createdAt={message.createdAt}
                isOwnMessage={message.senderId === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {canChat ? (
        <ChatInput onSend={handleSendMessage} />
      ) : (
        <div className="border-t border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          {booking.status === "vracen"
            ? "Razgovor je završen. Predmet je vraćen. Poruke će biti obrisane nakon 30 dana."
            : "Poruke nisu dozvoljene za ovu rezervaciju."}
        </div>
      )}
    </Card>
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
