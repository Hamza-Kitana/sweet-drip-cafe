# ارفع الموقع على Namecheap — 10 دقائق

**IP:** 203.161.44.168 · **Domain:** sweetdrip.cafe

> ⚠️ **لا ترسل باسوردات cPanel في الشات.** اتبع الخطوات بنفسك — الملفات جاهزة.

---

## 1) DNS (Namecheap → Advanced DNS)

| Type | Host | Value |
|------|------|-------|
| A | `@` | 203.161.44.168 |
| A | `www` | 203.161.44.168 |

---

## 2) cPanel → Setup Node.js App

1. **Create Application**
2. Node **20+** · Mode **Production**
3. Application root: `sweetdrip` (مجلد جديد)
4. Application URL: `sweetdrip.cafe`
5. **Startup file:** `server/index.mjs`

---

## 3) رفع الملفات

**الملف الجاهز على جهازك:**
```
deploy/sweetdrip.cafe/sweetdrip-site.zip
```

1. cPanel → **File Manager** → مجلد التطبيق `sweetdrip`
2. **Upload** → ارفع `sweetdrip-site.zip`
3. **Extract** (فك الضغط) داخل المجلد
4. ارفع أيضاً `deploy/sweetdrip.cafe/package.json` لنفس المجلد

---

## 4) Environment Variables (Node.js App)

في cPanel → Node.js App → **Edit** → Environment:

```
NODE_ENV=production
VITE_SITE_URL=https://sweetdrip.cafe
VITE_API_URL=https://api.sweetdrip.cafe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

*(بدون API جاهز بعد، احذف VITE_API_URL أو اترك الموقع يشتغل بدون داتابيس مؤقتاً)*

---

## 5) SSL

cPanel → **SSL/TLS Status** → Run **AutoSSL** لـ sweetdrip.cafe

---

## 6) Restart

Node.js App → **Restart**

افتح: https://sweetdrip.cafe

---

## الباك اند (Azure) — لاحقاً

ما بينرفع على Namecheap. راجع `SETUP-COMPLETE.md`.

---

## إعادة البناء على جهازك

```bash
npm run build
```

ثم أعد ضغط `.output` → `sweetdrip-site.zip`
