import { hashPassword } from "../auth";
import { config } from "../config";
import { toDZD } from "../constants";
import { pool, query, withTransaction } from "./pool";
import { SEED_CATEGORIES, SEED_ORDERS, SEED_PRODUCTS } from "./seed-data";

/**
 * Fill an empty database with the demo catalogue and admin account.
 * Safe to run more than once:
 * - categories/products use ON CONFLICT DO NOTHING
 * - demo orders use ON CONFLICT DO NOTHING
 * - the admin password is reset to ADMIN_PASSWORD from .env
 */
async function main() {
  // 1. Categories first, because products reference them.
  for (const name of SEED_CATEGORIES) {
    await query(
      "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
      [name],
    );
  }

  // 2. Products.
  for (const product of SEED_PRODUCTS) {
    await query(
      `INSERT INTO products
         (id, name, description, category, price, tint, image, finish,
          is_new, on_sale, hidden, is_custom, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, false, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        product.id,
        product.name,
        product.description,
        product.category,
        product.price,
        product.tint,
        product.image,
        product.finish ?? null,
        product.isNew ?? false,
        product.onSale ?? false,
        product.stock,
      ],
    );
  }

  // 3. Admin account. bcrypt hashes the password; the plain text is never
  // stored. Re-running the seed resets the password to the env value.
  const passwordHash = await hashPassword(config.admin.password);
  await query(
    `INSERT INTO admin_users (email, name, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`,
    [config.admin.email, config.admin.name, passwordHash],
  );

  // 4. Demo orders.
  const productById = new Map(SEED_PRODUCTS.map((product) => [product.id, product]));

  for (const order of SEED_ORDERS) {
    const createdAt = new Date(Date.now() - order.daysAgo * 24 * 60 * 60 * 1000);

    await withTransaction(async (client) => {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO orders
           (id, customer_name, email, phone, address, city, postal_code,
            payment, status, notes, discount_dzd, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [
          order.id,
          order.customer,
          order.email,
          order.phone,
          order.address,
          order.city,
          order.postalCode,
          order.payment,
          order.status,
          order.notes,
          createdAt,
        ],
      );

      // The order already existed, so leave its items/history untouched.
      if (inserted.rowCount === 0) return;

      for (const line of order.lines) {
        const product = productById.get(line.productId);
        if (!product) continue;
        await client.query(
          `INSERT INTO order_items
             (order_id, product_id, name, qty, unit_price_dzd)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, product.id, product.name, line.qty, toDZD(product.price)],
        );
      }

      // Build a believable timeline for the final status.
      const entries: { status: string; hours: number }[] = [
        { status: "Pending", hours: 0 },
      ];
      if (order.status === "Shipped") {
        entries.push({ status: "Shipped", hours: 6 });
      } else if (order.status === "Delivered") {
        entries.push({ status: "Shipped", hours: 6 });
        entries.push({ status: "Delivered", hours: 10 });
      } else if (order.status === "Cancelled") {
        entries.push({ status: "Cancelled", hours: 5 });
      }

      for (const entry of entries) {
        const at = new Date(createdAt.getTime() + entry.hours * 60 * 60 * 1000);
        await client.query(
          `INSERT INTO order_history (order_id, status, created_at)
           VALUES ($1, $2, $3)`,
          [order.id, entry.status, at],
        );
      }
    });
  }

  console.log(
    `[db] seeded ${SEED_PRODUCTS.length} products, ${SEED_ORDERS.length} demo orders`,
  );
  console.log(`[db] admin login: ${config.admin.email} (password from ADMIN_PASSWORD)`);
}

main()
  .catch((error) => {
    console.error("[db] seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
