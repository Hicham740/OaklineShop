"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "./api";
import type { AdminOrder } from "./admin";

/**
 * Customer order history. The API derives the customer from the HttpOnly
 * session cookie, so this hook never sends a customer id.
 */

interface OrdersResponse {
  orders: AdminOrder[];
}

interface OrderResponse {
  order: AdminOrder;
}

export function accountErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "We could not load your orders. Please check the server and try again.";
}

export function useMyOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<OrdersResponse>("/api/account/orders");
      setOrders(data.orders);
    } catch (caught) {
      setError(accountErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void reload();
    }, 0);
    return () => clearTimeout(timer);
  }, [reload]);

  return { orders, loading, error, reload };
}

export async function fetchMyOrder(id: string): Promise<AdminOrder> {
  const data = await apiFetch<OrderResponse>(
    `/api/account/orders/${encodeURIComponent(id)}`,
  );
  return data.order;
}
