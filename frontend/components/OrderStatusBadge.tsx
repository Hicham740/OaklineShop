"use client";

import type { OrderStatus } from "@/lib/admin";
import { useLanguage, type Strings } from "@/lib/language";

const STYLES: Record<OrderStatus, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Shipped: "border-blue-200 bg-blue-50 text-blue-700",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
};

const DOTS: Record<OrderStatus, string> = {
  Pending: "bg-amber-500",
  Shipped: "bg-blue-500",
  Delivered: "bg-emerald-500",
  Cancelled: "bg-red-500",
};

export function orderStatusLabel(status: OrderStatus, t: Strings): string {
  if (status === "Pending") return t.statusPending;
  if (status === "Shipped") return t.statusShipped;
  if (status === "Delivered") return t.statusDelivered;
  return t.statusCancelled;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status]}`} />
      {orderStatusLabel(status, t)}
    </span>
  );
}
