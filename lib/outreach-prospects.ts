// Public contact details researched for the initial outreach list on 2026-10-05.
// Importing these records does not contact or register any business.
const contacts = [
  ["Clean Rent", "Oprema za čišćenje", "0603616880", "https://cleanrent.rs/"],
  ["PuzziRent", "Oprema za čišćenje", "066115599", "https://puzzirent.rs/"],
  [
    "Diktat",
    "Odela i svečana odeća",
    "0641369333",
    "https://www.muskaodeladiktat.com/kontakt",
  ],
  [
    "Čarolija",
    "Odela i svečana odeća",
    "0112629022",
    "https://carolija.co.rs/odela-za-vencanje_3.html",
  ],
  ["BG Konzole", "Konzole", "0692420600", "https://iznajmips4.com/kontakt/"],
  [
    "Sony Iznajmljivanje",
    "Konzole",
    "0644532529",
    "https://www.sonyiznajmljivanje.rs/",
  ],
  [
    "BeoRental",
    "Alati",
    "0652604362",
    "https://www.beorental.com/kontakt",
    "Marko",
  ],
  [
    "Rent-Alata",
    "Alati",
    "063515333",
    "https://www.rent-alata.rs/kontakt/",
    "Petar",
  ],
  [
    "Kamera Rental",
    "Foto i video oprema",
    "0611686213",
    "https://kamerarental.rs/",
  ],
  [
    "Raskat Rental",
    "Foto i video oprema",
    "0611142694",
    "https://srb.raskat.rent/kontakti",
  ],
  [
    "Iznajmljivanje Ozvučenja",
    "Ozvučenje",
    "0641211612",
    "https://www.iznajmljivanjeozvucenja.com/",
  ],
  [
    "Iznajmljivanje Projektora i Ozvučenja",
    "Ozvučenje",
    "063456847",
    "https://iznajmljivanje-projektora.com/",
  ],
  [
    "Grand Event",
    "Nameštaj za događaje",
    "0668282882",
    "https://grandevent.rs/kontakt/",
  ],
  [
    "OFFICE2GO Rent",
    "Nameštaj za događaje",
    "0698209317",
    "https://iznajmljivanjenamestaja.rs/iznajmljivanje-stolova-i-stolica-beograd/",
  ],
  ["Beosport Ski Renta", "Ski oprema", "0628835400", "https://ski.rs/kontakt/"],
  [
    "Markoni Sport",
    "Ski oprema",
    "0692628209",
    "https://www.markonisport.rs/kontakt",
  ],
  ["Planet Bike", "Bicikli", "0600387240", "https://planetbike.rs/bike-renta"],
  [
    "Serbian Adventure Factory",
    "Bicikli",
    "0640649631",
    "https://adventuretourserbia.com/sr/iznajmljivanje-bicikala/",
  ],
];
export const initialProspects = contacts.map(
  ([name, category, phone, website, contactPerson = ""]) => ({
    name,
    category,
    phone,
    website,
    contactPerson,
    status: "new" as const,
    nextAction:
      "Pripremiti predlog oglasa i dopuniti mejl za preuzimanje ponude",
    nextStep: "prepare_offer" as const,
    followUpDate: "",
  }),
);
