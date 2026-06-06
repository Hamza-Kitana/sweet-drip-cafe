# DNS — sweetdrip.cafe على Namecheap

**IP الهوست:** `203.161.44.168`

ادخل: **Namecheap → Domain List → sweetdrip.cafe → Manage → Advanced DNS**

احذف سجلات **Parking Page** / **URL Redirect** القديمة.

---

## 1) الموقع على Namecheap Hosting (اللي اشتريته)

| Type | Host | Value | TTL |
|------|------|-------|-----|
| **A Record** | `@` | `203.161.44.168` | Automatic |
| **A Record** | `www` | `203.161.44.168` | Automatic |

> إذا Namecheap يستخدم **Nameservers** تبع الهوست (مش BasicDNS)، اضبط السجلات من **cPanel → Zone Editor** بنفس القيم.

---

## 2) الباك اند (API) — Azure

الباك اند C# **ما بينرفع** على هوست Namecheap العادي. استخدم subdomain:

| Type | Host | Value |
|------|------|-------|
| **CNAME** | `api` | `YOUR-API.azurewebsites.net` |

(بعد ما تنشئ Azure App Service — مثلاً `sweetdrip-api.azurewebsites.net`)

---

## 3) SSL (HTTPS)

من **cPanel** على الهوست:
1. **SSL/TLS Status** أو **AutoSSL**
2. فعّل شهادة لـ `sweetdrip.cafe` و `www.sweetdrip.cafe`
3. **Force HTTPS Redirect** من cPanel إن وُجد

---

## 4) التحقق

بعد 10 دقائق – 24 ساعة:

```text
ping sweetdrip.cafe        → 203.161.44.168
https://sweetdrip.cafe     → الموقع
https://api.sweetdrip.cafe → API (بعد Azure)
```

---

## بديل: Vercel بدل الهوست

إذا Node.js ما اشتغل على الهوست، ارجع لـ Vercel للموقع:

| Type | Host | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com.` |

راجع `NAMECHEAP-HOSTING.md` لرفع الملفات على `203.161.44.168`.
