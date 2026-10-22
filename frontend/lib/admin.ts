/**
 * Shared admin types and small order calculations.
 *
 * Orders are loaded from the API (see lib/admin-orders.ts); this file no longer
 * contains demo orders or stock levels. The dashboard derives its charts from
 * the real orders returned by the API.
 */

export const ORDER_STATUSES = [
  "Pending",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type PaymentMethod = "COD" | "CIB" | "EDAHABIA";

export interface OrderLine {
  productId: string;
  name: string;
  qty: number;
  unitPriceDZD: number;
}

export interface OrderHistoryEntry {
  status: OrderStatus;
  date: string;
  note?: string;
}

export interface AdminOrder {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  date: string;
  /** ISO timestamp, used by charts when the API provides it. */
  createdAt?: string;
  lines: OrderLine[];
  payment: PaymentMethod;
  status: OrderStatus;
  history: OrderHistoryEntry[];
  notes: string;
  discountDZD?: number;
}

export function orderSubtotal(order: AdminOrder): number {
  return order.lines.reduce(
    (sum, item) => sum + item.unitPriceDZD * item.qty,
    0,
  );
}

export function orderTotal(order: AdminOrder): number {
  return Math.max(0, orderSubtotal(order) - (order.discountDZD ?? 0));
}

export function orderItemCount(order: AdminOrder): number {
  return order.lines.reduce((sum, item) => sum + item.qty, 0);
}
