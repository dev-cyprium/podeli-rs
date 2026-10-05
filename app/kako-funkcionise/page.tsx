import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { BrandName } from "@/components/BrandName";

export default function KakoFunkcionisePage() {
  return (
    <div className="min-h-screen bg-podeli-light text-podeli-dark">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-podeli-accent/30 bg-podeli-accent/10 px-4 py-1.5 text-sm font-medium text-podeli-dark">
            Kako funkcioniše <BrandName />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-podeli-dark sm:text-5xl">
            Jednostavno deljenje, jasna pravila
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            <BrandName /> povezuje komšije koji žele da iznajme ili podele
            stvari na fer, siguran i jednostavan način. Ovo su osnovna pravila i
            tok korišćenja platforme.
          </p>
        </section>

        <section className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-podeli-dark">
              1. Besplatno objavljivanje
            </h2>
            <p className="mt-2 text-muted-foreground">
              U početnoj fazi objavljivanje je besplatno, bez pretplate i
              komercijalnog limita oglasa. Dodajte do 10 fotografija po
              predmetu.
            </p>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-podeli-dark">
              2. Pronađi ili objavi
            </h2>
            <p className="mt-2 text-muted-foreground">
              Tražiš alat, opremu ili nešto što ti treba? Pretraži ponudu u svom
              kraju. Imaš stvari koje ne koristiš? Objavi ih i zaradi.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Postavite način kontakta, tačnu cenu, depozit i termine
              dostupnosti pre objavljivanja.
            </p>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-podeli-dark">
              3. Dogovor i plaćanje
            </h2>
            <p className="mt-2 text-muted-foreground">
              Plaćanje se obavlja direktno između korisnika (vlasnik &lt;&gt;
              korisnik). <BrandName /> ne prima uplatu za najam niti čuva
              depozit.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Dogovorite cenu, način plaćanja, depozit i tačno vreme i mesto
              preuzimanja i vraćanja. Zahtev za rezervaciju nije potvrđena
              rezervacija.
            </p>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-podeli-dark">
              4. Jasni uslovi i podrška
            </h2>
            <p className="mt-2 text-muted-foreground">
              Ocene i recenzije pomažu pri izboru. Platforma ne nudi osiguranje
              predmeta niti garantuje ponašanje korisnika. Pre predaje
              dogovorite uslove i zabeležite stanje predmeta.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Ako nastane problem, prvo kontaktirajte drugu stranu, a za pomoć
              sa platformom pišite na kontakt@podeli.rs.
            </p>
          </div>
        </section>

        <section className="mt-14 rounded-3xl bg-podeli-dark px-6 py-10 text-podeli-light">
          <h2 className="text-2xl font-semibold">Ukratko:</h2>
          <ul className="mt-4 space-y-2 text-podeli-light/90">
            <li>• Objavljivanje je besplatno u početnoj fazi.</li>
            <li>• Nema komercijalnog limita oglasa.</li>
            <li>• Vlasnik potvrđuje zahtev za rezervaciju.</li>
            <li>• Plaćanje je direktno između korisnika.</li>
            <li>• Platforma ne nudi osiguranje niti čuva depozit.</li>
          </ul>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-podeli-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-podeli-accent/90"
            >
              Nazad na početnu
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
