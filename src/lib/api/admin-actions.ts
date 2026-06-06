import type { Category, HeroSettings, Offer, Order, Product } from "@/lib/store";
import { normalizeOfferSchedule } from "@/lib/admin-dates";
import { normalizeTaxRate, useAdmin, useShop } from "@/lib/store";
import * as api from "./backend";
import { isApiMode } from "./client";
import {
  publishCatalogMutation,
  registerCategory,
  registerOffer,
  registerProduct,
  removeCategoryLocal,
  removeOfferLocal,
  removeProductLocal,
  updateCategoryLocal,
  updateOfferLocal,
  updateProductLocal,
} from "./catalog-sync";
import { hydrateShopFromApi, refreshAdminDataFromApi } from "./hydrate";
import { notifyLocalAdminDataChanged, notifyLocalCatalogChanged } from "./live-sync";

function afterLocalCatalogChange() {
  notifyLocalCatalogChanged();
}

function afterLocalAdminChange() {
  notifyLocalAdminDataChanged();
}

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
    afterLocalCatalogChange();
    return rate;
  }
  const result = await api.saveTaxRate(rate);
  useShop.getState().setTaxRatePercent(result.taxRatePercent);
  await publishCatalogMutation();
  return result.taxRatePercent;
}

export async function saveOffersVisibleToApi(visible: boolean) {
  if (!isApiMode) {
    useShop.getState().setOffersSectionVisible(visible);
    afterLocalCatalogChange();
    return;
  }
  useShop.getState().setOffersSectionVisible(visible);
  await api.saveOffersVisible(visible);
  await publishCatalogMutation();
}

export async function saveHeroToApi(hero: HeroSettings) {
  useShop.getState().setHero(hero);
  if (!isApiMode) {
    afterLocalCatalogChange();
    return;
  }
  await api.saveHero(hero);
  await publishCatalogMutation();
}

export async function patchCategory(id: string, data: Partial<Category>) {
  if (!isApiMode) {
    useShop.getState().updateCategory(id, data);
    afterLocalCatalogChange();
    return;
  }
  const category = useShop.getState().categories.find((c) => c.id === id);
  if (!category) throw new Error("Section not found — refresh and try again.");
  const next = { ...category, ...data };
  updateCategoryLocal(next);
  try {
    await api.updateCategory(next);
    await publishCatalogMutation();
  } catch (error) {
    updateCategoryLocal(category);
    throw error;
  }
}

export async function saveCategory(editing: Category | null, data: Omit<Category, "id">) {
  if (!isApiMode) {
    if (editing) useShop.getState().updateCategory(editing.id, data);
    else useShop.getState().addCategory(data);
    afterLocalCatalogChange();
    return;
  }

  if (editing) {
    const next = { ...editing, ...data };
    updateCategoryLocal(next);
    try {
      await api.updateCategory(next);
      await publishCatalogMutation();
    } catch (error) {
      updateCategoryLocal(editing);
      throw error;
    }
    return;
  }

  const created = await api.createCategory(data);
  registerCategory(created);
  await publishCatalogMutation();
}

export async function removeCategory(id: string) {
  if (!isApiMode) {
    useShop.getState().deleteCategory(id);
    afterLocalCatalogChange();
    return;
  }

  const prevCategories = useShop.getState().categories;
  const prevProducts = useShop.getState().products;
  removeCategoryLocal(id);
  try {
    await api.deleteCategoryApi(id);
    await publishCatalogMutation();
  } catch (error) {
    useShop.setState({ categories: prevCategories, products: prevProducts });
    throw error;
  }
}

export async function saveProduct(editing: Product | null, data: Omit<Product, "id">) {
  if (!isApiMode) {
    if (editing) useShop.getState().updateProduct(editing.id, data);
    else useShop.getState().addProduct(data);
    afterLocalCatalogChange();
    return;
  }

  if (editing) {
    const next = { ...editing, ...data };
    updateProductLocal(next);
    try {
      await api.updateProduct(next);
      await publishCatalogMutation();
    } catch (error) {
      updateProductLocal(editing);
      throw error;
    }
    return;
  }

  const created = await api.createProduct(data);
  registerProduct(created);
  await publishCatalogMutation();
}

export async function removeProduct(id: string) {
  if (!isApiMode) {
    useShop.getState().deleteProduct(id);
    afterLocalCatalogChange();
    return;
  }

  const prevProducts = useShop.getState().products;
  removeProductLocal(id);
  try {
    await api.deleteProductApi(id);
    await publishCatalogMutation();
  } catch (error) {
    useShop.setState({ products: prevProducts });
    throw error;
  }
}

export async function saveOffer(editing: Offer | null, data: Omit<Offer, "id">) {
  const payload = {
    ...data,
    startAt: normalizeOfferSchedule(data.startAt),
    endAt: normalizeOfferSchedule(data.endAt),
  };

  if (!isApiMode) {
    if (editing) useShop.getState().updateOffer(editing.id, payload);
    else useShop.getState().addOffer(payload);
    afterLocalCatalogChange();
    return;
  }

  if (editing) {
    const optimistic = { ...editing, ...payload };
    updateOfferLocal(optimistic);
    try {
      const saved = await api.updateOffer(optimistic);
      updateOfferLocal(saved);
      await publishCatalogMutation();
    } catch (error) {
      updateOfferLocal(editing);
      throw error;
    }
    return;
  }

  const created = await api.createOffer(payload);
  registerOffer(created);
  await publishCatalogMutation();
}

export async function patchOffer(id: string, data: Partial<Offer>) {
  if (!isApiMode) {
    useShop.getState().updateOffer(id, data);
    afterLocalCatalogChange();
    return;
  }

  const offer = useShop.getState().offers.find((o) => o.id === id);
  if (!offer) throw new Error("Offer not found — refresh the page and try again.");

  const optimistic = {
    ...offer,
    ...data,
    startAt: normalizeOfferSchedule(data.startAt ?? offer.startAt),
    endAt: normalizeOfferSchedule(data.endAt ?? offer.endAt),
  };
  updateOfferLocal(optimistic);
  try {
    const saved = await api.updateOffer(optimistic);
    updateOfferLocal(saved);
    await publishCatalogMutation();
  } catch (error) {
    updateOfferLocal(offer);
    throw error;
  }
}

export async function removeOffer(id: string) {
  if (!isApiMode) {
    useShop.getState().deleteOffer(id);
    afterLocalCatalogChange();
    return;
  }

  const prevOffers = useShop.getState().offers;
  removeOfferLocal(id);
  try {
    await api.deleteOfferApi(id);
    await publishCatalogMutation();
  } catch (error) {
    useShop.setState({ offers: prevOffers });
    throw error;
  }
}

export async function patchOrderStatus(orderId: string, status: Order["status"]) {
  if (!isApiMode) {
    useShop.getState().updateOrderStatus(orderId, status);
    afterLocalAdminChange();
    return;
  }
  await api.updateOrderStatusApi(orderId, status);
  await refreshAdminDataFromApi();
}

export async function patchCateringStatus(id: string, status: "new" | "contacted" | "done") {
  if (!isApiMode) {
    useShop.getState().updateLargeOrderStatus(id, status);
    afterLocalAdminChange();
    return;
  }
  await api.updateCateringStatusApi(id, status);
  await refreshAdminDataFromApi();
}

export async function removeOrder(id: string) {
  if (!isApiMode) {
    useShop.getState().deleteOrder(id);
    afterLocalAdminChange();
    return;
  }
  await api.deleteOrderApi(id);
  await refreshAdminDataFromApi();
}

export async function removeCatering(id: string) {
  if (!isApiMode) {
    useShop.getState().deleteLargeOrder(id);
    afterLocalAdminChange();
    return;
  }
  await api.deleteCateringApi(id);
  await refreshAdminDataFromApi();
}

export { hydrateShopFromApi };
