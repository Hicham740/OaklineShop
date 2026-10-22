"use client";

import Link from "next/link";
import { ProductImage } from "@/components/ProductCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  ORDER_STATUSES,
  REVENUE_BY_MONTH,
  TOP_PRODUCTS,
  orderTotal,
} from "@/lib/admin";
import { useAdminOrders } from "@/lib/admin-orders";
import { useCatalog } from "@/lib/catalog";
import { formatDZDValue } from "@/lib/currency";

function StatIcon({ name }: { name: "wallet" | "bag" | "clock" | "box" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "wallet" && (
        <>
          <rect x="3" y="6" width="18" height="13" rx="3" />
          <path d="M3 10h18M16 14h2" />
        </>
      )}
      {name === "bag" && (
        <>
          <path d="M6 8h12l1 12H5L6 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )}
      {name === "box" && (
        <>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        </>
      )}
    </svg>
  );
}

const STATUS_BARS = {
  Pending: "bg-amber-500",
  Shipped: "bg-blue-500",
  Delivered: "bg-emerald-500",
  Cancelled: "bg-red-500",
} as const;

export default function AdminDashboardPage() {
  const { orders } = useAdminOrders();
  const { products, getProductById } = useCatalog();
  const customProducts = products.filter((product) => product.custom);

  const maxRevenue = Math.max(...REVENUE_BY_MONTH.map((m) => m.value));
  const maxSold = Math.max(...TOP_PRODUCTS.map((p) => p.sold));

  const revenue = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + orderTotal(order), 0);
  const pending = orders.filter((order) => order.status === "Pending").length;
  const customers = new Set(orders.map((order) => order.email)).size;

  const statusCounts = ORDER_STATUSES.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));

  const stats = [
    {
      label: "Revenue",
      value: formatDZDValue(revenue),
      hint: "Excluding cancelled orders",
      icon: "wallet",
      accent: "text-[#0e7a5d] bg-[#0e7a5d]/10",
    },
    {
      label: "Orders",
      value: orders.length.toString(),
      hint: `${customers} customers this month`,
      icon: "bag",
      accent: "text-blue-600 bg-blue-50",
    },
    {
      label: "Pending",
      value: pending.toString(),
      hint: "Waiting to be shipped",
      icon: "clock",
      accent: "text-amber-600 bg-amber-50",
    },
    {
      label: "Products",
      value: products.length.toString(),
      hint: customProducts.length
        ? `${customProducts.length} added from admin`
        : "All products from demo data",
      icon: "box",
      accent: "text-violet-600 bg-violet-50",
    },
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-[15px] text-gray-500">
            Welcome back. Here is how Oakline is doing this month.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="rounded-full bg-[#0e7a5d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b654d]"
        >
          View all orders
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${stat.accent}`}
              >
                <StatIcon name={stat.icon} />
              </span>
            </div>
            <p className="mt-3 text-[28px] font-extrabold leading-none tracking-tight">
              {stat.value}
            </p>
            <p className="mt-2 text-xs text-gray-500">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {/* Revenue chart */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 xl:col-span-2 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Revenue</h2>
              <p className="text-sm text-gray-500">Last 6 months</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              +12.7% vs September
            </span>
          </div>

          <div className="mt-6 flex h-52 items-end gap-2 sm:gap-4">
            {REVENUE_BY_MONTH.map((month, index) => (
              <div
                key={month.month}
                className="flex h-full flex-1 flex-col justify-end"
              >
                <div className="flex flex-1 items-end">
                  <div
                    title={formatDZDValue(month.value)}
                    className={`w-full rounded-t-lg transition-colors ${
                      index === REVENUE_BY_MONTH.length - 1
                        ? "bg-[#0e7a5d]"
                        : "bg-[#0e7a5d]/20 hover:bg-[#0e7a5d]/35"
                    }`}
                    style={{ height: `${(month.value / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="mt-2 text-center text-xs font-medium text-gray-500">
                  {month.month}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Order status */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
          <h2 className="text-lg font-bold">Order status</h2>
          <p className="text-sm text-gray-500">
            {orders.length} orders this month
          </p>

          <div className="mt-6 space-y-5">
            {statusCounts.map(({ status, count }) => {
              const percent = orders.length
                ? Math.round((count / orders.length) * 100)
                : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{status}</span>
                    <span className="text-gray-500">
                      {count} · {percent}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${STATUS_BARS[status]}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {/* Recent orders */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white xl:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 lg:px-6">
            <div>
              <h2 className="text-lg font-bold">Recent orders</h2>
              <p className="text-sm text-gray-500">The latest activity in your store</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-[#0e7a5d] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 lg:px-6">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-3.5 font-semibold lg:px-6">
                      {order.id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{order.customer}</div>
                      <div className="text-xs text-gray-500">
                        {order.city} · {order.date}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <a
                        href={`tel:${order.phone.replace(/\s/g, "")}`}
                        className="font-medium text-[#0e7a5d] hover:underline"
                      >
                        {order.phone}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium">
                      {formatDZDValue(orderTotal(order))}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top products */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
          <h2 className="text-lg font-bold">Top products</h2>
          <p className="text-sm text-gray-500">Best sellers this month</p>

          <ul className="mt-5 space-y-4">
            {TOP_PRODUCTS.map((entry) => {
              const product = getProductById(entry.id);
              if (!product) return null;
              return (
                <li key={entry.id} className="flex items-center gap-3">
                  <ProductImage
                    tint={product.tint}
                    image={product.image}
                    alt={product.name}
                    className="h-12 w-10 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <span className="shrink-0 text-xs text-gray-500">
                        {entry.sold} sold
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#0e7a5d]"
                        style={{ width: `${(entry.sold / maxSold) * 100}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <p className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
        <span className="font-semibold text-[#12141a]">Backend not connected.</span>{" "}
        Demo data lives in{" "}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">lib/admin.ts</code>.
        New products and order status changes are saved in this browser for now.
      </p>
    </div>
  );
}
