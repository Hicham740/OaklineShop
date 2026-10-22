import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import { config } from "./config";
import { query } from "./db/pool";
import { ApiError } from "./errors";

/**
 * Database-backed authentication for admins and customers.
 *
 * How it works:
 * 1. POST /api/auth/login checks admin_users first, then customers.
 * 2. On success we generate a random token. Only a SHA-256 hash of that token
 *    is stored in the matching session table, so a leaked database dump cannot
 *    be used to impersonate a signed-in account.
 * 3. The raw token goes to the browser in an HttpOnly cookie. JavaScript
 *    cannot read it, which reduces the impact of XSS.
 * 4. Every protected request hashes the cookie value and looks up a matching,
 *    unexpired session.
 *
 * Admin and customer cookies are separate. A browser only has one active
 * identity at a time because signing in revokes the other session.
 */

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: "admin";
}

export interface CustomerUser {
  id: number;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "customer";
}

export type AuthUser = AdminUser | CustomerUser;

interface AdminRow {
  id: string;
  email: string;
  name: string;
}

interface CustomerRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.bcryptRounds);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;

  // Cookie headers look like: "a=1; oakline_admin_session=abc; b=2".
  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      const value = rawValue.join("=");
      try {
        return decodeURIComponent(value);
      } catch {
        // A malformed cookie should behave like a missing session, not crash.
        return value;
      }
    }
  }
  return null;
}

function setCookie(
  res: Response,
  name: string,
  token: string,
  expiresAt: Date,
): void {
  res.cookie(name, token, {
    httpOnly: true,
    sameSite: "lax", // blocks most cross-site form posts while allowing normal navigation
    secure: config.isProduction, // HTTPS only in production
    expires: expiresAt,
    path: "/",
  });
}

function clearCookie(res: Response, name: string): void {
  res.clearCookie(name, { path: "/" });
}

export function readSessionToken(req: Request): string | null {
  return readCookie(req, config.sessionCookieName);
}

export function readCustomerToken(req: Request): string | null {
  return readCookie(req, config.customerSessionCookieName);
}

export function setSessionCookie(
  res: Response,
  token: string,
  expiresAt: Date,
): void {
  setCookie(res, config.sessionCookieName, token, expiresAt);
}

export function setCustomerSessionCookie(
  res: Response,
  token: string,
  expiresAt: Date,
): void {
  setCookie(res, config.customerSessionCookieName, token, expiresAt);
}

export function clearSessionCookie(res: Response): void {
  clearCookie(res, config.sessionCookieName);
}

export function clearCustomerSessionCookie(res: Response): void {
  clearCookie(res, config.customerSessionCookieName);
}

/** Create a new admin session row and return the raw token for the cookie. */
export async function createSession(
  adminId: number,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.sessionDurationMs);

  await query(
    `INSERT INTO admin_sessions (admin_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [adminId, hashToken(token), expiresAt],
  );

  return { token, expiresAt };
}

/** Create a new customer session row and return the raw token for the cookie. */
export async function createCustomerSession(
  customerId: number,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.customerSessionDurationMs);

  await query(
    `INSERT INTO customer_sessions (customer_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [customerId, hashToken(token), expiresAt],
  );

  return { token, expiresAt };
}

/** Look up the admin behind a cookie token, or return null. */
export async function findAdminBySession(
  token: string,
): Promise<AdminUser | null> {
  const result = await query<AdminRow & { expires_at: Date; session_id: string }>(
    `SELECT a.id, a.email, a.name, s.expires_at, s.id AS session_id
       FROM admin_sessions s
       JOIN admin_users a ON a.id = s.admin_id
      WHERE s.token_hash = $1
        AND s.expires_at > now()`,
    [hashToken(token)],
  );

  const row = result.rows[0];
  if (!row) return null;

  // Sliding expiration: if the session is close to expiring, extend it so an
  // active admin is not logged out in the middle of work.
  const expiresAt = new Date(row.expires_at).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (expiresAt - Date.now() < oneDay) {
    await query(
      `UPDATE admin_sessions
          SET expires_at = $1, last_seen_at = now()
        WHERE id = $2`,
      [new Date(Date.now() + config.sessionDurationMs), row.session_id],
    );
  } else {
    await query(
      `UPDATE admin_sessions SET last_seen_at = now() WHERE id = $1`,
      [row.session_id],
    );
  }

  return { id: Number(row.id), email: row.email, name: row.name, role: "admin" };
}

/** Look up the customer behind a cookie token, or return null. */
export async function findCustomerBySession(
  token: string,
): Promise<CustomerUser | null> {
  const result = await query<
    CustomerRow & { expires_at: Date; session_id: string }
  >(
    `SELECT c.id, c.email, c.first_name, c.last_name, c.phone,
            s.expires_at, s.id AS session_id
       FROM customer_sessions s
       JOIN customers c ON c.id = s.customer_id
      WHERE s.token_hash = $1
        AND s.expires_at > now()`,
    [hashToken(token)],
  );

  const row = result.rows[0];
  if (!row) return null;

  const expiresAt = new Date(row.expires_at).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (expiresAt - Date.now() < oneDay) {
    await query(
      `UPDATE customer_sessions
          SET expires_at = $1, last_seen_at = now()
        WHERE id = $2`,
      [new Date(Date.now() + config.customerSessionDurationMs), row.session_id],
    );
  } else {
    await query(
      `UPDATE customer_sessions SET last_seen_at = now() WHERE id = $1`,
      [row.session_id],
    );
  }

  return {
    id: Number(row.id),
    email: row.email,
    name: `${row.first_name} ${row.last_name}`.trim(),
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: "customer",
  };
}

/** Resolve whichever identity owns the request, preferring an admin session. */
export async function findUserByRequest(req: Request): Promise<AuthUser | null> {
  const adminToken = readSessionToken(req);
  if (adminToken) {
    const admin = await findAdminBySession(adminToken);
    if (admin) return admin;
  }

  const customerToken = readCustomerToken(req);
  if (customerToken) {
    const customer = await findCustomerBySession(customerToken);
    if (customer) return customer;
  }

  return null;
}

export async function deleteSession(token: string): Promise<void> {
  await query("DELETE FROM admin_sessions WHERE token_hash = $1", [
    hashToken(token),
  ]);
}

export async function deleteCustomerSession(token: string): Promise<void> {
  await query("DELETE FROM customer_sessions WHERE token_hash = $1", [
    hashToken(token),
  ]);
}

/** Revoke the current admin cookie/session, if any. */
export async function revokeAdminSession(
  req: Request,
  res: Response,
): Promise<void> {
  const token = readSessionToken(req);
  if (token) await deleteSession(token);
  clearSessionCookie(res);
}

/** Revoke the current customer cookie/session, if any. */
export async function revokeCustomerSession(
  req: Request,
  res: Response,
): Promise<void> {
  const token = readCustomerToken(req);
  if (token) await deleteCustomerSession(token);
  clearCustomerSessionCookie(res);
}

/** Delete expired rows. Called at startup and on a timer in server.ts. */
export async function cleanupExpiredSessions(): Promise<void> {
  await query("DELETE FROM admin_sessions WHERE expires_at < now()");
  await query("DELETE FROM customer_sessions WHERE expires_at < now()");
}

/**
 * Optional auth: attach `req.admin` when the cookie is valid, but do not fail.
 * The public product list uses this to include hidden products only for an
 * authenticated admin.
 */
export async function loadAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = readSessionToken(req);
  if (token) {
    req.admin = (await findAdminBySession(token)) ?? undefined;
  }
  next();
}

/**
 * Optional customer auth for checkout. A guest simply continues without
 * `req.customer`; the order is then stored without an account link.
 */
export async function loadCustomer(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = readCustomerToken(req);
  if (token) {
    req.customer = (await findCustomerBySession(token)) ?? undefined;
  }
  next();
}

/** Hard auth: reject with 401 unless a valid admin session is present. */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = readSessionToken(req);
  if (!token) {
    next(new ApiError(401, "Please sign in to continue.", "AUTH_REQUIRED"));
    return;
  }

  const admin = await findAdminBySession(token);
  if (!admin) {
    clearSessionCookie(res);
    next(
      new ApiError(401, "Your session expired. Please sign in again.", "AUTH_REQUIRED"),
    );
    return;
  }

  req.admin = admin;
  next();
}

/** Hard auth for customer-only endpoints such as order history. */
export async function requireCustomer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = readCustomerToken(req);
  if (!token) {
    next(new ApiError(401, "Please sign in to continue.", "AUTH_REQUIRED"));
    return;
  }

  const customer = await findCustomerBySession(token);
  if (!customer) {
    clearCustomerSessionCookie(res);
    next(
      new ApiError(401, "Your session expired. Please sign in again.", "AUTH_REQUIRED"),
    );
    return;
  }

  req.customer = customer;
  next();
}
