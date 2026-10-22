"use client";

import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin";
import { STATUS_STYLES } from "./StatusBadge";

export function StatusSelect({
  value,
  onChange,
}: {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as OrderStatus)}
      aria-label={`Change order status (currently ${value})`}
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold outline-none ${STATUS_STYLES[value]}`}
    >
      {ORDER_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}
