"use client";

import { useMemo } from "react";
import { Doc } from "@/convex/_generated/dataModel";

export type BookingWithItem = Doc<"bookings"> & {
  item: Doc<"items"> | null;
  renter?: {
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  } | null;
  renterRating?: {
    average: number;
    count: number;
  } | null;
  renterCompletedRentals?: number;
  ownerChatEnabled?: boolean;
};

type BookingStatus = BookingWithItem["status"];

export interface ItemGroup {
  itemId: string;
  item: Doc<"items"> | null;
  bookings: BookingWithItem[];
  pendingCount: number;
  activeCount: number;
  completedCount: number;
}

const STATUS_ORDER: Record<BookingStatus, number> = {
  pending: 0,
  confirmed: 1,
  nije_isporucen: 2,
  isporucen: 3,
  vracen: 4,
  cancelled: 5,
};

function isActive(status: BookingStatus): boolean {
  return (
    status === "confirmed" ||
    status === "nije_isporucen" ||
    status === "isporucen"
  );
}

function isCompleted(status: BookingStatus): boolean {
  return status === "vracen" || status === "cancelled";
}

export function useBookingGroups(bookings: BookingWithItem[]): ItemGroup[] {
  return useMemo(() => {
    const groupMap = new Map<string, ItemGroup>();

    for (const booking of bookings) {
      const key = booking.itemId;
      let group = groupMap.get(key);
      if (!group) {
        group = {
          itemId: key,
          item: booking.item,
          bookings: [],
          pendingCount: 0,
          activeCount: 0,
          completedCount: 0,
        };
        groupMap.set(key, group);
      }
      group.bookings.push(booking);
      if (booking.status === "pending") group.pendingCount++;
      else if (isActive(booking.status)) group.activeCount++;
      else if (isCompleted(booking.status)) group.completedCount++;
    }

    // Sort bookings within each group by status order
    for (const group of groupMap.values()) {
      group.bookings.sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      );
    }

    // Sort groups: pending first, then active, then completed-only
    const groups = Array.from(groupMap.values());
    groups.sort((a, b) => {
      // Groups with pending bookings come first
      if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
      if (b.pendingCount > 0 && a.pendingCount === 0) return 1;
      // Then groups with active bookings
      if (a.activeCount > 0 && b.activeCount === 0) return -1;
      if (b.activeCount > 0 && a.activeCount === 0) return 1;
      // Within same priority, sort by total bookings descending
      return b.bookings.length - a.bookings.length;
    });

    return groups;
  }, [bookings]);
}
