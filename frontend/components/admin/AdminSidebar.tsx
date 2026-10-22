"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/orders", label: "Orders", icon: "bag" },
  { href: "/admin/products", label: "Products", icon: "box" },
] as const;

function NavIcon({ name }: { name: "grid" | "bag" | "box" }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "grid" && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
      )}
      {name === "bag" && (
        <>
          <path d="M6 8h12l1 12H5L6 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
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

export function AdminSidebar() {
  const pathname = usePathname();

  // "/admin" should only be active on the dashboard. Sub-pages use startsWith.
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen flex-col bg-[#14171d] text-white print:hidden">
        <Link href="/admin" className="flex items-center gap-2.5 px-6 h-[72px]">
          <Logo size={30} />
          <span className="text-xl font-extrabold tracking-tight">Oakline</span>
          <span className="ms-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">
            Admin
          </span>
        </Link>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className={active ? "text-[#3fbf99]" : ""}>
                  <NavIcon name={item.icon} />
                </span>
                {item.label}
                {active && (
                  <span className="ms-auto h-1.5 w-1.5 rounded-full bg-[#3fbf99]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0e7a5d] text-sm font-bold">
              GA
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Guest admin</p>
              <p className="text-[11px] text-white/50">No login required yet</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            View storefront <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#14171d] text-white print:hidden">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-lg font-extrabold">Oakline</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">
              Admin
            </span>
          </Link>
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            Store ↗
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                  active
                    ? "bg-white text-[#14171d]"
                    : "bg-white/10 text-white/70"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
