import type { Product } from "@/lib/store";

export type ProductNoteChoice = { label: string; extraPrice: number };
export type ProductOptionSelectionType = "single" | "multiple";

export type ProductOptionGroup = {
  id: string;
  label: string;
  selectionType: ProductOptionSelectionType;
  required: boolean;
  choices: ProductNoteChoice[];
};

export type CartSelectedOption = {
  groupId: string;
  groupLabel: string;
  choices: string[];
};

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "group";
}

function normalizeChoice(raw: unknown): ProductNoteChoice | null {
  if (typeof raw === "string") {
    const label = raw.trim();
    return label ? { label, extraPrice: 0 } : null;
  }
  if (raw && typeof raw === "object" && "label" in raw) {
    const label = String((raw as ProductNoteChoice).label ?? "").trim();
    if (!label) return null;
    const extra = Number((raw as ProductNoteChoice).extraPrice);
    return { label, extraPrice: Number.isFinite(extra) && extra > 0 ? +extra.toFixed(2) : 0 };
  }
  return null;
}

function normalizeChoices(raw: unknown): ProductNoteChoice[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeChoice).filter(Boolean) as ProductNoteChoice[];
}

export function normalizeOptionGroups(
  raw: unknown,
  legacyNotes?: string,
  legacyFlatChoices?: unknown,
): ProductOptionGroup[] {
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (first && typeof first === "object" && ("choices" in first || "selectionType" in first)) {
      const groups: ProductOptionGroup[] = [];
      for (const item of raw) {
        if (!item || typeof item !== "object") continue;
        const obj = item as Partial<ProductOptionGroup> & { selectionType?: string; SelectionType?: string };
        const label = String(obj.label ?? "Options").trim() || "Options";
        const id = String(obj.id ?? slugify(label));
        const selectionType = (obj.selectionType ?? obj.SelectionType ?? "single") === "multiple" ? "multiple" : "single";
        const choices = normalizeChoices(obj.choices);
        if (choices.length === 0) continue;
        groups.push({
          id,
          label,
          selectionType,
          required: obj.required ?? selectionType === "single",
          choices,
        });
      }
      return groups;
    }
  }

  const flat = normalizeChoices(raw?.length ? raw : legacyFlatChoices);
  if (flat.length === 0) return [];

  return [
    {
      id: "legacy",
      label: (legacyNotes ?? "Options").trim() || "Options",
      selectionType: "single",
      required: true,
      choices: flat,
    },
  ];
}

export function normalizeNoteChoices(raw: unknown): ProductNoteChoice[] {
  return normalizeOptionGroups(raw).flatMap((g) => g.choices);
}

export function productHasOptions(product: Pick<Product, "optionGroups">) {
  return product.optionGroups.some((g) => g.choices.length > 0);
}

export function getChoiceLabel(choice: ProductNoteChoice | string): string {
  return typeof choice === "string" ? choice : choice.label;
}

export function getChoiceExtraPrice(choice: ProductNoteChoice | string): number {
  return typeof choice === "string" ? 0 : choice.extraPrice;
}

export function findChoiceInGroup(group: ProductOptionGroup, label?: string) {
  if (!label) return undefined;
  return group.choices.find((c) => c.label.toLowerCase() === label.toLowerCase());
}

export function defaultSelectedOptions(product: Pick<Product, "optionGroups">): CartSelectedOption[] {
  return product.optionGroups.map((group) => {
    if (group.selectionType === "single" && group.choices[0]) {
      return {
        groupId: group.id,
        groupLabel: group.label,
        choices: [group.choices[0].label],
      };
    }
    return { groupId: group.id, groupLabel: group.label, choices: [] };
  });
}

export function emptySelectedOptions(product: Pick<Product, "optionGroups">): CartSelectedOption[] {
  return product.optionGroups.map((group) => ({
    groupId: group.id,
    groupLabel: group.label,
    choices: [],
  }));
}

export function toggleGroupSelection(
  group: ProductOptionGroup,
  current: string[],
  choiceLabel: string,
): string[] {
  const exists = current.some((c) => c.toLowerCase() === choiceLabel.toLowerCase());
  if (group.selectionType === "single") {
    return exists ? [] : [choiceLabel];
  }
  if (exists) return current.filter((c) => c.toLowerCase() !== choiceLabel.toLowerCase());
  return [...current, choiceLabel];
}

export function getGroupSelection(
  selectedOptions: CartSelectedOption[] | undefined,
  group: ProductOptionGroup,
): string[] {
  const row = selectedOptions?.find(
    (s) => s.groupId === group.id || s.groupLabel.toLowerCase() === group.label.toLowerCase(),
  );
  return row?.choices ?? [];
}

export function setGroupSelection(
  selectedOptions: CartSelectedOption[],
  group: ProductOptionGroup,
  choices: string[],
): CartSelectedOption[] {
  const next = selectedOptions.filter((s) => s.groupId !== group.id);
  next.push({ groupId: group.id, groupLabel: group.label, choices });
  return next;
}

export function sumSelectionExtras(product: Pick<Product, "optionGroups">, selectedOptions?: CartSelectedOption[]) {
  let total = 0;
  for (const group of product.optionGroups) {
    const picks = getGroupSelection(selectedOptions, group);
    for (const label of picks) {
      total += findChoiceInGroup(group, label)?.extraPrice ?? 0;
    }
  }
  return +total.toFixed(2);
}

export function resolveProductUnitPrice(
  product: Pick<Product, "price" | "optionGroups">,
  selectedOptions?: CartSelectedOption[],
) {
  return +(product.price + sumSelectionExtras(product, selectedOptions)).toFixed(2);
}

/** @deprecated Use resolveProductUnitPrice with selectedOptions */
export function resolveProductUnitPriceLegacy(
  product: Pick<Product, "price" | "optionGroups" | "noteChoices">,
  choiceLabel?: string,
) {
  if (!choiceLabel) return product.price;
  for (const group of product.optionGroups) {
    const match = findChoiceInGroup(group, choiceLabel);
    if (match) return +(product.price + match.extraPrice).toFixed(2);
  }
  return product.price;
}

export function getProductPriceRange(product: Pick<Product, "price" | "optionGroups">) {
  if (!productHasOptions(product)) {
    return { min: product.price, max: product.price };
  }

  let minExtra = 0;
  let maxExtra = 0;
  for (const group of product.optionGroups) {
    const extras = group.choices.map((c) => c.extraPrice);
    if (extras.length === 0) continue;
    if (group.selectionType === "single") {
      minExtra += Math.min(...extras);
      maxExtra += Math.max(...extras);
    } else {
      maxExtra += extras.reduce((sum, n) => sum + n, 0);
    }
  }

  return {
    min: +(product.price + minExtra).toFixed(2),
    max: +(product.price + maxExtra).toFixed(2),
  };
}

export function validateSelectedOptions(
  product: Pick<Product, "optionGroups">,
  selectedOptions?: CartSelectedOption[],
): string | null {
  for (const group of product.optionGroups) {
    const picks = getGroupSelection(selectedOptions, group);
    if (group.required && picks.length === 0) {
      return `Please choose ${group.label.toLowerCase()}`;
    }
    if (group.selectionType === "single" && picks.length > 1) {
      return `Choose one option for ${group.label.toLowerCase()}`;
    }
    for (const label of picks) {
      if (!findChoiceInGroup(group, label)) {
        return `Invalid option for ${group.label.toLowerCase()}`;
      }
    }
  }
  return null;
}

export function formatChoiceExtra(extraPrice: number, fmt: (n: number) => string) {
  if (extraPrice <= 0) return null;
  return `+${fmt(extraPrice)}`;
}

export function formatChoiceWithExtra(choice: ProductNoteChoice, fmt: (n: number) => string) {
  const extra = formatChoiceExtra(choice.extraPrice, fmt);
  return extra ? `${choice.label} (${extra})` : choice.label;
}

export function formatSelectedOptionsSummary(selectedOptions?: CartSelectedOption[]) {
  if (!selectedOptions?.length) return "";
  return selectedOptions
    .filter((s) => s.choices.length > 0)
    .map((s) => `${s.groupLabel}: ${s.choices.join(", ")}`)
    .join("; ");
}

export function formatSelectedOptionsDetailed(
  product: Pick<Product, "optionGroups">,
  selectedOptions: CartSelectedOption[] | undefined,
  fmt: (n: number) => string,
) {
  const lines: string[] = [];
  for (const group of product.optionGroups) {
    const picks = getGroupSelection(selectedOptions, group);
    for (const label of picks) {
      const choice = findChoiceInGroup(group, label);
      lines.push(choice ? formatChoiceWithExtra(choice, fmt) : label);
    }
  }
  return lines;
}

export function serializeSelectedOptionsKey(selectedOptions?: CartSelectedOption[]) {
  if (!selectedOptions?.length) return "";
  return selectedOptions
    .map((s) => `${s.groupId}=${s.choices.slice().sort().join(",")}`)
    .sort()
    .join("|");
}

export function createOptionGroupId(label: string) {
  return `${slugify(label)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function normalizeProduct<T extends Product>(product: T): T {
  const optionGroups = normalizeOptionGroups(
    product.optionGroups ?? product.noteChoices,
    product.notes,
    product.noteChoices,
  );
  return {
    ...product,
    optionGroups,
    noteChoices: optionGroups.flatMap((g) => g.choices),
    notes: optionGroups[0]?.label ?? product.notes ?? "",
  };
}

/** @deprecated */
export function findNoteChoice(product: Pick<Product, "optionGroups">, label?: string) {
  if (!label) return undefined;
  for (const group of product.optionGroups) {
    const match = findChoiceInGroup(group, label);
    if (match) return match;
  }
  return undefined;
}
