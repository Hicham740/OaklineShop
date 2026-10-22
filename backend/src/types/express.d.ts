import type { AdminUser, CustomerUser } from "../auth";

/**
 * Teach TypeScript about the extra properties our auth middleware adds to
 * Express requests. Without this file `req.admin` and `req.customer` would be
 * type errors.
 */
declare global {
  namespace Express {
    interface Request {
      admin?: AdminUser;
      customer?: CustomerUser;
    }
  }
}

export {};
