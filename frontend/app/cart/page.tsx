"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Header } from "@/components/Header";
import { QtyStepper } from "@/components/QtyStepper";
import { ProductImage } from "@/components/ProductCard";
import { formatPrice } from "@/lib/products";
import { toDZD, formatDZDValue } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog";
import { savePlacedOrder } from "@/lib/admin-orders";
import type { AdminOrder } from "@/lib/admin";
import { useLanguage, type Strings } from "@/lib/language";

type PaymentMethod = "cod" | "cib" | "edahabia";

type CheckoutField =
  | "email"
  | "firstName"
  | "lastName"
  | "phone"
  | "address"
  | "city"
  | "postalCode";

type CheckoutForm = Record<CheckoutField, string>;
type CheckoutErrors = Partial<Record<CheckoutField, string>>;

interface PlacedOrder extends CheckoutForm {
  number: string;
  totalDZD: number;
  payment: PaymentMethod;
}

const EMPTY_FORM: CheckoutForm = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

const ALL_TOUCHED: Record<CheckoutField, boolean> = {
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  address: true,
  city: true,
  postalCode: true,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALGERIAN_PHONE_PATTERN = /^(?:\+213|00213|0)[5-7]\d{8}$/;

const baseInput =
  "w-full border rounded-2xl px-4 py-3.5 text-[15px] outline-none bg-white transition-colors";

function inputClass(invalid: boolean) {
  return `${baseInput} ${
    invalid
      ? "border-red-400 focus:border-red-500"
      : "border-gray-300 focus:border-[#0e7a5d]"
  }`;
}

function phoneForLink(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function createOrderNumber() {
  return `ORD-${Date.now().toString().slice(-6)}`;
}

function validateCheckout(form: CheckoutForm, t: Strings): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const email = form.email.trim();
  const phone = form.phone.replace(/[\s\-().]/g, "");
  const postalCode = form.postalCode.trim();

  if (!email) errors.email = t.errRequired;
  else if (!EMAIL_PATTERN.test(email)) errors.email = t.errEmail;

  if (!form.firstName.trim()) errors.firstName = t.errRequired;
  if (!form.lastName.trim()) errors.lastName = t.errRequired;

  if (!phone) errors.phone = t.errRequired;
  else if (!ALGERIAN_PHONE_PATTERN.test(phone)) errors.phone = t.errPhone;

  if (!form.address.trim()) errors.address = t.errRequired;
  if (!form.city.trim()) errors.city = t.errRequired;

  if (!postalCode) errors.postalCode = t.errRequired;
  else if (!/^\d{5}$/.test(postalCode)) errors.postalCode = t.errPostalCode;

  return errors;
}

function paymentLabel(method: PaymentMethod, t: Strings) {
  if (method === "cod") return t.payCOD;
  if (method === "cib") return t.payCIB;
  return t.payEdahabia;
}

function Field({
  label,
  error,
  required = false,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-medium text-[15px]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1.5 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

function OrderConfirmation({ order }: { order: PlacedOrder }) {
  const { t } = useLanguage();
  const nextStep =
    order.payment === "cod" ? t.nextStepsCOD : t.nextStepsCard;

  return (
    <div className="mx-auto max-w-[760px] py-12">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0e7a5d]/10 text-[#0e7a5d]">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 12 4.5 4.5L19 7" />
          </svg>
        </span>
        <h1 className="mt-5 text-[36px] font-extrabold tracking-tight">
          {t.orderConfirmed}
        </h1>
        <p className="mx-auto mt-2 max-w-[500px] text-gray-500">
          {t.orderConfirmedSub}
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <p className="text-sm text-gray-500">{t.orderNumber}</p>
            <p className="mt-0.5 text-xl font-extrabold">{order.number}</p>
          </div>
          <div className="text-end">
            <p className="text-sm text-gray-500">{t.orderTotal}</p>
            <p className="mt-0.5 text-xl font-extrabold">
              {formatDZDValue(order.totalDZD)}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-bold">{t.deliveryAddress}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {order.firstName} {order.lastName}
              <br />
              {order.address}
              <br />
              {order.city} {order.postalCode}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-bold">{t.contactDetails}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-gray-600">
              <a
                href={`tel:${phoneForLink(order.phone)}`}
                className="font-medium text-[#0e7a5d] hover:underline"
              >
                {order.phone}
              </a>
              <br />
              {order.email}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-bold">{t.paymentMethod}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {paymentLabel(order.payment, t)}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-bold">{t.nextSteps}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {nextStep}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-5 rounded-2xl bg-[#f2f3f5] px-5 py-4 text-sm text-gray-600">
        {t.demoOrderNote}
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/shop"
          className="rounded-full bg-[#0e7a5d] px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-[#0b654d]"
        >
          {t.continueShopping}
        </Link>
        <Link
          href="/"
          className="rounded-full border border-black px-6 py-3 text-center font-semibold transition-colors hover:bg-black hover:text-white"
        >
          {t.backToHome}
        </Link>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { t } = useLanguage();
  const { lines, setQty, remove, subtotal, clear } = useCart();
  const { getProductById, adjustStock } = useCatalog();

  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>(
    {},
  );
  const [order, setOrder] = useState<PlacedOrder | null>(null);

  const isCard = method !== "cod";

  const detailed = lines
    .map((line) => ({ line, product: getProductById(line.id) }))
    .filter((item) => item.product);

  const stockIssue = detailed.some(
    ({ line, product }) => line.qty > (product?.stock ?? 0),
  );

  const errors = validateCheckout(form, t);
  const isFormValid =
    detailed.length > 0 &&
    !stockIssue &&
    Object.keys(errors).length === 0;

  const setField = (field: CheckoutField, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const markTouched = (field: CheckoutField) => {
    setTouched((previous) => ({ ...previous, [field]: true }));
  };

  const errorFor = (field: CheckoutField) =>
    touched[field] ? errors[field] : undefined;

  const handlePlaceOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(ALL_TOUCHED);
    if (!isFormValid) return;

    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeLabel = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const orderLines = detailed.map(({ line, product }) => ({
      productId: line.id,
      name: product!.name,
      qty: line.qty,
      unitPriceDZD: toDZD(product!.price),
    }));

    const subtotalDZD = orderLines.reduce(
      (sum, item) => sum + item.unitPriceDZD * item.qty,
      0,
    );
    const discountDZD = promoApplied ? Math.round(subtotalDZD * 0.1) : 0;
    const totalDZD = subtotalDZD - discountDZD;
    const orderNumber = createOrderNumber();

    const placedOrder: AdminOrder = {
      id: orderNumber,
      customer: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      postalCode: form.postalCode.trim(),
      date: dateLabel,
      lines: orderLines,
      payment:
        method === "cod" ? "COD" : method === "cib" ? "CIB" : "EDAHABIA",
      status: "Pending",
      history: [{ status: "Pending", date: `${dateLabel}, ${timeLabel}` }],
      notes: "",
      discountDZD,
    };

    savePlacedOrder(placedOrder);
    adjustStock(
      orderLines.map((line) => ({ productId: line.productId, qty: line.qty })),
    );

    setOrder({
      ...form,
      number: orderNumber,
      totalDZD,
      payment: method,
    });
    clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Header minimal />
      <main className="mx-auto max-w-[1200px] px-5 w-full pb-20">
        {order ? (
          <OrderConfirmation order={order} />
        ) : (
          <>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-gray-600 mt-7 hover:text-black"
            >
              <span className="rtl:rotate-180">‹</span> {t.continueShopping}
            </Link>
            <h1 className="mt-3 text-[44px] font-extrabold tracking-tight">
              {t.yourCart}
            </h1>

            {detailed.length === 0 ? (
              <div className="mt-6 border-y border-gray-100 py-16 text-center">
                <p className="text-lg font-semibold">{t.emptyCart}</p>
                <Link
                  href="/shop"
                  className="inline-block mt-4 bg-[#0e7a5d] text-white font-semibold rounded-full px-6 py-3"
                >
                  {t.shopCollection}
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid lg:grid-cols-[1fr_380px] gap-10 items-start">
                <form
                  id="checkout-form"
                  onSubmit={handlePlaceOrder}
                  noValidate
                >
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
                              onChange={(qty) => setQty(line.id, qty)}
                              max={Math.max(1, product!.stock)}
                            />
                            <button
                              type="button"
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

                  <h2 className="mt-12 text-[26px] font-extrabold tracking-tight">
                    {t.shippingDetails}
                  </h2>
                  <div className="mt-5 space-y-5">
                    <Field
                      label={t.email}
                      required
                      error={errorFor("email")}
                    >
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(event) =>
                          setField("email", event.target.value)
                        }
                        onBlur={() => markTouched("email")}
                        placeholder="you@example.com"
                        dir="ltr"
                        aria-invalid={Boolean(errorFor("email"))}
                        className={inputClass(Boolean(errorFor("email")))}
                      />
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <Field
                        label={t.firstName}
                        required
                        error={errorFor("firstName")}
                      >
                        <input
                          name="firstName"
                          autoComplete="given-name"
                          value={form.firstName}
                          onChange={(event) =>
                            setField("firstName", event.target.value)
                          }
                          onBlur={() => markTouched("firstName")}
                          aria-invalid={Boolean(errorFor("firstName"))}
                          className={inputClass(Boolean(errorFor("firstName")))}
                        />
                      </Field>
                      <Field
                        label={t.lastName}
                        required
                        error={errorFor("lastName")}
                      >
                        <input
                          name="lastName"
                          autoComplete="family-name"
                          value={form.lastName}
                          onChange={(event) =>
                            setField("lastName", event.target.value)
                          }
                          onBlur={() => markTouched("lastName")}
                          aria-invalid={Boolean(errorFor("lastName"))}
                          className={inputClass(Boolean(errorFor("lastName")))}
                        />
                      </Field>
                    </div>

                    <Field
                      label={t.phone}
                      required
                      error={errorFor("phone")}
                    >
                      <input
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(event) =>
                          setField("phone", event.target.value)
                        }
                        onBlur={() => markTouched("phone")}
                        placeholder="0550 12 34 56"
                        inputMode="tel"
                        dir="ltr"
                        aria-invalid={Boolean(errorFor("phone"))}
                        className={inputClass(Boolean(errorFor("phone")))}
                      />
                    </Field>

                    <Field
                      label={t.address}
                      required
                      error={errorFor("address")}
                    >
                      <input
                        name="address"
                        autoComplete="street-address"
                        value={form.address}
                        onChange={(event) =>
                          setField("address", event.target.value)
                        }
                        onBlur={() => markTouched("address")}
                        aria-invalid={Boolean(errorFor("address"))}
                        className={inputClass(Boolean(errorFor("address")))}
                      />
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <Field
                        label={t.city}
                        required
                        error={errorFor("city")}
                      >
                        <input
                          name="city"
                          autoComplete="address-level2"
                          value={form.city}
                          onChange={(event) =>
                            setField("city", event.target.value)
                          }
                          onBlur={() => markTouched("city")}
                          aria-invalid={Boolean(errorFor("city"))}
                          className={inputClass(Boolean(errorFor("city")))}
                        />
                      </Field>
                      <Field
                        label={t.postalCode}
                        required
                        error={errorFor("postalCode")}
                      >
                        <input
                          name="postalCode"
                          autoComplete="postal-code"
                          value={form.postalCode}
                          onChange={(event) =>
                            setField("postalCode", event.target.value)
                          }
                          onBlur={() => markTouched("postalCode")}
                          placeholder="16000"
                          inputMode="numeric"
                          aria-invalid={Boolean(errorFor("postalCode"))}
                          className={inputClass(
                            Boolean(errorFor("postalCode")),
                          )}
                        />
                      </Field>
                    </div>
                  </div>

                  <h2 className="mt-12 text-[26px] font-extrabold tracking-tight">
                    {t.payment}
                  </h2>
                  <p className="mt-2 font-semibold text-[15px]">
                    {t.paymentMethod}
                  </p>
                  <div
                    className="mt-3 grid sm:grid-cols-3 gap-3"
                    role="radiogroup"
                    aria-label={t.paymentMethod}
                  >
                    {(
                      [
                        { value: "cod", title: t.payCOD, sub: t.payCODSub },
                        { value: "cib", title: t.payCIB, sub: t.payCardSub },
                        {
                          value: "edahabia",
                          title: t.payEdahabia,
                          sub: t.payCardSub,
                        },
                      ] as const
                    ).map((option) => {
                      const selected = method === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setMethod(option.value)}
                          className={`rounded-2xl border-2 p-4 text-start transition-colors ${
                            selected
                              ? "border-[#0e7a5d] bg-[#0e7a5d]/5"
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <span className="font-bold text-[15px]">
                            {option.title}
                          </span>
                          <span className="block text-gray-500 text-[13px] mt-1">
                            {option.sub}
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
                          <input
                            placeholder="0000 0000 0000 0000"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            dir="ltr"
                            className={inputClass(false)}
                          />
                        </Field>
                        <div className="grid sm:grid-cols-2 gap-5">
                          <Field label={t.expiry}>
                            <input
                              placeholder="MM / YY"
                              autoComplete="cc-exp"
                              dir="ltr"
                              className={inputClass(false)}
                            />
                          </Field>
                          <Field label={t.securityCode}>
                            <input
                              placeholder="CVC"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              dir="ltr"
                              className={inputClass(false)}
                            />
                          </Field>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">{t.codNote}</p>
                  )}
                </form>

                <aside className="bg-[#f2f3f5] rounded-3xl p-7 lg:sticky lg:top-24">
                  <h2 className="text-[24px] font-extrabold tracking-tight">
                    {t.orderSummary}
                  </h2>
                  <form
                    className="mt-5 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (promo.trim()) setPromoApplied(true);
                    }}
                  >
                    <input
                      value={promo}
                      onChange={(event) => setPromo(event.target.value)}
                      placeholder={t.promoCode}
                      className="flex-1 min-w-0 bg-white border border-gray-300 rounded-full px-5 py-2.5 outline-none"
                    />
                    <button
                      type="submit"
                      className="border border-black rounded-full px-6 font-semibold hover:bg-black hover:text-white transition-colors"
                    >
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
                      <dd className="font-medium">
                        {formatDZDValue(toDZD(subtotal))}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">{t.shipping}</dt>
                      <dd className="font-medium text-right">
                        {t.shippingCalc}
                      </dd>
                    </div>
                  </dl>
                  <div className="border-t border-gray-300 mt-5 pt-5 flex items-center justify-between">
                    <span className="font-bold text-[18px]">
                      {t.estimatedTotal}
                    </span>
                    <span className="font-extrabold text-[28px]">
                      {formatDZDValue(
                        toDZD(promoApplied ? subtotal * 0.9 : subtotal),
                      )}
                    </span>
                  </div>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={!isFormValid}
                    className="mt-5 w-full bg-[#0e7a5d] hover:bg-[#0b654d] text-white font-bold rounded-full py-4 text-[17px] transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
                  >
                    {t.placeOrder}
                  </button>
                  {stockIssue ? (
                    <p className="mt-3 text-center text-sm text-red-600">
                      {t.stockIssue}
                    </p>
                  ) : (
                    !isFormValid && (
                      <p className="mt-3 text-center text-sm text-gray-500">
                        {t.completeFields}
                      </p>
                    )
                  )}
                  <p className="mt-4 text-center text-gray-500 text-sm leading-relaxed">
                    {t.encryptedNote}
                  </p>
                </aside>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
