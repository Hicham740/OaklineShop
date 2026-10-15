/** USD → Algerian dinar conversion for display.
 *  Prices are stored in USD; checkout and all labels show DZD.
 *  Adjust USD_TO_DZD when the rate moves. */
export const USD_TO_DZD = 135;

export function toDZD(usd: number): number {
  const raw = usd * USD_TO_DZD;
  return Math.round(raw / 50) * 50;
}

const group = new Intl.NumberFormat("fr-FR");

export function formatDZDValue(dzd: number): string {
  return `${group.format(dzd)} دج`;
}

/** Format a USD base price as Algerian dinars, e.g. 48 → "6 500 دج". */
export function formatPrice(usd: number): string {
  return formatDZDValue(toDZD(usd));
}
