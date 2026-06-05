# Sweet Drip API (ASP.NET Core 8 + SQL Server)

REST API for the Sweet Drip cafe website. All catalog, orders, payments, admin settings, and site content are stored in SQL Server.

## Requirements

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- SQL Server or LocalDB (included with Visual Studio / SQL Server Express)

## Quick start

```bash
cd backend/SweetDrip.Api
dotnet run
```

API runs at `http://localhost:5080` by default. On first launch EF Core creates the database and seeds demo data.

Default admin login (change in Settings after first sign-in):

- Username: `admin`
- Password: `admin123`

## Configuration

Edit `appsettings.json` or use environment variables:

| Setting | Description |
|---------|-------------|
| `ConnectionStrings:DefaultConnection` | SQL Server connection string |
| `Jwt:Key` | JWT signing secret (32+ chars) |
| `Stripe:SecretKey` | Stripe secret key (`sk_live_` or `sk_test_`) |
| `Stripe:WebhookSecret` | Stripe webhook signing secret |
| `Cors:Origins` | Allowed frontend URLs |

Example production connection string:

```
Server=your-server.database.windows.net;Database=SweetDripDb;User Id=...;Password=...;TrustServerCertificate=True;
```

## Frontend connection

In the project root `.env`:

```
VITE_API_URL=http://localhost:5025
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

When `VITE_API_URL` is set, the React app loads products, offers, hero images, tax rate, and admin data from this API instead of localStorage.

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/catalog` | — | Categories, products, offers, hero, tax rate |
| POST | `/api/orders/checkout` | — | Create pending order + Stripe PaymentIntent |
| POST | `/api/orders/{id}/confirm-payment` | — | Mark order paid after Stripe success |
| GET | `/api/orders/{id}` | — | Fetch single order (invoice) |
| POST | `/api/catering` | — | Submit catering request |
| POST | `/api/auth/login` | — | Admin JWT login |
| PUT | `/api/auth/credentials` | JWT | Update admin username/password |
| GET | `/api/admin/overview` | JWT | Dashboard stats from DB |
| GET | `/api/orders` | JWT | All orders (incl. unpaid) |
| GET | `/api/catering` | JWT | Catering requests |
| CRUD | `/api/admin/categories`, `/products`, `/offers` | JWT | Catalog management |
| PUT | `/api/admin/hero` | JWT | Site hero & images |
| PUT | `/api/admin/settings/tax-rate` | JWT | Sales tax % |
| POST | `/api/stripe/webhook` | Stripe | Payment confirmation webhook |

## Order payment flow

1. Customer submits checkout → `POST /api/orders/checkout` saves order with `PaymentStatus=Pending`.
2. Stripe Payment Element confirms payment in the browser.
3. Frontend calls `POST /api/orders/{id}/confirm-payment` → status becomes `Paid`.
4. If payment fails, order stays `Pending` or `Failed` — visible in admin as **Unpaid**.

Configure Stripe webhook in production:

```
https://your-api-domain.com/api/stripe/webhook
```

## Database

See `database/schema.sql` for the full table layout. Images and content are stored as URL strings or base64 in `NVARCHAR(MAX)` columns.
