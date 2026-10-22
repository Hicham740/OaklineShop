/**
 * Tiny fetch wrapper for the Express API.
 *
 * Every request includes `credentials: "include"` so the browser sends the
 * HttpOnly admin session cookie. The API base URL comes from
 * NEXT_PUBLIC_API_URL (see frontend/.env.example).
 */

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  // 204 No Content is used by logout.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const errorBody = body as
      | { error?: { message?: string; code?: string } }
      | null;
    throw new ApiError(
      errorBody?.error?.message ?? "The request failed. Please try again.",
      response.status,
      errorBody?.error?.code,
    );
  }

  return body as T;
}
