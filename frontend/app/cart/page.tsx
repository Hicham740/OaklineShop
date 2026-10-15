"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "@/components/Header";
import { QtyStepper } from "@/components/QtyStepper";
import { ProductImage } from "@/components/ProductCard";
import { getProduct, formatPrice } from "@/lib/products";
import { toDZD, formatDZDValue } from "@/lib/currency";
import { useCart, useSeedDemoCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language";

const inputCls =
  "w-full border border-gray-300 rounded-2xl px-4 py-3.5 text-[15px] outline-none focus:border-[#0e7a5d] bg-white";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-medium text-[15px]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export default function CartPage() {
  useSeedDemoCart();
  const { t } = useLanguage();
  const { lines, setQty, remove, subtotal, clear } = useCart();
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [method, setMethod] = useState<"cod" | "cib" | "edahabia">("cod");
  const isCard = method !== "cod";

  const detailed = lines
    .map((l) => ({ line: l, product: getProduct(l.id) }))
    .filter((x) => x.product);

  return (
    <>
      <Header minimal />
      <main className="mx-auto max-w-[1200px] px-5 w-full pb-20">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-gray-600 mt-7 hover:text-black"
        >
          <span className="rtl:rotate-180">‹</span> {t.continueShopping}
        </Link>
        <h1 className="mt-3 text-[44px] font-extrabold tracking-tight">
          {t.yourCart}
        </h1>

        <div className="mt-6 grid lg:grid-cols-[1fr_380px] gap-10 items-start">
          <div>
            {detailed.length === 0 ? (
              <div className="border-y border-gray-100 py-16 text-center">
                <p className="text-lg font-semibold">{t.emptyCart}</p>
                <Link
                  href="/shop"
                  className="inline-block mt-4 bg-[#0e7a5d] text-white font-semibold rounded-full px-6 py-3"
                >
                  {t.shopCollection}
                </Link>
              </div>
            ) : (
              <ul className="border-t border-gray-100">
                {detailed.map(({ line, product }) => (
                  <li
                    key={line.id}
                    className="flex gap-5 py-7 border-b border-gray-100"
                  >
                    <ProductImage
                      tint={product!.tint}
                      image={product!.image}
                      alt={product!.name}
                      className="w-[110px] h-[130px] rounded-2xl shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between gap-4">
                        <div>
                          <div className="font-bold text-[17px]">
                            {product!.name}
                          </div>
                          <div className="text-gray-500 mt-0.5">
                            {line.variant
                              ? `${product!.category === "Living" ? t.colour : t.finish}: ${line.variant}`
                              : `${t.finish}: ${product!.finish ?? "Sand"}`}
                          </div>
                        </div>
                        <div className="font-bold text-[17px]">
                          {formatPrice(product!.price * line.qty)}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-4">
                        <QtyStepper
                          small
                          qty={line.qty}
                          onChange={(q) => setQty(line.id, q)}
                        />
                        <button
                          onClick={() => remove(line.id)}
                          className="text-gray-500 underline hover:text-black"
                        >
                          {t.remove}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="mt-12 text-[26px] font-extrabold tracking-tight">
              {t.shippingDetails}
            </h2>
            <div className="mt-5 space-y-5">
              <Field label={t.email}>
                <input placeholder="you@example.com" className={inputCls} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label={t.firstName}>
                  <input className={inputCls} />
                </Field>
                <Field label={t.lastName}>
                  <input className={inputCls} />
                </Field>
              </div>
              <Field label={t.phone}>
                <input
                  placeholder="0550 00 00 00"
                  className={inputCls}
                  inputMode="tel"
                />
              </Field>
              <Field label={t.address}>
                <input className={inputCls} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label={t.city}>
                  <input className={inputCls} />
                </Field>
                <Field label={t.postalCode}>
                  <input className={inputCls} />
                </Field>
              </div>
            </div>

            <h2 className="mt-12 text-[26px] font-extrabold tracking-tight">
              {t.payment}
            </h2>
            <p className="mt-2 font-semibold text-[15px]">{t.paymentMethod}</p>
            <div
              className="mt-3 grid sm:grid-cols-3 gap-3"
              role="radiogroup"
              aria-label={t.paymentMethod}
            >
              {(
                [
                  { value: "cod", title: t.payCOD, sub: t.payCODSub },
                  { value: "cib", title: t.payCIB, sub: t.payCardSub },
                  { value: "edahabia", title: t.payEdahabia, sub: t.payCardSub },
                ] as const
              ).map((opt) => {
                const selected = method === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMethod(opt.value)}
                    className={`rounded-2xl border-2 p-4 text-start transition-colors ${
                      selected
                        ? "border-[#0e7a5d] bg-[#0e7a5d]/5"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span className="font-bold text-[15px]">{opt.title}</span>
                    <span className="block text-gray-500 text-[13px] mt-1">
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>
            {isCard ? (
              <>
                <p className="text-gray-500 text-sm">{t.cardNote}</p>
                <div className="mt-5 space-y-5">
                  <Field label={t.cardNumber}>
                    <input placeholder="0000 0000 0000 0000" className={inputCls} inputMode="numeric" />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label={t.expiry}>
                      <input placeholder="MM / YY" className={inputCls} />
                    </Field>
                    <Field label={t.securityCode}>
                      <input placeholder="CVC" className={inputCls} inputMode="numeric" />
                    </Field>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">{t.codNote}</p>
            )}
          </div>

          <aside className="bg-[#f2f3f5] rounded-3xl p-7 lg:sticky lg:top-24">
            <h2 className="text-[24px] font-extrabold tracking-tight">
              {t.orderSummary}
            </h2>
            <form
              className="mt-5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (promo.trim()) setPromoApplied(true);
              }}
            >
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder={t.promoCode}
                className="flex-1 min-w-0 bg-white border border-gray-300 rounded-full px-5 py-2.5 outline-none"
              />
              <button className="border border-black rounded-full px-6 font-semibold hover:bg-black hover:text-white transition-colors">
                {t.apply}
              </button>
            </form>
            {promoApplied && (
              <p className="mt-2 text-sm text-[#0e7a5d] font-medium">
                {t.promoApplied}
              </p>
            )}
            <dl className="mt-5 space-y-2.5 text-[16px]">
              <div className="flex justify-between">
                <dt className="text-gray-500">{t.subtotal}</dt>
                <dd className="font-medium">{formatDZDValue(toDZD(subtotal))}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">{t.shipping}</dt>
                <dd className="font-medium text-right">{t.shippingCalc}</dd>
              </div>
            </dl>
            <div className="border-t border-gray-300 mt-5 pt-5 flex items-center justify-between">
              <span className="font-bold text-[18px]">{t.estimatedTotal}</span>
              <span className="font-extrabold text-[28px]">
                {formatDZDValue(
                  toDZD(promoApplied ? subtotal * 0.9 : subtotal),
                )}
              </span>
            </div>
            <button
              onClick={() => {
                setPlaced(true);
                setTimeout(() => {
                  clear();
                }, 1200);
              }}
              className="mt-5 w-full bg-[#0e7a5d] hover:bg-[#0b654d] text-white font-bold rounded-full py-4 text-[17px] transition-colors"
            >
              {placed ? t.orderPlaced : t.placeOrder}
            </button>
            <p className="mt-4 text-center text-gray-500 text-sm leading-relaxed">
              {t.encryptedNote}
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
