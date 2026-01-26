import Link from "next/link";

export default function KakoFunkcionisePage() {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-bold tracking-tight">
            PODELI.rs
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-amber-600"
          >
            Nazad na početnu
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800">
            Kako funkcioniše PODELI
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Jednostavno deljenje, jasna pravila
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            PODELI povezuje komšije koji žele da iznajme ili podele stvari na
            fer, siguran i jednostavan način. Ovo su osnovna pravila i tok
            korišćenja platforme.
          </p>
        </section>

        <section className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              1. Pretplata (za vlasnike)
            </h2>
            <p className="mt-2 text-slate-600">
              Pretplata je vrlo povoljna i odnosi se na korisnike koji
              objavljuju stvari. Sa jednom pretplatom možeš da izdaš:
            </p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>• 1 stvar odjednom</li>
              <li>• +1 dodatnu stvar u okviru istog perioda</li>
            </ul>
            <p className="mt-3 text-sm text-slate-500">
              To znači: jedna pretplata = do 2 aktivne ponude po ciklusu.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">2. Pronađi ili objavi</h2>
            <p className="mt-2 text-slate-600">
              Tražiš alat, opremu ili nešto što ti treba? Pretraži ponudu u svom
              kraju. Imaš stvari koje ne koristiš? Objavi ih i zaradi.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Iznajmljivanje nije vezano za pretplatu — pretplata važi za
              korisnike koji objavljuju stvari.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">3. Dogovor i plaćanje</h2>
            <p className="mt-2 text-slate-600">
              Plaćanje se obavlja direktno između korisnika (vlasnik &lt;&gt;
              korisnik). PODELI ne uzima uplatu za samu razmenu stvari, već
              pretplata omogućava pristup platformi.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Dogovorite cenu, vreme i način preuzimanja.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">4. Poverenje i zaštita</h2>
            <p className="mt-2 text-slate-600">
              Za sada, zaštita se zasniva na ocenama i recenzijama. Svaki
              korisnik nakon razmene ostavlja utisak, što gradi poverenje u
              zajednici.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Što više pozitivnih iskustava, to više sigurnosti za sve.
            </p>
          </div>
        </section>

        <section className="mt-14 rounded-3xl bg-slate-900 px-6 py-10 text-white">
          <h2 className="text-2xl font-semibold">Ukratko:</h2>
          <ul className="mt-4 space-y-2 text-slate-200">
            <li>
              • Jeftina pretplata važi za korisnike koji objavljuju stvari.
            </li>
            <li>• 1 pretplata = 1 stvar + 1 dodatna stvar po periodu.</li>
            <li>• Iznajmljivanje je dostupno bez pretplate.</li>
            <li>• Plaćanje je direktno između korisnika.</li>
            <li>• Sigurnost zasnovana na ocenama i recenzijama.</li>
          </ul>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
            >
              Nazad na početnu
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
