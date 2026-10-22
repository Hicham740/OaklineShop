import type { PoolClient } from "pg";
import { withTransaction, query } from "./db/pool";
import { ApiError } from "./errors";
import { DEMO_PROMO_DISCOUNT, toDZD, type OrderStatus } from "./constants";
import type { ProductRow } from "./serializers";
import {
  toCustomerOrder,
  toOrder,
  type OrderHistoryRow,
  type OrderItemRow,
  type OrderRow,
} from "./serializers";

export interface CreateOrderInput {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  lines: { productId: string; qty: number }[];
  payment: "COD" | "CIB" | "EDAHABIA";
  promoCode?: string;
}

/** Load items and history for a set of orders, then map them to API objects. */
async function buildOrders(
  orderRows: OrderRow[],
  client: PoolClient | null = null,
): Promise<ReturnType<typeof toOrder>[]> {
  if (orderRows.length === 0) return [];
  const ids = orderRows.map((row) => row.id);

  // `client` is passed when the caller is inside a transaction, so the reads
  // see uncommitted writes from that same transaction.
  const itemSql = `SELECT order_id, product_id, name, qty, unit_price_dzd
       FROM order_items
      WHERE order_id = ANY($1::text[])
      ORDER BY id`;
  const historySql = `SELECT order_id, status, note, created_at
       FROM order_history
      WHERE order_id = ANY($1::text[])
      ORDER BY created_at, id`;

  const itemResult = client
    ? await client.query<OrderItemRow>(itemSql, [ids])
    : await query<OrderItemRow>(itemSql, [ids]);
  const historyResult = client
    ? await client.query<OrderHistoryRow>(historySql, [ids])
    : await query<OrderHistoryRow>(historySql, [ids]);

  return orderRows.map((row) =>
    toOrder(row, itemResult.rows, historyResult.rows),
  );
}

export async function listOrders() {
  const result = await query<OrderRow>(
    "SELECT * FROM orders ORDER BY created_at DESC",
  );
  return buildOrders(result.rows);
}

export async function getOrderById(id: string) {
  const result = await query<OrderRow>("SELECT * FROM orders WHERE id = $1", [id]);
  const order = result.rows[0];
  if (!order) {
    throw new ApiError(404, "Order not found.", "ORDER_NOT_FOUND");
  }
  const [mapped] = await buildOrders([order]);
  return mapped;
}

/** Customer-facing order list, without staff-only notes. */
export async function listOrdersForCustomer(customerId: number) {
  const result = await query<OrderRow>(
    `SELECT * FROM orders
      WHERE customer_id = $1
      ORDER BY created_at DESC`,
    [customerId],
  );
  const orders = await buildOrders(result.rows);
  return orders.map(toCustomerOrder);
}

/**
 * Customer-facing order lookup. Filtering by customer_id in the same query is
 * what prevents one signed-in customer from reading another customer's order.
 */
export async function getOrderForCustomer(customerId: number, id: string) {
  const result = await query<OrderRow>(
    "SELECT * FROM orders WHERE id = $1 AND customer_id = $2",
    [id, customerId],
  );
  const order = result.rows[0];
  if (!order) {
    throw new ApiError(404, "Order not found.", "ORDER_NOT_FOUND");
  }
  const [mapped] = await buildOrders([order]);
  return toCustomerOrder(mapped);
}

/**
 * Place an order.
 *
 * The whole flow runs in one transaction:
 * 1. Lock the requested product rows (`FOR UPDATE`).
 * 2. Check that each product exists and has enough stock.
 * 3. Insert the order and its line snapshots.
 * 4. Decrease stock.
 *
 * Locking prevents two customers from buying the last item at the same time.
 * If anything fails, the transaction rolls back, so we never keep a partial
 * order or reduce stock without an order.
 */
export async function createOrder(
  input: CreateOrderInput,
  customerId: number | null = null,
) {
  return withTransaction(async (client) => {
    // Combine duplicate lines (the same product can appear twice in a cart).
    const quantities = new Map<string, number>();
    for (const line of input.lines) {
      quantities.set(
        line.productId,
        (quantities.get(line.productId) ?? 0) + line.qty,
      );
    }
    const productIds = [...quantities.keys()];

    const productResult = await client.query<ProductRow>(
      `SELECT * FROM products
        WHERE id = ANY($1::text[]) AND hidden = false
        FOR UPDATE`,
      [productIds],
    );

    if (productResult.rows.length !== productIds.length) {
      const found = new Set(productResult.rows.map((row) => row.id));
      const missing = productIds.filter((id) => !found.has(id));
      throw new ApiError(
        400,
        "Some items are no longer available. Please refresh your cart.",
        "PRODUCT_UNAVAILABLE",
        { productIds: missing },
      );
    }

    const products = new Map(
      productResult.rows.map((row) => [row.id, row] as const),
    );
    const lines = productIds.map((productId) => {
      const product = products.get(productId)!;
      return {
        productId,
        name: product.name,
        qty: quantities.get(productId)!,
        unitPriceDZD: toDZD(Number(product.price)),
        stock: product.stock,
      };
    });

    const insufficient = lines.filter((line) => line.qty > line.stock);
    if (insufficient.length > 0) {
      throw new ApiError(
        409,
        "Some items are no longer available in the requested quantity.",
        "OUT_OF_STOCK",
        {
          items: insufficient.map((line) => ({
            productId: line.productId,
            requested: line.qty,
            available: line.stock,
          })),
        },
      );
    }

    const subtotalDZD = lines.reduce(
      (sum, line) => sum + line.unitPriceDZD * line.qty,
      0,
    );
    const discountDZD = input.promoCode?.trim()
      ? Math.round(subtotalDZD * DEMO_PROMO_DISCOUNT)
      : 0;

    // The sequence is atomic, so two simultaneous orders cannot get the same
    // number. Seed data starts at 1043.
    const sequence = await client.query<{ next: string }>(
      "SELECT nextval('order_number_seq')::text AS next",
    );
    const orderId = `ORD-${sequence.rows[0].next}`;

    const orderResult = await client.query<OrderRow>(
      `INSERT INTO orders
         (id, customer_name, email, phone, address, city, postal_code,
          payment, status, notes, discount_dzd, customer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', '', $9, $10)
       RETURNING *`,
      [
        orderId,
        `${input.customer.firstName} ${input.customer.lastName}`.trim(),
        input.customer.email,
        input.customer.phone,
        input.customer.address,
        input.customer.city,
        input.customer.postalCode,
        input.payment,
        discountDZD,
        customerId,
      ],
    );

    const itemRows: OrderItemRow[] = [];
    for (const line of lines) {
      const itemResult = await client.query<OrderItemRow>(
        `INSERT INTO order_items
           (order_id, product_id, name, qty, unit_price_dzd)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING order_id, product_id, name, qty, unit_price_dzd`,
        [orderId, line.productId, line.name, line.qty, line.unitPriceDZD],
      );
      itemRows.push(itemResult.rows[0]);

      // Guard with `stock >= $2` as a second line of defence. The row is
      // already locked, so this should always succeed.
      const stockResult = await client.query(
        `UPDATE products
            SET stock = stock - $1, updated_at = now()
          WHERE id = $2 AND stock >= $1
          RETURNING stock`,
        [line.qty, line.productId],
      );
      if (stockResult.rowCount !== 1) {
        throw new ApiError(
          409,
          "Stock changed while placing your order. Please try again.",
          "OUT_OF_STOCK",
        );
      }
    }

    const historyResult = await client.query<OrderHistoryRow>(
      `INSERT INTO order_history (order_id, status)
       VALUES ($1, 'Pending')
       RETURNING order_id, status, note, created_at`,
      [orderId],
    );

    return toOrder(orderResult.rows[0], itemRows, historyResult.rows);
  });
}

/** Change an order's status and add a timeline entry in the same transaction. */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string,
) {
  return withTransaction(async (client) => {
    const currentResult = await client.query<OrderRow>(
      "SELECT * FROM orders WHERE id = $1 FOR UPDATE",
      [id],
    );
    const current = currentResult.rows[0];
    if (!current) {
      throw new ApiError(404, "Order not found.", "ORDER_NOT_FOUND");
    }

    if (current.status !== status) {
      await client.query("UPDATE orders SET status = $1 WHERE id = $2", [
        status,
        id,
      ]);
      await client.query(
        `INSERT INTO order_history (order_id, status, note)
         VALUES ($1, $2, $3)`,
        [id, status, note ?? null],
      );
    }

    const updatedResult = await client.query<OrderRow>(
      "SELECT * FROM orders WHERE id = $1",
      [id],
    );
    const [mapped] = await buildOrders([updatedResult.rows[0]], client);
    return mapped;
  });
}

export async function updateOrderNotes(id: string, notes: string) {
  const result = await query<OrderRow>(
    `UPDATE orders SET notes = $1 WHERE id = $2 RETURNING *`,
    [notes, id],
  );
  if (!result.rows[0]) {
    throw new ApiError(404, "Order not found.", "ORDER_NOT_FOUND");
  }
  const [mapped] = await buildOrders([result.rows[0]]);
  return mapped;
}
