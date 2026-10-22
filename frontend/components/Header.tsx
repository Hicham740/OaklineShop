"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language";
import { Logo } from "@/components/Logo";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BagIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8h12l1 12H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" />
    </svg>
  );
}

function HeaderSearchForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const onShop = pathname === "/shop";

  const [q, setQ] = useState(() => params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushed = useRef(params.get("q") ?? "");
  const urlQ = params.get("q") ?? "";

  // Keep the input in sync when the URL changes (for example, after
  // "Clear filters"), but don't overwrite what the user is typing.
  useEffect(() => {
    if (urlQ !== lastPushed.current) {
      lastPushed.current = urlQ;
      setQ(urlQ);
    }
  }, [urlQ]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const pushQuery = (value: string, navigate: boolean) => {
    const v = value.trim();
    lastPushed.current = v;
    const sp = new URLSearchParams(params.toString());
    if (v) sp.set("q", v);
    else sp.delete("q");
    const qs = sp.toString();
    const dest = qs ? `/shop?${qs}` : "/shop";
    if (navigate) router.push(dest);
    else router.replace(dest, { scroll: false });
  };

  const handleType = (v: string) => {
    setQ(v);
    // On the shop page, filter as the user types. A small delay avoids
    // updating the URL on every single keystroke.
    if (!onShop) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => pushQuery(v, false), 350);
  };

  return (
    <form
      role="search"
      aria-label={t.search}
      className="ms-auto hidden sm:flex flex-1 max-w-[420px] items-center gap-2 bg-[#f2f3f5] rounded-full px-4 py-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        pushQuery(q, !onShop);
      }}
    >
      <span className="text-gray-500" aria-hidden="true">
        <SearchIcon />
      </span>
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => handleType(e.target.value)}
        placeholder={t.search}
        aria-label={t.search}
        autoComplete="off"
        className="bg-transparent outline-none text-sm w-full"
      />
    </form>
  );
}

export function Header({ minimal = false }: { minimal?: boolean }) {
  const { count } = useCart();
  const { user } = useAuth();
  const { t, locale, toggle } = useLanguage();
  const pathname = usePathname();
  const languageLabel =
    locale === "en" ? t.switchToArabic : t.switchToEnglish;

  // The account button is deliberately role-neutral in appearance: one icon
  // and one shared login page. Signed-in visitors go to their own account area.
  const accountHref =
    user?.role === "admin" ? "/admin" : user ? "/account" : "/login";
  const accountAriaLabel = user ? t.myAccount : t.signIn;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-[1200px] px-5 h-[68px] flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Oakline home">
          <Logo size={34} />
          <span className="text-[26px] font-extrabold tracking-tight">
            Oakline
          </span>
        </Link>

        {!minimal && (
          <nav aria-label={t.primaryNav} className="hidden md:flex items-center">
            <Link
              href="/shop"
              aria-current={pathname === "/shop" ? "page" : undefined}
              className="group inline-flex items-center gap-2 rounded-full bg-[#0e7a5d] px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(14,122,93,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0b654d] hover:shadow-[0_8px_20px_rgba(14,122,93,0.38)] active:translate-y-0"
            >
              <span className="text-white/85" aria-hidden="true">
                <BagIcon size={17} />
              </span>
              {t.shopAll}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </nav>
        )}

        {minimal ? (
          <div className="ms-auto flex items-center gap-5">
            <span className="hidden sm:flex items-center gap-2 text-[15px] text-gray-600">
              <span className="text-[#0e7a5d]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </span>
              {t.secureCheckout}
            </span>
            <button
              type="button"
              onClick={toggle}
              aria-label={languageLabel}
              className="flex items-center gap-2 border border-black rounded-full px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors"
            >
              <GlobeIcon />{" "}
              <span lang={locale === "en" ? "ar" : "en"}>
                {locale === "en" ? "العربية" : "English"}
              </span>
            </button>
          </div>
        ) : (
          <>
            <Suspense
              fallback={
                <div
                  aria-hidden="true"
                  className="ms-auto hidden sm:flex flex-1 max-w-[420px] bg-[#f2f3f5] rounded-full px-4 py-2.5"
                />
              }
            >
              <HeaderSearchForm />
            </Suspense>
            <div className="ms-auto sm:ms-0 flex items-center gap-3">
              <Link
                href={accountHref}
                aria-label={accountAriaLabel}
                title={accountAriaLabel}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#12141a] transition-colors hover:bg-[#f2f3f5] hover:text-[#0e7a5d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7a5d] focus-visible:ring-offset-2"
              >
                <UserIcon />
              </Link>
              <button
                type="button"
                onClick={toggle}
                aria-label={languageLabel}
                className="flex items-center gap-2 border border-black rounded-full px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors"
              >
                <GlobeIcon />{" "}
                <span lang={locale === "en" ? "ar" : "en"}>
                  {locale === "en" ? "العربية" : "English"}
                </span>
              </button>
              <Link
                href="/cart"
                aria-label={
                  count > 0
                    ? `${t.yourCart}, ${t.cartItems(count)}`
                    : t.yourCart
                }
                className="relative hover:text-[#0e7a5d]"
              >
                <BagIcon />
                {count > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-2 -end-2 bg-[#0e7a5d] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    {count}
                  </span>
                )}
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
