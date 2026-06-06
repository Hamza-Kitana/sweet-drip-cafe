import { isApiMode } from "./client";
import * as api from "./backend";
import { SHOP_SYNC_CHANNEL, useShop, type Order } from "@/lib/store";

function notifyCatalogUpdated() {
  if (typeof window === "undefined") return;
  try {
    new BroadcastChannel(SHOP_SYNC_CHANNEL).postMessage({ type: "catalog-updated" });
  } catch {
    /* BroadcastChannel unavailable */
  }
}

export async function hydrateShopFromApi(options?: { broadcast?: boolean }) {
  if (!isApiMode) return;
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
  if (options?.broadcast !== false) notifyCatalogUpdated();
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
    status: o.status as Order["status"],
    paymentStatus: o.paymentStatus,
  };
}
