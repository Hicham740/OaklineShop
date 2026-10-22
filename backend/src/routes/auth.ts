import { Router } from "express";
import {
  clearCustomerSessionCookie,
  clearSessionCookie,
  createCustomerSession,
  createSession,
  deleteCustomerSession,
  deleteSession,
  findUserByRequest,
  hashPassword,
  readCustomerToken,
  readSessionToken,
  revokeAdminSession,
  revokeCustomerSession,
  setCustomerSessionCookie,
  setSessionCookie,
  verifyPassword,
} from "../auth";
import { query } from "../db/pool";
import { ApiError } from "../errors";
import { loginSchema, signupSchema } from "../validation";

export const authRouter = Router();

/**
 * Very small in-memory rate limiter for authentication attempts.
 *
 * This is enough for a single-process demo. In production you would use Redis
 * (or a similar shared store) so limits apply across several API instances.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000;

const signupAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_SIGNUPS = 20;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;

function loginKey(req: { ip?: string }): string {
  return req.ip ?? "unknown";
}

function tooManyAttempts(
  store: Map<string, { count: number; resetAt: number }>,
  key: string,
  max: number,
): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    store.delete(key);
    return false;
  }
  return entry.count >= max;
}

function recordFailure(
  store: Map<string, { count: number; resetAt: number }>,
  key: string,
  windowMs: number,
): void {
  const current = store.get(key);
  if (!current || Date.now() > current.resetAt) {
    store.set(key, { count: 1, resetAt: Date.now() + windowMs });
    return;
  }
  current.count += 1;
}

interface AdminLoginRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}

interface CustomerLoginRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  password_hash: string;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

/**
 * One shared sign-in endpoint for customers and admins.
 *
 * Admins live in admin_users and customers in customers. The email is always
 * looked up in admin_users first; customer email sign-up rejects admin emails,
 * so the two sets stay disjoint. Unknown email and wrong password return the
 * same message to avoid account discovery.
 */
authRouter.post("/login", async (req, res) => {
  const key = loginKey(req);
  if (tooManyAttempts(attempts, key, MAX_ATTEMPTS)) {
    throw new ApiError(
      429,
      "Too many sign-in attempts. Please wait a few minutes and try again.",
      "TOO_MANY_ATTEMPTS",
    );
  }

  const { email, password } = loginSchema.parse(req.body);
  const normalizedEmail = email.toLowerCase();

  const adminResult = await query<AdminLoginRow>(
    `SELECT id, email, name, password_hash
       FROM admin_users
      WHERE email = $1`,
    [normalizedEmail],
  );

  const admin = adminResult.rows[0];
  if (admin) {
    if (!(await verifyPassword(password, admin.password_hash))) {
      recordFailure(attempts, key, WINDOW_MS);
      throw new ApiError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    }

    attempts.delete(key);

    // Keep one active identity per browser.
    await revokeCustomerSession(req, res);

    const { token, expiresAt } = await createSession(Number(admin.id));
    setSessionCookie(res, token, expiresAt);

    res.json({
      user: {
        id: Number(admin.id),
        email: admin.email,
        name: admin.name,
        role: "admin" as const,
      },
      admin: { id: Number(admin.id), email: admin.email, name: admin.name },
    });
    return;
  }

  const customerResult = await query<CustomerLoginRow>(
    `SELECT id, email, first_name, last_name, phone, password_hash
       FROM customers
      WHERE email = $1`,
    [normalizedEmail],
  );

  const customer = customerResult.rows[0];
  if (!customer || !(await verifyPassword(password, customer.password_hash))) {
    recordFailure(attempts, key, WINDOW_MS);
    throw new ApiError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
  }

  attempts.delete(key);

  await revokeAdminSession(req, res);

  const { token, expiresAt } = await createCustomerSession(Number(customer.id));
  setCustomerSessionCookie(res, token, expiresAt);

  res.json({
    user: {
      id: Number(customer.id),
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`.trim(),
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      role: "customer" as const,
    },
  });
});

/**
 * Customer registration. There is deliberately no `role` field in the request:
 * accounts created here are always customers and can never reach /admin.
 */
authRouter.post("/signup", async (req, res) => {
  const key = loginKey(req);
  if (tooManyAttempts(signupAttempts, key, MAX_SIGNUPS)) {
    throw new ApiError(
      429,
      "Too many account creation attempts. Please try again later.",
      "TOO_MANY_ATTEMPTS",
    );
  }

  const input = signupSchema.parse(req.body);
  const email = input.email.toLowerCase();
  const phone = input.phone?.trim() ?? "";

  const existing = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM admin_users WHERE email = $1
       UNION ALL
       SELECT 1 FROM customers WHERE email = $1
     ) AS exists`,
    [email],
  );

  if (existing.rows[0]?.exists) {
    recordFailure(signupAttempts, key, SIGNUP_WINDOW_MS);
    throw new ApiError(
      409,
      "An account with this email already exists.",
      "EMAIL_IN_USE",
    );
  }

  const passwordHash = await hashPassword(input.password);

  let customer: CustomerLoginRow;
  try {
    const inserted = await query<CustomerLoginRow>(
      `INSERT INTO customers (first_name, last_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, phone, password_hash`,
      [
        input.firstName,
        input.lastName,
        email,
        phone || null,
        passwordHash,
      ],
    );
    customer = inserted.rows[0];
  } catch (error) {
    // Two simultaneous sign-ups can race past the EXISTS check. The unique
    // index is the real guard, so translate that error into a friendly 409.
    if (isUniqueViolation(error)) {
      recordFailure(signupAttempts, key, SIGNUP_WINDOW_MS);
      throw new ApiError(
        409,
        "An account with this email already exists.",
        "EMAIL_IN_USE",
      );
    }
    throw error;
  }

  signupAttempts.delete(key);

  // A visitor who was signed in as an admin and creates a customer account
  // should not keep both sessions alive.
  await revokeAdminSession(req, res);

  const { token, expiresAt } = await createCustomerSession(Number(customer.id));
  setCustomerSessionCookie(res, token, expiresAt);

  res.status(201).json({
    user: {
      id: Number(customer.id),
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`.trim(),
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      role: "customer" as const,
    },
  });
});

authRouter.post("/logout", async (req, res) => {
  const adminToken = readSessionToken(req);
  const customerToken = readCustomerToken(req);

  await Promise.all([
    adminToken ? deleteSession(adminToken) : Promise.resolve(),
    customerToken ? deleteCustomerSession(customerToken) : Promise.resolve(),
  ]);

  clearSessionCookie(res);
  clearCustomerSessionCookie(res);
  res.status(204).end();
});

authRouter.get("/me", async (req, res) => {
  const user = await findUserByRequest(req);
  if (!user) {
    clearSessionCookie(res);
    clearCustomerSessionCookie(res);
    throw new ApiError(401, "Please sign in to continue.", "AUTH_REQUIRED");
  }

  res.json({
    user,
    ...(user.role === "admin"
      ? { admin: { id: user.id, email: user.email, name: user.name } }
      : {}),
  });
});
