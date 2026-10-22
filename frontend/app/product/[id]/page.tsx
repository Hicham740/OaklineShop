import { Suspense } from "react";
import { PRODUCTS } from "@/lib/products";
import { ProductDetail } from "./ProductDetail";

// Create a static page for every product id at build time.
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

// In Next.js 16, `params` is a Promise. We pass it to the client component,
// which reads it with `use()` inside a Suspense boundary.
export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-10">Loading…</div>}>
      <ProductDetail params={params} />
    </Suspense>
  );
}
