"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  OrderStatusBadge,
  orderStatusLabel,
} from "@/components/OrderStatusBadge";
import {
  accountErrorMessage,
  fetchMyOrder,
} from "@/lib/account-orders";
import {
  orderSubtotal,
  orderTotal,
  type AdminOrder,
  type OrderStatus,
} from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { formatDZDValue } from "@/lib/currency";
import { useLanguage } from "@/lib/language";

const TRACKING_STEPS: OrderStatus[] = ["Pending", "Shipped", "Delivered"];

function TrackingProgress({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();
  const currentIndex = TRACKING_STEPS.indexOf(status);

  return (
    <ol
      aria-label={t.orderTimeline}
      className="grid grid-cols-3 gap-2 rounded-2xl bg-[#f7f8f9] p-5"
    >
      {TRACKING_STEPS.map((step, index) => {
        const complete = currentIndex >= index;
        const current = currentIndex === index;
        return (
          <li
            key={step}
            aria-current={current ? "step" : undefined}
            className="min-w-0"
          >
            <div className="flex items-center">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  complete
                    ? "bg-[#0e7a5d] text-white"
                    : "border-2 border-gray-300 bg-white text-gray-400"
                }`}
              >
                {complete ? (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4.5 4.5L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              {index < TRACKING_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mx-2 h-1 min-w-3 flex-1 rounded-full ${
                    currentIndex > index ? "bg-[#0e7a5d]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <p
              className={`mt-2 text-xs font-semibold ${
                complete ? "text-[#0e7a5d]" : "text-gray-400"
              }`}
            >
              {orderStatusLabel(step, t)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function OrderTimeline({ order }: { order: AdminOrder }) {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="timeline-heading" className="mt-8">
      <h2 id="timeline-heading" className="text-xl font-extrabold tracking-tight">
        {t.orderTimeline}
      </h2>
      <ol className="mt-4 space-y-0">
        {order.history.map((entry, index) => (
          <li key={`${entry.status}-${entry.date}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#0e7a5d]" />
              {index < order.history.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-gray-200" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 pb-1">
              <p className="font-semibold">{orderStatusLabel(entry.status, t)}</p>
              <p className="mt-0.5 text-sm text-gray-500">{entry.date}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-bold">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-600">
        {value}
      </dd>
    </div>
  );
}

export function OrderTracking({ id }: { id: string }) {
  const { t } = useLanguage();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await fetchMyOrder(id);
      setOrder(data);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        setNotFound(true);
      } else {
        setError(accountErrorMessage(caught));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const paymentLabel =
    order?.payment === "COD"
      ? t.payCOD
      : order?.payment === "CIB"
        ? t.payCIB
        : t.payEdahabia;

  return (
    <>
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1000px] flex-1 px-5 pb-20"
      >
        <Link
          href="/account"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black"
        >
          <span aria-hidden="true" className="rtl:rotate-180">
            ←
          </span>
          {t.backToOrders}
        </Link>

        {loading ? (
          <div role="status" className="mt-6 space-y-5">
            <div className="h-8 w-52 animate-pulse rounded bg-gray-200" />
            <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-64 animate-pulse rounded-3xl bg-gray-100" />
            <span className="sr-only">{t.loading}</span>
          </div>
        ) : notFound ? (
          <div className="mt-16 rounded-3xl border border-dashed border-gray-300 px-6 py-16 text-center">
            <p className="text-xl font-extrabold">{t.orderNotFound}</p>
            <p className="mx-auto mt-2 max-w-[420px] text-sm text-gray-500">
              {t.orderNotFoundSub}
            </p>
            <Link
              href="/account"
              className="mt-6 inline-block rounded-full bg-[#0e7a5d] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0b654d]"
            >
              {t.backToOrders}
            </Link>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 rounded-full bg-red-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-800"
            >
              {t.retry}
            </button>
          </div>
        ) : order ? (
          <>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-8">
              <div>
                <p className="text-sm text-gray-500">{t.orderDetails}</p>
                <h1 className="mt-1 text-[38px] font-extrabold tracking-tight sm:text-[44px]">
                  {order.id}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {t.placedOn} {order.date}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            {order.status === "Cancelled" ? (
              <p
                role="status"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
              >
                {t.cancelledNotice}
              </p>
            ) : (
              <div className="mt-6">
                <TrackingProgress status={order.status} />
              </div>
            )}

            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
              <div>
                <section aria-labelledby="items-heading">
                  <h2
                    id="items-heading"
                    className="text-xl font-extrabold tracking-tight"
                  >
                    {t.items}
                  </h2>
                  <ul className="mt-4 divide-y divide-gray-100 border-y border-gray-100">
                    {order.lines.map((line, index) => (
                      <li
                        key={`${line.productId}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-4"
                      >
                        <div>
                          <p className="font-semibold">{line.name}</p>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {t.quantity}: {line.qty} ·{" "}
                            {formatDZDValue(line.unitPriceDZD)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatDZDValue(line.unitPriceDZD * line.qty)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>

                <OrderTimeline order={order} />
              </div>

              <aside className="rounded-3xl bg-[#f2f3f5] p-6">
                <h2 className="text-xl font-extrabold tracking-tight">
                  {t.orderSummary}
                </h2>
                <dl className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">{t.subtotal}</dt>
                    <dd className="font-medium">
                      {formatDZDValue(orderSubtotal(order))}
                    </dd>
                  </div>
                  {(order.discountDZD ?? 0) > 0 && (
                    <div className="flex justify-between gap-4 text-[#0e7a5d]">
                      <dt>{t.discount}</dt>
                      <dd className="font-medium">
                        −{formatDZDValue(order.discountDZD ?? 0)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 border-t border-gray-300 pt-3">
                    <dt className="font-bold">{t.orderTotal}</dt>
                    <dd className="font-extrabold">
                      {formatDZDValue(orderTotal(order))}
                    </dd>
                  </div>
                </dl>

                <dl className="mt-6 space-y-4 border-t border-gray-300 pt-5">
                  <DetailRow
                    label={t.deliveryAddress}
                    value={`${order.customer}\n${order.address}\n${order.city} ${order.postalCode}`}
                  />
                  <DetailRow
                    label={t.contactDetails}
                    value={`${order.phone}\n${order.email}`}
                  />
                  <DetailRow label={t.paymentMethod} value={paymentLabel} />
                </dl>
              </aside>
            </div>
          </>
        ) : null}
      </main>
      <Footer full={false} />
    </>
  );
}
