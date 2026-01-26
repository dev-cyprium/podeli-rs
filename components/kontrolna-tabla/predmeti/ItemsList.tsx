"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PodeliEmptyState } from "@/components/kontrolna-tabla/PodeliEmptyState";

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
  return `${slot.startDate} – ${slot.endDate}`;
}

export function ItemsList() {
  return (
    <>
      <SignedOut>
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-600">
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

  if (!items) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-sm text-slate-500">
        Učitavanje predmeta...
      </div>
    );
  }

  async function handleDelete(id: Doc<"items">["_id"]) {
    if (!confirm("Da li ste sigurni da želite da obrišete predmet?")) {
      return;
    }
    await removeItem({ id });
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Moji predmeti</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Upravljajte ponudom i dostupnošću.
          </p>
        </div>
        <Button asChild className="bg-amber-500 text-white hover:bg-amber-600">
          <Link href="/kontrolna-tabla/predmeti/novi">Novi predmet</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <PodeliEmptyState
            onCreate={() => router.push("/kontrolna-tabla/predmeti/novi")}
            className="min-h-[260px]"
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
      : "Nema unetih termina";

  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4">
      <div className="h-20 w-20 overflow-hidden rounded-lg bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            Nema slike
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900">
            {item.title}
          </h3>
          <Badge>{item.category}</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-1">
            {item.pricePerDay.toFixed(0)} RSD / dan
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1">
            Dostupnost: {availabilitySummary}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1">
            Dostava:{" "}
            {item.deliveryMethods.length
              ? item.deliveryMethods.map(formatDelivery).join(", ")
              : "Nije navedeno"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Izmeni
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="border border-red-200"
        >
          Obriši
        </Button>
      </div>
    </div>
  );
}
