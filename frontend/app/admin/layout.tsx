import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Shared layout for every page inside /admin.
 * A layout wraps all child pages, so the sidebar is written once here.
 * (See: node_modules/next/dist/docs → layouts-and-pages)
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // dir="ltr" keeps the admin panel left-to-right even when the store is in Arabic.
    <div
      dir="ltr"
      className="min-h-screen bg-[#f5f6f7] text-[#12141a] lg:grid lg:grid-cols-[264px_1fr] print:block print:bg-white"
    >
      <AdminSidebar />

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-5 lg:px-8 print:hidden">
          <p className="text-sm text-gray-500">
            Oakline <span className="mx-1.5 text-gray-300">/</span>
            <span className="font-semibold text-[#12141a]">Admin</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Demo data
            </span>
            <Link
              href="/"
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              View store ↗
            </Link>
          </div>
        </header>

        <main className="px-5 py-6 lg:px-8 lg:py-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
