"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { formatSerbianDate } from "@/lib/serbian-date";
import { MessageSquare, ShieldBan, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "blocked";

interface AdminConversation {
  bookingId: Id<"bookings">;
  booking: {
    _id: Id<"bookings">;
    status: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
  };
  item: {
    _id: Id<"items">;
    title: string;
    images: Id<"_storage">[];
  } | null;
  owner: {
    userId: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  } | null;
  renter: {
    userId: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  } | null;
  lastMessage: {
    content: string;
    createdAt: number;
    senderId: string;
    isSystem: boolean;
  } | null;
  messageCount: number;
  isBlocked: boolean;
  blockReason?: string;
}

export function AdminConversationList() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const conversations = useQuery(api.adminChat.getAllConversations) as AdminConversation[] | undefined;

  if (conversations === undefined) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Učitavanje razgovora...
        </CardContent>
      </Card>
    );
  }

  const filtered =
    filter === "blocked"
      ? conversations.filter((c) => c.isBlocked)
      : conversations;

  const blockedCount = conversations.filter((c) => c.isBlocked).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-podeli-accent" />
          Sve poruke ({conversations.length})
        </CardTitle>
        <div className="flex gap-2 pt-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={cn(
              filter === "all" && "bg-podeli-accent text-white hover:bg-podeli-accent/90"
            )}
          >
            Sve ({conversations.length})
          </Button>
          <Button
            variant={filter === "blocked" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("blocked")}
            className={cn(
              filter === "blocked" && "bg-red-600 text-white hover:bg-red-700"
            )}
          >
            <ShieldBan className="mr-1.5 h-3.5 w-3.5" />
            Blokirane ({blockedCount})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              {filter === "blocked"
                ? "Nema blokiranih razgovora."
                : "Nema razgovora."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((conversation) => (
              <AdminConversationCard
                key={conversation.bookingId}
                conversation={conversation}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminConversationCard({
  conversation,
}: {
  conversation: AdminConversation;
}) {
  const { bookingId, booking, item, owner, renter, lastMessage, messageCount, isBlocked, blockReason } =
    conversation;

  const imageUrl = useQuery(
    api.items.getImageUrl,
    item?.images[0] ? { storageId: item.images[0] } : "skip"
  );

  return (
    <Link
      href={`/super-admin/poruke/${bookingId}`}
      className="flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      {/* Item thumbnail */}
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item?.title ?? "Predmet"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Nema
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-podeli-dark">
                {item?.title ?? "Predmet"}
              </h3>
              {isBlocked && (
                <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                  <ShieldBan className="h-3 w-3" />
                  Blokirano
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Vlasnik: {owner?.firstName ?? "?"} | Zakupac: {renter?.firstName ?? "?"}
            </p>
            {isBlocked && blockReason && (
              <p className="text-[10px] text-red-600 truncate">
                Razlog: {blockReason}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <BookingStatusBadge status={booking.status as "pending" | "confirmed" | "nije_isporucen" | "isporucen" | "vracen" | "cancelled"} />
            <span className="text-[10px] text-muted-foreground">
              {messageCount} poruka
            </span>
          </div>
        </div>

        {/* Last message preview */}
        {lastMessage && (
          <div className="mt-1 flex items-center gap-2">
            <p className="flex-1 truncate text-xs text-muted-foreground">
              {lastMessage.isSystem ? (
                <span className="inline-flex items-center gap-1">
                  <ShieldAlert className="inline h-3 w-3 text-amber-600" />
                  <span className="font-medium text-amber-700">PODELI.RS:</span>{" "}
                  {lastMessage.content}
                </span>
              ) : (
                lastMessage.content
              )}
            </p>
            {lastMessage && (
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(lastMessage.createdAt)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "upravo";
  if (diffMins < 60) return `pre ${diffMins} min`;
  if (diffHours < 24) return `pre ${diffHours} h`;
  if (diffDays < 2) return "juče";
  if (diffDays < 7) return `pre ${diffDays} dana`;
  return formatSerbianDate(timestamp, "short");
}
