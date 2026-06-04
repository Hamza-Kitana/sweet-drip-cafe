import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Offer } from "@/lib/store";
import { fmt, useCart } from "@/lib/store";
import { offerCartProductId } from "@/lib/offers";
import { Button } from "@/components/ui/button";

type OfferCardProps = {
  offer: Offer;
  index?: number;
  className?: string;
};

export function OfferCard({ offer, index = 0, className = "" }: OfferCardProps) {
  const add = useCart((s) => s.add);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      productId: offerCartProductId(offer.id),
      name: offer.title,
      price: offer.price,
      qty: 1,
      image: offer.image,
    });
    toast.success(`${offer.title} added to cart`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`relative flex w-full flex-col overflow-hidden rounded-2xl bg-card shadow-soft group sm:rounded-3xl ${className}`}
    >
      <Link
        to="/offer/$id"
        params={{ id: offer.id }}
        className="block flex-1 transition hover:opacity-95"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={offer.image}
            alt={offer.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="overlay-pink-card absolute inset-0" />
          <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary sm:text-xs">
            Offer
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <h3 className="text-xl font-display text-primary sm:text-2xl">{offer.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{offer.description}</p>
        </div>
      </Link>

      <div className="flex items-end justify-between gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="text-2xl font-display text-gradient-gold sm:text-3xl">{fmt(offer.price)}</div>
        <Button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-full gradient-choco px-4 text-primary-foreground hover:opacity-90 sm:px-5"
        >
          <ShoppingBag className="mr-1.5 h-4 w-4" />
          Order
        </Button>
      </div>
    </motion.article>
  );
}
