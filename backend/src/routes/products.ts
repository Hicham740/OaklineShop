import { Router } from "express";
import type { PoolClient } from "pg";
import { requireAdmin, loadAdmin } from "../auth";
import { query, withTransaction } from "../db/pool";
import { ApiError } from "../errors";
import { toProduct, type ProductRow } from "../serializers";
import { createProductSchema, updateProductSchema } from "../validation";

export const productsRouter = Router();

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

/** Add the category first so the products.category foreign key is valid. */
async function ensureCategory(client: PoolClient, name: string): Promise<void> {
  await client.query(
    "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
    [name],
  );
}

async function uniqueProductId(
  client: PoolClient,
  name: string,
): Promise<string> {
  const base = slugify(name);
  let id = base;
  let suffix = 2;

  // Keep trying "name", "name-2", "name-3"... until an unused id is found.
  while (true) {
    const existing = await client.query("SELECT 1 FROM products WHERE id = $1", [
      id,
    ]);
    if (existing.rowCount === 0) return id;
    id = `${base}-${suffix}`;
    suffix += 1;
  }
}

/**
 * GET /api/products
 * Public visitors only receive visible products. An authenticated admin can
 * add `?all=1` to include hidden rows (the admin table needs those).
 */
productsRouter.get("/", loadAdmin, async (req, res) => {
  const includeHidden = req.query.all === "1" && Boolean(req.admin);
  const result = await query<ProductRow>(
    `SELECT * FROM products
      ${includeHidden ? "" : "WHERE hidden = false"}
      ORDER BY created_at, name`,
  );
  res.json({ products: result.rows.map(toProduct) });
});

/** GET /api/products/:id — hidden products stay private to admins. */
productsRouter.get("/:id", loadAdmin, async (req, res) => {
  const result = await query<ProductRow>(
    "SELECT * FROM products WHERE id = $1",
    [req.params.id],
  );
  const product = result.rows[0];
  if (!product || (product.hidden && !req.admin)) {
    throw new ApiError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  }
  res.json({ product: toProduct(product) });
});

/** POST /api/products — admin only. */
productsRouter.post("/", requireAdmin, async (req, res) => {
  const input = createProductSchema.parse(req.body);
  const product = await withTransaction(async (client) => {
    await ensureCategory(client, input.category);
    const id = await uniqueProductId(client, input.name);

    const result = await client.query<ProductRow>(
      `INSERT INTO products
         (id, name, description, category, price, tint, image, finish,
          is_new, on_sale, is_custom, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
       RETURNING *`,
      [
        id,
        input.name,
        input.description,
        input.category,
        input.price,
        input.tint ?? "#E9E1D3",
        input.image ?? "",
        input.finish?.trim() || null,
        input.isNew ?? false,
        input.onSale ?? false,
        input.stock,
      ],
    );
    return result.rows[0];
  });

  res.status(201).json({ product: toProduct(product) });
});

/**
 * PATCH /api/products/:id — admin only.
 *
 * The column list is built from a fixed map, never from raw request keys, so a
 * malicious body cannot inject SQL identifiers.
 */
productsRouter.patch("/:id", requireAdmin, async (req, res) => {
  const input = updateProductSchema.parse(req.body);
  const id = req.params.id;

  const product = await withTransaction(async (client) => {
    if (Object.keys(input).length === 0) {
      const current = await client.query<ProductRow>(
        "SELECT * FROM products WHERE id = $1",
        [id],
      );
      if (!current.rows[0]) {
        throw new ApiError(404, "Product not found.", "PRODUCT_NOT_FOUND");
      }
      return current.rows[0];
    }

    if (input.category !== undefined) {
      await ensureCategory(client, input.category);
    }

    const columnByField: Record<string, string> = {
      name: "name",
      description: "description",
      category: "category",
      price: "price",
      tint: "tint",
      image: "image",
      finish: "finish",
      stock: "stock",
      isNew: "is_new",
      onSale: "on_sale",
      hidden: "hidden",
    };

    const assignments: string[] = [];
    const values: unknown[] = [];
    let parameter = 1;

    for (const [field, column] of Object.entries(columnByField)) {
      if (!(field in input)) continue;
      const raw = (input as Record<string, unknown>)[field];
      // Empty finish means "no finish", stored as NULL.
      const value = field === "finish" && raw === "" ? null : raw;
      assignments.push(`${column} = $${parameter}`);
      values.push(value);
      parameter += 1;
    }

    assignments.push("updated_at = now()");
    values.push(id);

    const result = await client.query<ProductRow>(
      `UPDATE products
          SET ${assignments.join(", ")}
        WHERE id = $${parameter}
        RETURNING *`,
      values,
    );

    if (!result.rows[0]) {
      throw new ApiError(404, "Product not found.", "PRODUCT_NOT_FOUND");
    }
    return result.rows[0];
  });

  res.json({ product: toProduct(product) });
});

/**
 * DELETE /api/products/:id — admin only.
 * Demo products are hidden (so they come back on reseed), while products
 * created in the admin are deleted permanently.
 */
productsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const existing = await query<{ is_custom: boolean }>(
    "SELECT is_custom FROM products WHERE id = $1",
    [req.params.id],
  );
  const product = existing.rows[0];
  if (!product) {
    throw new ApiError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  }

  if (product.is_custom) {
    await query("DELETE FROM products WHERE id = $1", [req.params.id]);
  } else {
    await query(
      "UPDATE products SET hidden = true, updated_at = now() WHERE id = $1",
      [req.params.id],
    );
  }

  res.json({ ok: true, deleted: product.is_custom });
});
