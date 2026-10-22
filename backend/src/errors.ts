/**
 * A small error class that carries the HTTP status we want to send.
 *
 * Routes can `throw new ApiError(404, "...")` and the central error handler
 * in app.ts turns it into a predictable JSON response. Keeping this in one
 * place avoids repeating `res.status(...).json(...)` in every route.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    message: string,
    code = "REQUEST_FAILED",
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
