"use client";

/**
 * Shared client authentication state.
 *
 * The Express API owns the HttpOnly session cookie. This provider only asks
 * "who is signed in?" and caches the answer for the header, checkout and
 * account pages. It never sees or stores the raw session token.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "./api";

export type AuthRole = "admin" | "customer";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: AuthRole;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

interface SessionResponse {
  user: AuthUser;
}

interface AuthValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<AuthUser | null>;
  login: (input: LoginInput) => Promise<AuthUser>;
  signup: (input: SignupInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const data = await apiFetch<SessionResponse>("/api/auth/me");
      setUser(data.user);
      return data.user;
    } catch {
      // 401 is the normal signed-out response.
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    // Defer the request until after the first paint, matching the catalogue
    // provider and avoiding synchronous state updates inside the effect.
    const timer = setTimeout(() => {
      void refresh().finally(() => {
        if (active) setLoading(false);
      });
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [refresh]);

  const login = useCallback(async (input: LoginInput): Promise<AuthUser> => {
    const data = await apiFetch<SessionResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (input: SignupInput): Promise<AuthUser> => {
    const data = await apiFetch<SessionResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiFetch<void>("/api/auth/logout", { method: "POST" });
    } finally {
      // Even if the network request failed, drop the local identity so the
      // header does not keep showing a stale account.
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, loading, refresh, login, signup, logout }),
    [user, loading, refresh, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Only allow same-site paths as post-login destinations. */
export function safeNextPath(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  if (next === "/login" || next.startsWith("/login?") || next === "/signup") {
    return null;
  }
  return next;
}

/**
 * Decide where to send someone after sign-in.
 *
 * Admins normally land in /admin, but a storefront `next` path (for example
 * /cart) is honoured. Customers may never be sent into /admin.
 */
export function destinationFor(
  user: AuthUser,
  next: string | null,
): string {
  const safeNext = safeNextPath(next);

  if (user.role === "admin") {
    if (safeNext) return safeNext;
    return "/admin";
  }

  if (safeNext && !safeNext.startsWith("/admin")) {
    return safeNext;
  }

  return "/account";
}
