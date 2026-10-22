import { Router } from "express";
import { requireAdmin } from "../auth";
import { query } from "../db/pool";
import { categorySchema } from "../validation";

export const categoriesRouter = Router();

/** GET /api/categories — used by the shop filters and the product form. */
categoriesRouter.get("/", async (_req, res) => {
  const result = await query<{ name: string }>(
    "SELECT name FROM categories ORDER BY created_at, name",
  );
  res.json({ categories: result.rows.map((row) => row.name) });
});

/** POST /api/categories — admin only. Duplicate names are a no-op. */
categoriesRouter.post("/", requireAdmin, async (req, res) => {
  const { name } = categorySchema.parse(req.body);
  await query(
    "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
    [name],
  );
  res.status(201).json({ name });
});
