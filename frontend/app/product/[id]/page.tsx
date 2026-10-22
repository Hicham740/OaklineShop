import { Suspense } from "react";
import { PRODUCTS } from "@/lib/products";
import { ProductDetail } from "./ProductDetail";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

// Deliberately NOT async anymore: instead of awaiting `params` on the server,
// we hand the promise itself to the client component, which unwraps it with
// `use()`. Reasons:
//  1. `ProductDetail` needs the `id` on the client to key the view (see there),
//     and passing the promise keeps the page synchronous, so React can render
//     the Suspense fallback while the params settle instead of blocking the
//     whole segment on the server.
//  2. Every id is listed in `generateStaticParams` below, so the promise is
//     already resolved — unwrapping it client-side costs no extra round trip.
// `use()` suspends if the promise isn't ready, so a Suspense boundary is
// mandatory; without it the route would bail out to the root boundary.
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
