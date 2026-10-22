"use client";

/**
 * Browser-only product storage for the admin demo.
 *
 * Products added from the admin panel are saved in localStorage until the
 * backend is connected. Then these functions can be replaced with API calls.
 */

import { useEffect, useState } from "react";
import { PRODUCTS, type Product } from "./products";

const STORAGE_KEY = "oakline-custom-products-v1";

export interface StoredProduct extends Product {
  stock: number;
  custom: true;
  createdAt: string;
  hidden?: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function loadCustomProducts(): StoredProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredProduct[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addCustomProduct(
  input: Omit<StoredProduct, "id" | "custom" | "createdAt">,
): StoredProduct {
  const existing = loadCustomProducts();
  const usedIds = new Set([
    ...PRODUCTS.map((product) => product.id),
    ...existing.map((product) => product.id),
  ]);

  const baseId = slugify(input.name) || "product";
  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  const product: StoredProduct = {
    ...input,
    id,
    custom: true,
    createdAt: new Date().toISOString(),
  };

  saveCustomProducts([product, ...existing]);
  return product;
}

export function updateCustomProduct(
  id: string,
  updates: Partial<Omit<StoredProduct, "id" | "custom" | "createdAt">>,
): StoredProduct | null {
  const existing = loadCustomProducts();
  const current = existing.find((product) => product.id === id);
  if (!current) return null;

  const updated: StoredProduct = {
    ...current,
    ...updates,
    id: current.id,
    custom: true,
    createdAt: current.createdAt,
  };

  saveCustomProducts(
    existing.map((product) => (product.id === id ? updated : product)),
  );
  return updated;
}

export function removeCustomProduct(id: string): void {
  saveCustomProducts(
    loadCustomProducts().filter((product) => product.id !== id),
  );
}

export function saveCustomProducts(products: StoredProduct[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    /* storage may be unavailable or full */
  }
}

/** Returns the products added from the admin panel. */
export function useCustomProducts(): StoredProduct[] {
  const [products, setProducts] = useState<StoredProduct[]>([]);

  useEffect(() => {
    // localStorage is browser-only, so read it after the page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(loadCustomProducts());
  }, []);

  return products;
}
