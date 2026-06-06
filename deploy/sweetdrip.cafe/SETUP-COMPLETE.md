# نشر sweetdrip.cafe — دليل كامل

**IP الهوست (Namecheap):** `203.161.44.168`

## مكونات المشروع

| جزء | الرابط | أين يرفع |
|-----|--------|----------|
| الموقع | https://sweetdrip.cafe | **Namecheap Hosting** → `203.161.44.168` |
| API | https://api.sweetdrip.cafe | **Azure App Service** |
| Database | SQL Server | **Azure SQL** |
| الدومين + DNS | sweetdrip.cafe | **Namecheap** |

> الهوست `203.161.44.168` للموقع (Node.js). الباك اند C# + SQL على Azure.

---

## الخطوة 0 — DNS (Namecheap Advanced DNS)

| Type | Host | Value |
|------|------|-------|
| **A** | `@` | `203.161.44.168` |
| **A** | `www` | `203.161.44.168` |
| **CNAME** | `api` | `YOUR-API.azurewebsites.net` *(بعد Azure)* |

التفاصيل: `DNS-NAMECHEAP.md`

---

## الخطوة 1 — GitHub (جاهز)

الريبو: `Hamza-Kitana/sweet-drip-cafe`

---

## الخطوة 2 — Azure SQL

1. [portal.azure.com](https://portal.azure.com) → Create **SQL Database** → `SweetDripDb`
2. أنشئ Server + username + password
3. Networking → Allow Azure services
4. انسخ Connection string (ADO.NET)

---

## الخطوة 3 — Azure App Service (Backend)

1. Create **Web App** → Runtime **.NET 8**
2. Name: `sweetdrip-api` (مثال)
3. **Configuration → Application settings**:

```
ConnectionStrings__DefaultConnection = (Azure SQL connection string)
Stripe__SecretKey = sk_live_...
Stripe__WebhookSecret = whsec_...
Jwt__Key = (32+ random characters)
Cors__Origins__0 = https://sweetdrip.cafe
Cors__Origins__1 = https://www.sweetdrip.cafe
ASPNETCORE_ENVIRONMENT = Production
```

4. Deployment Center → GitHub → Path: `backend/SweetDrip.Api`
5. Custom domains → `api.sweetdrip.cafe`

---

## الخطوة 4 — Namecheap Hosting (203.161.44.168)

1. Namecheap → **Hosting List** → **Go to cPanel**
2. **Setup Node.js App** → startup file: `server/index.mjs`
3. على جهازك: `npm run build` → ارفع مجلد `.output/` عبر FTP
4. Environment على السيرفر (راجع `host.env.example`):

```
VITE_SITE_URL=https://sweetdrip.cafe
VITE_API_URL=https://api.sweetdrip.cafe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

5. cPanel → **SSL** → AutoSSL لـ sweetdrip.cafe

التفاصيل: `NAMECHEAP-HOSTING.md`

---

## بديل — Vercel (إذا Node ما اشتغل على الهوست)

1. Vercel → Import GitHub + env vars
2. غيّر DNS `@` إلى `76.76.21.21` (راجع DNS-NAMECHEAP.md)

---

## الخطوة 5 — Stripe

1. Live mode → API keys
2. Webhook: `https://api.sweetdrip.cafe/api/stripe/webhook`
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. `whsec_...` → Azure `Stripe__WebhookSecret`

---

## الخطوة 6 — بعد النشر

1. https://sweetdrip.cafe يفتح (IP: 203.161.44.168)
2. Admin → غيّر الباسورد من `admin123`
3. جرّب طلب + دفع
4. Admin → Orders → Paid

---

## اختبار محلي

```bash
npm run dev
# .env → VITE_API_URL=http://localhost:5025
```

أو `start-dev.bat`
