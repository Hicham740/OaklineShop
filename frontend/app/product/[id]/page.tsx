import { Suspense } from "react";
import { PRODUCTS } from "@/lib/products";
import { ProductDetail } from "./ProductDetail";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-10">Loading…</div>}>
      <ProductDetail id={id} />
    </Suspense>
  );
}
