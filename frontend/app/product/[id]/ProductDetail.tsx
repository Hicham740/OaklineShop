"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBanner } from "@/components/TopBanner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, ProductImage } from "@/components/ProductCard";
import { QtyStepper } from "@/components/QtyStepper";
import { PRODUCTS, getProduct, formatPrice } from "@/lib/products";
import { useCart, useSeedDemoCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language";

const FINISHES = [
  { name: "Sand", color: "#D9CBAE" },
  { name: "Slate", color: "#5B6B7A" },
  { name: "Olive", color: "#7A8B6F" },
];

export function ProductDetail({ id }: { id: string }) {
  useSeedDemoCart();
  const { t } = useLanguage();
  const router = useRouter();
  const { add } = useCart();
  const product = getProduct(id) ?? PRODUCTS[0];

  const [finish, setFinish] = useState(product.finish ?? "Sand");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const related = useMemo(
    () => PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4),
    [product.id],
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
      <main className="mx-auto max-w-[1200px] px-5 w-full">
        <nav className="text-[15px] text-gray-500 mt-6 flex gap-2">
          <Link href="/" className="hover:text-black">
            {t.home}
          </Link>
          <span>/</span>
          <Link
            href={`/shop?category=${product.category}`}
            className="hover:text-black"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-black font-semibold">{product.name}</span>
        </nav>

        <section className="mt-6 grid md:grid-cols-2 gap-10">
          <div>
            <ProductImage
              tint={thumbs[activeImg].tint}
              image={thumbs[activeImg].src}
              alt={product.name}
              large
              className="rounded-3xl aspect-square w-full"
            />
            <div className="mt-3 grid grid-cols-4 gap-3">
              {thumbs.map((thumb, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative overflow-hidden rounded-2xl aspect-square border-2 transition-colors ${
                    i === activeImg ? "border-black" : "border-transparent"
                  }`}
                  style={{ backgroundColor: thumb.tint }}
                  aria-label={`View image ${i + 1}`}
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
            <p className="text-[13px] font-bold tracking-[0.12em] text-[#0e7a5d]">
              {t.inStockLabel}
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
            <div className="mt-3 flex gap-3">
              {FINISHES.map((f) => (
                <button
                  key={f.name}
                  title={f.name}
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
              <QtyStepper qty={qty} onChange={setQty} />
              <button
                onClick={() => {
                  add(product.id, qty, finish);
                  setAdded(true);
                  setTimeout(() => router.push("/cart"), 450);
                }}
                className="flex-1 bg-[#0e7a5d] hover:bg-[#0b654d] text-white font-bold rounded-full px-6 py-3 text-[16px] transition-colors"
              >
                {added ? t.added : t.addToCart}
              </button>
            </div>

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
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>
      <Footer full={false} />
    </>
  );
}
