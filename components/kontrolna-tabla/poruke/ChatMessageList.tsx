"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { MessageSquare } from "lucide-react";
import { formatSerbianDate } from "@/lib/serbian-date";

export interface ChatMessage {
  _id: string;
  content: string;
  senderId: string;
  createdAt: number;
  type?: "user" | "system";
  senderProfile?: {
    firstName?: string;
    imageUrl?: string;
  } | null;
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  isOwnMessage: (msg: ChatMessage) => boolean;
  emptyContent?: React.ReactNode;
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

export function ChatMessageList({
  messages,
  isOwnMessage,
  emptyContent,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        {emptyContent ?? (
          <>
            <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Nema poruka u ovom razgovoru.
            </p>
          </>
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
    const isOwn = isOwnMessage(msg);

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
      <div key={msg._id} className={isFirstInGroup ? "mt-3" : "mt-0.5"}>
        <MessageBubble
          content={msg.content}
          senderName={msg.senderProfile?.firstName}
          senderImage={msg.senderProfile?.imageUrl}
          createdAt={msg.createdAt}
          isOwnMessage={isOwn}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          isSystemMessage={isSystem}
        />
      </div>
    );
  }

  return (
    <>
      {elements}
      <div ref={messagesEndRef} />
    </>
  );
}
