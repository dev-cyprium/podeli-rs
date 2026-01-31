import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { formatSerbianDate } from "@/lib/serbian-date";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://podeli.rs";

export const metadata: Metadata = {
  title: "Politika privatnosti | PODELI.rs",
  description:
    "Politika privatnosti platforme PODELI.rs: prikupljanje podataka, kolačići, analitika, prava korisnika i zaštita podataka.",
  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },
  openGraph: {
    title: "Politika privatnosti | PODELI.rs",
    description:
      "Politika privatnosti platforme PODELI.rs: prikupljanje podataka, kolačići, analitika, prava korisnika.",
    url: `${SITE_URL}/privacy-policy`,
    siteName: "PODELI.rs",
    locale: "sr_RS",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-podeli-light text-podeli-dark">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20 lg:px-8">
        <header className="mb-10">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-podeli-accent/30 bg-podeli-accent/10 px-4 py-1.5 text-sm font-medium text-podeli-dark">
            Pravni dokument
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-podeli-dark sm:text-4xl lg:text-5xl">
            Politika privatnosti
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Poslednja izmena:{" "}
            <span className="inline-flex items-center rounded-md border border-[#006992]/30 bg-[#006992]/10 px-2.5 py-1 text-sm font-medium text-[#006992]">
              <time dateTime="2026-01-30">
                {formatSerbianDate("2026-01-30", "long")}
              </time>
            </span>
            . Vaša privatnost nam je važna.
          </p>
        </header>

        <article className="prose-podeli space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              1. Uvod
            </h2>
            <p>
              <strong>podeli.rs</strong> (u daljem tekstu &quot;platforma&quot;, &quot;mi&quot;) posvećena je
              zaštiti vaše privatnosti. Ova politika privatnosti objašnjava koje
              podatke prikupljamo, kako ih koristimo i koja prava imate u vezi
              sa vašim podacima. Korišćenjem naše platforme, <strong>prihvatate praksu</strong>{" "}
              opisanu u ovoj politici.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              2. Podaci koje prikupljamo
            </h2>
            <p>Prikupljamo sledeće kategorije podataka:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Podaci o nalogu:</strong> ime, prezime, adresa e-pošte,
                profilna slika (putem Clerk autentifikacije)
              </li>
              <li>
                <strong>Podaci o predmetima:</strong> slike, opisi, lokacija,
                cena i dostupnost predmeta koje objavljujete
              </li>
              <li>
                <strong>Podaci o rezervacijama:</strong> istorija rezervacija,
                datumi, komunikacija sa drugim korisnicima
              </li>
              <li>
                <strong>Tehnički podaci:</strong> IP adresa, tip uređaja,
                pregledač, operativni sistem
              </li>
              <li>
                <strong>Podaci o korišćenju:</strong> koje stranice posećujete,
                kako koristite platformu (anonimizovano)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              3. Kako koristimo vaše podatke
            </h2>
            <p>Vaše podatke koristimo za:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Pružanje usluge:</strong> omogućavanje objavljivanja
                predmeta, rezervacija i komunikacije između korisnika
              </li>
              <li>
                <strong>Poboljšanje platforme:</strong> analiza korišćenja radi
                unapređenja korisničkog iskustva
              </li>
              <li>
                <strong>Bezbednost:</strong> sprečavanje prevara i zloupotreba
              </li>
              <li>
                <strong>Komunikacija:</strong> slanje obaveštenja o
                rezervacijama, recenzijama i važnim promenama
              </li>
              <li>
                <strong>Zakonske obaveze:</strong> ispunjavanje pravnih zahteva
                kada je to neophodno
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              4. Kolačići i analitika
            </h2>
            <p>
              Koristimo kolačiće i alate za analitiku kako bismo poboljšali
              platformu:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Neophodni kolačići:</strong> omogućavaju osnovne
                funkcije poput prijave i navigacije
              </li>
              <li>
                <strong>Analitički kolačići (PostHog):</strong> prikupljamo{" "}
                <strong>anonimizovane</strong> podatke o korišćenju platforme
                (posećene stranice, klikovi, trajanje sesije)
              </li>
            </ul>
            <p className="mt-4">
              PostHog nam pomaže da razumemo kako se platforma koristi.{" "}
              <strong>Ne prodajemo</strong> vaše podatke trećim stranama niti ih
              koristimo za personalizovano oglašavanje.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              5. Usluge trećih strana
            </h2>
            <p>Koristimo sledeće usluge trećih strana:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Clerk:</strong> autentifikacija i upravljanje
                korisničkim nalozima
              </li>
              <li>
                <strong>Convex:</strong> skladištenje podataka i serverske
                funkcije
              </li>
              <li>
                <strong>PostHog:</strong> analitika korišćenja platforme
              </li>
            </ul>
            <p className="mt-4">
              Ove usluge imaju sopstvene politike privatnosti. Preporučujemo da
              ih pročitate kako biste razumeli kako obrađuju vaše podatke.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              6. Čuvanje podataka
            </h2>
            <p>
              Vaše podatke čuvamo <strong>dok imate aktivan nalog</strong> na
              platformi. Nakon brisanja naloga, vaši lični podaci biće obrisani
              u roku od <strong>30 dana</strong>, osim podataka koje smo dužni
              da čuvamo prema zakonu. Anonimizovani analitički podaci mogu biti
              zadržani duže radi statističkih analiza.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              7. Vaša prava
            </h2>
            <p>U skladu sa zakonom, imate sledeća prava:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Pravo na pristup:</strong> možete zatražiti kopiju vaših
                podataka
              </li>
              <li>
                <strong>Pravo na ispravku:</strong> možete ažurirati netačne
                podatke
              </li>
              <li>
                <strong>Pravo na brisanje:</strong> možete zatražiti brisanje
                vaših podataka
              </li>
              <li>
                <strong>Pravo na prenosivost:</strong> možete zatražiti izvoz
                vaših podataka
              </li>
              <li>
                <strong>Pravo na prigovor:</strong> možete uložiti prigovor na
                određene načine obrade
              </li>
            </ul>
            <p className="mt-4">
              Za ostvarivanje ovih prava, kontaktirajte nas putem adrese
              navedene u odeljku Kontakt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              8. Bezbednost podataka
            </h2>
            <p>
              Preduzimamo <strong>tehničke i organizacione mere</strong> za
              zaštitu vaših podataka od neovlašćenog pristupa, gubitka ili
              zloupotrebe. Koristimo šifrovanu komunikaciju (HTTPS), bezbednu
              autentifikaciju i pouzdane dobavljače usluga. Ipak,{" "}
              <strong>nijedan sistem nije potpuno siguran</strong> i ne možemo
              garantovati apsolutnu bezbednost podataka.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              9. Privatnost dece
            </h2>
            <p>
              Naša platforma <strong>nije namenjena</strong> osobama mlađim od
              18 godina. Ne prikupljamo svesno podatke od maloletnika. Ako
              saznamo da smo prikupili podatke od osobe mlađe od 18 godina,
              preduzećemo korake da te podatke obrišemo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              10. Međunarodni prenos podataka
            </h2>
            <p>
              Vaši podaci mogu biti obrađivani na serverima koji se nalaze van
              Srbije, uključujući zemlje Evropske unije i Sjedinjene Američke
              Države. Naši dobavljači usluga primenjuju odgovarajuće mere
              zaštite u skladu sa međunarodnim standardima.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              11. Izmene politike privatnosti
            </h2>
            <p>
              Možemo povremeno menjati ovu politiku privatnosti. O značajnim
              izmenama bićete obavešteni putem platforme ili putem e-pošte.
              Preporučujemo da povremeno proverite ovu stranicu.{" "}
              <strong>Nastavak korišćenja</strong> platforme nakon objave izmena{" "}
              <strong>smatra se prihvatanjem</strong> nove politike.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              12. Kontakt
            </h2>
            <p>
              Za pitanja u vezi sa privatnošću i zaštitom podataka možete nas
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
