/** Prices are stored in USD but displayed in Algerian dinars.
 *  Change USD_TO_DZD when the exchange rate changes. */
export const USD_TO_DZD = 135;

export function toDZD(usd: number): number {
  const raw = usd * USD_TO_DZD;
  return Math.round(raw / 50) * 50;
}

const group = new Intl.NumberFormat("fr-FR");

export function formatDZDValue(dzd: number): string {
  return `${group.format(dzd)} دج`;
}

/** Format a USD price in Algerian dinars, e.g. 48 → "6 500 دج". */
export function formatPrice(usd: number): string {
  return formatDZDValue(toDZD(usd));
}
