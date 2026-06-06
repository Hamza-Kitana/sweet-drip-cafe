# رفع الموقع على Namecheap Hosting

**IP:** `203.161.44.168`  
**الدومين:** `sweetdrip.cafe`  
**cPanel:** من Namecheap → Hosting List → Manage → **Go to cPanel**

---

## قبل الرفع — ابنِ المشروع على جهازك

```bash
cd sweet-drip-designs-main
npm install
npm run build
```

ينتج مجلد `.output/` — هذا اللي بيرفع على السيرفر.

---

## الطريقة أ — Node.js App (مُفضّلة إذا متوفرة)

1. cPanel → **Setup Node.js App** → **Create Application**
2. **Node.js version:** 20 أو أحدث
3. **Application mode:** Production
4. **Application root:** `sweetdrip` (مجلد جديد)
5. **Application URL:** `sweetdrip.cafe`
6. **Application startup file:** `server/index.mjs`

7. ارفع عبر **File Manager** أو FTP إلى مجلد التطبيق:
   - كل محتويات `.output/` (مجلد `server/` + `public/` + `nitro.json`)
   - انسخ `.env.production.example` → `.env` على السيرفر وعدّل:

```env
VITE_SITE_URL=https://sweetdrip.cafe
VITE_API_URL=https://api.sweetdrip.cafe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
NODE_ENV=production
PORT=(يحدده cPanel تلقائياً)
```

8. من Node.js App → **Run NPM Install** (إن طلب) → **Restart**

9. cPanel → **SSL** → فعّل HTTPS

---

## الطريقة ب — FTP إلى public_html

إذا **ما في** Node.js App:

1. cPanel → **FTP Accounts** — أنشئ حساب FTP
2. Host: `203.161.44.168` أو `ftp.sweetdrip.cafe`
3. ارفع إلى `public_html/`

> TanStack Start يحتاج **Node.js**. بدون Node، تواصل مع Namecheap لتفعيل Node أو استخدم **Vercel** للموقع (DNS يتغير — راجع `DNS-NAMECHEAP.md`).

---

## Stripe على الهوست

مفتاح `STRIPE_SECRET_KEY` لازم يكون على السيرفر (Node env) — **لا** ترفع `.env` على GitHub.

---

## الباك اند + الداتابيس

| الخدمة | وين |
|--------|-----|
| الموقع | `203.161.44.168` (Namecheap) |
| API | Azure → `api.sweetdrip.cafe` |
| SQL Server | Azure SQL |

راجع `SETUP-COMPLETE.md` لخطوات Azure.

---

## FTP سريع

| | |
|--|--|
| Server | `203.161.44.168` |
| Port | 21 (FTP) أو 22 (SFTP إن متوفر) |
| User | من cPanel → FTP Accounts |
| Folder | `public_html` أو مجلد Node app |

---

## بعد الرفع

1. https://sweetdrip.cafe يفتح
2. Menu + Checkout يشتغلو
3. `VITE_API_URL=https://api.sweetdrip.cafe` بعد ما Azure جاهز
4. Admin → غيّر الباسورد
