"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ProductImage } from "@/components/ProductCard";
import { useCatalog, type ProductInput } from "@/lib/catalog";
import { USD_TO_DZD, formatDZDValue, toDZD } from "@/lib/currency";
import { formatFileSize, optimiseImage } from "@/lib/image-upload";
import type { Category } from "@/lib/products";

export type ProductFormValues = {
  name: string;
  category: Category;
  finish: string;
  priceDZD: string;
  stock: string;
  tint: string;
  image: string;
  description: string;
  isNew: boolean;
  onSale: boolean;
};

const EMPTY_FORM: ProductFormValues = {
  name: "",
  category: "Living",
  finish: "",
  priceDZD: "",
  stock: "10",
  tint: "#E9E1D3",
  image: "",
  description: "",
  isNew: false,
  onSale: false,
};

const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-[#0e7a5d]";

export function ProductForm({
  mode,
  initial,
  onSubmit,
}: {
  mode: "new" | "edit";
  initial?: Partial<ProductFormValues>;
  onSubmit: (input: ProductInput) => void;
}) {
  const { categories, addCategory } = useCatalog();
  const [form, setForm] = useState<ProductFormValues>({
    ...EMPTY_FORM,
    ...initial,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const categoryOptions =
    form.category && !categories.includes(form.category)
      ? [form.category, ...categories]
      : categories;

  const update = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const priceNumber = Number.parseFloat(form.priceDZD);
  const stockNumber = Number.parseInt(form.stock, 10);

  const previewPrice =
    Number.isFinite(priceNumber) && priceNumber > 0
      ? formatDZDValue(toDZD(priceNumber / USD_TO_DZD))
      : "0 دج";

  const handleImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so choosing the same file again still triggers onChange.
    event.target.value = "";
    if (!file) return;

    setImageError(null);
    setImageInfo(null);
    setImageBusy(true);

    try {
      const optimised = await optimiseImage(file);
      update("image", optimised.dataUrl);
      setImageInfo(
        `${optimised.width} × ${optimised.height} px · ${formatFileSize(
          optimised.bytes,
        )} (optimised from ${formatFileSize(optimised.originalBytes)})`,
      );
    } catch (error) {
      setImageError(
        error instanceof Error
          ? error.message
          : "This image could not be processed.",
      );
    } finally {
      setImageBusy(false);
    }
  };

  const clearImage = () => {
    update("image", "");
    setImageInfo(null);
    setImageError(null);
  };

  const handleAddCategory = () => {
    const result = addCategory(newCategory);
    if (!result.ok) {
      setCategoryError(result.error);
      return;
    }

    update("category", result.name);
    setNewCategory("");
    setCategoryError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: string[] = [];
    if (imageBusy) nextErrors.push("Wait for the image to finish optimising.");
    if (!form.name.trim()) nextErrors.push("Product name is required.");
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      nextErrors.push("Price must be greater than 0.");
    }
    if (!Number.isInteger(stockNumber) || stockNumber < 0) {
      nextErrors.push("Stock must be 0 or more.");
    }

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors([]);
    onSubmit({
      name: form.name.trim(),
      price: Math.round((priceNumber / USD_TO_DZD) * 100) / 100,
      category: form.category,
      tint: form.tint,
      image: form.image.trim(),
      isNew: form.isNew,
      inStock: stockNumber > 0,
      onSale: form.onSale,
      finish: form.finish.trim() || undefined,
      description:
        form.description.trim() || "More details about this product coming soon.",
      stock: stockNumber,
    });
  };

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-black"
      >
        <span aria-hidden="true">←</span> Back to products
      </Link>

      <div className="mt-3">
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight">
          {mode === "new" ? "Add product" : "Edit product"}
        </h1>
        <p className="mt-1 text-[15px] text-gray-500">
          {mode === "new"
            ? "Create a new item for your catalogue."
            : "Change the details customers see and update the stock level."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        {errors.length > 0 && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p className="font-semibold">Please fix the following:</p>
            <ul className="mt-1 list-inside list-disc">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {/* Basic information */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
              <h2 className="text-lg font-bold">Basic information</h2>
              <p className="mt-1 text-sm text-gray-500">
                The name and description customers will see.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium">Product name</span>
                  <input
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                    placeholder="e.g. Ceramic mug set"
                    className={`mt-1.5 ${inputCls}`}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block">
                      <span className="text-sm font-medium">Category</span>
                      <select
                        value={form.category}
                        onChange={(event) =>
                          update("category", event.target.value as Category)
                        }
                        className={`mt-1.5 ${inputCls}`}
                      >
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="mt-2 flex gap-2">
                      <input
                        value={newCategory}
                        onChange={(event) => {
                          setNewCategory(event.target.value);
                          setCategoryError(null);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleAddCategory();
                          }
                        }}
                        placeholder="New category"
                        aria-label="New category name"
                        className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#0e7a5d]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="shrink-0 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold transition-colors hover:border-black"
                      >
                        Add
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      New categories appear in the shop filters right away.
                    </p>
                    {categoryError && (
                      <p
                        role="alert"
                        className="mt-1 text-xs font-medium text-red-600"
                      >
                        {categoryError}
                      </p>
                    )}
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium">
                      Finish <span className="text-gray-400">(optional)</span>
                    </span>
                    <input
                      value={form.finish}
                      onChange={(event) => update("finish", event.target.value)}
                      placeholder="e.g. Sand"
                      className={`mt-1.5 ${inputCls}`}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium">
                    Description <span className="text-gray-400">(optional)</span>
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      update("description", event.target.value)
                    }
                    rows={4}
                    placeholder="Materials, size, care instructions…"
                    className={`mt-1.5 resize-y ${inputCls}`}
                  />
                </label>
              </div>
            </section>

            {/* Price and stock */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
              <h2 className="text-lg font-bold">Price and stock</h2>
              <p className="mt-1 text-sm text-gray-500">
                Prices are entered in Algerian dinars.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Price (DZD)</span>
                  <input
                    value={form.priceDZD}
                    onChange={(event) =>
                      update("priceDZD", event.target.value)
                    }
                    placeholder="e.g. 6500"
                    inputMode="decimal"
                    className={`mt-1.5 ${inputCls}`}
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    Shown as {previewPrice} on the storefront.
                  </span>
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Stock quantity</span>
                  <input
                    value={form.stock}
                    onChange={(event) => update("stock", event.target.value)}
                    placeholder="e.g. 20"
                    inputMode="numeric"
                    className={`mt-1.5 ${inputCls}`}
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    Products with 0 stock are marked out of stock.
                  </span>
                </label>
              </div>
            </section>

            {/* Appearance */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
              <h2 className="text-lg font-bold">Appearance</h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose an image or a background colour.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <span className="text-sm font-medium">Product photo</span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleImageFile}
                      className="sr-only"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className={`cursor-pointer rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold transition-colors ${
                        imageBusy
                          ? "pointer-events-none opacity-60"
                          : "hover:border-black"
                      }`}
                    >
                      {imageBusy
                        ? "Optimising…"
                        : form.image
                          ? "Replace photo"
                          : "Upload photo"}
                    </label>
                    {form.image && !imageBusy && (
                      <button
                        type="button"
                        onClick={clearImage}
                        className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-300 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                    {form.image.startsWith("data:") && (
                      <span className="rounded-full bg-[#0e7a5d]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0e7a5d]">
                        Uploaded
                      </span>
                    )}
                  </div>
                  <span className="mt-1.5 block text-xs text-gray-500">
                    JPG, PNG, WebP or AVIF up to 8 MB. Photos are resized to
                    1,000 px and compressed automatically before saving.
                  </span>
                  {imageBusy && (
                    <p
                      role="status"
                      className="mt-1.5 text-xs font-medium text-gray-500"
                    >
                      Optimising image — this only takes a moment.
                    </p>
                  )}
                  {imageInfo && (
                    <p
                      role="status"
                      className="mt-1.5 text-xs font-medium text-[#0e7a5d]"
                    >
                      Image ready: {imageInfo}
                    </p>
                  )}
                  {imageError && (
                    <p
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-red-600"
                    >
                      {imageError}
                    </p>
                  )}
                </div>

                <label className="block">
                  <span className="text-sm font-medium">
                    Or use an image URL{" "}
                    <span className="text-gray-400">(optional)</span>
                  </span>
                  <input
                    value={form.image.startsWith("data:") ? "" : form.image}
                    onChange={(event) => {
                      update("image", event.target.value);
                      setImageInfo(null);
                      setImageError(null);
                    }}
                    placeholder="/products/glass-carafe.jpg"
                    className={`mt-1.5 ${inputCls}`}
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    Use a path from the public folder or a full https:// URL.
                    Leave both empty to show a placeholder icon.
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <span className="text-sm font-medium">Background colour</span>
                  <input
                    type="color"
                    value={form.tint}
                    onChange={(event) => update("tint", event.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
                  />
                  <span className="font-mono text-xs text-gray-500">
                    {form.tint}
                  </span>
                </label>
              </div>
            </section>

            {/* Visibility */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
              <h2 className="text-lg font-bold">Visibility</h2>
              <p className="mt-1 text-sm text-gray-500">
                Add badges to help this product stand out.
              </p>

              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3.5">
                  <input
                    type="checkbox"
                    checked={form.isNew}
                    onChange={(event) => update("isNew", event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#0e7a5d]"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Mark as new
                    </span>
                    <span className="block text-xs text-gray-500">
                      Shows a “New” badge on the product card.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3.5">
                  <input
                    type="checkbox"
                    checked={form.onSale}
                    onChange={(event) => update("onSale", event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#0e7a5d]"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Put on sale
                    </span>
                    <span className="block text-xs text-gray-500">
                      Includes this product in the “On sale” filter.
                    </span>
                  </span>
                </label>
              </div>
            </section>
          </div>

          {/* Preview + actions */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Preview</h2>
                {form.isNew && (
                  <span className="rounded-full bg-[#14171d] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    New
                  </span>
                )}
              </div>

              <ProductImage
                tint={form.tint}
                image={form.image.trim()}
                alt={form.name || "Product preview"}
                className="mt-4 aspect-[3/3.6] w-full rounded-2xl"
              />

              <div className="mt-3 flex items-baseline justify-between gap-3">
                <p className="font-medium">
                  {form.name.trim() || "Product name"}
                </p>
                <p className="shrink-0 text-sm text-gray-500">{previewPrice}</p>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {form.category}
                {form.finish.trim() ? ` · ${form.finish.trim()}` : ""}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <button
                type="submit"
                className="w-full rounded-full bg-[#0e7a5d] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0b654d]"
              >
                {mode === "new" ? "Save product" : "Save changes"}
              </button>
              <Link
                href="/admin/products"
                className="mt-2 block rounded-full border border-gray-300 py-3 text-center text-sm font-semibold transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                Cancel
              </Link>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-500">
                Saved in this browser until the backend is connected.
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
