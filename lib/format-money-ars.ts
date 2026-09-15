const ARS_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a finite number as Argentine pesos (es-AR, 2 decimals).
 *
 * @param value - Amount to format (must be finite).
 * @returns ARS string, e.g. "$ 1.234,50".
 * @throws {RangeError} When value is NaN or infinite.
 *
 * @example
 * formatMoneyARS(1234.5) // "$ 1.234,50"
 */
export function formatMoneyARS(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError("formatMoneyARS expects a finite number");
  }
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return ARS_FORMATTER.format(rounded);
}
