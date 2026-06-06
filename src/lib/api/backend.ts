import type { BackgroundSlide, Category, HeroSettings, LargeOrderRequest, Offer, Order, Product } from "@/lib/store";
import { apiFetch } from "./client";

type CatalogResponse = {
  categories: Category[];
  products: Product[];
  offers: Offer[];
  hero: HeroSettings & { backgroundSlides: BackgroundSlide[] };
  taxRatePercent: number;
  offersSectionVisible: boolean;
};

let catalogInflight: Promise<CatalogResponse> | null = null;

export async function fetchSyncRevision() {
  return apiFetch<{ catalogRevision: number; adminRevision: number }>("/api/sync/revision", {
    cache: "no-store",
  });
}

export async function fetchCatalog(options?: { fresh?: boolean }) {
  const path = options?.fresh ? `/api/catalog?_=${Date.now()}` : "/api/catalog";
  const init: RequestInit = options?.fresh ? { cache: "no-store" } : {};

  if (!options?.fresh && catalogInflight) return catalogInflight;

  const request = apiFetch<CatalogResponse>(path, init).finally(() => {
    if (!options?.fresh) catalogInflight = null;
  });

  if (!options?.fresh) catalogInflight = request;
  return request;
}

type ApiOrder = Order & {
  paymentStatus: "pending" | "paid" | "failed";
  paymentFailureReason?: string | null;
  stripePaymentIntentId?: string | null;
};

export async function loginAdmin(username: string, password: string) {
  return apiFetch<{ token: string; username: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchAdminProfile() {
  return apiFetch<{ username: string }>("/api/auth/me");
}

export async function updateAdminCredentials(input: {
  username: string;
  password: string;
  currentPassword: string;
}) {
  return apiFetch<{ ok: boolean; username: string }>("/api/auth/credentials", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function fetchOrders() {
  return apiFetch<ApiOrder[]>("/api/orders");
}

export async function fetchOrder(id: string) {
  return apiFetch<ApiOrder>(`/api/orders/${id}`);
}

export async function checkoutOrder(input: {
  items: Array<{
    productId: string;
    name: string;
    price: number;
    qty: number;
    note?: string;
    noteChoice?: string;
    image?: string;
  }>;
  tip: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    message?: string;
  };
}) {
  return apiFetch<{
    orderId: string;
    clientSecret: string;
    paymentIntentId: string;
    subtotal: number;
    tip: number;
    tax: number;
    taxRatePercent: number;
    total: number;
  }>("/api/orders/checkout", { method: "POST", body: JSON.stringify(input) });
}

export async function confirmOrderPayment(orderId: string, paymentIntentId: string) {
  return apiFetch<ApiOrder>(`/api/orders/${orderId}/confirm-payment`, {
    method: "POST",
    body: JSON.stringify({ paymentIntentId }),
  });
}

export async function updateOrderStatusApi(orderId: string, status: Order["status"]) {
  return apiFetch<ApiOrder>(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteOrderApi(id: string) {
  return apiFetch<void>(`/api/orders/${id}`, { method: "DELETE" });
}

export async function submitCatering(input: Omit<LargeOrderRequest, "id" | "createdAt" | "status">) {
  return apiFetch<LargeOrderRequest>("/api/catering", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchCatering() {
  return apiFetch<LargeOrderRequest[]>("/api/catering");
}

export async function updateCateringStatusApi(id: string, status: LargeOrderRequest["status"]) {
  return apiFetch<LargeOrderRequest>(`/api/catering/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteCateringApi(id: string) {
  return apiFetch<void>(`/api/catering/${id}`, { method: "DELETE" });
}

export async function fetchOverviewStats() {
  return apiFetch<{
    revenue: number;
    orderCount: number;
    newOrders: number;
    unpaidOrders: number;
    averageOrder: number;
  }>("/api/admin/overview");
}

export async function fetchTaxRate() {
  return apiFetch<{ taxRatePercent: number }>("/api/admin/settings/tax-rate");
}

export async function saveTaxRate(taxRatePercent: number) {
  return apiFetch<{ taxRatePercent: number }>("/api/admin/settings/tax-rate", {
    method: "PUT",
    body: JSON.stringify({ taxRatePercent }),
  });
}

export async function saveOffersVisible(visible: boolean) {
  return apiFetch<void>("/api/admin/settings/offers-visible", {
    method: "PUT",
    body: JSON.stringify({ visible }),
  });
}

export async function saveHero(hero: HeroSettings) {
  return apiFetch<void>("/api/admin/hero", {
    method: "PUT",
    body: JSON.stringify(hero),
  });
}

export async function createCategory(category: Omit<Category, "id">) {
  return apiFetch<Category>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
}

export async function updateCategory(category: Category) {
  return apiFetch<void>(`/api/admin/categories/${category.id}`, {
    method: "PUT",
    body: JSON.stringify(category),
  });
}

export async function deleteCategoryApi(id: string) {
  return apiFetch<void>(`/api/admin/categories/${id}`, { method: "DELETE" });
}

export async function createProduct(product: Omit<Product, "id">) {
  return apiFetch<Product>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(product: Product) {
  return apiFetch<void>(`/api/admin/products/${product.id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export async function deleteProductApi(id: string) {
  return apiFetch<void>(`/api/admin/products/${id}`, { method: "DELETE" });
}

export async function createOffer(offer: Omit<Offer, "id">) {
  return apiFetch<Offer>("/api/admin/offers", {
    method: "POST",
    body: JSON.stringify(offer),
  });
}

export async function updateOffer(offer: Offer) {
  return apiFetch<Offer>(`/api/admin/offers/${offer.id}`, {
    method: "PUT",
    body: JSON.stringify(offer),
  });
}

export async function deleteOfferApi(id: string) {
  return apiFetch<void>(`/api/admin/offers/${id}`, { method: "DELETE" });
}
