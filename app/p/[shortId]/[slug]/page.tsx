"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import {
  HeartHandshake,
  ArrowLeft,
  MapPin,
  Truck,
  Calendar,
  User,
} from "lucide-react";
import { ItemImageGallery } from "./_components/ItemImageGallery";
import { BookingForm } from "./_components/BookingForm";
import { ReviewsList } from "./_components/ReviewsList";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/UserMenu";
import { SignInButton } from "@/components/SignInButton";

type UserSnapshot = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

const DELIVERY_OPTIONS: Record<string, string> = {
  licno: "Lično preuzimanje",
  glovo: "Glovo",
  wolt: "Wolt",
  cargo: "Cargo",
};

interface PageProps {
  params: Promise<{ shortId: string; slug: string }>;
}

export default function ItemDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { shortId, slug } = resolvedParams;
  const router = useRouter();
  const item = useQuery(api.items.getByShortId, {
    shortId,
  });
  const getUsersByIds = useAction(api.clerk.getUsersByIds);
  const [owner, setOwner] = useState<UserSnapshot | null>(null);

  // Handle canonical redirect if slug doesn't match
  useEffect(() => {
    if (item && item.slug !== slug) {
      router.replace(`/p/${item.shortId}/${item.slug}`);
    }
  }, [item, slug, router]);

  useEffect(() => {
    if (item) {
      getUsersByIds({ userIds: [item.ownerId] })
        .then((users) => setOwner(users[0] ?? null))
        .catch(console.error);
    }
  }, [item, getUsersByIds]);

  if (item === undefined) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 rounded bg-slate-200" />
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="h-96 rounded-xl bg-slate-200" />
              </div>
              <div className="h-96 rounded-xl bg-slate-200" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (item === null) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Predmet nije pronađen
            </h1>
            <p className="mt-2 text-slate-600">
              Ovaj predmet ne postoji ili je uklonjen.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 text-amber-600 hover:text-amber-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Nazad na početnu
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Don't render if redirecting
  if (item && item.slug !== slug) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 rounded bg-slate-200" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Nazad na ponudu
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <ItemImageGallery images={item.images} title={item.title} />

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {item.title}
                    </h1>
                    <Badge>{item.category}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span>Beograd</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-600">
                    {item.pricePerDay.toFixed(0)} RSD
                  </p>
                  <p className="text-sm text-slate-500">po danu</p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <h2 className="font-semibold text-slate-900">Opis</h2>
                <p className="mt-2 text-slate-600">{item.description}</p>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                  <Truck className="h-4 w-4" />
                  Dostupni načini dostave
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.deliveryMethods.map((method) => (
                    <span
                      key={method}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                    >
                      {DELIVERY_OPTIONS[method] ?? method}
                    </span>
                  ))}
                </div>
              </div>

              {item.availabilitySlots.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                    <Calendar className="h-4 w-4" />
                    Dostupnost
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.availabilitySlots.map((slot, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
                      >
                        {slot.startDate} - {slot.endDate}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 border-t border-slate-100 pt-6">
                <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                  <User className="h-4 w-4" />
                  Vlasnik
                </h2>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-medium text-slate-600">
                    {owner?.firstName?.[0] ??
                      owner?.email?.[0]?.toUpperCase() ??
                      "K"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {owner?.firstName && owner?.lastName
                        ? `${owner.firstName} ${owner.lastName[0]}.`
                        : "Komšija"}
                    </p>
                    <p className="text-sm text-slate-500">Verifikovan korisnik</p>
                  </div>
                </div>
              </div>
            </div>

            <ReviewsList itemId={item._id} />
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <BookingForm item={item} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Header() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-amber-200">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            PODELI.rs
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {!isLoaded ? (
            <div className="h-10 w-[100px] animate-pulse rounded-full bg-slate-200" />
          ) : isSignedIn ? (
            <UserMenu />
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </nav>
  );
}
