"use client";

/**
 * One shared catalogue for the storefront and the admin panel.
 *
 * - Static demo products come from lib/products.ts.
 * - Admin-added products and edits are saved in localStorage.
 * - Stock levels are also saved in localStorage, so an order immediately
 *   updates the "Only X left" / "Out of stock" labels.
 *
 * When the backend is connected, replace the localStorage functions with API
 * calls. The rest of the app can keep using this provider.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadCustomProducts,
  addCustomProduct,
  updateCustomProduct,
  removeCustomProduct,
  saveCustomProducts,
  type StoredProduct,
} from "./custom-products";
import { STOCK_LEVELS } from "./admin";
import {
  CATEGORIES,
  PRODUCTS,
  type Category,
  type Product,
} from "./products";

export interface CatalogProduct extends Product {
  stock: number;
  hidden: boolean;
  custom: boolean;
}

export type AddCategoryResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export interface ProductInput {
  name: string;
  price: number;
  category: Category;
  tint: string;
  image: string;
  isNew?: boolean;
  inStock: boolean;
  onSale?: boolean;
  finish?: string;
  description: string;
  stock: number;
}

export interface ProductUpdates {
  name?: string;
  price?: number;
  description?: string;
  finish?: string;
  stock?: number;
  hidden?: boolean;
  category?: Category;
  tint?: string;
  image?: string;
  isNew?: boolean;
  onSale?: boolean;
}

interface ProductOverride {
  name?: string;
  price?: number;
  description?: string;
  finish?: string;
  hidden?: boolean;
  category?: Category;
  tint?: string;
  image?: string;
  isNew?: boolean;
  onSale?: boolean;
}

interface CatalogValue {
  products: CatalogProduct[];
  visibleProducts: CatalogProduct[];
  categories: string[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  getProductById: (id: string) => CatalogProduct | undefined;
  addProduct: (input: ProductInput) => void;
  updateProduct: (id: string, updates: ProductUpdates) => void;
  setHidden: (id: string, hidden: boolean) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (lines: { productId: string; qty: number }[]) => void;
  addCategory: (name: string) => AddCategoryResult;
}

const OVERRIDES_KEY = "oakline-product-overrides-v1";
const STOCK_KEY = "oakline-stock-v1";
const CATEGORIES_KEY = "oakline-categories-v1";

const CatalogContext = createContext<CatalogValue | null>(null);

function loadOverrides(): Record<string, ProductOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ProductOverride>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, ProductOverride>) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    /* storage may be unavailable or full */
  }
}

function loadStockOverrides(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STOCK_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStockOverrides(stock: Record<string, number>) {
  try {
    localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
  } catch {
    /* storage may be unavailable or full */
  }
}

function loadCustomCategories(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function saveCustomCategories(categories: string[]) {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch {
    /* storage may be unavailable or full */
  }
}

function mergeCategories(custom: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const raw of [...CATEGORIES, ...custom]) {
    const name = raw.trim().replace(/\s+/g, " ");
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    merged.push(name);
  }

  return merged;
}

function buildCatalog(
  customProducts: StoredProduct[],
  overrides: Record<string, ProductOverride>,
  stockOverrides: Record<string, number>,
): CatalogProduct[] {
  const staticProducts = PRODUCTS.map((product) => {
    const override = overrides[product.id] ?? {};
    const stock =
      stockOverrides[product.id] ??
      STOCK_LEVELS[product.id] ??
      (product.inStock ? 1 : 0);

    return {
      ...product,
      name: override.name ?? product.name,
      price: override.price ?? product.price,
      description: override.description ?? product.description,
      finish: override.finish ?? product.finish,
      category: override.category ?? product.category,
      tint: override.tint ?? product.tint,
      image: override.image ?? product.image,
      isNew: override.isNew ?? product.isNew,
      onSale: override.onSale ?? product.onSale,
      inStock: stock > 0,
      stock,
      hidden: override.hidden ?? false,
      custom: false,
    };
  });

  const custom = customProducts.map((product) => ({
    ...product,
    stock: product.stock,
    inStock: product.stock > 0,
    hidden: product.hidden ?? false,
    custom: true,
  }));

  return [...custom, ...staticProducts];
}

function readCatalog(): CatalogProduct[] {
  return buildCatalog(loadCustomProducts(), loadOverrides(), loadStockOverrides());
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<CatalogProduct[]>(() =>
    buildCatalog([], {}, {}),
  );
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      setProducts(readCatalog());
      setCustomCategories(loadCustomCategories());
    } catch {
      setError(
        "We could not load the catalogue. The backend may be unavailable. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(reload, 0);
    return () => clearTimeout(timer);
  }, [reload]);

  const categories = useMemo(
    () => mergeCategories(customCategories),
    [customCategories],
  );

  const registerCategory = useCallback(
    (raw: string): AddCategoryResult => {
      const name = raw.trim().replace(/\s+/g, " ");

      if (!name) {
        return { ok: false, error: "Enter a category name." };
      }

      if (name.length > 32) {
        return {
          ok: false,
          error: "Category names must be 32 characters or fewer.",
        };
      }

      if (name.includes(",")) {
        return {
          ok: false,
          error: "Category names cannot contain commas.",
        };
      }

      const existing = categories.find(
        (category) => category.toLowerCase() === name.toLowerCase(),
      );
      if (existing) {
        return { ok: true, name: existing };
      }

      const next = [...customCategories, name];
      saveCustomCategories(next);
      setCustomCategories(next);
      return { ok: true, name };
    },
    [categories, customCategories],
  );

  const addCategory = useCallback(
    (name: string) => registerCategory(name),
    [registerCategory],
  );

  const getProductById = useCallback(
    (id: string) => products.find((product) => product.id === id),
    [products],
  );

  const addProduct = useCallback(
    (input: ProductInput) => {
      const category = registerCategory(input.category);
      addCustomProduct({
        ...input,
        category: category.ok ? category.name : input.category,
        inStock: input.stock > 0,
        hidden: false,
      });
      setProducts(readCatalog());
    },
    [registerCategory],
  );

  const updateProduct = useCallback(
    (id: string, updates: ProductUpdates) => {
      const current = products.find((product) => product.id === id);
      if (!current) return;

      let nextUpdates = updates;
      if (nextUpdates.category) {
        const category = registerCategory(nextUpdates.category);
        if (category.ok) {
          nextUpdates = { ...nextUpdates, category: category.name };
        }
      }

      const { stock, ...fields } = nextUpdates;

      if (current.custom) {
        updateCustomProduct(id, {
          ...fields,
          ...(stock !== undefined
            ? { stock: Math.max(0, stock), inStock: stock > 0 }
            : {}),
        });
      } else {
        const overrides = loadOverrides();
        overrides[id] = { ...overrides[id], ...fields };
        saveOverrides(overrides);

        if (stock !== undefined) {
          const levels = loadStockOverrides();
          levels[id] = Math.max(0, stock);
          saveStockOverrides(levels);
        }
      }

      setProducts(readCatalog());
    },
    [products, registerCategory],
  );

  const setHidden = useCallback(
    (id: string, hidden: boolean) => {
      const current = products.find((product) => product.id === id);
      if (!current) return;

      if (current.custom) {
        updateCustomProduct(id, { hidden });
      } else {
        const overrides = loadOverrides();
        overrides[id] = { ...overrides[id], hidden };
        saveOverrides(overrides);
      }

      setProducts(readCatalog());
    },
    [products],
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const current = products.find((product) => product.id === id);
      if (!current) return;

      if (current.custom) {
        removeCustomProduct(id);
      } else {
        // Demo products are never removed from the source code. Hide them
        // instead, so they disappear from the storefront.
        const overrides = loadOverrides();
        overrides[id] = { ...overrides[id], hidden: true };
        saveOverrides(overrides);
      }

      setProducts(readCatalog());
    },
    [products],
  );

  const adjustStock = useCallback(
    (lines: { productId: string; qty: number }[]) => {
      if (lines.length === 0) return;

      const stockOverrides = loadStockOverrides();
      const customProducts = loadCustomProducts();

      for (const line of lines) {
        const product = products.find((item) => item.id === line.productId);
        if (!product) continue;

        const nextStock = Math.max(0, product.stock - line.qty);

        if (product.custom) {
          const customProduct = customProducts.find(
            (item) => item.id === line.productId,
          );
          if (customProduct) {
            customProduct.stock = nextStock;
            customProduct.inStock = nextStock > 0;
          }
        } else {
          stockOverrides[line.productId] = nextStock;
        }
      }

      saveStockOverrides(stockOverrides);
      saveCustomProducts(customProducts);

      setProducts(readCatalog());
    },
    [products],
  );

  const value = useMemo<CatalogValue>(() => {
    return {
      products,
      visibleProducts: products.filter((product) => !product.hidden),
      categories,
      loading,
      error,
      reload,
      getProductById,
      addProduct,
      updateProduct,
      setHidden,
      deleteProduct,
      adjustStock,
      addCategory,
    };
  }, [
    products,
    categories,
    loading,
    error,
    reload,
    getProductById,
    addProduct,
    updateProduct,
    setHidden,
    deleteProduct,
    adjustStock,
    addCategory,
  ]);

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return context;
}
