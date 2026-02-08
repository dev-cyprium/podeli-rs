"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Activity,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getItemUrl } from "@/lib/utils";
import { CompactBookingRow } from "./CompactBookingRow";
import type { ItemGroup } from "./useBookingGroups";

interface ItemBookingGroupProps {
  group: ItemGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ItemBookingGroup({
  group,
  isExpanded,
  onToggle,
}: ItemBookingGroupProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const imageUrl = useQuery(
    api.items.getImageUrl,
    group.item?.images[0]
      ? { storageId: group.item.images[0] as Id<"_storage"> }
      : "skip"
  );

  const activeBookings = group.bookings.filter(
    (b) =>
      b.status === "pending" ||
      b.status === "confirmed" ||
      b.status === "nije_isporucen" ||
      b.status === "isporucen"
  );
  const completedBookings = group.bookings.filter(
    (b) => b.status === "vracen" || b.status === "cancelled"
  );

  const itemUrl =
    group.item?.shortId && group.item?.slug
      ? getItemUrl(group.item)
      : null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Clickable header — entire row toggles expand/collapse */}
      <Button
        variant="ghost"
        onClick={onToggle}
        className="flex h-auto w-full items-center gap-3 rounded-none px-4 py-3 hover:bg-slate-50"
      >
        {/* Expand/collapse icon */}
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Item thumbnail */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={group.item?.title ?? "Predmet"}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
              Nema
            </div>
          )}
        </div>

        {/* Item title */}
        <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-[#02020a]">
          {group.item?.title ?? "Predmet nije dostupan"}
        </span>

        {/* External link to item page */}
        {itemUrl && (
          <Link
            href={itemUrl}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-slate-100 hover:text-[#006992]"
            title="Otvori oglas"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}

        {/* Count badges with tooltips */}
        <div className="flex shrink-0 items-center gap-1.5">
          {group.pendingCount > 0 && (
            <Badge
              className="gap-1 border-[#f0a202]/30 bg-[#f0a202]/10 text-[#f0a202]"
              title={`${group.pendingCount} na čekanju`}
            >
              <Clock className="h-3 w-3" />
              {group.pendingCount}
            </Badge>
          )}
          {group.activeCount > 0 && (
            <Badge
              className="gap-1 border-green-300 bg-green-100 text-green-700"
              title={`${group.activeCount} aktivn${group.activeCount === 1 ? "a" : "e"}`}
            >
              <Activity className="h-3 w-3" />
              {group.activeCount}
            </Badge>
          )}
          {group.completedCount > 0 && (
            <Badge
              className="gap-1 border-slate-200 bg-slate-50 text-slate-500"
              title={`${group.completedCount} završen${group.completedCount === 1 ? "a" : "e"}`}
            >
              <CheckCircle2 className="h-3 w-3" />
              {group.completedCount}
            </Badge>
          )}
        </div>
      </Button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-slate-100 px-4 py-3">
              {/* Active bookings */}
              {activeBookings.map((booking) => (
                <CompactBookingRow key={booking._id} booking={booking} />
              ))}

              {/* Completed bookings toggle */}
              {completedBookings.length > 0 && (
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-200" />
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="text-xs text-muted-foreground hover:text-[#02020a]"
                    >
                      Završene ({completedBookings.length})
                      {" — "}
                      {showCompleted ? "Sakrij" : "Prikaži"}
                    </Button>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <AnimatePresence initial={false}>
                    {showCompleted && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-2">
                          {completedBookings.map((booking) => (
                            <CompactBookingRow
                              key={booking._id}
                              booking={booking}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Edge case: group has only completed bookings and none are shown yet */}
              {activeBookings.length === 0 &&
                completedBookings.length > 0 &&
                !showCompleted && (
                  <div className="py-2 text-center text-xs text-muted-foreground">
                    Sve rezervacije za ovaj predmet su završene.
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
