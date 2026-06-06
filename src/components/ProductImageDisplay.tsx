import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getProductIcon,
  resolveProductImage,
  type ProductImageIconId,
} from "@/lib/product-image";

type ProductImageDisplayProps = {
  image?: string;
  categoryImage?: string;
  alt: string;
  className?: string;
  iconClassName?: string;
  emptyClassName?: string;
};

export function ProductImageDisplay({
  image,
  categoryImage,
  alt,
  className,
  iconClassName = "h-12 w-12 text-primary/35 sm:h-16 sm:w-16",
  emptyClassName = "h-10 w-10 text-muted-foreground/40",
}: ProductImageDisplayProps) {
  const resolved = resolveProductImage(image, categoryImage);

  if (resolved.type === "none") {
    return (
      <div
        className={cn("flex h-full w-full items-center justify-center bg-muted/80", className)}
        aria-hidden={!alt}
      >
        <ImageOff className={emptyClassName} />
      </div>
    );
  }

  if (resolved.type === "icon") {
    const Icon = getProductIcon(resolved.iconId as ProductImageIconId);
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/90 to-accent/20",
          className,
        )}
      >
        <Icon className={iconClassName} aria-hidden />
      </div>
    );
  }

  return (
    <img src={resolved.url} alt={alt} className={className} loading="lazy" />
  );
}
