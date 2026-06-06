import type { Category, HeroSettings, Offer, Order, Product } from "@/lib/store";
import { normalizeTaxRate, useAdmin, useShop } from "@/lib/store";
import * as api from "./backend";
import { isApiMode } from "./client";
import { hydrateShopFromApi, refreshAdminDataFromApi } from "./hydrate";

export async function loadAdminProfileFromApi() {
  if (!isApiMode) return;
  const profile = await api.fetchAdminProfile();
  useAdmin.getState().setUsername(profile.username);
}

export async function updateAdminCredentialsToApi(input: {
  username: string;
  password: string;
  currentPassword: string;
}) {
  if (!isApiMode) return;
  const result = await api.updateAdminCredentials(input);
  useAdmin.getState().setUsername(result.username);
}

export async function loadTaxRateFromApi() {
  if (!isApiMode) return;
  const { taxRatePercent } = await api.fetchTaxRate();
  useShop.getState().setTaxRatePercent(taxRatePercent);
}

export async function saveTaxRateToApi(taxRatePercent: number) {
  const rate = normalizeTaxRate(taxRatePercent);
  useShop.getState().setTaxRatePercent(rate);
  if (!isApiMode) {
    return rate;
  }
  const result = await api.saveTaxRate(rate);
  useShop.getState().setTaxRatePercent(result.taxRatePercent);
  return result.taxRatePercent;
}

export async function saveOffersVisibleToApi(visible: boolean) {
  if (!isApiMode) {
    useShop.getState().setOffersSectionVisible(visible);
    return;
  }
  await api.saveOffersVisible(visible);
  useShop.getState().setOffersSectionVisible(visible);
}

export async function saveHeroToApi(hero: HeroSettings) {
  useShop.getState().setHero(hero);
  if (!isApiMode) {
    return;
  }
  await api.saveHero(hero);
  await hydrateShopFromApi({ force: true });
}

export async function patchCategory(id: string, data: Partial<Category>) {
  if (!isApiMode) {
    useShop.getState().updateCategory(id, data);
    return;
  }
  const category = useShop.getState().categories.find((c) => c.id === id);
  if (!category) return;
  await api.updateCategory({ ...category, ...data });
  await hydrateShopFromApi({ force: true });
}

export async function saveCategory(editing: Category | null, data: Omit<Category, "id">) {
  if (!isApiMode) {
    if (editing) useShop.getState().updateCategory(editing.id, data);
    else useShop.getState().addCategory(data);
    return;
  }
  if (editing) {
    await api.updateCategory({ ...editing, ...data });
  } else {
    await api.createCategory(data);
  }
  await hydrateShopFromApi({ force: true });
}

export async function removeCategory(id: string) {
  if (!isApiMode) {
    useShop.getState().deleteCategory(id);
    return;
  }
  await api.deleteCategoryApi(id);
  await hydrateShopFromApi({ force: true });
}

export async function saveProduct(editing: Product | null, data: Omit<Product, "id">) {
  if (!isApiMode) {
    if (editing) useShop.getState().updateProduct(editing.id, data);
    else useShop.getState().addProduct(data);
    return;
  }
  if (editing) {
    await api.updateProduct({ ...editing, ...data });
  } else {
    await api.createProduct(data);
  }
  await hydrateShopFromApi({ force: true });
}

export async function removeProduct(id: string) {
  if (!isApiMode) {
    useShop.getState().deleteProduct(id);
    return;
  }
  await api.deleteProductApi(id);
  await hydrateShopFromApi({ force: true });
}

export async function saveOffer(editing: Offer | null, data: Omit<Offer, "id">) {
  if (!isApiMode) {
    if (editing) useShop.getState().updateOffer(editing.id, data);
    else useShop.getState().addOffer(data);
    return;
  }
  if (editing) {
    await api.updateOffer({ ...editing, ...data });
  } else {
    await api.createOffer(data);
  }
  await hydrateShopFromApi({ force: true });
}

export async function patchOffer(id: string, data: Partial<Offer>) {
  if (!isApiMode) {
    useShop.getState().updateOffer(id, data);
    return;
  }
  const offer = useShop.getState().offers.find((o) => o.id === id);
  if (!offer) return;
  await api.updateOffer({ ...offer, ...data });
  await hydrateShopFromApi({ force: true });
}

export async function removeOffer(id: string) {
  if (!isApiMode) {
    useShop.getState().deleteOffer(id);
    return;
  }
  await api.deleteOfferApi(id);
  await hydrateShopFromApi({ force: true });
}

export async function patchOrderStatus(orderId: string, status: Order["status"]) {
  if (!isApiMode) {
    useShop.getState().updateOrderStatus(orderId, status);
    return;
  }
  await api.updateOrderStatusApi(orderId, status);
  await refreshAdminDataFromApi();
}

export async function patchCateringStatus(id: string, status: "new" | "contacted" | "done") {
  if (!isApiMode) {
    useShop.getState().updateLargeOrderStatus(id, status);
    return;
  }
  await api.updateCateringStatusApi(id, status);
  await refreshAdminDataFromApi();
}

export async function removeOrder(id: string) {
  if (!isApiMode) {
    useShop.getState().deleteOrder(id);
    return;
  }
  await api.deleteOrderApi(id);
  await refreshAdminDataFromApi();
}

export async function removeCatering(id: string) {
  if (!isApiMode) {
    useShop.getState().deleteLargeOrder(id);
    return;
  }
  await api.deleteCateringApi(id);
  await refreshAdminDataFromApi();
}
