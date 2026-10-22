# Oakline e-commerce platform

A small storefront and admin panel built with Next.js, plus an Express + PostgreSQL API.

```
frontend/   Next.js 16 storefront and admin panel
backend/    Express 5 API, PostgreSQL schema, seed data
```

## What the backend provides

- **Catalogue** — products, categories, prices, hidden state and stock are stored in PostgreSQL.
- **Orders** — checkout writes an order, snapshots line prices, decrements stock and records the status timeline in one transaction.
- **Shared authentication** — one `/login` page serves customers and admins. The API checks `admin_users` first, then `customers`, and stores separate HttpOnly session cookies.
- **Customer accounts** — `/signup` creates a customer-only account. Customers can sign in, see their order history and follow each order's status at `/account`.
- **Guest checkout** — visitors can still order without an account. A signed-in customer's order is linked to their account automatically.
- **Protected admin** — every `/admin` page asks the API for the current session before rendering. There is no separate admin login URL; admins sign in through the normal `/login` page.
- **Loading, error and retry states** — storefront, account and admin screens read from the API and keep their loading, error and retry states.

## 1. Create the database

You need PostgreSQL running locally (the project was tested with PostgreSQL 18).

```bash
# Example: create a dedicated user and database
psql -U postgres -c "CREATE USER oakline WITH PASSWORD 'oakline';"
psql -U postgres -c "CREATE DATABASE oakline OWNER oakline;"
```

Copy the environment template and edit it:

```bash
cp backend/.env.example backend/.env
```

```dotenv
DATABASE_URL=postgresql://oakline:oakline@localhost:5432/oakline
ADMIN_EMAIL=admin@oakline.test
ADMIN_PASSWORD=change-me-now
ADMIN_NAME=Store admin
CORS_ORIGIN=http://localhost:3000
```

> `ADMIN_PASSWORD` is only read by the seed script. It is hashed with bcrypt before it is stored.

## 2. Install, migrate and seed

```bash
npm --prefix backend install
npm run db:setup
```

`db:setup` runs `sql/schema.sql` and then inserts the demo catalogue, five demo orders and the admin account. Both steps are safe to run again:

- products/categories/orders use `ON CONFLICT DO NOTHING`
- the admin password is reset to the current `ADMIN_PASSWORD`

## 3. Run both apps

```bash
# terminal 1 — API on http://localhost:4000
npm run backend:dev

# terminal 2 — Next.js on http://localhost:3000
npm run dev
```

Open:

- storefront: <http://localhost:3000>
- shared sign-in / account creation: <http://localhost:3000/login> and <http://localhost:3000/signup>
- customer account and order tracking: <http://localhost:3000/account>
- admin panel: <http://localhost:3000/admin>

Admins sign in through the normal `/login` page with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env`. The API recognizes the privileged account and redirects it to `/admin`. New sign-ups are always customers.

To try order tracking, create a customer at `/signup`, add something to the cart and check out while signed in. The order appears at `/account` and can be followed at `/account/orders/:id`. Checking out while signed out remains a guest order and is not attached to an account.

## Development ports and CORS

The API allows the origins listed in `CORS_ORIGIN`. In development it also accepts any `localhost`/`127.0.0.1` port, so Next.js can move to `3001`, `3002`, etc. when `3000` is already in use. Production stays strict and only allows `CORS_ORIGIN`.

Cookies still work because both apps use the same host (`localhost`) during development. See the production note about same-host deployment below.

## How authentication works

1. `POST /api/auth/signup` creates a row in `customers` only. There is no role field in the request, so sign-up can never create an admin.
2. `POST /api/auth/login` looks for the email in `admin_users` first, then in `customers`, and checks the bcrypt hash. Unknown email and wrong password return the same generic error.
3. On success the API creates a row in `admin_sessions` or `customer_sessions` containing a **SHA-256 hash of a random token**. The raw token goes to the browser in an **HttpOnly, SameSite=Lax cookie**. JavaScript cannot read it.
4. Protected routes hash the cookie value and look up an unexpired session. `requireAdmin` and `requireCustomer` are separate, so a customer session can never call an admin API.
5. The browser keeps one active identity: signing in as a customer revokes an admin session and vice versa. Logout revokes both.
6. The shared `/login` page sends admins to `/admin` and customers to `/account` (or the safe `next` path, for example back to `/cart`).
7. The admin and account layouts forward cookies to `GET /api/auth/me` before rendering. Unauthenticated visitors get a real redirect to `/login?next=...`.

Admin sessions slide forward to seven days; customer sessions slide forward to 30 days. Expired rows are deleted at startup and periodically by the API.

## API overview

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | public | API + database health |
| `POST` | `/api/auth/signup` | public | Create a customer account and set its session cookie |
| `POST` | `/api/auth/login` | public | Shared admin/customer sign-in, set session cookie |
| `POST` | `/api/auth/logout` | cookie | Delete both session types and clear cookies |
| `GET` | `/api/auth/me` | cookie | Current admin or customer |
| `GET` | `/api/products` | public | Visible products; `?all=1` includes hidden ones for admins |
| `GET` | `/api/products/:id` | public | One visible product |
| `POST` | `/api/products` | admin | Create a product |
| `PATCH` | `/api/products/:id` | admin | Update fields, stock or visibility |
| `DELETE` | `/api/products/:id` | admin | Delete custom products, hide seeded ones |
| `GET` | `/api/categories` | public | Categories for filters and forms |
| `POST` | `/api/categories` | admin | Add a category |
| `POST` | `/api/orders` | public / customer cookie | Checkout; links the order to the customer when signed in (prices and stock checked server-side) |
| `GET` | `/api/orders` | admin | All orders |
| `GET` | `/api/orders/:id` | admin | One order with lines and history |
| `PATCH` | `/api/orders/:id/status` | admin | Change status and append history |
| `PATCH` | `/api/orders/:id/notes` | admin | Save internal notes |
| `GET` | `/api/account/orders` | customer | The signed-in customer's orders |
| `GET` | `/api/account/orders/:id` | customer | One order owned by the signed-in customer |

## Why prices are recalculated on the server

The browser sends only `productId` and `qty`. The API looks up the current price, converts USD to DZD, applies the promo discount, checks stock under a row lock (`SELECT ... FOR UPDATE`), and only then writes the order. This prevents a customer from editing prices in DevTools or buying stock that another order just took.

## Database tables

- `categories` — filter categories
- `products` — catalogue, price in USD, stock, visibility, `is_custom` flag
- `orders` — customer details, payment, status, notes, discount, nullable `customer_id` (NULL for guest orders)
- `order_items` — product snapshot (name + price at purchase time), quantity
- `order_history` — status timeline
- `admin_users` — admin accounts and bcrypt hashes
- `admin_sessions` — hashed admin session tokens and expiry
- `customers` — customer name, email, optional phone and bcrypt hash
- `customer_sessions` — hashed customer session tokens and expiry

Customer-facing order responses deliberately omit the shop's internal notes and status notes.

## Production notes

- Set `NODE_ENV=production`; cookies become `Secure` and require HTTPS.
- Serve the frontend and API from the **same host** and proxy `/api` through the frontend. The session cookie is host-only, so a separate `api.example.com` would not be visible to the Next.js server reading it on `app.example.com`. A same-origin proxy keeps that simple and also avoids CORS.
- Replace the in-memory login rate limiter with Redis if you run more than one API instance.
- Product images are currently stored as data URLs in the `image` column. For real traffic, upload to object storage (S3/R2) and store the URL instead.
- The promo rule is a demo: any non-empty code gives 10% off. Add a `promo_codes` table when you need real codes.
- Run `npm run backend:build` and `npm --prefix backend start` for a production build.
