/**
 * Shared loading and error states for the admin pages.
 *
 * Show a skeleton while data loads, and a retry button if the API fails.
 */

export function AdminTableSkeleton({
  rows = 5,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="animate-pulse p-5" aria-hidden="true">
      <div className="mb-5 h-9 rounded-xl bg-gray-100" />
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 border-t border-gray-100 py-4">
          {Array.from({ length: columns }).map((__, column) => (
            <div
              key={column}
              className={`h-4 rounded bg-gray-100 ${
                column === 0 ? "w-24" : column === 1 ? "w-40" : "w-20"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-500">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </span>
      <p className="mt-4 font-bold text-red-900">Something went wrong</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full bg-[#0e7a5d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b654d]"
      >
        Try again
      </button>
    </div>
  );
}

export function AdminEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="px-5 py-16 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
    </div>
  );
}
