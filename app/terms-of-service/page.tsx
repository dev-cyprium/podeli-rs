import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { formatSerbianDate } from "@/lib/serbian-date";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://podeli.rs";

export const metadata: Metadata = {
  title: "Uslovi korišćenja | PODELI.rs",
  description:
    "Uslovi korišćenja platforme PODELI.rs: odricanje odgovornosti, dostupnost usluge, kolačići i praćenje, recenzije i rana faza bez osiguranja.",
  alternates: {
    canonical: `${SITE_URL}/terms-of-service`,
  },
  openGraph: {
    title: "Uslovi korišćenja | PODELI.rs",
    description:
      "Uslovi korišćenja platforme PODELI.rs: odricanje odgovornosti, dostupnost, kolačići, recenzije.",
    url: `${SITE_URL}/terms-of-service`,
    siteName: "PODELI.rs",
    locale: "sr_RS",
    type: "website",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-podeli-light text-podeli-dark">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20 lg:px-8">
        <header className="mb-10">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-podeli-accent/30 bg-podeli-accent/10 px-4 py-1.5 text-sm font-medium text-podeli-dark">
            Pravni dokument
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-podeli-dark sm:text-4xl lg:text-5xl">
            Uslovi korišćenja
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Poslednja izmena:{" "}
            <span className="inline-flex items-center rounded-md border border-[#006992]/30 bg-[#006992]/10 px-2.5 py-1 text-sm font-medium text-[#006992]">
              <time dateTime="2026-01-30">
                {formatSerbianDate("2026-01-30", "long")}
              </time>
            </span>
            . Korišćenjem platforme podeli.rs prihvatate ove uslove.
          </p>
        </header>

        <article className="prose-podeli space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              1. Uvod
            </h2>
            <p>
              <strong>podeli.rs</strong> (u daljem tekstu &quot;platforma&quot;, &quot;mi&quot;) je online tržište
              koje povezuje vlasnike stvari sa korisnicima koji žele da ih
              iznajme. Korišćenjem naše platforme, prihvatate ove uslove
              korišćenja. Platforma deluje <strong>isključivo kao posrednik</strong> između
              korisnika. Mi <strong>ne posedujemo</strong> predmete niti <strong>ne sklapamo ugovore</strong> o
              iznajmljivanju u svoje ime.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              2. Odricanje odgovornosti za štetu
            </h2>
            <p>
              <strong>U potpunosti se odričemo odgovornosti</strong> za bilo kakvu direktnu,
              indirektnu, slučajnu ili posledičnu štetu koja može nastati u
              vezi sa korišćenjem platforme ili predmeta iznajmljenih putem
              platforme. Šteta uključuje, ali nije ograničena na: <strong>oštećenje
              predmeta, povredu korisnika, gubitak podataka ili poslovne
              posledice</strong>. Sva prava i obaveze u vezi sa predmetima i njihovim
              korišćenjem ostaju <strong>isključivo između davatelja u zakup i zakupca</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              3. Odricanje odgovornosti za krađu i gubitak
            </h2>
            <p>
              <strong>Ne snosimo odgovornost</strong> za krađu, gubitak ili zloupotrebu predmeta
              koji su objavljeni na platformi. Vlasnici predmeta iznajmljuju na{" "}
              <strong>sopstveni rizik</strong>. Preporučujemo da korisnici vode računa o{" "}
              <strong>dokumentovanju stanja</strong> predmeta pri predaji i primopredaji te da
              eventualne sporove rešavaju međusobno ili putem nadležnih organa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              4. Dostupnost usluge (uptime)
            </h2>
            <p>
              Nastojimo da platforma bude dostupna neprekidno. Cilj nam je
              dostupnost od najmanje <strong>99%</strong> u toku godine, uz
              moguće kratke prekide zbog održavanja ili vanrednih okolnosti. <strong>Ne
              garantujemo</strong>{" "}
              besprekornu dostupnost i <strong>ne snosimo odgovornost</strong>{" "}
              za posledice privremene nedostupnosti usluge.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              5. Kolačići i praćenje (PostHog)
            </h2>
            <p>
              Koristimo kolačiće i alate za analitiku kako bismo poboljšali
              platformu i korisničko iskustvo. Koristimo <strong>PostHog</strong>{" "}
              za praćenje <strong>anonimizovanih</strong> podataka o korišćenju (npr. koje
              stranice se posete, osnovne interakcije). Ti podaci nam pomažu da
              razumemo kako se platforma koristi i da donosimo odluke o
              razvoju. <strong>Ne prodajemo</strong>{" "}
              vaše podatke trećim stranama. Više o
              privatnosti možete naći u našoj Politici privatnosti, kada bude
              objavljena.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              6. Recenzije i ugled platforme
            </h2>
            <p>
              Recenzije na platformi su <strong>isključivo mišljenja korisnika</strong>. Mi <strong>ne
              potvrđujemo</strong>{" "}
              tačnost recenzija i ne snosimo odgovornost za njihov
              sadržaj. Korisnici su <strong>dužni</strong> da pre donošenja odluke o zakupu ili
              iznajmljivanju sami pročitaju recenzije i vode računa o ugledu
              druge strane. Platforma nudi recenzije kao pomoćnu informaciju, <strong>ne
              kao garanciju</strong>{" "}
              ponašanja korisnika.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              7. Rana faza: bez osiguranja
            </h2>
            <p>
              Platforma je trenutno u <strong>ranoj fazi</strong> razvoja. <strong>Ne nudimo osiguranje</strong>{" "}
              predmeta niti osiguranje od odgovornosti u vezi sa iznajmljivanjem
              putem naše platforme. <strong>Svi rizici</strong> u vezi sa predmetima i
              iznajmljivanjem snose <strong>isključivo korisnici</strong> (davatelj u zakup i
              zakupac). Preporučujemo da korisnici po potrebi sami obezbede
              odgovarajuće osiguranje ili zaštitu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              8. Zabrana zloupotrebe
            </h2>
            <p>
              <strong>Zabranjeno je</strong> korišćenje platforme u svrhe koje su protivzakonite
              ili u suprotnosti sa ovim uslovima. Zadržavamo pravo da
              <strong> privremeno ili trajno obustavimo pristup</strong>{" "}
              korisnicima koji krše
              uslove ili nanose štetu drugim korisnicima ili platformi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              9. Izmene uslova
            </h2>
            <p>
              Možemo povremeno menjati ove uslove. O značajnim izmenama
              bićete obavešteni putem platforme ili putem kontakt podataka koje ste
              ostavili. <strong>Nastavak korišćenja</strong>{" "}
              platforme nakon objave izmena{" "}
              <strong>smatra se prihvatanjem</strong>{" "}
              novih uslova.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-podeli-dark sm:text-2xl">
              10. Kontakt
            </h2>
            <p>
              Za pitanja u vezi sa uslovima korišćenja možete nas kontaktirati{" "}
              <a href="mailto:kontakt@podeli.rs">kontakt@podeli.rs</a>.
            </p>
          </section>
        </article>

        <footer className="mt-16 border-t border-border pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-podeli-accent hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Nazad na početnu
          </Link>
        </footer>
      </main>
    </div>
  );
}
