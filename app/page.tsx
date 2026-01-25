"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Drill,
  Tent,
  Gamepad2,
  Bike,
  HeartHandshake,
  ShieldCheck,
  Leaf,
  PiggyBank,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { SignInModal } from "@/components/SignInModal";
import { UserMenu } from "@/components/UserMenu";

type UserSnapshot = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

// Icon mapping for categories
const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  Alati: Drill,
  Kampovanje: Tent,
  Zabava: Gamepad2,
  Prevoz: Bike,
  Elektronika: Gamepad2,
  "Društvene igre": Gamepad2,
};

function CategoryIcon({
  category,
  className,
  strokeWidth,
}: {
  category: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = categoryIcons[category] || Drill;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

function ItemCard({
  item,
}: {
  item: Doc<"items"> & { owner: UserSnapshot | undefined };
}) {
  const imageUrl = useQuery(
    api.items.getImageUrl,
    item.images[0] ? { storageId: item.images[0] as Id<"_storage"> } : "skip",
  );
  console.log(item);
  const owner = item.owner;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="relative flex h-48 w-full items-center justify-center bg-slate-100 transition-colors group-hover:bg-amber-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <CategoryIcon
            category={item.category}
            className="h-20 w-20 text-slate-300 group-hover:text-amber-500"
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-semibold text-slate-900">{item.title}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
            {item.category}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <MapPin className="h-3 w-3" />
          <span>Beograd</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-slate-200"></div>
            <span className="text-xs font-medium text-slate-600">
              {owner && owner.firstName && owner.lastName
                ? `${owner.firstName} ${owner.lastName[0]}.`
                : "Komšija"}
            </span>
          </div>
          <span className="font-bold text-amber-600">
            {item.pricePerDay.toFixed(0)} RSD
            <span className="text-xs font-normal text-slate-400"> /dan</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const items = useQuery(api.items.listAll, { limit: 8 });
  const getUsersByIds = useAction(api.clerk.getUsersByIds);
  const [users, setUsers] = useState<UserSnapshot[]>([]);

  // Fetch users when items are loaded
  useEffect(() => {
    if (items && items.length > 0) {
      const userIds = items.map((item) => item.ownerId);
      getUsersByIds({ userIds }).then(setUsers).catch(console.error);
    }
  }, [items, getUsersByIds]);

  // Merge items with user data
  const itemsWithUsers = useMemo(() => {
    if (!items) return undefined;
    const userMap = new Map(users.map((user) => [user.id, user]));
    return items.map((item) => ({
      ...item,
      owner: userMap.get(item.ownerId),
    }));
  }, [items, users]);

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-amber-200">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              PODELI.rs
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="/kako-funkcionise"
              className="text-sm font-medium text-slate-600 hover:text-amber-600"
            >
              Kako funkcioniše
            </a>
            <a
              href="#zasto-deljenje"
              className="text-sm font-medium text-slate-600 hover:text-amber-600"
            >
              Zašto deljenje
            </a>
            <a
              href="#ponuda"
              className="text-sm font-medium text-slate-600 hover:text-amber-600"
            >
              Ponuda
            </a>
            <SignInModal />
            <UserMenu />
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 touch-manipulation"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-stone-200 bg-white md:hidden">
            <div className="flex flex-col gap-4 px-6 py-4">
              <a
                href="/kako-funkcionise"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-600 hover:text-amber-600"
              >
                Kako funkcioniše
              </a>
              <a
                href="#zasto-deljenje"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-600 hover:text-amber-600"
              >
                Zašto deljenje
              </a>
              <a
                href="#ponuda"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-600 hover:text-amber-600"
              >
                Ponuda
              </a>
              <div className="pt-2">
                <SignInModal />
              </div>
              <div className="pt-2">
                <UserMenu />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              </span>
              Lansiramo uskoro u Beogradu
            </div>

            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Tvoj komšiluk je pun <br className="hidden sm:block" />
              <span className="relative whitespace-nowrap text-amber-500">
                <svg
                  className="absolute -bottom-2 left-0 -z-10 h-3 w-full fill-amber-200"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path d="M0 5 Q 50 10 100 5 L 100 0 Q 50 5 0 0 Z" />
                </svg>
                korisnih stvari
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              Zašto kupovati bušilicu koju ćeš koristiti 10 minuta godišnje?
              <br className="hidden sm:block" />
              Iznajmi je od komšije Marka za 300 dinara.
            </p>

            {/* Mock Search Bar */}
            <div className="mt-10 w-full max-w-2xl">
              <div className="relative flex items-center overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                  <Search className="h-6 w-6" />
                </div>
                <input
                  type="text"
                  className="h-full w-full border-0 bg-transparent px-4 text-lg text-slate-900 placeholder:text-slate-400 focus:ring-0"
                  placeholder="Šta ti treba danas? (npr. bušilica, šator, projektor...)"
                  readOnly
                />
                <button className="hidden rounded-xl bg-amber-500 px-8 py-3 text-base font-bold text-white transition-transform hover:scale-105 hover:bg-amber-600 sm:block">
                  Pronađi
                </button>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-slate-500">
                <span>Popularno:</span>
                <span className="cursor-pointer font-medium text-slate-700 hover:text-amber-600 hover:underline">
                  Alati
                </span>
                <span className="cursor-pointer font-medium text-slate-700 hover:text-amber-600 hover:underline">
                  Kampovanje
                </span>
                <span className="cursor-pointer font-medium text-slate-700 hover:text-amber-600 hover:underline">
                  Elektronika
                </span>
                <span className="cursor-pointer font-medium text-slate-700 hover:text-amber-600 hover:underline">
                  Društvene igre
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase (What you can find) */}
      <section id="ponuda" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Šta komšije dele u Beogradu?
            </h2>
            <a
              href="#"
              className="text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              Vidi sve kategorije &rarr;
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {itemsWithUsers === undefined ? (
              // Loading state
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-md"
                >
                  <div className="flex h-48 w-full items-center justify-center bg-slate-100">
                    <div className="h-20 w-20 animate-pulse rounded-full bg-slate-200"></div>
                  </div>
                  <div className="p-5">
                    <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-slate-200"></div>
                    <div className="mb-2 h-4 w-1/4 animate-pulse rounded bg-slate-200"></div>
                    <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-slate-200"></div>
                  </div>
                </div>
              ))
            ) : itemsWithUsers.length === 0 ? (
              // Empty state
              <div className="col-span-full rounded-2xl bg-white p-12 text-center shadow-md">
                <p className="text-slate-600">
                  Trenutno nema dostupnih predmeta. Budite prvi koji će objaviti
                  predmet!
                </p>
              </div>
            ) : (
              // Items from database
              itemsWithUsers.map((item) => <ItemCard key={item._id} item={item} />)
            )}
          </div>
        </div>
      </section>

      {/* Why Sharing Matters (Redesigned) */}
      <section id="zasto-deljenje" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Zašto deljenje ima smisla?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Manje stvari u ormaru, više novca u džepu. I bolji odnos sa
              komšijama.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <PiggyBank className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Uštedi novac</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Zašto plaćati punu cenu za nešto što ti treba retko?
                Iznajmljivanje je 10x jeftinije od kupovine.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                <Leaf className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Čuvaj planetu
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Jedna bušilica se u proseku koristi samo 13 minuta tokom svog
                životnog veka. Deljenjem smanjujemo otpad.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <HeartHandshake className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Upoznaj komšije
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Podeli je više od transakcije. To je prilika da upoznaš ljude
                koji žive oko tebe i izgradiš poverenje.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-slate-900 py-24 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Sigurnost je na prvom mestu
              </h2>
              <p className="mt-6 text-lg text-slate-300">
                Znamo da je poverenje ključno. Zato smo izgradili sistem koji
                štiti i vlasnike i one koji iznajmljuju.
              </p>

              <ul className="mt-10 space-y-6">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 flex-none text-amber-500" />
                  <div>
                    <strong className="block font-semibold text-white">
                      Verifikovani korisnici
                    </strong>
                    <span className="text-slate-400">
                      Svaki nalog prolazi kroz proveru telefona i lokacije.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 flex-none text-amber-500" />
                  <div>
                    <strong className="block font-semibold text-white">
                      Ocene i recenzije
                    </strong>
                    <span className="text-slate-400">
                      Vidiš iskustva drugih pre nego što se dogovoriš.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 flex-none text-amber-500" />
                  <div>
                    <strong className="block font-semibold text-white">
                      Sigurni dogovori
                    </strong>
                    <span className="text-slate-400">
                      Jasna pravila o korišćenju i vraćanju stvari.
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="relative rounded-3xl bg-slate-800 p-8">
              <div className="absolute -top-4 -right-4 -z-10 h-full w-full rounded-3xl bg-amber-500/20 blur-2xl"></div>
              <blockquote className="space-y-6">
                <p className="text-xl font-medium italic text-slate-200">
                  &quot;Imao sam merdevine koje su stajale u garaži 3 godine.
                  Preko Podeli platforme sam ih iznajmio komšiji za vikend. Ja
                  zaradio za kafu, on završio krečenje, a merdevine konačno
                  služe svrsi.&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-600"></div>
                  <div>
                    <div className="font-semibold text-white">
                      Nikola Jovanović
                    </div>
                    <div className="text-sm text-slate-400">
                      Vračar, Beograd
                    </div>
                  </div>
                </div>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative overflow-hidden bg-slate-900 py-24 text-center">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        ></div>
        <div className="relative mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Spreman da živiš pametnije?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
            Pridruži se listi čekanja za Beograd. Obavestićemo te čim platforma
            postane aktivna u tvom kraju.
          </p>

          <form className="mx-auto mt-10 max-w-md">
            <div className="rounded-2xl bg-white p-2 shadow-xl shadow-slate-900/30">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  placeholder="tvoja@email.adresa"
                  className="flex-1 rounded-xl border border-slate-200 px-5 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <button
                  type="submit"
                  className="flex-none rounded-xl bg-amber-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                >
                  Prijavi se
                </button>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              *Bez spama. Samo važne informacije o lansiranju.
            </p>
          </form>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-slate-500 lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} PODELI.rs - Sva prava zadržana.
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <a href="#" className="hover:text-slate-900">
              O nama
            </a>
            <a href="#" className="hover:text-slate-900">
              Pravila korišćenja
            </a>
            <a href="#" className="hover:text-slate-900">
              Kontakt
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
