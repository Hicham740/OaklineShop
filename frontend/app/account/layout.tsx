import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

// Wait for the session check before sending the account shell. Without this,
// the redirect is streamed to the browser inside a 200 response, which hides
// the real access-control result from crawlers and command-line clients.
export const instant = false;

/**
 * Customer account layout.
 *
 * The Express API is the source of truth for the HttpOnly session. This server
 * layout forwards the cookie to GET /api/auth/me and only lets customer
 * sessions through. Admins are sent to their dashboard; signed-out visitors
 * are sent to the shared /login page with a return path.
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
    // Let Next.js internal prerender signals pass through untouched.
    unstable_rethrow(error);

    console.error("[account] session check failed", error);
    return null;
  }
}

async function AccountShell({ children }: { children: React.ReactNode }) {
  const user = await getSignedInUser();

  if (!user) redirect("/login?next=/account");
  if (user.role === "admin") redirect("/admin");

  return <>{children}</>;
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountShell>{children}</AccountShell>;
}
