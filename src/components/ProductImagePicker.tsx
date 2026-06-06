import { ImageDropzone } from "@/components/ImageDropzone";
import { cn } from "@/lib/utils";
import {
  PRODUCT_IMAGE_ICONS,
  encodeProductImage,
  parseProductImageStored,
  resolveProductImage,
  type ProductImageIconId,
  type ProductImageMode,
} from "@/lib/product-image";

const MODES: { id: ProductImageMode; label: string }[] = [
  { id: "none", label: "Empty" },
  { id: "section", label: "Section photo" },
  { id: "icon", label: "Icon" },
  { id: "upload", label: "Upload" },
];

type ProductImagePickerProps = {
  value: string;
  categoryImage?: string;
  onChange: (encoded: string) => void;
};

export function ProductImagePicker({ value, categoryImage, onChange }: ProductImagePickerProps) {
  const parsed = parseProductImageStored(value, categoryImage);
  const mode = parsed.mode;
  const iconId = parsed.iconId;
  const uploadUrl = parsed.uploadUrl;

  const setMode = (next: ProductImageMode) => {
    if (next === "upload") {
      onChange(encodeProductImage("upload", { uploadUrl }));
      return;
    }
    if (next === "icon") {
      onChange(encodeProductImage("icon", { iconId }));
      return;
    }
    onChange(encodeProductImage(next, {}));
  };

  const preview = resolveProductImage(value, categoryImage);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              mode === m.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary/40",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "icon" && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PRODUCT_IMAGE_ICONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => onChange(encodeProductImage("icon", { iconId: id }))}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-2 transition",
                iconId === id
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40",
              )}
            >
              <Icon className="h-6 w-6 text-primary" />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      )}

      {mode === "upload" && (
        <ImageDropzone
          value={uploadUrl}
          onChange={(url) => onChange(encodeProductImage("upload", { uploadUrl: url }))}
          onClear={() => onChange(encodeProductImage("upload", { uploadUrl: "" }))}
          hint="Drag & drop or click to upload"
          previewClassName="aspect-video max-h-44"
        />
      )}

      {mode !== "upload" && (
        <div className="overflow-hidden rounded-2xl border bg-muted/30">
          <div className="aspect-video max-h-44 w-full">
            {preview.type === "none" && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <span className="text-xs">No image on menu</span>
              </div>
            )}
            {preview.type === "section" && (
              <img src={preview.url} alt="" className="h-full w-full object-cover" />
            )}
            {preview.type === "icon" && (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-accent/20">
                {(() => {
                  const Icon = PRODUCT_IMAGE_ICONS.find((i) => i.id === preview.iconId)?.Icon;
                  return Icon ? <Icon className="h-14 w-14 text-primary/50" /> : null;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "section" && !categoryImage && (
        <p className="text-xs text-amber-700">This section has no photo yet — add a section image or pick another option.</p>
      )}
    </div>
  );
}
