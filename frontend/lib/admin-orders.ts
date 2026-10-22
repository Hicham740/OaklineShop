"use client";

/**
 * Admin order data now lives in PostgreSQL and is read through the API.
 *
 * The hook loads all orders once and exposes two mutations. Each mutation
 * replaces the matching order in local state with the response from the API,
 * which already includes the updated status history or notes.
 */

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "./api";
import type { AdminOrder, OrderStatus } from "./admin";

interface OrdersResponse {
  orders: AdminOrder[];
}

interface OrderResponse {
  order: AdminOrder;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "We could not load the orders. Please check the server and try again.";
}

export function useAdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<OrdersResponse>("/api/orders");
      setOrders(data.orders);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer the request so the initial state update happens after paint.
    const timer = setTimeout(() => {
      void reload();
    }, 0);
    return () => clearTimeout(timer);
  }, [reload]);

  const setOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        const data = await apiFetch<OrderResponse>(
          `/api/orders/${orderId}/status`,
          {
            method: "PATCH",
            body: JSON.stringify({ status }),
          },
        );
        setOrders((previous) =>
          previous.map((order) =>
            order.id === orderId ? data.order : order,
          ),
        );
        setError(null);
      } catch (caught) {
        setError(errorMessage(caught));
      }
    },
    [],
  );

  const setOrderNotes = useCallback(
    async (orderId: string, notes: string): Promise<boolean> => {
      try {
        const data = await apiFetch<OrderResponse>(
          `/api/orders/${orderId}/notes`,
          {
            method: "PATCH",
            body: JSON.stringify({ notes }),
          },
        );
        setOrders((previous) =>
          previous.map((order) =>
            order.id === orderId ? data.order : order,
          ),
        );
        setError(null);
        return true;
      } catch (caught) {
        setError(errorMessage(caught));
        return false;
      }
    },
    [],
  );

  return {
    orders,
    loading,
    error,
    reload,
    setOrderStatus,
    setOrderNotes,
  };
}
