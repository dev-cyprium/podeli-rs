import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Besplatno objavljivanje | podeli.rs",
  description:
    "Objavljivanje je besplatno tokom početne faze platforme, bez pretplate i komercijalnog limita oglasa.",
};

export default function PlanoviPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <BackButton />
        <h1 className="mt-6 text-3xl font-bold text-podeli-dark">
          Objavljivanje je besplatno
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          podeli.rs je u početnoj fazi. Objavite predmete bez pretplate i
          komercijalnog limita oglasa.
        </p>
        <ul className="mt-6 list-inside list-disc space-y-3 text-muted-foreground">
          <li>Do 10 fotografija po predmetu.</li>
          <li>Dogovor i plaćanje direktno sa vlasnikom.</li>
          <li>Tačni podaci, dostupnost i uslovi u svakom oglasu.</li>
          <li>Spam i duplirani oglasi nisu dozvoljeni.</li>
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Platforma ne naplaćuje najam niti čuva depozit i ne nudi osiguranje.
          Cenu, depozit, vreme preuzimanja i vraćanja dogovarate sa vlasnikom.
          Ako se uslovi objavljivanja promene, obavestićemo vas unapred.
        </p>
        <Button
          asChild
          className="mt-8 bg-podeli-accent text-white hover:bg-podeli-accent/90"
        >
          <Link href="/kontrolna-tabla/predmeti/novi">Objavi predmet</Link>
        </Button>
        <p className="mt-8 text-sm text-muted-foreground">
          Potrebna vam je pomoć?{" "}
          <a
            href="mailto:kontakt@podeli.rs"
            className="text-podeli-blue underline"
          >
            kontakt@podeli.rs
          </a>
        </p>
      </main>
    </div>
  );
}
