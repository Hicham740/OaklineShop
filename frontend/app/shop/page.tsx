"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopBanner } from "@/components/TopBanner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton, StorefrontError } from "@/components/StorefrontStates";
import { USD_TO_DZD } from "@/lib/currency";
import { useCatalog } from "@/lib/catalog";
import { useLanguage } from "@/lib/language";

const PAGE_SIZE = 9;

// `useSearchParams` must be inside a Suspense boundary, so we split the page
// into an outer wrapper and an inner component.
export default function ShopPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-[1200px] px-5 py-20">…</div>}
    >
      <ShopInner />
    </Suspense>
  );
}

function ShopInner() {
  const { t } = useLanguage();
  const { visibleProducts, categories, loading, error, reload } = useCatalog();
  const params = useSearchParams();
  const router = useRouter();

  const paramCategory = params.get("category") ?? "";
  const paramQ = params.get("q") ?? "";

  const parseCats = (v: string) => (v ? v.split(",").filter(Boolean) : []);

  const [cats, setCats] = useState<string[]>(() => parseCats(paramCategory));
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sort, setSort] = useState("featured");
  const [query, setQuery] = useState(paramQ);
  const [page, setPage] = useState(1);
  const qTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (qTimer.current) clearTimeout(qTimer.current);
    },
    [],
  );

  // Live search: update the grid immediately, then put the search term
  // in the URL after a short pause so the page can be refreshed or shared.
  const handleQuery = (v: string) => {
    setQuery(v);
    setPage(1);
    if (qTimer.current) clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (v.trim()) sp.set("q", v.trim());
      else sp.delete("q");
      const qs = sp.toString();
      router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
    }, 500);
  };

  // Read filters from the URL when it changes (back/forward buttons or
  // category links from the home page).
  useEffect(() => {
    const fromUrl = parseCats(paramCategory);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCats((prev) =>
      prev.join(",") !== fromUrl.join(",") ? fromUrl : prev,
    );
    setQuery(paramQ);
    setPage(1);
  }, [paramCategory, paramQ]);

  const SORT_OPTIONS = [
    { value: "featured", label: t.featured },
    { value: "low", label: t.priceLowHigh },
    { value: "high", label: t.priceHighLow },
    { value: "name", label: t.nameSort },
  ];

  const catLabel = (c: string) => {
    if (c === "Living") return t.catLiving;
    if (c === "Kitchen") return t.catKitchen;
    if (c === "Bedroom") return t.catBedroom;
    if (c === "Outdoor") return t.catOutdoor;
    return c;
  };

  const toggleCat = (c: string) => {
    const next = cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c];
    setCats(next);
    setPage(1);
    const sp = new URLSearchParams(params.toString());
    if (next.length) sp.set("category", next.join(","));
    else sp.delete("category");
    const qs = sp.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  };

  const filtered = useMemo(() => {
    let list = [...visibleProducts];
    if (cats.length) list = list.filter((p) => cats.includes(p.category));
    if (query)
      list = list.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()),
      );
    const loDzd = parseFloat(min);
    const hiDzd = parseFloat(max);
    // The price inputs are in DZD, but product prices are stored in USD.
    if (!Number.isNaN(loDzd))
      list = list.filter((p) => p.price >= loDzd / USD_TO_DZD);
    if (!Number.isNaN(hiDzd))
      list = list.filter((p) => p.price <= hiDzd / USD_TO_DZD);
    if (inStockOnly) list = list.filter((p) => p.stock > 0);
    if (onSaleOnly) list = list.filter((p) => p.onSale);
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    if (sort === "high") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [
    visibleProducts,
    cats,
    query,
    min,
    max,
    inStockOnly,
    onSaleOnly,
    sort,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const clear = () => {
    setCats([]);
    setMin("");
    setMax("");
    setInStockOnly(false);
    setOnSaleOnly(false);
    setQuery("");
    setPage(1);
    router.replace("/shop", { scroll: false });
  };

  return (
    <>
      <TopBanner />
      <Header />
      <main className="mx-auto max-w-[1200px] px-5 w-full pb-4">
        <nav className="text-sm text-gray-500 mt-6 flex gap-2">
          <Link href="/" className="hover:text-black">
            {t.home}
          </Link>
          <span>/</span>
          <span className="text-black font-medium">{t.shopAll}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[40px] font-extrabold tracking-tight leading-none">
              {t.shopAll}
            </h1>
            <p className="text-gray-500 mt-2">{t.productsCount(filtered.length)}</p>
          </div>
          <label className="flex items-center gap-3 text-[15px] font-medium">
            {t.sortBy}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2.5 bg-white text-sm outline-none"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 grid md:grid-cols-[220px_1fr] gap-10">
          {/* Filters */}
          <aside className="space-y-7">
            <div>
              <input
                value={query}
                onChange={(e) => handleQuery(e.target.value)}
                placeholder={t.search}
                className="w-full bg-[#f2f3f5] rounded-full px-4 py-2.5 text-sm outline-none"
              />
            </div>
            <div>
              <h3 className="font-bold mb-3">{t.category}</h3>
              <ul className="space-y-3 text-[15px]">
                {categories.map((c) => (
                  <li key={c}>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cats.includes(c)}
                        onChange={() => toggleCat(c)}
                        className="w-[18px] h-[18px] accent-[#0e7a5d]"
                      />
                      {catLabel(c)}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2">{t.price}</h3>
              <div className="flex gap-2">
                <label className="flex-1">
                  <span className="text-[13px] text-gray-500">{t.min}</span>
                  <input
                    value={min}
                    onChange={(e) => {
                      setMin(e.target.value);
                      setPage(1);
                    }}
                    placeholder="0 دج"
                    inputMode="numeric"
                    className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </label>
                <label className="flex-1">
                  <span className="text-[13px] text-gray-500">{t.max}</span>
                  <input
                    value={max}
                    onChange={(e) => {
                      setMax(e.target.value);
                      setPage(1);
                    }}
                    placeholder="13 500 دج"
                    inputMode="numeric"
                    className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </label>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-3">{t.availability}</h3>
              <ul className="space-y-3 text-[15px]">
                <li>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => {
                        setInStockOnly(e.target.checked);
                        setPage(1);
                      }}
                      className="w-[18px] h-[18px] accent-[#0e7a5d]"
                    />
                    {t.inStock}
                  </label>
                </li>
                <li>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={(e) => {
                        setOnSaleOnly(e.target.checked);
                        setPage(1);
                      }}
                      className="w-[18px] h-[18px] accent-[#0e7a5d]"
                    />
                    {t.onSale}
                  </label>
                </li>
              </ul>
            </div>
            <button
              onClick={clear}
              className="w-full border border-black rounded-full py-2.5 font-semibold text-[15px] hover:bg-black hover:text-white transition-colors"
            >
              {t.clearFilters}
            </button>
          </aside>

          {/* Grid */}
          <div>
            {error ? (
              <StorefrontError message={error} onRetry={reload} />
            ) : loading && visibleProducts.length === 0 ? (
              <ProductGridSkeleton />
            ) : filtered.length === 0 ? (
              <p className="text-gray-500 py-20 text-center">{t.noResults}</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8">
                {paged.map((p) => (
                  <ProductCard key={p.id} product={p} stock={p.stock} />
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      aria-current={safePage === n ? "page" : undefined}
                      className={`w-11 h-11 rounded-full font-semibold ${
                        safePage === n
                          ? "bg-[#14171d] text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}
                {safePage < totalPages && (
                  <button
                    aria-label="Next page"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="w-11 h-11 rounded-full hover:bg-gray-100 text-xl rtl:rotate-180"
                  >
                    ›
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer full={false} />
    </>
  );
}
