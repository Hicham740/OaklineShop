"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { formatDZDValue } from "@/lib/currency";
import { orderItemCount, orderTotal } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { useMyOrders } from "@/lib/account-orders";
import { useLanguage } from "@/lib/language";

function OrdersLoading() {
  const { t } = useLanguage();
  return (
    <div role="status" className="mt-8 space-y-4">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-3xl border border-gray-100 p-6 sm:p-7"
        >
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="mt-3 h-6 w-52 rounded bg-gray-200" />
          <div className="mt-6 h-4 w-40 rounded bg-gray-100" />
        </div>
      ))}
      <span className="sr-only">{t.loading}</span>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { orders, loading, error, reload } = useMyOrders();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const firstName = user?.firstName ?? user?.name?.split(" ")[0] ?? "";

  return (
    <>
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1000px] flex-1 px-5 pb-20"
      >
        <div className="mt-10 flex flex-col gap-5 border-b border-gray-100 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.12em] text-[#0e7a5d]">
              {t.myAccount}
            </p>
            <h1 className="mt-2 text-[38px] font-extrabold tracking-tight sm:text-[44px]">
              {firstName ? `${t.accountOrders}, ${firstName}` : t.accountOrders}
            </h1>
            <p className="mt-2 max-w-[520px] text-gray-500">
              {t.accountOrdersSub}
            </p>
            {user && (
              <p className="mt-2 text-sm text-gray-500">
                {t.signedInAs(user.name)} · {user.email}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-3">
            <Link
              href="/shop"
              className="rounded-full border border-black px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-black hover:text-white"
            >
              {t.continueShopping}
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="rounded-full bg-[#f2f3f5] px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-200 disabled:opacity-60"
            >
              {loggingOut ? t.loading : t.signOut}
            </button>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-3 rounded-full bg-red-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-800"
            >
              {t.retry}
            </button>
          </div>
        ) : loading ? (
          <OrdersLoading />
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-gray-300 px-6 py-16 text-center">
            <p className="text-lg font-bold">{t.noOrders}</p>
            <p className="mx-auto mt-2 max-w-[420px] text-sm text-gray-500">
              {t.noOrdersSub}
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block rounded-full bg-[#0e7a5d] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0b654d]"
            >
              {t.startShopping}
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((order) => {
              const count = orderItemCount(order);
              return (
                <li key={order.id}>
                  <article className="rounded-3xl border border-gray-200 p-6 transition-shadow hover:shadow-[0_12px_30px_rgba(20,23,29,0.07)] sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          {t.orderNumber}
                        </p>
                        <h2 className="mt-0.5 text-xl font-extrabold tracking-tight">
                          {order.id}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          {t.placedOn} {order.date}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-gray-100 pt-5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {t.itemCount(count)}
                        </p>
                        <p className="mt-1 line-clamp-2 max-w-[540px] text-sm text-gray-500">
                          {order.lines.map((line) => line.name).join(", ")}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-sm text-gray-500">{t.orderTotal}</p>
                        <p className="text-lg font-extrabold">
                          {formatDZDValue(orderTotal(order))}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/account/orders/${encodeURIComponent(order.id)}`}
                      className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#0e7a5d]/10 px-4 py-2 text-sm font-semibold text-[#0e7a5d] transition-colors hover:bg-[#0e7a5d] hover:text-white"
                    >
                      {t.trackOrder}
                      <span aria-hidden="true" className="rtl:rotate-180">
                        →
                      </span>
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer full={false} />
    </>
  );
}
