"use client";

import { cn } from "@/lib/utils";
import { formatSerbianDate } from "@/lib/serbian-date";

interface MessageBubbleProps {
  content: string;
  senderName?: string;
  senderImage?: string;
  createdAt: number;
  isOwnMessage: boolean;
}

export function MessageBubble({
  content,
  senderName,
  senderImage,
  createdAt,
  isOwnMessage,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-2 max-w-[85%]",
        isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {senderImage ? (
          <img
            src={senderImage}
            alt={senderName ?? "Korisnik"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {senderName?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col gap-1",
          isOwnMessage ? "items-end" : "items-start"
        )}
      >
        {/* Sender name */}
        <span className="text-xs text-muted-foreground">{senderName ?? "Korisnik"}</span>

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            isOwnMessage
              ? "rounded-br-sm bg-podeli-accent text-podeli-dark"
              : "rounded-bl-sm bg-muted text-podeli-dark"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground">
          {formatRelativeTime(createdAt)}
        </span>
      </div>
    </div>
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
