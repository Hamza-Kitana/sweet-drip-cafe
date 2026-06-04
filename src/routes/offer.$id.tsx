import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { isLiveOffer, OFFERS_MENU_FILTER, offerCartProductId, resolveOfferProducts } from "@/lib/offers";
import { fmt, useCart, useShop } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/offer/$id")({
  head: ({ params }) => ({ meta: [{ title: `Offer — Sweet Drip` }] }),
  component: OfferPage,
});

function OfferPage() {
  const { id } = useParams({ from: "/offer/$id" });
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const { offers, products } = useShop();
  const offer = offers.find((o) => o.id === id);
  const included = offer ? resolveOfferProducts(offer, products) : [];

  if (!offer || !isLiveOffer(offer)) {
    return (
      <div className="section-inner py-20 text-center">
        <h1 className="text-3xl font-display text-primary mb-4">Offer not found</h1>
        <Link to="/menu" search={{ cat: OFFERS_MENU_FILTER }} className="text-primary underline">
          Back to offers
        </Link>
      </div>
    );
  }

  const onAdd = () => {
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
    <div className="section-inner py-8 sm:py-12">
      <button
        type="button"
        onClick={() => navigate({ to: "/menu", search: { cat: OFFERS_MENU_FILTER } })}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary sm:mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Back to offers
      </button>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="gradient-hero mx-auto aspect-square w-full max-h-[min(85vw,28rem)] overflow-hidden rounded-2xl shadow-glow sm:rounded-3xl md:max-h-none"
        >
          <img src={offer.image} alt={offer.title} className="h-full w-full object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Limited Time Offer</p>
          <h1 className="mt-2 font-display text-3xl text-primary sm:text-4xl lg:text-5xl">{offer.title}</h1>
          <div className="mt-2 text-2xl font-display text-gradient-gold sm:mt-3 sm:text-3xl">{fmt(offer.price)}</div>
          <p className="mt-5 leading-relaxed text-muted-foreground">{offer.description}</p>
          <Button
            type="button"
            onClick={onAdd}
            size="lg"
            className="mt-6 w-full rounded-full gradient-choco text-primary-foreground hover:opacity-90 sm:mt-8 sm:w-auto sm:px-8"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Order bundle · {fmt(offer.price)}
          </Button>
        </motion.div>
      </div>

      <section className="mt-12 sm:mt-16">
        <h2 className="text-center font-display text-2xl text-primary sm:text-3xl">Included in this offer</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground sm:text-base">
          Everything you get in this bundle — tap any item for full details.
        </p>
        {included.length === 0 ? (
          <p className="mt-8 text-center text-muted-foreground">Products for this offer are being updated.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {included.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
