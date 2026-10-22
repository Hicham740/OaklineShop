"use client";

/**
 * Order storage for the admin panel.
 *
 * Demo orders come from lib/admin.ts. Orders placed at checkout and changes
 * made by the admin (status, history, notes) are saved in localStorage until
 * the backend is connected.
 */

import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_ORDERS,
  type AdminOrder,
  type OrderHistoryEntry,
  type OrderStatus,
} from "./admin";

const OVERRIDES_KEY = "oakline-order-overrides-v2";
const PLACED_KEY = "oakline-placed-orders-v1";

interface OrderOverride {
  status?: OrderStatus;
  history?: OrderHistoryEntry[];
  notes?: string;
}

type OverrideMap = Record<string, OrderOverride>;

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable or full */
  }
}

function mergeOrders(
  placed: AdminOrder[],
  overrides: OverrideMap,
): AdminOrder[] {
  return [...placed, ...ADMIN_ORDERS].map((order) => {
    const override = overrides[order.id];
    if (!override) return order;
    return {
      ...order,
      status: override.status ?? order.status,
      history: override.history ?? order.history,
      notes: override.notes ?? order.notes,
    };
  });
}

function nowLabel(): string {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Save a new order placed from the checkout page. */
export function savePlacedOrder(order: AdminOrder) {
  const placed = loadJson<AdminOrder[]>(PLACED_KEY, []);
  saveJson(PLACED_KEY, [order, ...placed]);
}

export function useAdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>(ADMIN_ORDERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const placed = loadJson<AdminOrder[]>(PLACED_KEY, []);
      const overrides = loadJson<OverrideMap>(OVERRIDES_KEY, {});
      setOrders(mergeOrders(placed, overrides));
    } catch {
      setError(
        "We could not load the orders. The backend may be unavailable. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(reload, 0);
    return () => clearTimeout(timer);
  }, [reload]);

  const setOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      const order = orders.find((item) => item.id === orderId);
      if (!order || order.status === status) return;

      const entry: OrderHistoryEntry = { status, date: nowLabel() };
      const history = [...order.history, entry];
      const next = orders.map((item) =>
        item.id === orderId ? { ...item, status, history } : item,
      );

      setOrders(next);

      const overrides = loadJson<OverrideMap>(OVERRIDES_KEY, {});
      overrides[orderId] = { ...overrides[orderId], status, history };
      saveJson(OVERRIDES_KEY, overrides);
    },
    [orders],
  );

  const setOrderNotes = useCallback(
    (orderId: string, notes: string) => {
      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId ? { ...order, notes } : order,
        ),
      );

      const overrides = loadJson<OverrideMap>(OVERRIDES_KEY, {});
      overrides[orderId] = { ...overrides[orderId], notes };
      saveJson(OVERRIDES_KEY, overrides);
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
