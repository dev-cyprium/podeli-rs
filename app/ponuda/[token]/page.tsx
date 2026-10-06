import type { Metadata } from "next";
import { ListingOfferPreview } from "@/components/offers/ListingOfferPreview";

export const metadata: Metadata = {
  title: "Predlog vaše ponude | Podeli",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function OfferPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ListingOfferPreview token={token} />;
}
