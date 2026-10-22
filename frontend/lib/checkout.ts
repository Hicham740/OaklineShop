"use client";

import { apiFetch } from "./api";
import type { AdminOrder, PaymentMethod } from "./admin";

/**
 * Checkout request/response types.
 *
 * The API recalculates every price from the database, so the browser only
 * sends product ids and quantities. The response includes the final order with
 * server-calculated line prices, discount and total.
 */

export interface PlaceOrderInput {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  lines: { productId: string; qty: number }[];
  payment: PaymentMethod;
  promoCode?: string;
}

export interface CreatedOrder extends AdminOrder {
  totalDZD: number;
  createdAt?: string;
}

export async function placeOrder(
  input: PlaceOrderInput,
): Promise<CreatedOrder> {
  const data = await apiFetch<{ order: CreatedOrder }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.order;
}
