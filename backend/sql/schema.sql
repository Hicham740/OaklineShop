-- ============================================================
-- Oakline e-commerce schema (PostgreSQL)
-- Run with: npm run db:migrate
-- ============================================================

-- Categories are their own table so the admin can add one before a product
-- is assigned to it.
CREATE TABLE IF NOT EXISTS categories (
  name       TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products. Prices are stored in USD, matching the seed data; the API
-- converts to DZD when it builds an order.
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL REFERENCES categories(name) ON UPDATE CASCADE,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  tint        TEXT NOT NULL DEFAULT '#E9E1D3',
  image       TEXT NOT NULL DEFAULT '',
  finish      TEXT,
  is_new      BOOLEAN NOT NULL DEFAULT false,
  on_sale     BOOLEAN NOT NULL DEFAULT false,
  hidden      BOOLEAN NOT NULL DEFAULT false,
  -- Demo products are hidden instead of deleted; admin-created products can
  -- be deleted for real. This flag keeps the old UI behaviour.
  is_custom   BOOLEAN NOT NULL DEFAULT false,
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
CREATE INDEX IF NOT EXISTS products_hidden_idx ON products (hidden);

-- Customer accounts and their database-backed sessions. Customers are kept
-- separate from admin_users so signing up can never create an admin account.
CREATE TABLE IF NOT EXISTS customers (
  id            BIGSERIAL PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_sessions (
  id           BIGSERIAL PRIMARY KEY,
  customer_id  BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  -- We store a hash, never the raw cookie token.
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_sessions_expiry_idx
  ON customer_sessions (expires_at);

-- Orders. `id` looks like ORD-1043 and comes from order_number_seq.
CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address       TEXT NOT NULL,
  city          TEXT NOT NULL,
  postal_code   TEXT NOT NULL,
  -- NULL for guest orders; set from the customer session during checkout.
  customer_id   BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  payment       TEXT NOT NULL CHECK (payment IN ('COD', 'CIB', 'EDAHABIA')),
  status        TEXT NOT NULL DEFAULT 'Pending'
                         CHECK (status IN ('Pending', 'Shipped', 'Delivered', 'Cancelled')),
  notes         TEXT NOT NULL DEFAULT '',
  discount_dzd  INTEGER NOT NULL DEFAULT 0 CHECK (discount_dzd >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Existing databases were created before customer accounts existed, so add the
-- link column when it is missing.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_idx
  ON orders (customer_id, created_at DESC);

-- A line stores the product name and price at the time of purchase. That way
-- renaming or repricing a product does not rewrite old invoices.
CREATE TABLE IF NOT EXISTS order_items (
  id             BIGSERIAL PRIMARY KEY,
  order_id       TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     TEXT REFERENCES products(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  qty            INTEGER NOT NULL CHECK (qty > 0),
  unit_price_dzd INTEGER NOT NULL CHECK (unit_price_dzd >= 0)
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

-- Status changes over time, shown in the admin order timeline.
CREATE TABLE IF NOT EXISTS order_history (
  id         BIGSERIAL PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL
                    CHECK (status IN ('Pending', 'Shipped', 'Delivered', 'Cancelled')),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_history_order_idx ON order_history (order_id, created_at);

-- Admin accounts and database-backed sessions.
CREATE TABLE IF NOT EXISTS admin_users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL DEFAULT 'Store admin',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id           BIGSERIAL PRIMARY KEY,
  admin_id     BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  -- We store a hash, never the raw cookie token.
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions (expires_at);

-- Starts at 1043 so seeded demo orders can keep their existing numbers.
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1043;
