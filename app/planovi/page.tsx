import { PricingCards } from "@/components/planovi/PricingCards";
import { BackButton } from "@/components/ui/back-button";

export const metadata = {
  title: "Planovi | PODELI.rs",
  description: "Izaberite plan koji najbolje odgovara vašim potrebama. Od besplatnog do doživotnog pristupa.",
};

export default function PlanoviPage() {
  return (
    <div className="min-h-screen bg-background">
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

        <PricingCards />

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Imate pitanja? Kontaktirajte nas na{" "}
            <a
              href="mailto:kontakt@podeli.rs"
              className="font-medium text-accent hover:underline"
            >
              kontakt@podeli.rs
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
