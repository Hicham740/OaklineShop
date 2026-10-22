import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { config, isAllowedOrigin } from "./config";
import { query } from "./db/pool";
import { ApiError } from "./errors";
import { accountRouter } from "./routes/account";
import { authRouter } from "./routes/auth";
import { categoriesRouter } from "./routes/categories";
import { ordersRouter } from "./routes/orders";
import { productsRouter } from "./routes/products";

export function createApp() {
  const app = express();

  // Behind a reverse proxy (Render, Fly, nginx) `req.ip` needs the
  // X-Forwarded-For header to be trusted. Remove this if you deploy directly.
  app.set("trust proxy", 1);

  // Helmet adds safe defaults such as X-Content-Type-Options and HSTS.
  app.use(helmet());

  // The browser only gets CORS headers from the configured storefront origin.
  // `credentials: true` is required so the session cookie can travel with
  // fetch(..., { credentials: "include" }).
  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin));
      },
      credentials: true,
    }),
  );

  // Product images can be pasted/uploaded as data URLs, so allow a larger body
  // than Express's default. In production, upload images to object storage and
  // store only the URL (see frontend/lib/image-upload.ts).
  app.use(express.json({ limit: "8mb" }));

  app.get("/api/health", async (_req, res) => {
    await query("SELECT 1");
    res.json({ ok: true, database: "up" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/orders", ordersRouter);

  // Unknown API route.
  app.use((_req, res) => {
    res.status(404).json({
      error: { code: "NOT_FOUND", message: "Route not found." },
    });
  });

  // Central error handler. Express 5 forwards rejected promises from async
  // route handlers here automatically, so routes can simply `throw`.
  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      if (error instanceof ZodError) {
        const first = error.issues[0];
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: first?.message ?? "Invalid request body.",
            field: first?.path.join("."),
          },
        });
        return;
      }

      if (error instanceof ApiError) {
        res.status(error.status).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
        return;
      }

      // Malformed JSON from express.json().
      if (error instanceof SyntaxError && "body" in error) {
        res.status(400).json({
          error: { code: "INVALID_JSON", message: "Request body is not valid JSON." },
        });
        return;
      }

      console.error("[api] unhandled error", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong. Please try again.",
        },
      });
    },
  );

  return app;
}
