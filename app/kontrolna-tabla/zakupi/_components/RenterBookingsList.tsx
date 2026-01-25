"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Search } from "lucide-react";
import { RenterBookingCard } from "./RenterBookingCard";

export function RenterBookingsList() {
  return (
    <>
      <SignedOut>
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-600">
            Prijavite se da biste videli vaše rezervacije.
          </CardContent>
        </Card>
      </SignedOut>
      <SignedIn>
        <RenterBookingsContent />
      </SignedIn>
    </>
  );
}

function RenterBookingsContent() {
  const bookings = useQuery(api.bookings.getBookingsAsRenter, {});

  if (bookings === undefined) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-sm text-slate-500">
        Učitavanje rezervacija...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-500" />
            Moje rezervacije
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Pregledajte status vaših iznajmljivanja.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {bookings.map((booking) => (
                <motion.div
                  key={booking._id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: "spring", bounce: 0.35, duration: 0.4 }}
                >
                  <RenterBookingCard booking={booking} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
        <Search className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">
        Nemate rezervacija
      </h3>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        Pretražite predmete koje komšije dele i iznajmite ono što vam treba.
      </p>
      <Button
        asChild
        className="mt-6 bg-amber-500 hover:bg-amber-600"
      >
        <Link href="/#ponuda">Pretraži ponudu</Link>
      </Button>
    </div>
  );
}
