# Pripremljene ponude i CRM

Administrator priprema nejavni predlog oglasa. Ponuđač preko linka pregleda ponudu, preuzima je svojim nalogom i potvrđuje podatke pre objave. Pregled i preuzimanje sami ne objavljuju oglas.

## Administrator

Otvorite **Super-admin → Saradnja** (`/super-admin/saradnja`). Početni prikaz je **Sve firme**, uključujući ranije uvezene kontakte.

1. **Izmeni firmu**: ispravite naziv, kategoriju, telefon i mejl. Telefon i kontakt forma su opcioni. Za preuzimanje ponude potreban je mejl ponuđača. Izaberite konkretan sledeći zadatak, npr. **Pripremi ponudu**. Istorija saradnje ostaje sačuvana; promena telefona/naziva ne pravi duplikat pri ponovnom početnom uvozu.
2. **Pripremi ponudu**: unesite naziv, opis, kategoriju i cenu (ili cenu po dogovoru). Dodajte fotografije, lokaciju i lično preuzimanje ako ih znate. **Sačuvaj nacrt ponude** čuva nejavni predlog; termine unosi ponuđač. Za jednu firmu priprema se jedan predlog, koji možete naknadno menjati.
3. **Napravi link ponude**: link je namenjen mejlu sa kartice i važi 30 dana. **Pregled ponude** otvara stranicu koju će videti ponuđač. **Kopiraj link** omogućava ručno slanje. **Otvori pripremljen mejl** otvara vaš mejl program sa popunjenom porukom; poruku sami šaljete.
4. Posle stvarnog slanja izaberite **Označi kao poslato**. Po želji postavite podsetnik. Kopiranje linka i otvaranje mejla ne menjaju status u „poslato”.
5. **Odgovor i istorija**: zabeležite odgovor, odbijanje, interne beleške ili dogovor za kasnije. Način komunikacije se odnosi na taj događaj; sledeći zadatak je zaseban izbor. Preuzimanje i objava se automatski upisuju u istoriju i povezuju firmu sa nalogom ponuđača.

**Izmeni nacrt** poništava prethodni link. Promena mejla firme takođe poništava link dok ponuda nije preuzeta. Napravite novi link pre ponovnog slanja. **Povuci link** odmah ukida pregled i preuzimanje. Posle preuzimanja administrator ne menja ponudu; uređuje je ponuđač.

## Ponuđač

1. Otvorite dobijeni link i pregledajte predlog bez prijave.
2. Napravite nalog ili se prijavite nalogom sa potvrđenom mejl adresom kojoj je ponuda namenjena. Koristite postojeći Clerk tok prijave; Podeli ne postavlja niti šalje privremenu lozinku. Posle prijave vraćate se na istu ponudu.
3. Kliknite **Preuzmi i uredi ponudu**. Predlog se čuva na vašem nalogu. U delu **Moji predmeti → Preuzete ponude za objavu** možete mu se vratiti i posle isteka početnog linka.
4. Dodajte termine dostupnosti, proverite cenu, fotografije, grad/opštinu i preuzimanje. Pre objave izaberite kako zainteresovani korisnici mogu da vas kontaktiraju.
5. **Potvrdi i objavi oglas** pravi javni oglas. Dalje ga menjate kroz **Moji predmeti**, kao i ostale oglase.

Predlog može biti nepotpun i može uključivati najam, prodaju ili oba. Javna objava zahteva iste podatke i validaciju kao redovno dodavanje predmeta, uključujući fotografiju, lokaciju i kontakt. Najam zahteva dostupnost; prodaja zahteva prodajnu cenu i ne zahteva termine. Ponovljena potvrda ne pravi dupli oglas.

## Napomena za razvoj i objavu

Nacrti su u zasebnoj tabeli `listingOffers`, pa postojeći javni upiti i rezervacije ne mogu da ih uključe. Preuzimanje proverava potpisani identitet: `email` i `email_verified` u Clerk JWT šablonu `convex` moraju odgovarati potvrđenoj adresi ponuđača. To su standardne tvrdnje Clerk Convex šablona; nedostajuća ili nepotvrđena adresa ne dobija pravo preuzimanja.

Potrebno je zajedno objaviti Convex i frontend kroz postojeći deployment postupak. Kreiranje linkova ne šalje automatske poruke niti kreira tuđe naloge. Privatni linkovi imaju `noindex` i `no-referrer`; tajna iz linka uklanja se iz URL-ova analitike.

## Uređivanje pre prijave

Primalac bira „Pregledaj i uredi ponudu”, popunjava postojeći obrazac i bira fotografije pre prijave. Podaci i fajlovi ostaju u memoriji otvorenog taba; osvežavanje ili zatvaranje taba ih briše. Fotografije se šalju tek nakon potvrde mejla.

Na kraju obrasca primalac unosi mejl, prihvata uslove i dobija Clerk kod. Jedan tok podržava postojeće i nove naloge preko `signUpIfMissing`; novi nalog nastaje tek nakon potvrde mejla i ličnog prihvatanja uslova. Clerk mora imati omogućene mejl kodove i registraciju bez obavezne lozinke. Postojeći korisnici mogu i dalje koristiti već postavljene lozinke.

Nakon potvrde kontakta, `claimAndPublish` u jednoj transakciji proverava važeći link, tačan potvrđen mejl i sva pravila objave. Neuspešna validacija ne preuzima ponudu, ne menja kontakt i ne objavljuje oglas. Novi profili mogu izabrati kontakt preko mejla i chata; postojeća podešavanja kontakta ostaju sačuvana. Nema unapred kreiranih naloga niti lozinki za klijente.
