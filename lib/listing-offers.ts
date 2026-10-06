export const offerStatuses = {
  draft: "Nacrt ponude",
  ready: "Link spreman",
  sent: "Link poslat",
  claimed: "Ponuda preuzeta",
  published: "Oglas objavljen",
} as const;

export function offerPath(token: string) {
  return `/ponuda/${token}`;
}

export function createOfferToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function offerEmail(company: string, title: string, url: string) {
  return {
    subject: `Predlog oglasa za ${company} na Podeliju`,
    body: `Zdravo,\n\nPripremio sam predlog oglasa „${title}” za vašu ponudu na podeli.rs:\n${url}\n\nOglas još nije objavljen. Ako vam odgovara, preuzmite ga svojim nalogom, proverite podatke i dodajte termine. Objavljivanje je besplatno.\n\nPlatforma je nova i trenutno ne mogu da obećam broj upita.\n\nPozdrav,\nStefan\npodeli.rs`,
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function recipientHint(email: string) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}
