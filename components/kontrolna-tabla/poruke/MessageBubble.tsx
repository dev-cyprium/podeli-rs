"use client";

import { cn } from "@/lib/utils";
import { formatSerbianDate } from "@/lib/serbian-date";
import { ShieldAlert } from "lucide-react";
import { Fragment } from "react";

// Emoticon replacements
const EMOTICON_MAP: Array<[string, string]> = [
  [":D", "\u{1F604}"],
  [":)", "\u{1F60A}"],
  [":(", "\u{1F61E}"],
  [";)", "\u{1F609}"],
  [":P", "\u{1F61B}"],
  ["<3", "\u{2764}\u{FE0F}"],
  [":O", "\u{1F62E}"],
  [":/", "\u{1F615}"],
];

function replaceEmoticons(text: string): string {
  let result = text;
  for (const [emoticon, emoji] of EMOTICON_MAP) {
    result = result.split(emoticon).join(emoji);
  }
  return result;
}

// URL detection regex
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderContentWithLinks(content: string) {
  const processed = replaceEmoticons(content);
  const parts = processed.split(URL_REGEX);

  if (parts.length === 1) {
    return <p className="whitespace-pre-wrap break-words">{processed}</p>;
  }

  return (
    <p className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          // Reset lastIndex since we're using the regex multiple times
          URL_REGEX.lastIndex = 0;
          const displayUrl = part.length > 50 ? part.slice(0, 47) + "..." : part;
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-podeli-blue underline break-all"
            >
              {displayUrl}
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </p>
  );
}

interface MessageBubbleProps {
  content: string;
  senderName?: string;
  senderImage?: string;
  createdAt: number;
  isOwnMessage: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  isSystemMessage?: boolean;
}

export function MessageBubble({
  content,
  senderName,
  senderImage,
  createdAt,
  isOwnMessage,
  isFirstInGroup = true,
  isLastInGroup = true,
  isSystemMessage = false,
}: MessageBubbleProps) {
  // System message: centered banner
  if (isSystemMessage) {
    return (
      <div className="mx-auto max-w-[90%]">
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="mb-1 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-800">PODELI.RS</span>
          </div>
          <p className="text-sm text-amber-900 whitespace-pre-wrap break-words">{replaceEmoticons(content)}</p>
          <span className="mt-1 block text-[10px] text-amber-600">
            {formatRelativeTime(createdAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex max-w-[80%]",
        isOwnMessage ? "ml-auto justify-end" : "mr-auto justify-start"
      )}
    >
      {/* Avatar - only on first in group for other party */}
      {!isOwnMessage && (
        <div className="mr-1.5 w-7 flex-shrink-0">
          {isFirstInGroup ? (
            senderImage ? (
              <img
                src={senderImage}
                alt={senderName ?? "Korisnik"}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                {senderName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )
          ) : null}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col",
          isOwnMessage ? "items-end" : "items-start"
        )}
      >
        {/* Sender name - only on first in group */}
        {isFirstInGroup && !isOwnMessage && (
          <span className="mb-0.5 ml-1 text-[11px] font-medium text-muted-foreground">
            {senderName ?? "Korisnik"}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3 py-1.5 text-sm shadow-sm",
            isOwnMessage
              ? cn(
                  "bg-[#dcf8c6] text-podeli-dark",
                  isLastInGroup ? "rounded-br-none" : ""
                )
              : cn(
                  "bg-white text-podeli-dark",
                  isLastInGroup ? "rounded-bl-none" : ""
                )
          )}
        >
          {renderContentWithLinks(content)}
          {/* Inline timestamp on last in group */}
          {isLastInGroup && (
            <span className="ml-2 inline-block align-bottom text-[10px] leading-none text-muted-foreground">
              {formatRelativeTime(createdAt)}
            </span>
          )}
        </div>
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
