"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PodeliEmptyState } from "@/components/kontrolna-tabla/PodeliEmptyState";
import { formatSerbianDate } from "@/lib/serbian-date";
import { AlertTriangle, Calendar, Truck, Coins } from "lucide-react";

type DeliveryMethod = "licno" | "glovo" | "wolt" | "cargo";

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string }[] = [
  { value: "licno", label: "Lično preuzimanje" },
  { value: "glovo", label: "Glovo" },
  { value: "wolt", label: "Wolt" },
  { value: "cargo", label: "Cargo" },
];

function formatDelivery(method: string) {
  return (
    DELIVERY_OPTIONS.find((option) => option.value === method)?.label ?? method
  );
}

function formatSlot(slot: { startDate: string; endDate: string }) {
  return `${formatSerbianDate(slot.startDate, "short")} – ${formatSerbianDate(slot.endDate, "short")}`;
}

export function ItemsList() {
  return (
    <>
      <SignedOut>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Prijavite se da biste upravljali predmetima.
          </CardContent>
        </Card>
      </SignedOut>
      <SignedIn>
        <ItemsListContent />
      </SignedIn>
    </>
  );
}

function ItemsListContent() {
  const router = useRouter();
  const items = useQuery(api.items.listMine, {});
  const removeItem = useMutation(api.items.remove);
  const limits = useQuery(api.profiles.getMyPlanLimits);
  const profile = useQuery(api.profiles.getMyProfile);

  const preferredContactTypes = profile?.preferredContactTypes ?? [];
  const hasContactPrefs = preferredContactTypes.length > 0;

  if (!items) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground">
        Učitavanje predmeta...
      </div>
    );
  }

  const isUnlimited = limits?.maxListings === -1;
  const atLimit = limits && !isUnlimited && limits.listingCount >= limits.maxListings;

  async function handleDelete(id: Doc<"items">["_id"]) {
    await removeItem({ id });
  }

  const listingCountLabel = limits
    ? isUnlimited
      ? `${items.length}`
      : `${items.length}/${limits.maxListings}`
    : `${items.length}`;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <CardTitle>Moji predmeti ({listingCountLabel})</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Upravljajte ponudom i dostupnošću.
          </p>
        </div>
        <div className="shrink-0">
          {atLimit ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-[#f0a202]">
                <AlertTriangle className="h-3 w-3" />
                Limit dostignut
              </span>
              <Button asChild size="sm" className="bg-podeli-accent text-white hover:bg-podeli-accent/90">
                <Link href="/planovi">Nadogradite</Link>
              </Button>
            </div>
          ) : !hasContactPrefs ? (
            <Button
              disabled
              size="sm"
              variant="outline"
              className="w-full cursor-not-allowed opacity-60 sm:w-auto"
              title="Postavite način kontakta gore da biste dodali predmet"
            >
              Novi predmet
            </Button>
          ) : (
            <Button asChild size="sm" className="w-full bg-podeli-accent text-white hover:bg-podeli-accent/90 sm:w-auto">
              <Link href="/kontrolna-tabla/predmeti/novi">Novi predmet</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <PodeliEmptyState
            onCreate={() => router.push("/kontrolna-tabla/predmeti/novi")}
            className="min-h-[260px]"
            createDisabled={!hasContactPrefs}
          />
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: "spring", bounce: 0.35, duration: 0.4 }}
                >
                  <ItemCard
                    item={item}
                    onEdit={() =>
                      router.push(
                        `/kontrolna-tabla/predmeti/novi?id=${item._id}`,
                      )
                    }
                    onDelete={() => handleDelete(item._id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Doc<"items">;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const imageUrl = useQuery(
    api.items.getImageUrl,
    item.images[0] ? { storageId: item.images[0] as Id<"_storage"> } : "skip",
  );
  const availabilitySummary =
    item.availabilitySlots.length > 0
      ? item.availabilitySlots.slice(0, 2).map(formatSlot).join(", ")
      : "Nema termina";

  const deliverySummary = item.deliveryMethods.length
    ? item.deliveryMethods.map(formatDelivery).join(", ")
    : "Nije navedeno";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Mobile: stacked, Desktop: horizontal */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Image */}
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Nema slike
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title + Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-podeli-dark">
              {item.title}
            </h3>
            <Badge className="shrink-0">{item.category}</Badge>
          </div>

          {/* Description - hidden on mobile to save space */}
          <p className="mt-1 hidden text-sm text-muted-foreground sm:line-clamp-2">
            {item.description}
          </p>

          {/* Info pills with icons */}
          <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
              <Coins className="h-3 w-3 shrink-0" />
              <span>{item.pricePerDay.toFixed(0)} RSD / dan</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">{availabilitySummary}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
              <Truck className="h-3 w-3 shrink-0" />
              <span className="truncate">{deliverySummary}</span>
            </span>
          </div>
        </div>

        {/* Action buttons - row on mobile, column on desktop */}
        <div className="flex shrink-0 gap-2 sm:flex-col">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={onEdit}>
            Izmeni
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 border border-podeli-red/30 sm:flex-none"
              >
                Obriši
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Brisanje predmeta</AlertDialogTitle>
                <AlertDialogDescription>
                  Da li ste sigurni da želite da obrišete predmet?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Ne</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-[#dd1c1a] text-white hover:bg-[#dd1c1a]/90"
                >
                  Da, obriši
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
