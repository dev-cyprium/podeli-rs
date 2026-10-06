export type ListingType = "rent" | "sale" | "both";
export const listingLabels: Record<ListingType, string> = {
  rent: "Iznajmljivanje",
  sale: "Prodaja",
  both: "Iznajmljivanje i prodaja",
};
// Listings created before sales were introduced are rental listings.
export function offersRent(item: { listingType?: ListingType }) {
  return item.listingType !== "sale";
}
export function offersSale(item: { listingType?: ListingType }) {
  return item.listingType === "sale" || item.listingType === "both";
}
