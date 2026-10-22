"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusSelect } from "@/components/admin/StatusSelect";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminTableSkeleton,
} from "@/components/admin/DataState";
import {
  ORDER_STATUSES,
  orderItemCount,
  orderTotal,
  type OrderStatus,
} from "@/lib/admin";
import { useAdminOrders } from "@/lib/admin-orders";
import { formatDZDValue } from "@/lib/currency";

export default function AdminOrdersPage() {
  const { orders, setOrderStatus, loading, error, reload } = useAdminOrders();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === "All" || order.status === status;
      const matchesQuery =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.email.toLowerCase().includes(q) ||
        order.phone.includes(q) ||
        order.city.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, status]);

  const total = filtered.reduce((sum, order) => sum + orderTotal(order), 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight">
            Orders
          </h1>
          <p className="mt-1 text-[15px] text-gray-500">
            Contact customers, open an order and update its status.
          </p>
        </div>
        <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-600">
          {filtered.length} of {orders.length} orders
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white">
        {error ? (
          <div className="p-5">
            <AdminErrorState message={error} onRetry={reload} />
          </div>
        ) : loading ? (
          <AdminTableSkeleton rows={6} columns={8} />
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-full bg-[#f2f3f5] px-4 py-2.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="shrink-0 text-gray-500"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by order, customer, phone or city"
                  aria-label="Search orders"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus("All")}
                  aria-pressed={status === "All"}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    status === "All"
                      ? "bg-[#14171d] text-white"
                      : "border border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  All
                </button>
                {ORDER_STATUSES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    aria-pressed={status === option}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                      status === option
                        ? "bg-[#14171d] text-white"
                        : "border border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th scope="col" className="px-5 py-3">Order</th>
                    <th scope="col" className="px-5 py-3">Customer</th>
                    <th scope="col" className="px-5 py-3">Phone</th>
                    <th scope="col" className="px-5 py-3">Date</th>
                    <th scope="col" className="px-5 py-3">Payment</th>
                    <th scope="col" className="px-5 py-3">Items</th>
                    <th scope="col" className="px-5 py-3">Total</th>
                    <th scope="col" className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                    >
                      <td className="px-5 py-4 font-semibold">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-[#0e7a5d] hover:underline"
                        >
                          {order.id}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium">{order.customer}</div>
                        <div className="text-xs text-gray-500">
                          {order.city} · {order.email}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <a
                          href={`tel:${order.phone.replace(/\s/g, "")}`}
                          className="font-medium text-[#0e7a5d] hover:underline"
                        >
                          {order.phone}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {order.date}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {order.payment}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {orderItemCount(order)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold">
                        {formatDZDValue(orderTotal(order))}
                      </td>
                      <td className="px-5 py-4">
                        <StatusSelect
                          value={order.status}
                          onChange={(nextStatus) =>
                            setOrderStatus(order.id, nextStatus)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-gray-200 bg-gray-50/70">
                      <td
                        colSpan={6}
                        className="px-5 py-3.5 text-sm font-semibold"
                      >
                        Total for visible orders
                      </td>
                      <td className="px-5 py-3.5 font-bold">
                        {formatDZDValue(total)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {filtered.length === 0 && (
              <AdminEmptyState
                title="No orders found"
                message="Try another search or choose a different status."
              />
            )}
          </>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Status changes, history and internal notes are saved in PostgreSQL
        through the API. Open an order to edit its notes.
      </p>
    </div>
  );
}
