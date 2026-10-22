"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { AdminErrorState } from "@/components/admin/DataState";
import { useAdminOrders } from "@/lib/admin-orders";
import {
  orderSubtotal,
  orderTotal,
  type AdminOrder,
  type PaymentMethod,
} from "@/lib/admin";
import { formatDZDValue } from "@/lib/currency";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  COD: "Cash on delivery",
  CIB: "CIB card",
  EDAHABIA: "Edahabia card",
};

function exportOrder(order: AdminOrder) {
  const data = {
    ...order,
    subtotalDZD: orderSubtotal(order),
    totalDZD: orderTotal(order),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function OrderDetails({ id }: { id: string }) {
  const { orders, loading, error, reload, setOrderStatus, setOrderNotes } =
    useAdminOrders();
  const order = orders.find((item) => item.id === id);
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [saved, setSaved] = useState(false);

  // Load the note when the order changes. We intentionally do not react to
  // every note update, so typing is not overwritten by a status change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotes(order?.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  if (error) {
    return <AdminErrorState message={error} onRetry={reload} />;
  }

  if (loading && !order) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="h-10 w-64 rounded bg-gray-200" />
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="h-96 rounded-2xl bg-gray-100" />
          <div className="h-80 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
        <p className="text-lg font-bold">Order not found</p>
        <p className="mt-1 text-sm text-gray-500">
          This order may not exist in this browser.
        </p>
        <Link
          href="/admin/orders"
          className="mt-5 inline-block rounded-full bg-[#0e7a5d] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const subtotal = orderSubtotal(order);
  const discount = order.discountDZD ?? 0;
  const total = orderTotal(order);

  const saveNotes = () => {
    setOrderNotes(order.id, notes);
    setSaved(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-black"
        >
          <span aria-hidden="true">←</span> Back to orders
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold transition-colors hover:border-black"
          >
            Print order
          </button>
          <button
            type="button"
            onClick={() => exportOrder(order)}
            className="rounded-full bg-[#14171d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Order details</p>
          <h1 className="mt-0.5 text-[32px] font-extrabold leading-tight tracking-tight">
            {order.id}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Placed on {order.date} · {PAYMENT_LABELS[order.payment]}
          </p>
        </div>
        <div className="print:hidden">
          <StatusSelect
            value={order.status}
            onChange={(nextStatus) => setOrderStatus(order.id, nextStatus)}
          />
        </div>
        <div className="hidden print:block">
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="mt-6 grid items-start gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {/* Items */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-bold">Items</h2>
              <p className="text-sm text-gray-500">
                {order.lines.reduce((sum, line) => sum + line.qty, 0)} item(s)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Qty</th>
                    <th className="px-5 py-3">Unit price</th>
                    <th className="px-5 py-3 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((line) => (
                    <tr
                      key={line.productId}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-5 py-3.5 font-medium">{line.name}</td>
                      <td className="px-5 py-3.5 text-gray-600">{line.qty}</td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {formatDZDValue(line.unitPriceDZD)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold">
                        {formatDZDValue(line.unitPriceDZD * line.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <dl className="ms-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Subtotal</dt>
                  <dd className="font-medium">{formatDZDValue(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#0e7a5d]">
                    <dt>Discount</dt>
                    <dd className="font-medium">
                      −{formatDZDValue(discount)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base">
                  <dt className="font-bold">Total</dt>
                  <dd className="font-extrabold">{formatDZDValue(total)}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Internal notes */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold">Internal notes</h2>
            <p className="mt-1 text-sm text-gray-500">
              Only visible in the admin panel.
            </p>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Add a note for your team…"
              className="mt-3 w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-[#0e7a5d]"
            />
            <div className="mt-3 flex items-center gap-3 print:hidden">
              <button
                type="button"
                onClick={saveNotes}
                className="rounded-full bg-[#0e7a5d] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0b654d]"
              >
                Save notes
              </button>
              {saved && (
                <span className="text-sm font-medium text-[#0e7a5d]">
                  Saved
                </span>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          {/* Customer */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold">Customer</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </dt>
                <dd className="mt-0.5 font-medium">{order.customer}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phone
                </dt>
                <dd className="mt-0.5">
                  <a
                    href={`tel:${order.phone.replace(/\s/g, "")}`}
                    className="font-medium text-[#0e7a5d] hover:underline"
                  >
                    {order.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </dt>
                <dd className="mt-0.5 break-all">
                  <a
                    href={`mailto:${order.email}`}
                    className="font-medium text-[#0e7a5d] hover:underline"
                  >
                    {order.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Delivery address
                </dt>
                <dd className="mt-0.5 leading-relaxed text-gray-700">
                  {order.address}
                  <br />
                  {order.city} {order.postalCode}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Payment
                </dt>
                <dd className="mt-0.5">{PAYMENT_LABELS[order.payment]}</dd>
              </div>
            </dl>
          </section>

          {/* Status history */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold">Status history</h2>
            <ol className="mt-4 space-y-4">
              {order.history.map((entry, index) => (
                <li key={`${entry.status}-${entry.date}-${index}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={entry.status} />
                    <span className="text-xs text-gray-500">{entry.date}</span>
                  </div>
                  {entry.note && (
                    <p className="mt-1.5 text-sm text-gray-600">
                      {entry.note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
