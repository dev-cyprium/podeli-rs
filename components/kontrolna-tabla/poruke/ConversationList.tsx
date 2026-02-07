"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConversationCard } from "./ConversationCard";
import { MessageSquare } from "lucide-react";

export function ConversationList() {
  const conversations = useQuery(api.messages.getConversations);

  if (conversations === undefined) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Učitavanje razgovora...
        </CardContent>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-podeli-accent" />
            Poruke
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Nemate nijednu konverzaciju.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Poruke će se pojaviti kada vaša rezervacija bude odobrena.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-podeli-accent" />
          Poruke
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.bookingId}
              bookingId={conversation.bookingId}
              item={conversation.item}
              otherParty={conversation.otherParty}
              lastMessage={conversation.lastMessage}
              unreadCount={conversation.unreadCount}
              bookingStatus={conversation.booking.status}
              isOwner={conversation.isOwner}
              isBlocked={conversation.isBlocked}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
