import { ClaimedOfferEditor } from "@/components/offers/ClaimedOfferEditor";
import type { Id } from "@/convex/_generated/dataModel";

export default async function ClaimedOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClaimedOfferEditor id={id as Id<"listingOffers">} />;
}
