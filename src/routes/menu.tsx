import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useShop } from "@/lib/store";
import { OfferCard } from "@/components/OfferCard";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { visibleCategories, isOffersSectionVisible } from "@/lib/catalog";
import { isLiveOffer, isOffersMenuFilter, OFFERS_MENU_FILTER } from "@/lib/offers";
import { motion } from "motion/react";
import { z } from "zod";

const searchSchema = z.object({ cat: z.string().optional() });

export const Route = createFileRoute("/menu")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Menu — Sweet Drip" }, { name: "description", content: "Browse our full dessert menu." }] }),
  component: MenuPage,
});

function MenuPage() {
  const { categories, products, offers, offersSectionVisible } = useShop();
  const { cat } = Route.useSearch();
  const navigate = useNavigate();
  const menuCategories = visibleCategories(categories);
  const visibleCategoryIds = new Set(menuCategories.map((c) => c.id));
  const offersOnSite = isOffersSectionVisible(offersSectionVisible);
  const showOffers = offersOnSite && isOffersMenuFilter(cat);
  const liveOffers = offers.filter(isLiveOffer);
  const filtered = showOffers
    ? []
    : cat
      ? products.filter((p) => p.categoryId === cat && visibleCategoryIds.has(cat))
      : products.filter((p) => visibleCategoryIds.has(p.categoryId));
  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const syncHeight = () => setBarHeight(bar.offsetHeight);
    syncHeight();

    const ro = new ResizeObserver(syncHeight);
    ro.observe(bar);
    window.addEventListener("resize", syncHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const update = () => {
      const headerH =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")) || 88;
      setStuck(sentinel.getBoundingClientRect().top <= headerH + 1);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const hiddenCategorySelected =
    typeof cat === "string" && cat !== OFFERS_MENU_FILTER && !visibleCategoryIds.has(cat);

  useEffect(() => {
    if (!offersOnSite && isOffersMenuFilter(cat)) {
      navigate({ to: "/menu", search: {}, replace: true });
    } else if (hiddenCategorySelected) {
      navigate({ to: "/menu", search: {}, replace: true });
    }
  }, [cat, offersOnSite, hiddenCategorySelected, navigate]);

  const filterBtn = (active: boolean) =>
    active
      ? "gradient-choco text-primary-foreground shadow-soft"
      : "bg-muted hover:bg-muted/70 text-foreground";

  return (
    <>
      <div className="section-inner pt-10 sm:pt-16">
        <SectionHeading eyebrow="Our Menu" title="Sweet Selection" sub="From rich chocolate cakes to creamy ice creams." />
      </div>

      <div ref={sentinelRef} className="h-px" aria-hidden />

      <div className="menu-filter-bar-wrap" style={{ height: stuck ? barHeight : undefined }}>
        <div ref={barRef} className={`menu-filter-bar ${stuck ? "is-stuck py-2" : "py-1"}`}>
          <div className={`menu-filter-bar-surface mx-auto w-fit max-w-full ${stuck ? "is-stuck" : ""}`}>
            <div className="mobile-scroll-x gap-2 sm:flex sm:flex-wrap sm:justify-center">
              <button
                type="button"
                onClick={() => navigate({ to: "/menu", search: {} })}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition sm:px-5 ${filterBtn(!cat)}`}
              >
                All
              </button>
              {menuCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate({ to: "/menu", search: { cat: c.id } })}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition sm:px-5 ${filterBtn(cat === c.id)}`}
                >
                  {c.name}
                </button>
              ))}
              {offersOnSite && (
                <button
                  type="button"
                  onClick={() => navigate({ to: "/menu", search: { cat: OFFERS_MENU_FILTER } })}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition sm:px-5 ${filterBtn(showOffers)}`}
                >
                  Offers
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="section-inner pb-10 sm:pb-16 pt-4 sm:pt-6">
        {showOffers ? (
          liveOffers.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No active offers right now. Check back soon!</p>
          ) : (
            <motion.div layout className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              {liveOffers.map((o, i) => (
                <OfferCard key={o.id} offer={o} index={i} />
              ))}
            </motion.div>
          )
        ) : (
          <>
            <motion.div layout className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} p={p} index={i} />
              ))}
            </motion.div>

            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">Nothing here yet. Check back soon!</p>
            )}
          </>
        )}
      </div>
    </>
  );
}
