import type { Product } from "@/lib/store";

export type ProductNoteChoice = { label: string; extraPrice: number };

export function normalizeNoteChoices(raw: unknown): ProductNoteChoice[] {
  if (!Array.isArray(raw)) return [];
  const out: ProductNoteChoice[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const label = item.trim();
      if (label) out.push({ label, extraPrice: 0 });
      continue;
    }
    if (item && typeof item === "object" && "label" in item) {
      const label = String((item as ProductNoteChoice).label ?? "").trim();
      if (!label) continue;
      const extra = Number((item as ProductNoteChoice).extraPrice);
      out.push({ label, extraPrice: Number.isFinite(extra) && extra > 0 ? +extra.toFixed(2) : 0 });
    }
  }
  return out;
}

export function getChoiceLabel(choice: ProductNoteChoice | string): string {
  return typeof choice === "string" ? choice : choice.label;
}

export function getChoiceExtraPrice(choice: ProductNoteChoice | string): number {
  return typeof choice === "string" ? 0 : choice.extraPrice;
}

export function findNoteChoice(product: Pick<Product, "noteChoices">, label?: string) {
  if (!label) return undefined;
  return product.noteChoices.find((c) => getChoiceLabel(c).toLowerCase() === label.toLowerCase());
}

export function resolveProductUnitPrice(product: Pick<Product, "price" | "noteChoices">, choiceLabel?: string) {
  const extra = findNoteChoice(product, choiceLabel)?.extraPrice ?? 0;
  return +(product.price + extra).toFixed(2);
}

export function getProductPriceRange(product: Pick<Product, "price" | "noteChoices">) {
  if (product.noteChoices.length === 0) {
    return { min: product.price, max: product.price };
  }
  const prices = product.noteChoices.map((c) => resolveProductUnitPrice(product, getChoiceLabel(c)));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function formatChoiceExtra(extraPrice: number, fmt: (n: number) => string) {
  if (extraPrice <= 0) return null;
  return `+${fmt(extraPrice)}`;
}

export function formatChoiceWithExtra(choice: ProductNoteChoice, fmt: (n: number) => string) {
  const extra = formatChoiceExtra(choice.extraPrice, fmt);
  return extra ? `${choice.label} (${extra})` : choice.label;
}

export function normalizeProduct<T extends Product>(product: T): T {
  return { ...product, noteChoices: normalizeNoteChoices(product.noteChoices) };
}
