import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NavBar } from "@/components/NavBar";
import { PricingCards } from "@/components/planovi/PricingCards";
import { BackButton } from "@/components/ui/back-button";
import { DiscordIcon } from "@/components/icons/Icons";

export const metadata = {
  title: "Planovi | podeli.rs",
  description: "Izaberite plan koji najbolje odgovara vašim potrebama. Od besplatnog do doživotnog pristupa.",
};

export default async function PlanoviPage() {
  const plans = await fetchQuery(api.plans.list);
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <BackButton />

        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Izaberite plan
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Pronađite plan koji najbolje odgovara vašim potrebama za deljenje i iznajmljivanje.
          </p>
        </div>

        <PricingCards plans={plans} />

        <div className="mt-12 w-full text-center">
          <p className="inline-block text-sm text-muted-foreground">
          Imate pitanja? Kontaktirajte nas na{" "}
          <a
            href="mailto:kontakt@podeli.rs"
            className="font-medium text-accent hover:underline"
          >
            kontakt@podeli.rs
          </a>{" "}
          ili na{" "}
          <a
            href="https://discord.gg/69MBaCTEnz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 align-middle font-medium text-[#5865F2] hover:underline"
          >
            <DiscordIcon className="h-4 w-4 shrink-0" />
            Discord-u
          </a>
          .
          </p>
        </div>
      </div>
    </div>
  );
}
