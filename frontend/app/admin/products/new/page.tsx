"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { useCatalog, type ProductInput } from "@/lib/catalog";

export default function NewProductPage() {
  const router = useRouter();
  const { addProduct } = useCatalog();

  const handleSubmit = (input: ProductInput) => {
    addProduct(input);
    router.push("/admin/products");
  };

  return <ProductForm mode="new" onSubmit={handleSubmit} />;
}
