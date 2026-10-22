/**
 * Values shared by validation, routes and serializers.
 */

export const ORDER_STATUSES = [
  "Pending",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["COD", "CIB", "EDAHABIA"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Prices are stored in USD (the seed data is written that way) but customers
 * pay in Algerian dinars. Keep this in sync with frontend/lib/currency.ts.
 */
export const USD_TO_DZD = 135;

/** Convert USD to DZD and round to the nearest 50 dinars. */
export function toDZD(usd: number): number {
  return Math.round((usd * USD_TO_DZD) / 50) * 50;
}

/** Any non-empty promo code gets 10% off in this demo. */
export const DEMO_PROMO_DISCOUNT = 0.1;
