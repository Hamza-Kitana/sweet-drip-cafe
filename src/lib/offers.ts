import type { Offer, Product } from "@/lib/store";

export const OFFERS_MENU_FILTER = "offers";

const DEFAULT_OFFER_PRODUCTS: Record<string, string[]> = {
  o1: ["p1", "p5", "p3"],
  o2: ["p6", "p7"],
};

export function getOfferProductIds(offer: Pick<Offer, "id" | "productIds">) {
  if (offer.productIds?.length) return offer.productIds;
  return DEFAULT_OFFER_PRODUCTS[offer.id] ?? [];
}

export function resolveOfferProducts(offer: Pick<Offer, "id" | "productIds">, products: Product[]) {
  const ids = getOfferProductIds(offer);
  return ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
}

export function isOffersMenuFilter(cat: string | undefined) {
  return cat === OFFERS_MENU_FILTER;
}

export function isLiveOffer(o: Pick<Offer, "active" | "startAt" | "endAt">) {
  if (!o.active) return false;
  const now = new Date();
  if (o.startAt && new Date(o.startAt) > now) return false;
  if (o.endAt && new Date(o.endAt) < now) return false;
  return true;
}

export function offerCartProductId(offerId: string) {
  return `offer:${offerId}`;
}

export function isOfferCartItem(productId: string) {
  return productId.startsWith("offer:");
}
