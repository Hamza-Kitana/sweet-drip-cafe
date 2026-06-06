/** Production domain — sweetdrip.cafe (Namecheap) */
export const SITE_DOMAIN = "sweetdrip.cafe";
/** Namecheap hosting IP (DNS A record) */
export const NAMECHEAP_HOST_IP = "203.161.44.168";
export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ?? `https://${SITE_DOMAIN}`;
export const API_PUBLIC_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? `https://api.${SITE_DOMAIN}`;
