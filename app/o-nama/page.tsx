import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { DiscordIcon } from "@/components/icons/Icons";

function S({ children }: { children: React.ReactNode }) {
  return (
    <strong className="text-podeli-accent font-semibold">{children}</strong>
  );
}

export default function ONamaPage() {
  return (
    <div className="min-h-screen bg-podeli-light text-podeli-dark">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-podeli-accent/30 bg-podeli-accent/10 px-4 py-1.5 text-sm font-medium text-podeli-dark">
            O nama
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-podeli-dark sm:text-5xl">
            Gradimo zajednicu deljenja
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            <span className="text-podeli-accent">podeli</span> je platforma koja
            povezuje komšije i omogućava im da dele stvari koje im ne trebaju
            svakodnevno.
          </p>
        </section>

        <section className="mt-14 space-y-6">
          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-podeli-dark">
              Naša misija
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Verujemo da u svakom komšiluku postoji mnogo korisnih stvari koje
              većinu vremena stoje neiskorišćene. Bušilice, merdevine, oprema za
              kampovanje, alati - sve to može da posluži <S>nekome drugom</S>{" "}
              dok vama ne treba.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Naša misija je da olakšamo deljenje između komšija, smanjimo
              nepotrebnu potrošnju i pomognemo ljudima da uštede novac dok grade
              poverenje u svojoj zajednici.
            </p>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-podeli-dark">
              Zašto <span className="text-podeli-accent">podeli</span>?
            </h2>
            <ul className="mt-3 space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-podeli-accent font-bold">•</span>
                <span>
                  <strong className="text-podeli-dark">Lokalno i lično.</strong>{" "}
                  Fokusiramo se na komšiluk — ljude koji žive blizu vas i sa
                  kojima možete lako da se dogovorite.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-podeli-accent font-bold">•</span>
                <span>
                  <strong className="text-podeli-dark">Jednostavno.</strong> Bez
                  komplikovanih procedura. Objavi stvar, dogovori se sa
                  zainteresovanim, završi razmenu.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-podeli-accent font-bold">•</span>
                <span>
                  <strong className="text-podeli-dark">Fer.</strong> Nema
                  skrivenih provizija na razmenu. Pretplata je simbolična i
                  omogućava pristup platformi.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-podeli-dark">
              Ko stoji iza <span className="text-podeli-accent">podeli</span>?
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <span className="text-podeli-accent">podeli</span> je projekat
              koji je nastao iz želje da se promeni način na koji razmišljamo o
              vlasništvu i deljenju. Pokrenut je u Beogradu sa idejom da se
              proširi na celu Srbiju i region.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Ako imate pitanja, predloge ili želite da sarađujete, slobodno nas
              kontaktirajte.
            </p>
          </div>
        </section>

        <section className="mt-14 rounded-3xl bg-podeli-dark px-6 py-10 text-podeli-light">
          <h2 className="text-2xl font-semibold">Kontaktirajte nas</h2>
          <p className="mt-3 text-podeli-light/90">
            Imate pitanja ili želite da se povežete? Javite nam se putem email-a
            ili nas pratite na društvenim mrežama.
          </p>

          <div className="mt-6 space-y-3">
            <a
              href="mailto:kontakt@podeli.rs"
              className="block text-podeli-accent hover:underline"
            >
              kontakt@podeli.rs
            </a>

            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="https://www.instagram.com/podeli_rs/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-podeli-light/80 hover:text-podeli-accent transition-colors"
              >
                <Instagram className="h-5 w-5" />
                Instagram
              </a>
              <a
                href="https://discord.gg/69MBaCTEnz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-podeli-light/80 hover:text-podeli-accent transition-colors"
              >
                <DiscordIcon className="h-5 w-5" />
                Discord
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61587392755718"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-podeli-light/80 hover:text-podeli-accent transition-colors"
              >
                <Facebook className="h-5 w-5" />
                Facebook
              </a>
            </div>
          </div>

          <div className="mt-8">
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
