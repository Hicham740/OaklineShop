"use client";

export function QtyStepper({
  qty,
  onChange,
  small = false,
}: {
  qty: number;
  onChange: (q: number) => void;
  small?: boolean;
}) {
  const pad = small ? "px-2 py-1.5" : "px-3 py-2.5";
  return (
    <div
      className={`flex items-center gap-1 border border-gray-300 rounded-full ${pad}`}
    >
      <button
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, qty - 1))}
        className="w-8 h-8 flex items-center justify-center text-xl hover:text-[#0e7a5d]"
      >
        −
      </button>
      <span className="w-6 text-center font-semibold">{qty}</span>
      <button
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(99, qty + 1))}
        className="w-8 h-8 flex items-center justify-center text-xl hover:text-[#0e7a5d]"
      >
        +
      </button>
    </div>
  );
}
