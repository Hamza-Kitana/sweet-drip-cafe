import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ProductNoteChoice } from "@/lib/product-options";

const DEFAULT_CHOICES: ProductNoteChoice[] = [
  { label: "Regular", extraPrice: 0 },
  { label: "Less sugar", extraPrice: 0 },
  { label: "No sugar", extraPrice: 0 },
];

type ProductOptionsEditorProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  optionLabel: string;
  onOptionLabelChange: (label: string) => void;
  choices: ProductNoteChoice[];
  onChoicesChange: (choices: ProductNoteChoice[]) => void;
};

export function ProductOptionsEditor({
  enabled,
  onEnabledChange,
  optionLabel,
  onOptionLabelChange,
  choices,
  onChoicesChange,
}: ProductOptionsEditorProps) {
  const updateChoice = (index: number, patch: Partial<ProductNoteChoice>) => {
    onChoicesChange(choices.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeChoice = (index: number) => {
    onChoicesChange(choices.filter((_, i) => i !== index));
  };

  const addChoice = () => {
    onChoicesChange([...choices, { label: "", extraPrice: 0 }]);
  };

  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Customization options</p>
          <p className="text-xs text-muted-foreground">
            Add choices customers pick on the product page. Set an extra charge per choice when needed.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(next) => {
            onEnabledChange(next);
            if (next && choices.length === 0) onChoicesChange(DEFAULT_CHOICES);
          }}
          aria-label="Enable customization options"
        />
      </div>

      {enabled && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Option group label</p>
            <Input
              value={optionLabel}
              onChange={(e) => onOptionLabelChange(e.target.value)}
              placeholder="e.g. Size, Sweetness, Add-ons"
            />
          </div>

          <div>
            <div className="mb-2 hidden gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_7rem_2.5rem]">
              <span>Choice name</span>
              <span>Extra charge ($)</span>
              <span />
            </div>
            <div className="space-y-2">
              {choices.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-xl border bg-background/70 p-2 sm:grid-cols-[1fr_7rem_2.5rem] sm:items-center sm:p-0 sm:border-0 sm:bg-transparent"
                >
                  <Input
                    value={row.label}
                    onChange={(e) => updateChoice(index, { label: e.target.value })}
                    placeholder="e.g. Extra shot, Large"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.extraPrice}
                    onChange={(e) =>
                      updateChoice(index, { extraPrice: Math.max(0, +e.target.value || 0) })
                    }
                    placeholder="0.00"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeChoice(index)}
                    disabled={choices.length <= 1}
                    aria-label="Remove choice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-3 rounded-full" onClick={addChoice}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add choice
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
