import type { Category, Offer, Product } from "@/lib/store";
import { useShop } from "@/lib/store";
import { SHOP_SYNC_CHANNEL } from "@/lib/store";
import type { HeroSettings } from "@/lib/store";
import { normalizeProduct } from "@/lib/product-options";
import * as api from "./backend";
import { isApiMode } from "./client";
import { ackCatalogMutation } from "./live-sync";

type CatalogPayload = {
  categories: Category[];
  products: Product[];
  offers: Offer[];
  hero: HeroSettings & { backgroundSlides?: { image: string; caption: string }[]; floatingImages?: string[] };
  taxRatePercent: number;
  offersSectionVisible: boolean;
};

const TAB_ID =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const tombstoneCategories = new Set<string>();
const tombstoneProducts = new Set<string>();
const tombstoneOffers = new Set<string>();

const pendingCategories = new Map<string, Category>();
const pendingProducts = new Map<string, Product>();
const pendingOffers = new Map<string, Offer>();

const TOMBSTONE_TTL_MS = 60_000;

function scheduleTombstoneClear(kind: "categories" | "products" | "offers", id: string) {
  window.setTimeout(() => {
    if (kind === "categories") tombstoneCategories.delete(id);
    if (kind === "products") tombstoneProducts.delete(id);
    if (kind === "offers") tombstoneOffers.delete(id);
  }, TOMBSTONE_TTL_MS);
}

function mergeServerList<T extends { id: string }>(
  server: T[],
  pending: Map<string, T>,
  tombstones: Set<string>,
) {
  const map = new Map<string, T>();
  for (const item of server) {
    if (tombstones.has(item.id)) continue;
    map.set(item.id, item);
    pending.delete(item.id);
  }
  for (const item of pending.values()) {
    if (!tombstones.has(item.id)) map.set(item.id, item);
  }
  return [...map.values()];
}

export function applyCatalogToShop(catalog: CatalogPayload) {
  useShop.setState({
    categories: mergeServerList(catalog.categories, pendingCategories, tombstoneCategories),
    products: mergeServerList(
      catalog.products.map(normalizeProduct),
      pendingProducts,
      tombstoneProducts,
    ),
    offers: mergeServerList(catalog.offers, pendingOffers, tombstoneOffers),
    hero: {
      ...catalog.hero,
      backgroundSlides: catalog.hero.backgroundSlides ?? [],
      floatingImages: catalog.hero.floatingImages ?? [],
    },
    taxRatePercent: catalog.taxRatePercent,
    offersSectionVisible: catalog.offersSectionVisible,
  });
}

export function registerCategory(category: Category) {
  pendingCategories.set(category.id, category);
  tombstoneCategories.delete(category.id);
  useShop.setState({ categories: [...useShop.getState().categories.filter((c) => c.id !== category.id), category] });
}

export function updateCategoryLocal(category: Category) {
  pendingCategories.set(category.id, category);
  useShop.setState({
    categories: useShop.getState().categories.map((c) => (c.id === category.id ? category : c)),
  });
}

export function removeCategoryLocal(id: string) {
  for (const product of useShop.getState().products.filter((p) => p.categoryId === id)) {
    tombstoneProducts.add(product.id);
    pendingProducts.delete(product.id);
    scheduleTombstoneClear("products", product.id);
  }
  tombstoneCategories.add(id);
  pendingCategories.delete(id);
  scheduleTombstoneClear("categories", id);
  useShop.setState({
    categories: useShop.getState().categories.filter((c) => c.id !== id),
    products: useShop.getState().products.filter((p) => p.categoryId !== id),
  });
}

export function registerProduct(product: Product) {
  pendingProducts.set(product.id, product);
  tombstoneProducts.delete(product.id);
  useShop.setState({ products: [...useShop.getState().products.filter((p) => p.id !== product.id), product] });
}

export function updateProductLocal(product: Product) {
  pendingProducts.set(product.id, product);
  useShop.setState({
    products: useShop.getState().products.map((p) => (p.id === product.id ? product : p)),
  });
}

export function removeProductLocal(id: string) {
  tombstoneProducts.add(id);
  pendingProducts.delete(id);
  scheduleTombstoneClear("products", id);
  useShop.setState({ products: useShop.getState().products.filter((p) => p.id !== id) });
}

export function registerOffer(offer: Offer) {
  pendingOffers.set(offer.id, offer);
  tombstoneOffers.delete(offer.id);
  useShop.setState({ offers: [...useShop.getState().offers.filter((o) => o.id !== offer.id), offer] });
}

export function updateOfferLocal(offer: Offer) {
  pendingOffers.set(offer.id, offer);
  useShop.setState({
    offers: useShop.getState().offers.map((o) => (o.id === offer.id ? offer : o)),
  });
}

export function removeOfferLocal(id: string) {
  tombstoneOffers.add(id);
  pendingOffers.delete(id);
  scheduleTombstoneClear("offers", id);
  useShop.setState({ offers: useShop.getState().offers.filter((o) => o.id !== id) });
}

export function getTabId() {
  return TAB_ID;
}

export function broadcastCatalogUpdated() {
  if (typeof window === "undefined") return;
  try {
    new BroadcastChannel(SHOP_SYNC_CHANNEL).postMessage({
      type: "catalog-updated",
      sourceTabId: TAB_ID,
    });
  } catch {
    /* BroadcastChannel unavailable */
  }
}

/** After a successful admin catalog mutation — never re-fetch on this tab (UI already updated). */
export async function publishCatalogMutation() {
  if (!isApiMode) {
    broadcastCatalogUpdated();
    return;
  }
  await ackCatalogMutation();
  broadcastCatalogUpdated();
}

export async function pullCatalogFromServer(force = true) {
  if (!isApiMode) return;
  const catalog = await api.fetchCatalog({ fresh: force });
  applyCatalogToShop(catalog);
  await ackCatalogMutation();
}

export function isSameTabBroadcast(sourceTabId?: string) {
  return Boolean(sourceTabId && sourceTabId === TAB_ID);
}
