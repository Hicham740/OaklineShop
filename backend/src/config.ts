import "dotenv/config";

/**
 * Central place for every environment variable the backend needs.
 *
 * Reading configuration once at startup (instead of calling process.env all
 * over the code) makes it obvious what the server depends on and lets us fail
 * with a helpful message when something is missing.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy backend/.env.example to backend/.env and set it.`,
    );
  }
  return value;
}

function list(value: string | undefined, fallback: string): string[] {
  return (value ?? fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const config = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number(process.env.PORT ?? 4000),

  // PostgreSQL connection string, for example:
  // postgresql://postgres:secret@localhost:5432/oakline
  databaseUrl: required("DATABASE_URL"),

  // The browser origin allowed to send credentialed requests (cookies).
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  corsOrigins: list(
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL ?? "http://localhost:3000",
  ),

  // Session cookie settings.
  sessionCookieName: "oakline_admin_session",
  customerSessionCookieName: "oakline_customer_session",
  sessionDurationMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  customerSessionDurationMs: 30 * 24 * 60 * 60 * 1000, // 30 days

  // Used by `npm run db:seed` to create the first admin account.
  admin: {
    email: (process.env.ADMIN_EMAIL ?? "admin@oakline.test").toLowerCase(),
    password: process.env.ADMIN_PASSWORD ?? "change-me-now",
    name: process.env.ADMIN_NAME ?? "Store admin",
  },

  // bcrypt cost. 12 is a good default in 2026: slow enough to resist guessing,
  // still fast enough for a single admin login.
  bcryptRounds: 12,
} as const;

/**
 * Decide whether a browser origin may call the API with cookies.
 *
 * Production is strict: only the comma-separated `CORS_ORIGIN` list is
 * allowed. During development Next.js automatically moves to port 3001, 3002,
 * etc. when 3000 is already in use, so loopback origins on any port are
 * accepted there. This keeps `credentials: "include"` working without
 * allowing arbitrary websites to read admin data.
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  // curl and server-to-server requests do not send an Origin header.
  if (!origin) return true;

  if (config.corsOrigins.includes(origin)) return true;

  if (config.isProduction) return false;

  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(origin);
}
