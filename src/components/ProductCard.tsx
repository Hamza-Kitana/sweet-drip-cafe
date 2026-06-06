import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/store";
import { fmt, useCart, useShop } from "@/lib/store";
import { ProductImageDisplay } from "@/components/ProductImageDisplay";
import { getChoiceLabel, resolveProductUnitPrice } from "@/lib/product-options";

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const add = useCart((s) => s.add);
  const categories = useShop((s) => s.categories);
  const categoryImage = categories.find((c) => c.id === p.categoryId)?.image;

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const firstChoice = p.noteChoices[0];
    const noteChoice = firstChoice ? getChoiceLabel(firstChoice) : undefined;
    const price = resolveProductUnitPrice(p, noteChoice);
    add({
      productId: p.id,
      name: p.name,
      price,
      qty: 1,
      image: p.image,
      noteChoice,
    });
    toast.success(`${p.name} added to cart`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.05 }}
      className="group"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-soft sm:rounded-3xl">
        <Link to="/product/$id" params={{ id: p.id }} className="block h-full">
          <ProductImageDisplay
            image={p.image}
            categoryImage={categoryImage}
            alt={p.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="overlay-pink-card-hover absolute inset-x-0 bottom-0 hidden h-1/2 opacity-0 transition group-hover:opacity-100 sm:block" />
        </Link>
        <span className="pointer-events-none absolute right-2 top-2 z-[1] rounded-full glass px-2 py-0.5 text-xs font-semibold text-primary sm:right-3 sm:top-3 sm:px-3 sm:py-1 sm:text-sm">
          {fmt(p.price)}
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="absolute bottom-2 left-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.78_0.11_350)] to-[oklch(0.64_0.12_348)] text-white shadow-soft transition hover:scale-105 hover:from-[oklch(0.74_0.12_350)] hover:to-[oklch(0.6_0.13_346)] sm:bottom-3 sm:left-3 sm:h-10 sm:w-10"
          aria-label={`Add ${p.name} to cart`}
        >
          <ShoppingBag className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" />
        </button>
      </div>
      <Link to="/product/$id" params={{ id: p.id }} className="mt-2 block sm:mt-4">
        <h3 className="line-clamp-2 text-sm font-semibold transition group-hover:text-primary sm:text-lg">{p.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground hidden sm:block">{p.description}</p>
      </Link>
    </motion.div>
  );
}
