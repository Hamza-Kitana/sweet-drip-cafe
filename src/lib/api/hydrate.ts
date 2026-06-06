import { isApiMode } from "./client";
import { SHOP_SYNC_CHANNEL, useShop, type Order, normalizeOrderStatus } from "@/lib/store";
import { ackAdminMutation } from "./live-sync";
import { pullCatalogFromServer } from "./catalog-sync";

function notifyAdminDataUpdated() {
  if (typeof window === "undefined") return;
  try {
    new BroadcastChannel(SHOP_SYNC_CHANNEL).postMessage({ type: "admin-data-updated" });
  } catch {
    /* BroadcastChannel unavailable */
  }
}

let hydrateInflight: Promise<void> | null = null;
let lastHydrateAt = 0;
const HYDRATE_COOLDOWN_MS = 500;

export async function hydrateShopFromApi(options?: { broadcast?: boolean; force?: boolean }) {
  if (!isApiMode) return;

  const now = Date.now();
  if (!options?.force && hydrateInflight) return hydrateInflight;
  if (!options?.force && now - lastHydrateAt < HYDRATE_COOLDOWN_MS) return;

  hydrateInflight = (async () => {
    await pullCatalogFromServer(Boolean(options?.force));
    lastHydrateAt = Date.now();
  })();

  try {
    await hydrateInflight;
  } finally {
    hydrateInflight = null;
  }
}

export async function refreshAdminDataFromApi(options?: { broadcast?: boolean }) {
  if (!isApiMode) return;
  const { fetchOrders, fetchCatering } = await import("./backend");
  const [orders, catering] = await Promise.all([fetchOrders(), fetchCatering()]);
  useShop.setState({
    orders: orders.map(mapApiOrder),
    largeOrders: catering,
  });
  await ackAdminMutation();
  if (options?.broadcast !== false) notifyAdminDataUpdated();
}

function mapApiOrder(o: Order): Order {
  return {
    ...o,
    status: normalizeOrderStatus(o.status),
    paymentStatus: o.paymentStatus,
  };
}

// Re-export for admin-actions
export { publishCatalogMutation } from "./catalog-sync";
