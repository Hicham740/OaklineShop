"use client";

import { useLanguage } from "@/lib/language";

export function QtyStepper({
  qty,
  onChange,
  small = false,
  max = 99,
  label,
}: {
  qty: number;
  onChange: (q: number) => void;
  small?: boolean;
  max?: number;
  label?: string;
}) {
  const { t } = useLanguage();
  const pad = small ? "px-2 py-1.5" : "px-3 py-2.5";
  const groupLabel = label ?? t.quantity;

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className={`flex items-center gap-1 border border-gray-300 rounded-full ${pad}`}
    >
      <button
        type="button"
        aria-label={t.decreaseQuantity}
        disabled={qty <= 1}
        onClick={() => onChange(Math.max(1, qty - 1))}
        className="w-8 h-8 flex items-center justify-center text-xl hover:text-[#0e7a5d] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-current"
      >
        <span aria-hidden="true">−</span>
      </button>
      <span
        className="w-6 text-center font-semibold"
        aria-live="polite"
        aria-atomic="true"
      >
        {qty}
      </span>
      <button
        type="button"
        aria-label={t.increaseQuantity}
        disabled={qty >= max}
        onClick={() => onChange(Math.min(max, qty + 1))}
        className="w-8 h-8 flex items-center justify-center text-xl hover:text-[#0e7a5d] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-current"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
