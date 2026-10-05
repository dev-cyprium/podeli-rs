export function formatRentalTotal(booking: {
  totalPrice: number;
  priceByAgreement?: boolean;
}): string {
  // Old negotiated bookings have no flag and were stored with a zero total.
  return booking.priceByAgreement || booking.totalPrice === 0
    ? "Cena po dogovoru"
    : `${booking.totalPrice.toLocaleString("sr-RS")} RSD`;
}
