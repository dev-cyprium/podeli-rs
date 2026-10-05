import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchQuery, preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { clerkClient } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, User } from "lucide-react";
import { DomacinBadge } from "@/components/DomacinBadge";
import { NavBar } from "@/components/NavBar";
import { Metadata } from "next";
import { ItemDetailContent } from "@/components/p/ItemDetailContent";

type UserSnapshot = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const product = await fetchQuery(api.items.getByShortId, {
    shortId: (await params).shortId,
  });

  if (!product) {
    return {
      title: "Predmet nije pronađen | podeli.rs",
      description:
        "Ovaj predmet ne postoji ili je uklonjen. Pogledaj druge ponude na podeli.rs.",
    };
  }

  return {
    title: `${product.title} | podeli.rs`,
    description:
      product.description.slice(0, 155) + " | opis klijenta na podeli.rs",
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

  const preloadedItem = await preloadQuery(api.items.getByShortId, { shortId });
  const item = preloadedQueryResult(preloadedItem);

  if (!item) {
    return (
      <div className="min-h-screen bg-podeli-light">
        <NavBar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-card p-12 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-podeli-dark">
              Predmet nije pronađen
            </h1>
            <p className="mt-2 text-muted-foreground">
              Ovaj predmet ne postoji ili je uklonjen.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 text-podeli-accent hover:text-podeli-accent/90"
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

  const ownerProfile = await fetchQuery(api.profiles.getProfileByUserId, {
    userId: item.ownerId,
  });

  return (
    <div className="min-h-screen bg-podeli-light">
      <NavBar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-podeli-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Nazad na ponudu
        </Link>

        <ItemDetailContent
          preloadedItem={preloadedItem}
          slug={slug}
          ownerCard={
            <div className="mt-6 border-t border-border pt-6">
              <h2 className="flex items-center gap-2 font-semibold text-podeli-dark">
                <User className="h-4 w-4" />
                Vlasnik
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground ${ownerProfile?.hasBadge ? "ring-2 ring-[#f0a202]/50" : ""}`}
                >
                  {owner?.firstName?.[0] ??
                    owner?.email?.[0]?.toUpperCase() ??
                    "K"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-podeli-dark">
                      {owner?.firstName && owner?.lastName
                        ? `${owner.firstName} ${owner.lastName[0]}.`
                        : "Komšija"}
                    </p>
                    {ownerProfile?.hasBadge && <DomacinBadge size="sm" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vlasnik oglasa
                  </p>
                </div>
              </div>
            </div>
          }
        />
      </main>
    </div>
  );
}
