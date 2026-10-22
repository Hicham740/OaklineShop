/**
 * Loading and error feedback used by the public storefront.
 * These become useful as soon as products come from a real API.
 */

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading products"
      aria-busy="true"
      className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[3/3.6] rounded-2xl bg-gray-100" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="h-4 w-2/3 rounded bg-gray-100" />
            <div className="h-4 w-14 rounded bg-gray-100" />
          </div>
          <div className="mt-2 h-3 w-20 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export function StorefrontError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <p className="text-lg font-bold text-red-900">
        We could not load the products
      </p>
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
