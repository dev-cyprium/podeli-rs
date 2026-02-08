import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Construction, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Roadmap 2026 | podeli.rs",
  description:
    "Plan razvoja podeli.rs platforme za 2026. godinu. Pogledaj šta gradimo i šta dolazi sledeće.",
};

const quarters = [
  {
    label: "Q1",
    period: "Jan – Mar 2026",
    status: "done" as const,
    icon: Check,
    items: [
      "Lansiranje platforme u Beogradu",
      "Sistem rezervacija sa kalendarom",
      "Ocene i recenzije korisnika",
      "Kategorije predmeta sa predlozima zajednice",
      "Blog sa vodičima i savetima",
    ],
  },
  {
    label: "Q2",
    period: "Apr – Jun 2026",
    status: "current" as const,
    icon: Construction,
    items: [
      "Unapređen sistem poruka",
      "Notifikacije u realnom vremenu",
      "Mobilna optimizacija i PWA podrška",
      "Proširenje na Novi Sad",
      "Program za partnere i lokalne biznise",
    ],
  },
  {
    label: "Q3",
    period: "Jul – Sep 2026",
    status: "upcoming" as const,
    icon: Rocket,
    items: [
      "Plaćanje kroz platformu",
      "Osiguranje predmeta",
      "Verifikacija identiteta",
      "Podrška za još gradova u Srbiji",
      "API za integracije",
    ],
  },
  {
    label: "Q4",
    period: "Okt – Dec 2026",
    status: "upcoming" as const,
    icon: Sparkles,
    items: [
      "Mobilna aplikacija (iOS i Android)",
      "AI preporuke na osnovu lokacije",
      "Program lojalnosti za aktivne korisnike",
      "Proširenje na region (Crna Gora, BiH, Hrvatska)",
      "Godišnji izveštaj zajednice",
    ],
  },
];

const statusStyles = {
  done: {
    badge: "bg-podeli-green/10 text-podeli-green border-podeli-green/30",
    badgeText: "Završeno",
    line: "bg-podeli-green",
    dot: "bg-podeli-green",
    card: "border-podeli-green/20",
    icon: "bg-podeli-green/10 text-podeli-green",
  },
  current: {
    badge: "bg-podeli-accent/10 text-podeli-accent border-podeli-accent/30",
    badgeText: "U toku",
    line: "bg-podeli-accent",
    dot: "bg-podeli-accent",
    card: "border-podeli-accent/20",
    icon: "bg-podeli-accent/10 text-podeli-accent",
  },
  upcoming: {
    badge:
      "bg-muted text-muted-foreground border-border",
    badgeText: "Planirano",
    line: "bg-border",
    dot: "bg-border",
    card: "border-border",
    icon: "bg-muted text-muted-foreground",
  },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-podeli-light font-sans text-podeli-dark selection:bg-podeli-accent/20 selection:text-podeli-dark">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-podeli-accent/30 bg-podeli-accent/10 px-4 py-1.5 text-sm font-medium text-podeli-accent">
            <Rocket className="h-4 w-4" />
            Plan razvoja
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-podeli-dark sm:text-5xl">
            Roadmap za 2026.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Transparentno delimo šta gradimo i kuda idemo. Ovo je naš plan —
            prilagođavamo ga na osnovu onoga što zajednica traži.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 hidden h-full w-0.5 bg-border sm:block" />

          <div className="space-y-12">
            {quarters.map((q) => {
              const style = statusStyles[q.status];
              const Icon = q.icon;

              return (
                <div key={q.label} className="relative sm:pl-16">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-4 top-1 hidden h-5 w-5 rounded-full border-4 border-podeli-light sm:block ${style.dot}`}
                  />

                  <div
                    className={`rounded-2xl border bg-card p-6 shadow-sm sm:p-8 ${style.card}`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.icon}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-podeli-dark">
                          {q.label}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {q.period}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-0.5 text-xs font-medium ${style.badge}`}
                      >
                        {style.badgeText}
                      </span>
                    </div>

                    <ul className="mt-5 space-y-2.5">
                      {q.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-muted-foreground"
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 flex-none rounded-full ${style.dot}`}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 rounded-3xl bg-podeli-dark px-6 py-10 text-center text-podeli-light">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Imaš ideju ili predlog?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-podeli-light/80">
            Ovaj roadmap nije uklesan u kamen. Slušamo zajednicu i prilagođavamo
            prioritete. Javi nam se na Discord ili pošalji mejl.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href="https://discord.gg/69MBaCTEnz" target="_blank" rel="noopener noreferrer">
              <Button className="bg-podeli-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-podeli-accent/90">
                Pridruži se na Discord
              </Button>
            </a>
            <Link href="/">
              <Button
                variant="ghost"
                className="border border-podeli-light/30 px-6 py-2.5 text-sm font-semibold text-podeli-light hover:bg-podeli-light/10 hover:text-podeli-light"
              >
                Nazad na početnu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
