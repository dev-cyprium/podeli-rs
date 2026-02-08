"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { formatSerbianDate } from "@/lib/serbian-date";
import { ShieldAlert, ShieldBan } from "lucide-react";

interface ConversationCardProps {
  bookingId: Id<"bookings">;
  item: {
    _id: Id<"items">;
    title: string;
    images: Id<"_storage">[];
  } | null;
  otherParty: {
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
  unreadCount: number;
  bookingStatus: string;
  isOwner: boolean;
  isBlocked: boolean;
}

export function ConversationCard({
  bookingId,
  item,
  otherParty,
  lastMessage,
  unreadCount,
  bookingStatus,
  isOwner,
  isBlocked,
}: ConversationCardProps) {
  const imageUrl = useQuery(
    api.items.getImageUrl,
    item?.images[0] ? { storageId: item.images[0] } : "skip"
  );

  const otherName = otherParty?.firstName ?? "Korisnik";
  const roleLabel = isOwner ? "Zakupac" : "Vlasnik";

  // Use context-specific URL: owner goes to predmeti/poruke, renter goes to zakupi/poruke
  const chatUrl = isOwner
    ? `/kontrolna-tabla/predmeti/poruke/${bookingId}`
    : `/kontrolna-tabla/zakupi/poruke/${bookingId}`;

  return (
    <Link
      href={chatUrl}
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
                <ShieldBan className="h-3.5 w-3.5 shrink-0 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {roleLabel}: {otherName}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <BookingStatusBadge status={bookingStatus as "pending" | "confirmed" | "nije_isporucen" | "isporucen" | "vracen" | "cancelled"} />
            {lastMessage && (
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(lastMessage.createdAt)}
              </span>
            )}
          </div>
        </div>

        {/* Last message preview */}
        <div className="mt-1 flex items-center gap-2">
          <p className="flex-1 truncate text-xs text-muted-foreground">
            {lastMessage ? (
              lastMessage.isSystem ? (
                <span className="inline-flex items-center gap-1">
                  <ShieldAlert className="inline h-3 w-3 text-amber-600" />
                  <span className="font-medium text-amber-700">PODELI.RS:</span>{" "}
                  {lastMessage.content}
                </span>
              ) : (
                lastMessage.content
              )
            ) : (
              <span className="italic">Nema poruka — pošaljite prvu poruku</span>
            )}
          </p>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-podeli-accent px-1.5 text-[10px] font-medium text-podeli-dark">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
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
