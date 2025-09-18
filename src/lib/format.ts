export function formatUsd(value: number | null | undefined, digits: number = 4): string {
  if (value == null || Number.isNaN(value)) return "—";
  try {
    const fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    return fmt.format(value);
  } catch {
    // Fallback if Intl not available for some reason
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return "$" + n.toFixed(digits);
  }
}