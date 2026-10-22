// "use client" means this file runs in the browser, so it can use hooks
// like useState and localStorage.
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCatalog } from "./catalog";

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
const SEED_KEY = "oakline-demo-cart-seeded-v1";

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
  const { getProductById } = useCatalog();

  // localStorage only exists in the browser, so load the saved cart after
  // the page mounts. This avoids a server/client HTML mismatch.
  useEffect(() => {
    const saved = load();
    if (saved.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLines(saved);
      return;
    }

    // On the very first visit, add two demo items so the cart is not empty.
    // A flag makes sure we never add them again after the customer clears it.
    try {
      if (!localStorage.getItem(SEED_KEY)) {
        localStorage.setItem(SEED_KEY, "1");
        setLines([
          { id: "ceramic-pour-over-set", qty: 1, variant: "Sand" },
          { id: "linen-throw-blanket", qty: 1, variant: "Fog" },
        ]);
      }
    } catch {
      /* ignore */
    }
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
      const p = getProductById(l.id);
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
  }, [lines, getProductById]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
