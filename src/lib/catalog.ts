import type { Category } from "@/lib/store";

export function isCategoryVisible(c: Pick<Category, "visible">) {
  return c.visible !== false;
}

export function visibleCategories(categories: Category[]) {
  return categories.filter(isCategoryVisible);
}

export function isOffersSectionVisible(visible: boolean | undefined) {
  return visible !== false;
}
