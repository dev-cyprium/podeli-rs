import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { formatSerbianDate } from "@/lib/serbian-date";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://podeli.rs";

export const metadata: Metadata = {
  title: "Politika kolačića | podeli.rs",
  description:
    "Politika kolačića platforme podeli.rs: koje kolačiće koristimo, zašto ih koristimo i kako možete upravljati njima.",
  alternates: {
    canonical: `${SITE_URL}/cookie-policy`,
  },
  openGraph: {
    title: "Politika kolačića | podeli.rs",
    description:
      "Politika kolačića platforme podeli.rs: koje kolačiće koristimo, zašto ih koristimo i kako možete upravljati njima.",
    url: `${SITE_URL}/cookie-policy`,
    siteName: "podeli.rs",
    locale: "sr_RS",
    type: "website",
  },
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-podeli-light text-podeli-dark">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20 lg:px-8">
        <header className="mb-10">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-podeli-accent/30 bg-podeli-accent/10 px-4 py-1.5 text-sm font-medium text-podeli-dark">
            Pravni dokument
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-podeli-dark sm:text-4xl lg:text-5xl">
            Politika kolačića
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Poslednja izmena:{" "}
            <span className="inline-flex items-center rounded-md border border-[#006992]/30 bg-[#006992]/10 px-2.5 py-1 text-sm font-medium text-[#006992]">
              <time dateTime="2026-02-07">
                {formatSerbianDate("2026-02-07", "long")}
              </time>
            </span>
            . Ova politika objašnjava kako koristimo kolačiće i slične
            tehnologije.
          </p>
        </header>

        <article className="prose-podeli space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              1. Šta su kolačići?
            </h2>
            <p>
              Kolačići (cookies) su mali tekstualni fajlovi koji se čuvaju na
              vašem uređaju (računaru, telefonu ili tabletu) kada posetite
              internet stranicu. Oni omogućavaju stranici da zapamti vaše radnje
              i podešavanja tokom vremena, tako da ne morate da ih ponovo
              unosite svaki put kada posetite stranicu ili prelazite sa jedne
              stranice na drugu.
            </p>
            <p>
              Pored kolačića, koristimo i druge slične tehnologije poput{" "}
              <strong>localStorage</strong> mehanizma u pregledaču za čuvanje
              vašeg izbora u vezi sa kolačićima.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              2. Kolačići koje koristimo
            </h2>
            <p>
              <strong>podeli.rs</strong> (u daljem tekstu &quot;platforma&quot;,
              &quot;mi&quot;) koristi sledeće kolačiće i tehnologije praćenja:
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-podeli-dark">
                      Naziv / Servis
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-podeli-dark">
                      Provajder
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-podeli-dark">
                      Svrha
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-podeli-dark">
                      Trajanje
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-podeli-dark">
                      Tip
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 font-medium">__clerk_*</td>
                    <td className="px-4 py-3">Clerk</td>
                    <td className="px-4 py-3">
                      Autentifikacija i upravljanje sesijama korisnika
                    </td>
                    <td className="px-4 py-3">Sesija / do 1 godine</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-[#006992]/10 px-2.5 py-0.5 text-xs font-medium text-[#006992]">
                        Neophodni
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">_vercel_*</td>
                    <td className="px-4 py-3">Vercel Analytics</td>
                    <td className="px-4 py-3">
                      Anonimizovane metrike poseta i performansi sajta
                    </td>
                    <td className="px-4 py-3">Sesija</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-[#006992]/10 px-2.5 py-0.5 text-xs font-medium text-[#006992]">
                        Neophodni
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">ph_*</td>
                    <td className="px-4 py-3">PostHog</td>
                    <td className="px-4 py-3">
                      Analitika ponašanja korisnika (anonimizovano)
                    </td>
                    <td className="px-4 py-3">Do 1 godine</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-podeli-accent/10 px-2.5 py-0.5 text-xs font-medium text-podeli-accent">
                        Analitički
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">
                      cookie-consent
                    </td>
                    <td className="px-4 py-3">podeli.rs</td>
                    <td className="px-4 py-3">
                      Čuva vaš izbor u vezi sa korišćenjem kolačića
                    </td>
                    <td className="px-4 py-3">Trajno (localStorage)</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-[#006992]/10 px-2.5 py-0.5 text-xs font-medium text-[#006992]">
                        Neophodni
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              3. Neophodni kolačići
            </h2>
            <p>
              Ovi kolačići su neophodni za funkcionisanje platforme i ne mogu se
              isključiti. Oni uključuju:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Clerk kolačići:</strong> omogućavaju prijavu na nalog,
                održavanje sesije i bezbednost autentifikacije
              </li>
              <li>
                <strong>Vercel Analytics:</strong> prikuplja anonimizovane
                podatke o posećenosti i performansama sajta bez korišćenja
                kolačića sa ličnim podacima (GDPR usklađeno po defaultu)
              </li>
              <li>
                <strong>Izbor kolačića:</strong> čuva vaš pristanak ili odbijanje
                analitičkih kolačića u localStorage pregledača
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              4. Analitički kolačići
            </h2>
            <p>
              Analitički kolačići nam pomažu da razumemo kako korisnici koriste
              platformu, koje stranice posećuju i gde nailaze na probleme.{" "}
              <strong>Ovi kolačići se aktiviraju samo uz vaš pristanak.</strong>
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>PostHog:</strong> prikuplja anonimizovane podatke o
                korišćenju platforme (posećene stranice, klikovi, trajanje
                sesije). Podaci se koriste isključivo za poboljšanje korisničkog
                iskustva.{" "}
                <strong>
                  Ne prodajemo vaše podatke niti ih koristimo za
                  personalizovano oglašavanje.
                </strong>
              </li>
            </ul>
            <p className="mt-4">
              Ako odaberete opciju &quot;Samo neophodni&quot; na baneru za
              kolačiće, PostHog analitika se neće učitati i nikakvi analitički
              kolačići neće biti postavljeni na vaš uređaj.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              5. Kako upravljati kolačićima
            </h2>
            <p>
              Možete upravljati kolačićima kroz podešavanja vašeg pregledača.
              Ispod su linkovi ka uputstvima za najpopularnije pregledače:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/sr/kb/cookies-information-websites-store-on-your-computer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apple Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/sr-latn-rs/windows/upravljanje-kolacicima-u-pregledacu-microsoft-edge-view-allow-block-delete-and-use-168dab11-0753-043d-7c16-ede5947fc64d"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
            <p className="mt-4">
              <strong>Napomena:</strong> Blokiranje neophodnih kolačića može
              uticati na funkcionalnost platforme (npr. nemogućnost prijave na
              nalog).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              6. Usluge trećih strana
            </h2>
            <p>
              Koristimo sledeće usluge trećih strana koje mogu postavljati
              kolačiće:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Clerk</strong> (autentifikacija) –{" "}
                <a
                  href="https://clerk.com/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Politika privatnosti
                </a>
              </li>
              <li>
                <strong>Vercel Analytics</strong> (metrike poseta) –{" "}
                <a
                  href="https://vercel.com/docs/analytics/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Politika privatnosti
                </a>
              </li>
              <li>
                <strong>PostHog</strong> (analitika ponašanja) –{" "}
                <a
                  href="https://posthog.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Politika privatnosti
                </a>
              </li>
              <li>
                <strong>Google Search Console</strong> (SEO verifikacija i
                indeksiranje) –{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Politika privatnosti
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              7. Povlačenje saglasnosti
            </h2>
            <p>
              Svoj pristanak za analitičke kolačiće možete povući u bilo kom
              trenutku na sledeće načine:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Brisanje localStorage podataka:</strong> Otvorite
                Developer Tools u pregledaču (F12), idite na karticu
                &quot;Application&quot; → &quot;Local Storage&quot; →{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                  podeli.rs
                </code>{" "}
                i obrišite stavku{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                  cookie-consent
                </code>
                . Pri sledećoj poseti pojaviće se baner za izbor ponovo.
              </li>
              <li>
                <strong>Brisanje kolačića u pregledaču:</strong> Koristite
                podešavanja pregledača da obrišete sve kolačiće za sajt
                podeli.rs.
              </li>
              <li>
                <strong>Kontakt:</strong> Pišite nam na{" "}
                <a href="mailto:kontakt@podeli.rs">kontakt@podeli.rs</a> i mi
                ćemo vam pomoći.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              8. Izmene politike kolačića
            </h2>
            <p>
              Možemo povremeno menjati ovu politiku kolačića kako bismo je
              uskladili sa promenama u tehnologijama koje koristimo ili sa
              zakonskim zahtevima. O značajnim izmenama bićete obavešteni putem
              platforme. Preporučujemo da povremeno proverite ovu stranicu.{" "}
              <strong>Nastavak korišćenja</strong> platforme nakon objave izmena{" "}
              <strong>smatra se prihvatanjem</strong> nove politike kolačića.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              9. Kontakt
            </h2>
            <p>
              Za pitanja u vezi sa kolačićima i zaštitom podataka možete nas
              kontaktirati na{" "}
              <a href="mailto:kontakt@podeli.rs">kontakt@podeli.rs</a>.
            </p>
          </section>
        </article>

        <footer className="mt-16 border-t border-border pt-8">
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-podeli-accent hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Nazad na početnu
            </Link>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} podeli.rs – Sva prava zadržana.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
