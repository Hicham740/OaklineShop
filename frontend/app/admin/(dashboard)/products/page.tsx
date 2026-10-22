"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductImage } from "@/components/ProductCard";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminTableSkeleton,
} from "@/components/admin/DataState";
import { useCatalog } from "@/lib/catalog";
import { formatPrice } from "@/lib/currency";

export default function AdminProductsPage() {
  const {
    products,
    categories,
    loading,
    error,
    reload,
    setHidden,
    deleteProduct,
  } = useCatalog();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [visibility, setVisibility] = useState<"All" | "Visible" | "Hidden">(
    "All",
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;
      const matchesVisibility =
        visibility === "All" ||
        (visibility === "Hidden" ? product.hidden : !product.hidden);
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q);
      return matchesCategory && matchesVisibility && matchesQuery;
    });
  }, [products, query, category, visibility]);

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Delete "${name}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteProduct(id);
      setActionError(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "The product was not deleted.",
      );
    }
  };

  const handleVisibility = async (id: string, hidden: boolean) => {
    try {
      await setHidden(id, hidden);
      setActionError(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "The visibility could not be updated.",
      );
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight">
            Products
          </h1>
          <p className="mt-1 text-[15px] text-gray-500">
            Your catalogue, prices, stock and visibility.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-600">
            {filtered.length} of {products.length} products
          </span>
          <Link
            href="/admin/products/new"
            className="rounded-full bg-[#0e7a5d] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0b654d]"
          >
            + Add product
          </Link>
        </div>
      </div>

      {actionError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white">
        {error ? (
          <div className="p-5">
            <AdminErrorState message={error} onRetry={reload} />
          </div>
        ) : loading ? (
          <AdminTableSkeleton rows={6} columns={6} />
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 xl:flex-row xl:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-full bg-[#f2f3f5] px-4 py-2.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="shrink-0 text-gray-500"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {["All", ...categories].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCategory(option)}
                    aria-pressed={category === option}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                      category === option
                        ? "bg-[#14171d] text-white"
                        : "border border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <select
                value={visibility}
                onChange={(event) =>
                  setVisibility(
                    event.target.value as "All" | "Visible" | "Hidden",
                  )
                }
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium outline-none"
                aria-label="Filter by visibility"
              >
                <option value="All">All visibility</option>
                <option value="Visible">Visible</option>
                <option value="Hidden">Hidden</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th scope="col" className="px-5 py-3">Product</th>
                    <th scope="col" className="px-5 py-3">Category</th>
                    <th scope="col" className="px-5 py-3">Price</th>
                    <th scope="col" className="px-5 py-3">Stock</th>
                    <th scope="col" className="px-5 py-3">Status</th>
                    <th scope="col" className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => {
                    const stock = product.stock;
                    return (
                      <tr
                        key={product.id}
                        className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/60 ${
                          product.hidden ? "bg-gray-50/60" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ProductImage
                              tint={product.tint}
                              image={product.image}
                              alt={product.name}
                              className={`h-14 w-12 shrink-0 rounded-lg ${
                                product.hidden ? "opacity-50" : ""
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold">
                                  {product.name}
                                </span>
                                {product.custom && (
                                  <span className="rounded-full bg-[#0e7a5d]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0e7a5d]">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {product.finish ?? "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {product.category}
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                stock <= 8
                                  ? "font-semibold text-amber-600"
                                  : ""
                              }
                            >
                              {stock}
                            </span>
                            {stock === 0 ? (
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                Empty
                              </span>
                            ) : stock <= 8 ? (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                Low
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {product.hidden ? (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                                Hidden
                              </span>
                            ) : stock > 0 ? (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                In stock
                              </span>
                            ) : (
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                                Out of stock
                              </span>
                            )}
                            {product.isNew && (
                              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                                New
                              </span>
                            )}
                            {product.onSale && (
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                                On sale
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              aria-label={`Edit ${product.name}`}
                              className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-black hover:bg-black hover:text-white"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                void handleVisibility(
                                  product.id,
                                  !product.hidden,
                                )
                              }
                              aria-label={`${product.hidden ? "Show" : "Hide"} ${product.name}`}
                              className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-black"
                            >
                              {product.hidden ? "Show" : "Hide"}
                            </button>
                            {product.custom && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDelete(product.id, product.name)
                                }
                                aria-label={`Delete ${product.name}`}
                                className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <AdminEmptyState
                title="No products found"
                message="Try another search, category or visibility filter."
              />
            )}
          </>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Edits, hidden products and stock levels are saved in PostgreSQL. Hiding
        a seeded product removes it from the storefront without deleting its
        row; products created in the admin can be deleted permanently.
      </p>
    </div>
  );
}
