# Inventory API

All responses use `{ success, message, data }`; errors use `{ success, message, errors }`. Send `Authorization: Bearer <Supabase access token>` to all routes except registration and login.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Products | `GET, POST /api/products`; `GET, PUT, DELETE /api/products/:id`; `GET /api/products/:id/transactions`; `GET /api/products/:id/stock-history` |
| Categories | `GET, POST /api/categories`; `GET, PUT, DELETE /api/categories/:id` |
| Transactions | `GET, POST /api/transactions`; `GET /api/transactions/:id`; `GET /api/transactions/product/:productId` |
| Company | `GET, PUT /api/company` |
| Reports | `GET /api/reports/dashboard`, `/inventory`, `/stock-movement`, `/low-stock`, `/transactions` |

`POST /api/transactions` accepts `{ type, remarks, date, items: [{ productId, quantity, adjustmentDirection? }] }`. Types are `opening_stock`, `stock_in`, `stock_out`, and `adjustment`. Quantity and monetary totals are computed in PostgreSQL, never trusted from the client. Product `POST` accepts multipart fields plus `image` and `openingQuantity`.

## Supabase setup and recovery

Run the SQL files in `supabase/migrations` in numeric order for a new project. If only the `profiles` table was deleted, run `004_repair_profiles_and_auth.sql` in the Supabase SQL editor. It restores the table, backfills profiles for existing auth users, and recreates the profile trigger used for future registrations. If the inventory tables were deleted, run `005_restore_inventory_schema.sql`; it is idempotent and preserves the recovered profiles table. Run `006_fix_product_optionals_and_transaction_total.sql` after an earlier schema restore to fix transaction totals and make SKU/category optional.

## LAN development

Start the backend with `npm run dev` in `Backend`, then the frontend with `npm run dev` in `Frontend`. Vite binds to all network interfaces and proxies `/api` to the backend, so access it from another device using the Network URL Vite prints (for example, `http://10.x.x.x:5173`). Do not set `VITE_API_URL` for this workflow.

## Account roles

Registration offers Staff and Administrator. Staff accounts need no extra setup. To allow an Administrator registration, set a private `ADMIN_REGISTRATION_CODE` (at least eight characters) in `Backend/.env`, restart the backend, and enter that same code in the registration form. This prevents an unauthenticated LAN user from assigning themselves administrator permissions.
