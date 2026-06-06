import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ProductNoteChoice, ProductOptionGroup, ProductOptionSelectionType } from "@/lib/product-options";
import { createOptionGroupId } from "@/lib/product-options";

const DEFAULT_GROUP: ProductOptionGroup = {
  id: "sweetness",
  label: "Sweetness",
  selectionType: "single",
  required: true,
  choices: [
    { label: "Regular", extraPrice: 0 },
    { label: "Less sugar", extraPrice: 0 },
    { label: "No sugar", extraPrice: 0 },
  ],
};

type ProductOptionGroupsEditorProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  groups: ProductOptionGroup[];
  onGroupsChange: (groups: ProductOptionGroup[]) => void;
};

export function ProductOptionGroupsEditor({
  enabled,
  onEnabledChange,
  groups,
  onGroupsChange,
}: ProductOptionGroupsEditorProps) {
  const updateGroup = (index: number, patch: Partial<ProductOptionGroup>) => {
    onGroupsChange(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  };

  const updateChoice = (groupIndex: number, choiceIndex: number, patch: Partial<ProductNoteChoice>) => {
    const group = groups[groupIndex];
    updateGroup(groupIndex, {
      choices: group.choices.map((row, i) => (i === choiceIndex ? { ...row, ...patch } : row)),
    });
  };

  const addGroup = () => {
    onGroupsChange([
      ...groups,
      {
        ...DEFAULT_GROUP,
        id: createOptionGroupId("Options"),
        label: "Add-ons",
        selectionType: "multiple",
        required: false,
      },
    ]);
  };

  const removeGroup = (index: number) => {
    onGroupsChange(groups.filter((_, i) => i !== index));
  };

  const addChoice = (groupIndex: number) => {
    const group = groups[groupIndex];
    updateGroup(groupIndex, { choices: [...group.choices, { label: "", extraPrice: 0 }] });
  };

  const removeChoice = (groupIndex: number, choiceIndex: number) => {
    const group = groups[groupIndex];
    updateGroup(groupIndex, { choices: group.choices.filter((_, i) => i !== choiceIndex) });
  };

  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Customization options</p>
          <p className="text-xs text-muted-foreground">
            Add one or more option groups. Choose single pick (one only) or multiple pick (add-ons together).
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(next) => {
            onEnabledChange(next);
            if (next && groups.length === 0) onGroupsChange([DEFAULT_GROUP]);
          }}
          aria-label="Enable customization options"
        />
      </div>

      {enabled && (
        <div className="mt-4 space-y-4">
          {groups.map((group, groupIndex) => (
            <div key={group.id} className="rounded-2xl border bg-background/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 text-xs text-muted-foreground">Group name</Label>
                    <Input
                      value={group.label}
                      onChange={(e) => updateGroup(groupIndex, { label: e.target.value })}
                      placeholder="e.g. Sugar, Ice, Add-ons"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 text-xs text-muted-foreground">Customer picks</Label>
                    <Select
                      value={group.selectionType}
                      onValueChange={(value: ProductOptionSelectionType) =>
                        updateGroup(groupIndex, {
                          selectionType: value,
                          required: value === "single" ? group.required : false,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">One choice only</SelectItem>
                        <SelectItem value="multiple">Multiple choices</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={group.required}
                      disabled={group.selectionType === "multiple"}
                      onCheckedChange={(required) => updateGroup(groupIndex, { required })}
                    />
                    Required
                  </label>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeGroup(groupIndex)}
                    disabled={groups.length <= 1}
                    aria-label="Remove option group"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {group.choices.map((row, choiceIndex) => (
                  <div
                    key={`${group.id}-${choiceIndex}`}
                    className="grid gap-2 rounded-xl border p-2 sm:grid-cols-[1fr_7rem_2.5rem] sm:items-center sm:border-0 sm:p-0"
                  >
                    <Input
                      value={row.label}
                      onChange={(e) => updateChoice(groupIndex, choiceIndex, { label: e.target.value })}
                      placeholder="Choice name"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.extraPrice}
                      onChange={(e) =>
                        updateChoice(groupIndex, choiceIndex, {
                          extraPrice: Math.max(0, +e.target.value || 0),
                        })
                      }
                      placeholder="Extra $"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeChoice(groupIndex, choiceIndex)}
                      disabled={group.choices.length <= 1}
                      aria-label="Remove choice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 rounded-full"
                onClick={() => addChoice(groupIndex)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add choice
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={addGroup}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add option group
          </Button>
        </div>
      )}
    </div>
  );
}
