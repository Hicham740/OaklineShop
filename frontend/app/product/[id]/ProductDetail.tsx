"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TopBanner } from "@/components/TopBanner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, ProductImage } from "@/components/ProductCard";
import { QtyStepper } from "@/components/QtyStepper";
import { StorefrontError } from "@/components/StorefrontStates";
import { formatPrice } from "@/lib/products";
import { useCatalog, type CatalogProduct } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language";

const FINISHES = [
  { name: "Sand", color: "#D9CBAE" },
  { name: "Slate", color: "#5B6B7A" },
  { name: "Olive", color: "#7A8B6F" },
];

export function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Read the Promise with `use()`. It pauses rendering until the params
  // are ready, and the <Suspense> in page.tsx shows the fallback meanwhile.
  const { id } = use(params);

  // Without a key, React reuses this component when you open another product
  // and the old state (finish, quantity, image) stays visible. The key forces
  // a fresh component, so each product starts with clean state.
  return <ProductDetailView key={id} id={id} />;
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBanner />
      <Header />
      <main className="mx-auto max-w-[1200px] px-5 w-full py-16">
        {children}
      </main>
      <Footer full={false} />
    </>
  );
}

function ProductDetailView({ id }: { id: string }) {
  const { t } = useLanguage();
  const { getProductById, visibleProducts, loading, error, reload } =
    useCatalog();
  const product = getProductById(id);

  if (error) {
    return (
      <PageShell>
        <StorefrontError message={error} onRetry={reload} />
      </PageShell>
    );
  }

  if (loading && !product) {
    return (
      <PageShell>
        <div className="grid animate-pulse gap-10 md:grid-cols-2">
          <div className="aspect-square rounded-3xl bg-gray-100" />
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-10 w-3/4 rounded bg-gray-100" />
            <div className="h-7 w-28 rounded bg-gray-100" />
            <div className="h-24 rounded bg-gray-100" />
            <div className="h-12 w-48 rounded-full bg-gray-100" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (!product || product.hidden) {
    return (
      <PageShell>
        <div className="py-12 text-center">
          <p className="text-sm font-semibold tracking-wide text-gray-500">
            404
          </p>
          <h1 className="mt-2 text-[32px] font-extrabold tracking-tight">
            {t.productUnavailable}
          </h1>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-[#0e7a5d] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0b654d]"
          >
            {t.continueShopping}
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <ProductContent
      key={product.id}
      product={product}
      relatedProducts={visibleProducts}
    />
  );
}

function ProductContent({
  product,
  relatedProducts,
}: {
  product: CatalogProduct;
  relatedProducts: CatalogProduct[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const { add } = useCart();

  const [finish, setFinish] = useState(product.finish ?? "Sand");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const stock = product.stock;
  const outOfStock = stock <= 0;
  const lowStock = stock > 0 && stock <= 8;

  // Navigation keeps the old scroll position, so start every product at
  // the top of the page. This runs once because the key above remounts it.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const related = useMemo(
    () =>
      relatedProducts
        .filter((item) => item.id !== product.id && !item.hidden)
        .slice(0, 4),
    [product.id, relatedProducts],
  );

  const thumbs = [
    { tint: product.tint, src: product.image },
    { tint: "#DFE6EA", src: product.image },
    { tint: "#E6DCC9", src: product.image },
    { tint: "#DCE7E2", src: product.image },
  ];

  return (
    <>
      <TopBanner />
      <Header />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1200px] px-5 w-full">
        <nav aria-label={t.breadcrumb} className="text-[15px] text-gray-500 mt-6 flex gap-2">
          <Link href="/" className="hover:text-black">
            {t.home}
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/shop?category=${product.category}`}
            className="hover:text-black"
          >
            {product.category}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-black font-semibold">
            {product.name}
          </span>
        </nav>

        <section className="mt-6 grid md:grid-cols-2 gap-10">
          <div>
            <ProductImage
              tint={thumbs[activeImg].tint}
              image={thumbs[activeImg].src}
              alt={product.name}
              large
              className={`rounded-3xl aspect-square w-full ${
                outOfStock ? "opacity-60" : ""
              }`}
            />
            <div className="mt-3 grid grid-cols-4 gap-3">
              {thumbs.map((thumb, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  aria-label={t.viewImage(i + 1)}
                  aria-pressed={i === activeImg}
                  className={`relative overflow-hidden rounded-2xl aspect-square border-2 transition-colors ${
                    i === activeImg ? "border-black" : "border-transparent"
                  }`}
                  style={{ backgroundColor: thumb.tint }}
                >
                  <img
                    src={thumb.src}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p
              className={`text-[13px] font-bold tracking-[0.12em] ${
                outOfStock
                  ? "text-red-600"
                  : lowStock
                    ? "text-amber-600"
                    : "text-[#0e7a5d]"
              }`}
            >
              {outOfStock
                ? t.outOfStock
                : lowStock
                  ? t.onlyLeft(stock)
                  : t.inStockLabel}
            </p>
            <h1 className="mt-2 text-[40px] leading-[1.05] font-extrabold tracking-tight">
              {product.name}
            </h1>
            <p className="mt-3 text-[28px] font-bold">
              {formatPrice(product.price)}
            </p>
            <p className="mt-4 text-gray-500 text-[17px] leading-relaxed">
              {product.description}
            </p>

            <p className="mt-6 font-semibold">
              {t.finish}:{" "}
              <span className="font-normal text-gray-600">{finish}</span>
            </p>
            <div
              role="group"
              aria-label={t.finish}
              className="mt-3 flex gap-3"
            >
              {FINISHES.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  title={f.name}
                  aria-label={`${t.finish}: ${f.name}`}
                  aria-pressed={finish === f.name}
                  onClick={() => setFinish(f.name)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    finish === f.name
                      ? "border-black scale-105"
                      : "border-transparent"
                  }`}
                  style={{
                    backgroundColor: f.color,
                    boxShadow:
                      finish === f.name
                        ? "0 0 0 2px white, 0 0 0 3px black"
                        : "none",
                  }}
                />
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <QtyStepper
                qty={qty}
                onChange={setQty}
                max={Math.max(1, stock)}
                label={t.quantity}
              />
              <button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  if (outOfStock) return;
                  add(product.id, qty, finish);
                  setAdded(true);
                  setTimeout(() => router.push("/cart"), 450);
                }}
                className="flex-1 bg-[#0e7a5d] hover:bg-[#0b654d] text-white font-bold rounded-full px-6 py-3 text-[16px] transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
              >
                {outOfStock ? t.outOfStock : added ? t.added : t.addToCart}
              </button>
            </div>
            <p className="sr-only" role="status">
              {added ? t.added : ""}
            </p>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="font-bold">{t.details}</h3>
              <p className="text-gray-500 mt-1">{t.detailsText}</p>
            </div>
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="font-bold">{t.shippingReturns}</h3>
              <p className="text-gray-500 mt-1">{t.shippingReturnsText}</p>
            </div>
            <div className="border-b border-gray-100 mt-6" />
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-center justify-between">
            <h2 className="text-[28px] font-extrabold tracking-tight">
              {t.youMayAlsoLike}
            </h2>
            <Link href="/shop" className="text-[#0e7a5d] font-semibold">
              {t.viewAll}
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} stock={item.stock} />
            ))}
          </div>
        </section>
      </main>
      <Footer full={false} />
    </>
  );
}
