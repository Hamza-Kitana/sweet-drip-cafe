import type { LucideIcon } from "lucide-react";
import { Cake, Coffee, Cookie, CupSoda, IceCreamCone, Sparkles } from "lucide-react";

export const PRODUCT_IMAGE_NONE = "product-image:none";
export const PRODUCT_IMAGE_SECTION = "product-image:section";
const ICON_PREFIX = "product-image:icon-";

export type ProductImageMode = "none" | "section" | "icon" | "upload";

export type ProductImageIconId = "coffee" | "cake" | "ice-cream" | "cookie" | "drink" | "sparkle";

export const PRODUCT_IMAGE_ICONS: {
  id: ProductImageIconId;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "cake", label: "Cake", Icon: Cake },
  { id: "coffee", label: "Coffee", Icon: Coffee },
  { id: "ice-cream", label: "Ice cream", Icon: IceCreamCone },
  { id: "cookie", label: "Cookie", Icon: Cookie },
  { id: "drink", label: "Drink", Icon: CupSoda },
  { id: "sparkle", label: "Dessert", Icon: Sparkles },
];

export type ResolvedProductImage =
  | { type: "none" }
  | { type: "section"; url: string }
  | { type: "icon"; iconId: ProductImageIconId }
  | { type: "upload"; url: string };

function isCustomImageUrl(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:image")
  );
}

export function encodeProductImage(
  mode: ProductImageMode,
  options: { iconId?: ProductImageIconId; uploadUrl?: string },
): string {
  if (mode === "none") return PRODUCT_IMAGE_NONE;
  if (mode === "section") return PRODUCT_IMAGE_SECTION;
  if (mode === "icon" && options.iconId) return `${ICON_PREFIX}${options.iconId}`;
  return (options.uploadUrl ?? "").trim();
}

export function parseProductImageStored(
  stored: string | undefined,
  categoryImageUrl?: string,
): { mode: ProductImageMode; iconId: ProductImageIconId; uploadUrl: string } {
  const value = (stored ?? "").trim();

  if (value === PRODUCT_IMAGE_NONE) {
    return { mode: "none", iconId: "cake", uploadUrl: "" };
  }
  if (value === PRODUCT_IMAGE_SECTION) {
    return { mode: "section", iconId: "cake", uploadUrl: "" };
  }
  if (value.startsWith(ICON_PREFIX)) {
    const iconId = value.slice(ICON_PREFIX.length) as ProductImageIconId;
    const valid = PRODUCT_IMAGE_ICONS.some((i) => i.id === iconId);
    return { mode: "icon", iconId: valid ? iconId : "cake", uploadUrl: "" };
  }
  if (isCustomImageUrl(value)) {
    if (categoryImageUrl && value === categoryImageUrl) {
      return { mode: "section", iconId: "cake", uploadUrl: "" };
    }
    return { mode: "upload", iconId: "cake", uploadUrl: value };
  }

  // Legacy empty → section image
  return { mode: "section", iconId: "cake", uploadUrl: "" };
}

export function resolveProductImage(
  stored: string | undefined,
  categoryImageUrl?: string,
): ResolvedProductImage {
  const parsed = parseProductImageStored(stored, categoryImageUrl);

  if (parsed.mode === "none") return { type: "none" };
  if (parsed.mode === "icon") return { type: "icon", iconId: parsed.iconId };
  if (parsed.mode === "section") {
    if (categoryImageUrl) return { type: "section", url: categoryImageUrl };
    return { type: "none" };
  }
  if (parsed.uploadUrl) return { type: "upload", url: parsed.uploadUrl };
  return { type: "none" };
}

export function getProductIcon(iconId: ProductImageIconId) {
  return PRODUCT_IMAGE_ICONS.find((i) => i.id === iconId)?.Icon ?? Sparkles;
}

/** URL for cart/checkout thumbnails — empty when none or icon. */
export function productImageForCart(stored: string | undefined, categoryImageUrl?: string) {
  const resolved = resolveProductImage(stored, categoryImageUrl);
  if (resolved.type === "upload" || resolved.type === "section") return resolved.url;
  return stored?.trim() || "";
}

export function isProductIconImage(value: string | undefined) {
  return Boolean(value?.startsWith(ICON_PREFIX));
}
