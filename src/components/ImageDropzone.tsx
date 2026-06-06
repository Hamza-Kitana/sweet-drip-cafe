import { useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { isApiMode } from "@/lib/api/client";
import { removeStoredMedia, uploadSiteImageFile } from "@/lib/api/media";

const MAX_BYTES = 3 * 1024 * 1024;

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file (JPG, PNG, WebP…)"));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error("Image must be under 3 MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

type ImageDropzoneProps = {
  value: string;
  onChange: (dataUrl: string) => void;
  onClear?: () => void;
  hint?: string;
  className?: string;
  previewClassName?: string;
};

export function ImageDropzone({
  value,
  onChange,
  onClear,
  hint = "Drag & drop or click to upload",
  className,
  previewClassName = "aspect-video",
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (isApiMode) {
        if (file.size > MAX_BYTES) {
          throw new Error("Image must be under 3 MB");
        }
        if (!file.type.startsWith("image/")) {
          throw new Error("Please choose an image file (JPG, PNG, WebP…)");
        }
        if (value) await removeStoredMedia(value);
        const uploaded = await uploadSiteImageFile(file);
        onChange(uploaded.url);
      } else {
        onChange(await readImageAsDataUrl(file));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const clearImage = async () => {
    if (isApiMode && value) await removeStoredMedia(value);
    onClear?.();
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void pickFile(event.dataTransfer.files[0]);
  };

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition",
          dragging ? "border-accent bg-accent/10" : "border-border bg-muted/30 hover:border-accent/50 hover:bg-muted/50",
          value ? "p-2" : "flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void pickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {value ? (
          <>
            <img src={value} alt="" className={cn("w-full rounded-xl object-cover", previewClassName)} />
            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-primary/0 opacity-0 transition hover:bg-primary/40 hover:opacity-100">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-primary">
                <Upload className="h-3.5 w-3.5" /> Replace
              </span>
            </div>
            {onClear && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void clearImage();
                }}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-primary shadow-sm transition hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{hint}</p>
          </>
        )}
      </div>
    </div>
  );
}

type ImageUploadButtonProps = {
  onUpload: (dataUrl: string) => void;
  className?: string;
  title?: string;
};

/** Compact upload button — opens file picker (no URL prompt). */
export function ImageUploadButton({
  onUpload,
  className,
  title = "Upload image",
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (isApiMode) {
        if (file.size > MAX_BYTES) {
          throw new Error("Image must be under 3 MB");
        }
        if (!file.type.startsWith("image/")) {
          throw new Error("Please choose an image file (JPG, PNG, WebP…)");
        }
        const uploaded = await uploadSiteImageFile(file);
        onUpload(uploaded.url);
      } else {
        onUpload(await readImageAsDataUrl(file));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          void pickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={className}
        title={title}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-3 w-3" />
      </Button>
    </>
  );
}
