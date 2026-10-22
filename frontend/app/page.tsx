"use client";

import Link from "next/link";
import { useState } from "react";
import { TopBanner } from "@/components/TopBanner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { BEST_SELLERS } from "@/lib/products";
import { useCatalog } from "@/lib/catalog";
import { useLanguage } from "@/lib/language";

const CATEGORY_CARDS: Record<string, { tint: string; image: string }> = {
  Living: { tint: "#E4EAF0", image: "/products/linen-throw-blanket.jpg" },
  Kitchen: { tint: "#E7DCC8", image: "/products/ceramic-pour-over-set.jpg" },
  Bedroom: { tint: "#E9E1D3", image: "/products/brass-table-lamp.jpg" },
  Outdoor: { tint: "#DCE7E2", image: "/products/woven-storage-basket.jpg" },
};

const FALLBACK_TINTS = ["#E4EAF0", "#E7DCC8", "#E9E1D3", "#DCE7E2"];

export default function Home() {
  const { t } = useLanguage();
  const { visibleProducts, categories } = useCatalog();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const bestSellers = BEST_SELLERS.map((id) =>
    visibleProducts.find((product) => product.id === id),
  ).filter((product) => product !== undefined);

  const categoryCards = categories.map((key, index) => {
    const preset = CATEGORY_CARDS[key];
    const productImage = visibleProducts.find(
      (product) => product.category === key && product.image,
    )?.image;

    return {
      key,
      tint: preset?.tint ?? FALLBACK_TINTS[index % FALLBACK_TINTS.length],
      image: preset?.image ?? productImage ?? "",
    };
  });

  const catLabel = (key: string) => {
    if (key === "Living") return t.catLiving;
    if (key === "Kitchen") return t.catKitchen;
    if (key === "Bedroom") return t.catBedroom;
    if (key === "Outdoor") return t.catOutdoor;
    return key;
  };

  return (
    <>
      <TopBanner />
      <Header />
      <main className="mx-auto max-w-[1200px] px-5 w-full">
        {/* Hero */}
        <section className="grid md:grid-cols-2 gap-10 items-center py-10">
          <div>
            <p className="text-[13px] font-semibold tracking-[0.12em] text-[#0e7a5d]">
              {t.newSeason}
            </p>
            <h1 className="mt-3 text-[44px] md:text-[56px] leading-[1.02] font-extrabold tracking-tight">
              {t.heroTitle}
            </h1>
            <p className="mt-4 text-gray-500 text-[17px] max-w-[440px]">
              {t.heroSub}
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/shop"
                className="bg-[#0e7a5d] hover:bg-[#0b654d] text-white font-semibold rounded-full px-6 py-3 text-[15px]"
              >
                {t.shopCollection}
              </Link>
              <Link
                href="/shop"
                className="border border-black font-semibold rounded-full px-6 py-3 text-[15px] hover:bg-black hover:text-white transition-colors"
              >
                {t.newArrivals}
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl min-h-[320px] md:min-h-[380px] bg-[#DCE7E2]">
            <img
              src="/products/wool-floor-cushion.jpg"
              alt={t.heroTitle}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </section>

        {/* Shop by category */}
        <section className="mt-8">
          <h2 className="text-[26px] font-extrabold tracking-tight">
            {t.shopByCategory}
          </h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryCards.map((c) => (
              <Link
                key={c.key}
                href={`/shop?category=${encodeURIComponent(c.key)}`}
                className="group relative overflow-hidden rounded-2xl min-h-[160px] flex items-end"
                style={{ backgroundColor: c.tint }}
              >
                {c.image && (
                  <img
                    src={c.image}
                    alt={catLabel(c.key)}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent"
                />
                <span className="relative m-3 rounded-full bg-white/95 px-4 py-1.5 font-semibold text-[15px] text-[#14171d]">
                  {catLabel(c.key)}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Best sellers */}
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="text-[26px] font-extrabold tracking-tight">
              {t.bestSellers}
            </h2>
            <Link href="/shop" className="text-[#0e7a5d] text-sm font-semibold">
              {t.viewAll}
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-5">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} stock={p.stock} />
            ))}
          </div>
        </section>

        {/* Perks */}
        <section className="mt-14 border-y border-gray-100 py-6 grid md:grid-cols-3 gap-6">
          {[
            { t: t.freeShipping, s: t.freeShippingSub, icon: "truck" },
            { t: t.easyReturns, s: t.easyReturnsSub, icon: "return" },
            { t: t.secureCheckoutTitle, s: t.secureCheckoutSub, icon: "lock" },
          ].map((p) => (
            <div key={p.t} className="flex gap-3 items-start">
              <span className="text-[#0e7a5d] mt-0.5">
                {p.icon === "truck" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 7h13v9H1zM14 10h4l4 4v2h-8z" />
                    <circle cx="6" cy="18" r="1.8" /><circle cx="18" cy="18" r="1.8" />
                  </svg>
                )}
                {p.icon === "return" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
                  </svg>
                )}
                {p.icon === "lock" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                )}
              </span>
              <div>
                <div className="font-semibold text-[15px]">{p.t}</div>
                <div className="text-gray-500 text-sm">{p.s}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Newsletter */}
        <section className="mt-10 bg-[#f2f3f5] rounded-3xl px-6 md:px-10 py-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h3 className="text-[26px] font-extrabold tracking-tight">
              {t.newsletterTitle}
            </h3>
            <p className="text-gray-500 mt-1">{t.newsletterSub}</p>
          </div>
          {subscribed ? (
            <p className="font-semibold text-[#0e7a5d]">{t.subscribed}</p>
          ) : (
            <form
              className="flex flex-col sm:flex-row gap-3 flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setSubscribed(true);
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-white border border-gray-200 rounded-full px-5 py-3 text-sm outline-none focus:border-[#0e7a5d]"
              />
              <button className="bg-[#14171d] text-white font-semibold rounded-full px-7 py-3 text-[15px] hover:bg-black">
                {t.subscribe}
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
