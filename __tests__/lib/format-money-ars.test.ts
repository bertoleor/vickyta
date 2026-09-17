import { describe, expect, it } from "vitest";
import { formatMoneyARS } from "@/lib/format-money-ars";

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// es-AR ARS uses NBSP (\u00A0) between the sign and the amount — assert against
// the Intl oracle so ICU drift never makes this suite go red by itself.
const NBSP = "\u00A0";
describe("formatMoneyARS", () => {
  it("formats a positive amount with es-AR ARS locale (2 decimals)", () => {
    expect(formatMoneyARS(1234.5)).toBe(ARS.format(1234.5));
    expect(formatMoneyARS(1234.5)).toBe(`$${NBSP}1.234,50`);
  });

  it("formats zero", () => {
    expect(formatMoneyARS(0)).toBe(ARS.format(0));
    expect(formatMoneyARS(0)).toBe(`$${NBSP}0,00`);
  });

  it("formats a negative amount preserving the sign", () => {
    expect(formatMoneyARS(-50)).toBe(ARS.format(-50));
    expect(formatMoneyARS(-50)).toBe(`-$${NBSP}50,00`);
  });

  it("rounds UP to 2 decimals at the third decimal (half away from zero)", () => {
    const rounded = formatMoneyARS(10.005);
    expect(rounded.endsWith(ARS.format(10.01).slice(-2))).toBe(true);
    expect(rounded).toBe(`$${NBSP}10,01`);
  });

  it("rounds DOWN to 2 decimals when the third decimal is below half", () => {
    const rounded = formatMoneyARS(10.004);
    expect(rounded.endsWith(ARS.format(10.0).slice(-2))).toBe(true);
    expect(rounded).toBe(`$${NBSP}10,00`);
  });

  it("throws RangeError for NaN", () => {
    expect(() => formatMoneyARS(NaN)).toThrow(RangeError);
  });

  it("throws RangeError for +Infinity", () => {
    expect(() => formatMoneyARS(Infinity)).toThrow(RangeError);
  });

  it("throws RangeError for -Infinity", () => {
    expect(() => formatMoneyARS(-Infinity)).toThrow(RangeError);
  });
});