import { isApiMode } from "./client";
import * as api from "./backend";
import { SHOP_SYNC_CHANNEL, useShop, type Order, normalizeOrderStatus } from "@/lib/store";

function notifyCatalogUpdated() {
  if (typeof window === "undefined") return;
  try {
    new BroadcastChannel(SHOP_SYNC_CHANNEL).postMessage({ type: "catalog-updated" });
  } catch {
    /* BroadcastChannel unavailable */
  }
}

let hydrateInflight: Promise<void> | null = null;
let lastHydrateAt = 0;
const HYDRATE_COOLDOWN_MS = 1500;

export async function hydrateShopFromApi(options?: { broadcast?: boolean; force?: boolean }) {
  if (!isApiMode) return;

  const now = Date.now();
  if (!options?.force && hydrateInflight) return hydrateInflight;
  if (!options?.force && now - lastHydrateAt < HYDRATE_COOLDOWN_MS) return;

  hydrateInflight = (async () => {
    const catalog = await api.fetchCatalog();
    useShop.setState({
      categories: catalog.categories,
      products: catalog.products,
      offers: catalog.offers,
      hero: {
        ...catalog.hero,
        backgroundSlides: catalog.hero.backgroundSlides ?? [],
        floatingImages: catalog.hero.floatingImages ?? [],
      },
      taxRatePercent: catalog.taxRatePercent,
      offersSectionVisible: catalog.offersSectionVisible,
    });
    lastHydrateAt = Date.now();
    if (options?.broadcast !== false) notifyCatalogUpdated();
  })();

  try {
    await hydrateInflight;
  } finally {
    hydrateInflight = null;
  }
}

export async function refreshAdminDataFromApi() {
  if (!isApiMode) return;
  const [orders, catering] = await Promise.all([api.fetchOrders(), api.fetchCatering()]);
  useShop.setState({
    orders: orders.map(mapApiOrder),
    largeOrders: catering,
  });
}

function mapApiOrder(o: Order): Order {
  return {
    ...o,
    status: normalizeOrderStatus(o.status),
    paymentStatus: o.paymentStatus,
  };
}
