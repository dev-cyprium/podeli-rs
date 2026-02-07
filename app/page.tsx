import {
  HeartHandshake,
  ShieldCheck,
  Leaf,
  PiggyBank,
  Instagram,
  Facebook,
  Linkedin,
  Handshake,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { DiscordIcon } from "@/components/icons/Icons";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/NavBar";
import { ItemsGrid } from "@/components/ItemsGrid";
import { ItemsGridSkeleton } from "@/components/ItemsGridSkeleton";
import { SearchBar } from "@/components/search/SearchBar";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { getAllPosts } from "@/lib/blog";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Suspense } from "react";

function HeroSection() {
  return (
    <section className="relative pt-16 pb-24 lg:pt-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-podeli-dark sm:text-6xl lg:text-7xl">
            Tvoj komšiluk je pun <br className="hidden sm:block" />
            <span className="relative whitespace-nowrap text-podeli-accent">
              <svg
                className="absolute -bottom-2 left-0 -z-10 h-3 w-full fill-podeli-accent/30"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path d="M0 5 Q 50 10 100 5 L 100 0 Q 50 5 0 0 Z" />
              </svg>
              korisnih stvari
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Zašto kupovati bušilicu koju ćeš koristiti 10 minuta godišnje?
            <br className="hidden sm:block" />
            Iznajmi je od komšije Marka za 300 dinara.
          </p>

          {/* Search Bar */}
          <div className="mt-10 w-full max-w-2xl">
            <SearchBar />
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
              <span>Popularno:</span>
              <Link
                href="/pretraga?kategorija=Alati"
                className="font-medium text-podeli-dark hover:text-podeli-accent hover:underline"
              >
                Alati
              </Link>
              <Link
                href="/pretraga?kategorija=Kampovanje"
                className="font-medium text-podeli-dark hover:text-podeli-accent hover:underline"
              >
                Kampovanje
              </Link>
              <Link
                href="/pretraga?kategorija=Elektronika"
                className="font-medium text-podeli-dark hover:text-podeli-accent hover:underline"
              >
                Elektronika
              </Link>
              <Link
                href="/pretraga?kategorija=Društvene igre"
                className="font-medium text-podeli-dark hover:text-podeli-accent hover:underline"
              >
                Društvene igre
              </Link>
            </div>
            <div className="mt-6 flex justify-center gap-6">
              <a
                href="https://www.instagram.com/podeli_rs/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-podeli-dark hover:text-podeli-accent transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
                Instagram
              </a>
              <a
                href="https://discord.gg/69MBaCTEnz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-podeli-dark hover:text-podeli-accent transition-colors"
                aria-label="Discord"
              >
                <DiscordIcon className="h-5 w-5" />
                Discord
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61587392755718"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-podeli-dark hover:text-podeli-accent transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
                Facebook
              </a>
              <a
                href="https://www.linkedin.com/company/podeli-rs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-podeli-dark hover:text-podeli-accent transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function ProductShowcaseSection() {
  const preloadItems = await preloadQuery(api.items.listAll, { limit: 8 });

  return (
    <section id="ponuda" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <h2 className="text-2xl font-bold tracking-tight text-podeli-dark sm:text-3xl">
            Šta komšije dele u Beogradu?
          </h2>
          <Link
            href="/pretraga"
            className="text-sm font-semibold text-podeli-accent hover:text-podeli-accent/90"
          >
            Vidi sve kategorije &rarr;
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ItemsGrid preloadedItems={preloadItems} />
        </div>
      </div>
    </section>
  );
}

function WhySharingSection() {
  return (
    <section id="zasto-deljenje" className="bg-podeli-accent/5 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-podeli-dark sm:text-4xl">
            Zašto deljenje ima smisla?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Manje stvari u ormaru, više novca u džepu. I bolji odnos sa
            komšijama.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="group rounded-2xl bg-podeli-light p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-podeli-red/10 text-podeli-red">
              <PiggyBank className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-podeli-dark">Uštedi novac</h3>
            <p className="mt-3 leading-7 text-muted-foreground">
              Zašto plaćati punu cenu za nešto što ti treba retko?
              Iznajmljivanje je 10x jeftinije od kupovine.
            </p>
          </div>

          <div className="group rounded-2xl bg-podeli-light p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-podeli-green/10 text-podeli-green">
              <Leaf className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-podeli-dark">
              Čuvaj planetu
            </h3>
            <p className="mt-3 leading-7 text-muted-foreground">
              Jedna bušilica se u proseku koristi samo 13 minuta tokom svog
              životnog veka. Deljenjem smanjujemo otpad.
            </p>
          </div>

          <div className="group rounded-2xl bg-podeli-light p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-podeli-blue/10 text-podeli-blue">
              <HeartHandshake className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-podeli-dark">
              Upoznaj komšije
            </h3>
            <p className="mt-3 leading-7 text-muted-foreground">
              Podeli je više od transakcije. To je prilika da upoznaš ljude koji
              žive oko tebe i izgradiš poverenje.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

async function LatestBlogSection() {
  const posts = getAllPosts().slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <h2 className="text-2xl font-bold tracking-tight text-podeli-dark sm:text-3xl">
            Najnovije sa bloga
          </h2>
          <Link
            href="/blog"
            className="text-sm font-semibold text-podeli-accent hover:text-podeli-accent/90"
          >
            Svi članci &rarr;
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersSection() {
  return (
    <section className="bg-podeli-accent/5 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <h2 className="text-2xl font-bold tracking-tight text-podeli-dark sm:text-3xl">
            Naši partneri
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Partner CTA Card */}
          <Link
            href="mailto:kontakt@podeli.rs?subject=Zainteresovan sam za partnerstvo"
            className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-podeli-accent/40 bg-gradient-to-br from-podeli-accent/10 to-podeli-accent/5 p-8 transition-all hover:border-podeli-accent hover:shadow-lg hover:shadow-podeli-accent/10"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-podeli-accent/20 blur-2xl transition-all group-hover:bg-podeli-accent/30" />
            <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-podeli-blue/20 blur-2xl" />

            <div className="relative">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-podeli-accent/20 text-podeli-accent transition-transform group-hover:scale-110">
                <Handshake className="h-7 w-7" />
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-podeli-accent" />
                <span className="text-sm font-medium text-podeli-accent">
                  Otvoreno za prijave
                </span>
              </div>

              <h3 className="mt-3 text-xl font-bold text-podeli-dark">
                Vi - postanite naš partner
              </h3>

              <p className="mt-3 leading-7 text-muted-foreground">
                Imate biznis ili ideju koja se uklapa u našu misiju deljenja?
                Javite nam se i hajde da zajedno gradimo zajednicu.
              </p>

              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-podeli-accent transition-all group-hover:gap-3">
                <span>Kontaktirajte nas</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  return (
    <div className="min-h-screen bg-podeli-light font-sans text-podeli-dark selection:bg-podeli-accent/20 selection:text-podeli-dark">
      <NavBar />

      <HeroSection />

      <Suspense fallback={<ItemsGridSkeleton />}>
        <ProductShowcaseSection />
      </Suspense>

      <WhySharingSection />

      {/* Latest from blog */}
      <LatestBlogSection />

      {/* Partners Section */}
      <PartnersSection />

      {/* Trust Section */}
      <section className="bg-podeli-dark py-24 text-podeli-light">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Sigurnost je na prvom mestu
              </h2>
              <p className="mt-6 text-lg text-podeli-light/80">
                Znamo da je poverenje ključno. Zato smo izgradili sistem koji
                štiti i vlasnike i one koji iznajmljuju.
              </p>

              <ul className="mt-10 space-y-6">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 flex-none text-podeli-accent" />
                  <div>
                    <strong className="block font-semibold text-podeli-light">
                      Verifikovani korisnici
                    </strong>
                    <span className="text-podeli-light/70">
                      Svaki nalog prolazi kroz proveru telefona i lokacije.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 flex-none text-podeli-accent" />
                  <div>
                    <strong className="block font-semibold text-podeli-light">
                      Ocene i recenzije
                    </strong>
                    <span className="text-podeli-light/70">
                      Vidiš iskustva drugih pre nego što se dogovoriš.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 flex-none text-podeli-accent" />
                  <div>
                    <strong className="block font-semibold text-podeli-light">
                      Sigurni dogovori
                    </strong>
                    <span className="text-podeli-light/70">
                      Jasna pravila o korišćenju i vraćanju stvari.
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="relative rounded-3xl bg-podeli-dark/80 border border-podeli-accent/20 p-8">
              <div className="absolute -top-4 -right-4 -z-10 h-full w-full rounded-3xl bg-podeli-accent/20 blur-2xl"></div>
              <blockquote className="space-y-6">
                <p className="text-xl font-medium italic text-podeli-light/90">
                  &quot;Imao sam merdevine koje su stajale u garaži 3 godine.
                  Preko Podeli platforme sam ih iznajmio komšiji za vikend. Ja
                  zaradio za kafu, on završio krečenje, a merdevine konačno
                  služe svrsi.&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-podeli-blue/30"></div>
                  <div>
                    <div className="font-semibold text-podeli-light">
                      Nikola Jovanović
                    </div>
                    <div className="text-sm text-podeli-light/70">
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
      <section className="relative overflow-hidden bg-podeli-dark py-24 text-center">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#f8f7ff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        ></div>
        <div className="relative mx-auto flex max-w-2xl flex-col items-center px-6">
          <h2 className="text-3xl font-bold tracking-tight text-podeli-light sm:text-4xl">
            Spreman da živiš pametnije?
          </h2>
          <p className="mt-6 max-w-xl text-center text-lg text-podeli-light/80">
            Pridruži se listi čekanja za Beograd. Obavestićemo te čim platforma
            postane aktivna u tvom kraju.
          </p>

          <form className="mx-auto mt-10 flex max-w-md flex-col items-center">
            <div className="w-full rounded-2xl bg-podeli-light p-2 shadow-xl shadow-podeli-dark/30">
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  placeholder="tvoja@email.adresa"
                  className="flex-1 rounded-xl border border-border px-5 py-3.5 text-podeli-dark placeholder:text-muted-foreground focus:border-podeli-accent focus:outline-none focus:ring-2 focus:ring-podeli-accent/30"
                />
                <Button
                  type="submit"
                  className="flex-none bg-podeli-accent px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-podeli-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-podeli-accent"
                >
                  Prijavi se
                </Button>
              </div>
            </div>
            <p className="mt-4 text-xs text-podeli-light/60">
              *Bez spama. Samo važne informacije o lansiranju.
            </p>
          </form>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-card py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground lg:px-8">
          <p>© {new Date().getFullYear()} podeli.rs – Sva prava zadržana.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-6">
            <Link href="/o-nama" className="hover:text-podeli-dark">
              O nama
            </Link>
            <Link href="/terms-of-service" className="hover:text-podeli-dark">
              Uslovi korišćenja
            </Link>
            <Link href="/cookie-policy" className="hover:text-podeli-dark">
              Politika kolačića
            </Link>
            <a
              href="mailto:kontakt@podeli.rs"
              className="hover:text-podeli-dark"
            >
              Kontakt
            </a>
            <a
              href="https://www.instagram.com/podeli_rs/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-podeli-dark"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </a>
            <a
              href="https://discord.gg/69MBaCTEnz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-podeli-dark"
              aria-label="Discord"
            >
              <DiscordIcon className="h-4 w-4" />
              Discord
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61587392755718"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-podeli-dark"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </a>
            <a
              href="https://www.linkedin.com/company/podeli-rs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-podeli-dark"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
