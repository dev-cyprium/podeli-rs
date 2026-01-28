import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PricingCards } from "@/components/planovi/PricingCards";

export const metadata = {
  title: "Planovi | PODELI.rs",
  description: "Izaberite plan koji najbolje odgovara vašim potrebama. Od besplatnog do doživotnog pristupa.",
};

export default function PlanoviPage() {
  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#f0a202]"
        >
          <ArrowLeft className="h-4 w-4" />
          Nazad na početnu
        </Link>

        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-[#02020a] sm:text-4xl">
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
              className="font-medium text-[#006992] hover:underline"
            >
              kontakt@podeli.rs
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
