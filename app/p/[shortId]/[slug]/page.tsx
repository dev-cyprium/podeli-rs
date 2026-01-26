import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { clerkClient } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, MapPin, Truck, Calendar, User } from "lucide-react";
import { ItemImageGallery } from "./_components/ItemImageGallery";
import { BookingForm } from "./_components/BookingForm";
import { ReviewsList } from "./_components/ReviewsList";
import { ItemDetailHeader } from "./_components/ItemDetailHeader";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const product = await fetchQuery(api.items.getByShortId, {
    shortId: (await params).shortId,
  });

  if (!product) {
    return {
      title: "Predmet nije pronađen | PODELI.rs",
      description:
        "Ovaj predmet ne postoji ili je uklonjen. Pogledaj druge ponude na PODELI.rs.",
    };
  }

  return {
    title: `${product.title} | PODELI.rs`,
    description:
      product.description.slice(0, 155) + " | opis klijenta na PODELI.rs",
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.images,
    },
  };
}

interface PageProps {
  params: Promise<{ shortId: string; slug: string }>;
}

export default async function ItemDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { shortId, slug } = resolvedParams;

  const item = await fetchQuery(api.items.getByShortId, {
    shortId,
  });

  if (!item) {
    return (
      <div className="min-h-screen bg-stone-50">
        <ItemDetailHeader />
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

  // Handle canonical redirect if slug doesn't match
  if (item.slug !== slug) {
    redirect(`/p/${item.shortId}/${item.slug}`);
  }

  // Fetch owner data from Clerk
  let owner: UserSnapshot | null = null;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(item.ownerId);
    owner = {
      id: user.id,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      email: user.emailAddresses[0]?.emailAddress || null,
    };
  } catch (error) {
    console.error("Failed to fetch owner data:", error);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <ItemDetailHeader />

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
                    <p className="text-sm text-slate-500">
                      Verifikovan korisnik
                    </p>
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
