import type { OrderStatus, PaymentMethod } from "./constants";

/**
 * Database rows use snake_case, while the frontend uses camelCase.
 * These small mapper functions keep that translation in one place.
 */

export interface ProductRow {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string; // NUMERIC arrives as a string from `pg`
  tint: string;
  image: string;
  finish: string | null;
  is_new: boolean;
  on_sale: boolean;
  hidden: boolean;
  is_custom: boolean;
  stock: number;
}

export function toProduct(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    tint: row.tint,
    image: row.image,
    finish: row.finish ?? undefined,
    isNew: row.is_new,
    inStock: row.stock > 0,
    onSale: row.on_sale,
    description: row.description,
    stock: row.stock,
    hidden: row.hidden,
    custom: row.is_custom,
  };
}

export interface OrderRow {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  customer_id: string | null;
  payment: PaymentMethod;
  status: OrderStatus;
  notes: string;
  discount_dzd: number;
  created_at: Date;
}

export interface OrderItemRow {
  order_id: string;
  product_id: string | null;
  name: string;
  qty: number;
  unit_price_dzd: number;
}

export interface OrderHistoryRow {
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: Date;
}

function dateLabel(value: Date): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function historyDateLabel(value: Date): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Shape returned by GET /api/orders and the order-related admin routes. */
export function toOrder(
  row: OrderRow,
  items: OrderItemRow[],
  history: OrderHistoryRow[],
) {
  const lines = items
    .filter((item) => item.order_id === row.id)
    .map((item) => ({
      productId: item.product_id ?? "",
      name: item.name,
      qty: item.qty,
      unitPriceDZD: item.unit_price_dzd,
    }));

  const subtotalDZD = lines.reduce(
    (sum, line) => sum + line.unitPriceDZD * line.qty,
    0,
  );

  return {
    id: row.id,
    customer: row.customer_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    postalCode: row.postal_code,
    date: dateLabel(row.created_at),
    createdAt: new Date(row.created_at).toISOString(),
    lines,
    payment: row.payment,
    status: row.status,
    history: history
      .filter((entry) => entry.order_id === row.id)
      .map((entry) => ({
        status: entry.status,
        date: historyDateLabel(entry.created_at),
        note: entry.note ?? undefined,
      })),
    notes: row.notes,
    discountDZD: row.discount_dzd,
    totalDZD: Math.max(0, subtotalDZD - row.discount_dzd),
  };
}

/**
 * Orders returned to a customer must not expose the shop's internal notes or
 * status notes written by staff. The customer still gets the public status
 * timeline and all of the invoice details.
 */
export function toCustomerOrder(order: ReturnType<typeof toOrder>) {
  return {
    ...order,
    notes: "",
    history: order.history.map((entry) => ({
      status: entry.status,
      date: entry.date,
    })),
  };
}
