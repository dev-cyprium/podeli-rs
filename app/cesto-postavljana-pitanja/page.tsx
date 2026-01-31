import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Često postavljana pitanja | PODELI",
  description:
    "Pronađite odgovore na najčešća pitanja o korišćenju PODELI platforme za iznajmljivanje i deljenje stvari.",
};

const faqs = [
  {
    question: "Kako da iskoristim kupon?",
    answer: `Da biste iskoristili kupon, pratite sledeće korake:
1. Prijavite se na svoj nalog
2. Idite na stranicu "Planovi" (ili kliknite na dugme "Aktiviraj pretplatu")
3. Kliknite na dugme "Imam kupon kod"
4. Unesite vaš kupon kod u polje koje se pojavi
5. Kliknite na "Aktiviraj" i vaša pretplata će biti automatski aktivirana

Napomena: Svaki kupon može da se iskoristi samo jednom i vezan je za vaš nalog.`,
  },
  {
    question: "Kako funkcioniše plaćanje za iznajmljivanje?",
    answer: `Plaćanje se obavlja direktno između vlasnika i korisnika koji iznajmljuje stvar. PODELI platforma ne posreduje u samoj transakciji — mi samo povezujemo korisnike.

Preporučeni koraci:
• Dogovorite cenu unapred preko chat-a
• Dogovorite način plaćanja (gotovina, prenos, itd.)
• Sačuvajte dokaz o plaćanju za svaki slučaj

Pretplata na PODELI služi za objavljivanje stvari, a ne za samo iznajmljivanje.`,
  },
  {
    question: "Šta ako se stvar ošteti tokom iznajmljivanja?",
    answer: `Trenutno, PODELI ne nudi osiguranje za štetu. Preporučujemo sledeće mere predostrožnosti:

• Pre predaje, fotografišite stvar sa svih strana
• Dogovorite se o depozitu za vrednije stvari
• Jasno definišite uslove korišćenja u opisu predmeta
• Komunicirajte otvoreno o eventualnim oštećenjima

Nakon razmene, ostavite iskren utisak kroz sistem ocena kako biste pomogli zajednici da prepozna pouzdane korisnike.`,
  },
  {
    question: "Kako da ostavim recenziju?",
    answer: `Recenziju možete ostaviti nakon završene razmene:

1. Idite na "Kontrolna tabla" → "Moji zakupi" (ako ste iznajmljivali) ili "Moji predmeti" (ako ste izdavali)
2. Pronađite završenu rezervaciju
3. Kliknite na opciju za ostavljanje recenzije
4. Ocenite korisnika (1-5 zvezdica) i napišite kratak komentar

Recenzije su ključne za izgradnju poverenja u zajednici i pomažu svima da donose bolje odluke.`,
  },
];

export default function CestoPostavljanaPitanjaPage() {
  return (
    <div className="min-h-screen bg-podeli-light text-podeli-dark">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-podeli-accent/30 bg-podeli-accent/10 px-4 py-1.5 text-sm font-medium text-podeli-dark">
            Pomoć i podrška
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-podeli-dark sm:text-5xl">
            Često postavljana pitanja
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Pronađite odgovore na najčešća pitanja o korišćenju PODELI
            platforme. Ako ne pronađete odgovor, slobodno nas kontaktirajte.
          </p>
        </section>

        <section className="mt-14 space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-2xl bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-podeli-dark">
                {faq.question}
              </h2>
              <p className="mt-3 whitespace-pre-line text-muted-foreground">
                {faq.answer}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-14 rounded-3xl bg-podeli-dark px-6 py-10 text-podeli-light">
          <h2 className="text-2xl font-semibold">Imate još pitanja?</h2>
          <p className="mt-4 text-podeli-light/90">
            Ako niste pronašli odgovor na svoje pitanje, možete nas kontaktirati
            putem email-a ili društvenih mreža. Rado ćemo vam pomoći!
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href="mailto:kontakt@podeli.rs"
              className="inline-flex items-center rounded-xl bg-podeli-accent px-6 py-2.5 text-sm font-semibold text-podeli-dark hover:bg-podeli-accent/90"
            >
              Kontaktirajte nas
            </a>
            <Link
              href="/kako-funkcionise"
              className="inline-flex items-center rounded-xl border border-podeli-light/30 px-6 py-2.5 text-sm font-semibold text-podeli-light hover:bg-podeli-light/10"
            >
              Kako funkcioniše
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
