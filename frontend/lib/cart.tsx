"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProduct } from "./products";

export interface CartLine {
  id: string;
  qty: number;
  variant?: string;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (id: string, qty?: number, variant?: string) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "oakline-cart-v1";

function load(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    setLines(load());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const subtotal = lines.reduce((s, l) => {
      const p = getProduct(l.id);
      return s + (p ? p.price * l.qty : 0);
    }, 0);
    return {
      lines,
      count,
      subtotal,
      add: (id, qty = 1, variant) =>
        setLines((prev) => {
          const found = prev.find((l) => l.id === id);
          if (found) {
            return prev.map((l) =>
              l.id === id ? { ...l, qty: Math.min(99, l.qty + qty) } : l,
            );
          }
          return [...prev, { id, qty, variant }];
        }),
      setQty: (id, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.id !== id)
            : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
        ),
      remove: (id) => setLines((prev) => prev.filter((l) => l.id !== id)),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/* Seed the demo cart (2 items) so the header badge matches the mockups
   on a fresh visit. */
export function useSeedDemoCart() {
  const { lines, add } = useCart();
  useEffect(() => {
    if (lines.length === 0 && load().length === 0) {
      add("ceramic-pour-over-set", 1, "Sand");
      add("linen-throw-blanket", 1, "Fog");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
