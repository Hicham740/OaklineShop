"use client";

/**
 * One shared catalogue for the storefront and the admin panel.
 *
 * The Express API is the source of truth now. This provider loads products
 * and categories once, exposes helpers for the admin mutations, and keeps the
 * in-memory copy in sync so the UI updates without a full page reload.
 *
 * `?all=1` asks the API for hidden products too. The API only honours that
 * when a valid admin session cookie is present, so public visitors still only
 * receive visible products.
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
import { ApiError, apiFetch } from "./api";
import type { Category, Product } from "./products";

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
  /** Accepted for compatibility with the form; the API derives this from stock. */
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

interface CatalogResponse {
  products: CatalogProduct[];
}

interface CategoriesResponse {
  categories: string[];
}

interface ProductResponse {
  product: CatalogProduct;
}

interface DeleteResponse {
  ok: boolean;
  deleted: boolean;
}

interface CatalogValue {
  products: CatalogProduct[];
  visibleProducts: CatalogProduct[];
  categories: string[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getProductById: (id: string) => CatalogProduct | undefined;
  addProduct: (input: ProductInput) => Promise<void>;
  updateProduct: (id: string, updates: ProductUpdates) => Promise<void>;
  setHidden: (id: string, hidden: boolean) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<AddCategoryResult>;
}

const CatalogContext = createContext<CatalogValue | null>(null);

/** Turn a network or API failure into a sentence we can show in the UI. */
function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "We could not reach the server. Please check your connection and try again.";
}

function mergeCategory(categories: string[], name: string): string[] {
  const exists = categories.some(
    (category) => category.toLowerCase() === name.toLowerCase(),
  );
  return exists ? categories : [...categories, name];
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productData, categoryData] = await Promise.all([
        apiFetch<CatalogResponse>("/api/products?all=1"),
        apiFetch<CategoriesResponse>("/api/categories"),
      ]);
      setProducts(productData.products);
      setCategories(categoryData.categories);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Run after the first paint so loading state updates are not part of the
    // synchronous effect body (which can cause cascading renders).
    const timer = setTimeout(() => {
      void reload();
    }, 0);
    return () => clearTimeout(timer);
  }, [reload]);

  const getProductById = useCallback(
    (id: string) => products.find((product) => product.id === id),
    [products],
  );

  const addProduct = useCallback(async (input: ProductInput) => {
    const data = await apiFetch<ProductResponse>("/api/products", {
      method: "POST",
      body: JSON.stringify(input),
    });

    // New products are created by the admin, so they go at the top of the
    // table. The API also guarantees the category exists.
    setProducts((previous) => [data.product, ...previous]);
    setCategories((previous) => mergeCategory(previous, data.product.category));
  }, []);

  const updateProduct = useCallback(
    async (id: string, updates: ProductUpdates) => {
      const data = await apiFetch<ProductResponse>(`/api/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      setProducts((previous) =>
        previous.map((product) =>
          product.id === id ? data.product : product,
        ),
      );
      setCategories((previous) =>
        mergeCategory(previous, data.product.category),
      );
    },
    [],
  );

  const setHidden = useCallback(
    async (id: string, hidden: boolean) => {
      await updateProduct(id, { hidden });
    },
    [updateProduct],
  );

  const deleteProduct = useCallback(async (id: string) => {
    const result = await apiFetch<DeleteResponse>(`/api/products/${id}`, {
      method: "DELETE",
    });

    setProducts((previous) =>
      result.deleted
        ? previous.filter((product) => product.id !== id)
        : previous.map((product) =>
            product.id === id ? { ...product, hidden: true } : product,
          ),
    );
  }, []);

  const addCategory = useCallback(
    async (raw: string): Promise<AddCategoryResult> => {
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
        return { ok: false, error: "Category names cannot contain commas." };
      }

      const existing = categories.find(
        (category) => category.toLowerCase() === name.toLowerCase(),
      );
      if (existing) {
        return { ok: true, name: existing };
      }

      try {
        await apiFetch<{ name: string }>("/api/categories", {
          method: "POST",
          body: JSON.stringify({ name }),
        });
        setCategories((previous) => mergeCategory(previous, name));
        return { ok: true, name };
      } catch (caught) {
        return { ok: false, error: errorMessage(caught) };
      }
    },
    [categories],
  );

  const visibleProducts = useMemo(
    () => products.filter((product) => !product.hidden),
    [products],
  );

  const value = useMemo<CatalogValue>(
    () => ({
      products,
      visibleProducts,
      categories,
      loading,
      error,
      reload,
      getProductById,
      addProduct,
      updateProduct,
      setHidden,
      deleteProduct,
      addCategory,
    }),
    [
      products,
      visibleProducts,
      categories,
      loading,
      error,
      reload,
      getProductById,
      addProduct,
      updateProduct,
      setHidden,
      deleteProduct,
      addCategory,
    ],
  );

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
