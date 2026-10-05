import { describe, expect, it } from "vitest";
import {
  availabilityError,
  getBelgradeDate,
  isValidRentalDate,
  rentalDays,
  rentalDatesOverlap,
  rentalRangeError,
} from "../lib/rental-dates";
import { formatRentalTotal } from "../lib/rental-pricing";

const range = (startDate: string, endDate = startDate) => ({
  startDate,
  endDate,
});

describe("rental calendar rules", () => {
  it("rejects impossible dates, reversed ranges and incomplete availability", () => {
    expect(isValidRentalDate("2026-02-29")).toBe(false);
    expect(isValidRentalDate("2028-02-29")).toBe(true);
    expect(availabilityError([range("2026-10-06", "2026-10-05")])).toBeTruthy();
    expect(availabilityError([range("", "2026-10-06")])).toBeTruthy();
  });
  it("uses the Belgrade calendar date near midnight and counts DST days inclusively", () => {
    expect(getBelgradeDate(new Date("2026-10-05T22:30:00Z"))).toBe(
      "2026-10-06",
    );
    expect(rentalDays("2026-10-24", "2026-10-26")).toBe(3);
    expect(rentalDays("2026-03-28", "2026-03-30")).toBe(3);
    expect(rentalDays("2026-10-05", "2026-10-05")).toBe(1);
  });
  it("allows adjacent windows but rejects a gap or a past start", () => {
    const slots = [
      range("2026-10-05", "2026-10-06"),
      range("2026-10-07", "2026-10-10"),
    ];
    expect(
      rentalRangeError(range("2026-10-05", "2026-10-10"), slots, "2026-10-05"),
    ).toBeNull();
    expect(
      rentalRangeError(
        range("2026-10-05", "2026-10-10"),
        [slots[0], range("2026-10-08", "2026-10-10")],
        "2026-10-05",
      ),
    ).toBeTruthy();
    expect(
      rentalRangeError(range("2026-10-04"), slots, "2026-10-05"),
    ).toBeTruthy();
    expect(
      rentalRangeError(range("2026-10-07", "2026-10-06"), slots, "2026-10-05"),
    ).toBeTruthy();
  });
  it("treats pickup and return dates as occupied", () => {
    expect(
      rentalDatesOverlap(
        range("2026-10-05", "2026-10-07"),
        range("2026-10-07", "2026-10-08"),
      ),
    ).toBe(true);
    expect(
      rentalDatesOverlap(
        range("2026-10-05", "2026-10-07"),
        range("2026-10-08"),
      ),
    ).toBe(false);
  });
});

describe("negotiated prices", () => {
  it("does not present negotiated or legacy zero totals as free", () => {
    expect(
      formatRentalTotal({ totalPrice: 1200, priceByAgreement: true }),
    ).toBe("Cena po dogovoru");
    expect(formatRentalTotal({ totalPrice: 0 })).toBe("Cena po dogovoru");
    expect(formatRentalTotal({ totalPrice: 1200 })).toBe("1.200 RSD");
  });
});
