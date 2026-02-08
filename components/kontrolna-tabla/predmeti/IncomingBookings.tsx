"use client";

import { useCallback, useMemo, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronsDownUp, ChevronsUpDown, Inbox } from "lucide-react";
import { useBookingGroups } from "./incoming/useBookingGroups";
import { PendingActionBanner } from "./incoming/PendingActionBanner";
import { ItemBookingGroup } from "./incoming/ItemBookingGroup";
import type { BookingWithItem } from "./incoming/useBookingGroups";

export function IncomingBookings() {
  return (
    <>
      <SignedOut>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Prijavite se da biste videli dolazne rezervacije.
          </CardContent>
        </Card>
      </SignedOut>
      <SignedIn>
        <IncomingBookingsContent />
      </SignedIn>
    </>
  );
}

function IncomingBookingsContent() {
  const bookings = useQuery(api.bookings.getBookingsAsOwner, {});

  if (bookings === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        Učitavanje rezervacija...
      </div>
    );
  }

  return <IncomingBookingsLoaded bookings={bookings as BookingWithItem[]} />;
}

function IncomingBookingsLoaded({
  bookings,
}: {
  bookings: BookingWithItem[];
}) {
  const groups = useBookingGroups(bookings);

  // Total pending count across all groups
  const totalPending = useMemo(
    () => groups.reduce((sum, g) => sum + g.pendingCount, 0),
    [groups]
  );

  // Auto-expand groups that have pending or active bookings
  const defaultExpanded = useMemo(() => {
    const set = new Set<string>();
    for (const group of groups) {
      if (group.pendingCount > 0 || group.activeCount > 0) {
        set.add(group.itemId);
      }
    }
    return set;
  }, [groups]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(defaultExpanded);

  const toggleGroup = useCallback((itemId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(groups.map((g) => g.itemId)));
  }, [groups]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const allExpanded = groups.length > 0 && expandedIds.size === groups.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-[#f0a202]" />
              Dolazne rezervacije
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Rezervacije za vaše predmete.
            </p>
          </div>
          {groups.length > 1 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={allExpanded ? collapseAll : expandAll}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {allExpanded ? (
                <>
                  <ChevronsDownUp className="mr-1 h-3 w-3" />
                  Skupi sve
                </>
              ) : (
                <>
                  <ChevronsUpDown className="mr-1 h-3 w-3" />
                  Proširi sve
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nemate dolaznih rezervacija.
          </div>
        ) : (
          <div className="space-y-3">
            <PendingActionBanner count={totalPending} />
            {groups.map((group) => (
              <ItemBookingGroup
                key={group.itemId}
                group={group}
                isExpanded={expandedIds.has(group.itemId)}
                onToggle={() => toggleGroup(group.itemId)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
