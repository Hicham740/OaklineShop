"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminErrorState } from "@/components/admin/DataState";
import {
  ProductForm,
  type ProductFormValues,
} from "@/components/admin/ProductForm";
import { useCatalog, type ProductInput } from "@/lib/catalog";
import { USD_TO_DZD } from "@/lib/currency";

export function EditProduct({ id }: { id: string }) {
  const router = useRouter();
  const { getProductById, updateProduct, loading, error, reload } =
    useCatalog();
  const product = getProductById(id);

  if (error) {
    return <AdminErrorState message={error} onRetry={reload} />;
  }

  if (loading && !product) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="h-10 w-64 rounded bg-gray-200" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="h-96 rounded-2xl bg-gray-100" />
          <div className="h-80 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
        <p className="text-lg font-bold">Product not found</p>
        <p className="mt-1 text-sm text-gray-500">
          It may have been deleted or the API may be unavailable.
        </p>
        <Link
          href="/admin/products"
          className="mt-5 inline-block rounded-full bg-[#0e7a5d] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to products
        </Link>
      </div>
    );
  }

  const initial: ProductFormValues = {
    name: product.name,
    category: product.category,
    finish: product.finish ?? "",
    priceDZD: String(Math.round(product.price * USD_TO_DZD)),
    stock: String(product.stock),
    tint: product.tint,
    image: product.image,
    description: product.description,
    isNew: Boolean(product.isNew),
    onSale: Boolean(product.onSale),
  };

  const handleSubmit = async (input: ProductInput) => {
    await updateProduct(id, input);
    router.push("/admin/products");
  };

  return (
    <div>
      <ProductForm mode="edit" initial={initial} onSubmit={handleSubmit} />
      {!product.custom && (
        <p className="mt-4 max-w-2xl text-sm text-gray-500">
          This is a seeded demo product. Edits are saved in PostgreSQL and are
          kept when you run the seed script again.
        </p>
      )}
    </div>
  );
}
