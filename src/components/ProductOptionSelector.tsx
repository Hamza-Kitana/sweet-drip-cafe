import type { Product } from "@/lib/store";
import { fmt } from "@/lib/store";
import {
  formatChoiceExtra,
  getGroupSelection,
  productHasOptions,
  setGroupSelection,
  toggleGroupSelection,
  type CartSelectedOption,
} from "@/lib/product-options";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

type ProductOptionSelectorProps = {
  product: Product;
  selectedOptions: CartSelectedOption[];
  onChange: (next: CartSelectedOption[]) => void;
};

export function ProductOptionSelector({ product, selectedOptions, onChange }: ProductOptionSelectorProps) {
  if (!productHasOptions(product)) return null;

  return (
    <div className="space-y-6">
      {product.optionGroups.map((group) => {
        const picks = getGroupSelection(selectedOptions, group);
        const isMultiple = group.selectionType === "multiple";

        return (
          <div key={group.id}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Label className="font-semibold">{group.label}</Label>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {isMultiple ? "Pick any" : "Pick one"}
              </span>
              {group.required && (
                <span className="text-[10px] font-medium uppercase tracking-wide text-primary">Required</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.choices.map((choice) => {
                const selected = picks.some((p) => p.toLowerCase() === choice.label.toLowerCase());
                const extraLabel = formatChoiceExtra(choice.extraPrice, fmt);
                return (
                  <button
                    key={`${group.id}-${choice.label}`}
                    type="button"
                    onClick={() => {
                      const nextChoices = toggleGroupSelection(group, picks, choice.label);
                      onChange(setGroupSelection(selectedOptions, group, nextChoices));
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm transition",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50",
                      isMultiple && selected && "ring-2 ring-primary/20",
                    )}
                  >
                    {isMultiple && selected && <Check className="h-3.5 w-3.5" />}
                    <span>{choice.label}</span>
                    {extraLabel && (
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          selected ? "text-primary-foreground/90" : "text-primary",
                        )}
                      >
                        {extraLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
