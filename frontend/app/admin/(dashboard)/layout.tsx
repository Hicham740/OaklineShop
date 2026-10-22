import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Authentication must finish before the dashboard shell is sent. Waiting for
// the session here also lets `redirect()` return a real 307 instead of a
// client-side redirect embedded in a streamed 200 response.
export const instant = false;

/**
 * Protected admin layout.
 *
 * The shared login page lives outside this route group (app/login), so the
 * sidebar is never rendered before authentication. Every dashboard request
 * forwards the session cookie to the Express API and asks "who am I?". If the
 * API rejects the session, we redirect to the shared login page with /admin as
 * the return path.
 *
 * This segment opts out of instant navigation (`instant = false`) because a
 * protected dashboard should not expose a static shell before the session is
 * known. The request blocks until the session check finishes.
 */

interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "customer";
}

const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000"
).replace(/\/$/, "");

async function getSignedInUser(): Promise<AuthUser | null> {
  // Keep `cookies()` outside the try/catch. During prerendering Next uses a
  // special rejection to pause this component until request time; catching it
  // would turn that signal into a normal "not signed in" result.
  const cookieStore = await cookies();

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { user?: AuthUser };
    return data.user ?? null;
  } catch (error) {
    // During partial prerendering, `fetch(..., { cache: "no-store" })` throws
    // an internal Next.js signal that must reach the framework. Without this,
    // the logs report a swallowed HANGING_PROMISE_REJECTION.
    unstable_rethrow(error);

    // The API may be down while the Next server is running. Treat this as
    // "not signed in" so the visitor sees the login page instead of a crash.
    console.error("[admin] session check failed", error);
    return null;
  }
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await getSignedInUser();
  if (!admin) redirect("/login?next=/admin");
  if (admin.role !== "admin") redirect("/account");

  return (
    <div
      dir="ltr"
      className="min-h-screen bg-[#f5f6f7] text-[#12141a] lg:grid lg:grid-cols-[264px_1fr] print:block print:bg-white"
    >
      <AdminSidebar admin={admin} />

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-5 lg:px-8 print:hidden">
          <p className="text-sm text-gray-500">
            Oakline <span className="mx-1.5 text-gray-300">/</span>
            <span className="font-semibold text-[#12141a]">Admin</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live database
            </span>
            <Link
              href="/"
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              View store ↗
            </Link>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="px-5 py-6 lg:px-8 lg:py-8 print:p-0"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
