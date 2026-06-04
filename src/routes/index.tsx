import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Hero3D } from "@/components/Hero3D";
import { IngredientsFloatingBg } from "@/components/IngredientsFloatingBg";
import { MapLocationBox } from "@/components/MapLocationBox";
import { OfferCard } from "@/components/OfferCard";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { visibleCategories, isOffersSectionVisible } from "@/lib/catalog";
import { isLiveOffer, OFFERS_MENU_FILTER } from "@/lib/offers";
import { useShop } from "@/lib/store";
import { CAFE_HOURS, CAFE_HOURS_FOOTER } from "@/lib/location";
import { ChefHat, Sparkles, Heart, Award, MapPin, Phone, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sweet Drip Dessert Cafe — Chicago" },
      { name: "description", content: "Premium desserts, ice cream and drinks in Chicago." },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Award,
    title: "Belgian Chocolate",
    desc: "Deep, silky cocoa in every bite.",
    detail: "Real Belgian chocolate in our ganache, mousse, and drizzles — rich taste without artificial fillers.",
  },
  {
    icon: Sparkles,
    title: "Premium Pistachios",
    desc: "Nutty, fresh, and carefully picked.",
    detail: "Top-grade pistachios for our creams, pastries, and seasonal favorites — quality you can taste.",
  },
  {
    icon: ChefHat,
    title: "Crafted Fresh Daily",
    desc: "Made in our kitchen every morning.",
    detail: "We bake and prep throughout the day so your dessert lands on the plate at its very best.",
  },
  {
    icon: Heart,
    title: "Warm Cafe Vibes",
    desc: "A cozy spot to slow down and enjoy.",
    detail: "Hyde Park's neighborhood cafe for coffee dates, family treats, and sweet moments that linger.",
  },
];

function Index() {
  const { categories, products, offers, offersSectionVisible } = useShop();
  const menuCategories = visibleCategories(categories);
  const visibleCategoryIds = new Set(menuCategories.map((c) => c.id));
  const featured = products.filter((p) => visibleCategoryIds.has(p.categoryId)).slice(0, 4);
  const liveOffers = offers.filter(isLiveOffer).slice(0, 3);
  const showOffersBlock = isOffersSectionVisible(offersSectionVisible) && liveOffers.length > 0;

  return (
    <>
      <Hero3D />

      {showOffersBlock && (
        <section className="section-pad bg-muted/40">
          <div className="section-inner">
            <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-accent mb-2 sm:mb-3">Limited Time</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display leading-tight text-primary">Today&apos;s Offers</h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-lg">
                Bundles too sweet to skip — order straight from here.
              </p>
              <div className="mt-8 flex w-full flex-wrap items-stretch justify-center gap-4 sm:gap-6">
                {liveOffers.map((o, i) => (
                  <OfferCard key={o.id} offer={o} index={i} className="w-full max-w-[300px] sm:max-w-[320px]" />
                ))}
              </div>
              <Link
                to="/menu"
                search={{ cat: OFFERS_MENU_FILTER }}
                className="mt-8 inline-flex rounded-full border-2 border-primary px-6 py-2.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                View all offers
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="section-pad">
        <div className="section-inner">
          <SectionHeading eyebrow="Discover" title="Sweet Categories" sub="Pick a craving — we've got it covered." />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {menuCategories.map((c, i) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
              >
                <Link to="/menu" search={{ cat: c.id } as any} className="group relative block aspect-[4/5] rounded-3xl overflow-hidden shadow-soft">
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  <div className="overlay-pink-card absolute inset-0" />
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-6 text-primary-foreground">
                    <h3 className="text-base sm:text-xl lg:text-2xl font-display">{c.name}</h3>
                    <span className="text-xs uppercase tracking-widest opacity-80">Browse →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-muted/40">
        <div className="section-inner">
          <SectionHeading eyebrow="Bestsellers" title="House Favorites" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {featured.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
          </div>
          <div className="text-center mt-12">
            <Link to="/menu" className="inline-flex px-7 py-3.5 rounded-full gradient-choco text-primary-foreground font-medium hover:scale-105 transition">View Full Menu</Link>
          </div>
        </div>
      </section>

      <section className="section-pad bg-primary text-primary-foreground">
        <div className="section-inner grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div className="text-center lg:text-left">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-accent mb-2 sm:mb-3">Visit Us</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display leading-tight">Find your <span className="font-script text-gradient-gold">sweet spot</span></h2>
            <p className="mt-4 sm:mt-6 opacity-80 text-sm sm:text-base max-w-md mx-auto lg:mx-0">Cozy corner of Hyde Park, Chicago. Open {CAFE_HOURS} — every single day.</p>
            <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-sm sm:text-base inline-block text-left">
              <li className="flex gap-3"><MapPin className="text-accent shrink-0 mt-0.5" /><span>1658 E 53rd St, Chicago, IL 60615</span></li>
              <li className="flex gap-3"><Phone className="text-accent shrink-0" />+1 (773) 966-4332</li>
              <li className="flex gap-3"><Clock className="text-accent shrink-0" />{CAFE_HOURS_FOOTER}</li>
            </ul>
          </div>
          <MapLocationBox
            className="w-full"
            showLabel={false}
            borderClassName="border border-white/10"
          />
        </div>
      </section>

      <section className="relative flex min-h-[100svh] flex-col justify-start overflow-hidden border-t border-border/60 gradient-hero pb-8 pt-16 text-primary sm:pb-10 sm:pt-20 lg:pb-12 lg:pt-24">
        <IngredientsFloatingBg />
        <div className="section-inner relative z-[1] w-full">
          <div className="mb-12 text-center md:mb-16 lg:mb-20">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-accent sm:mb-3 sm:text-xs sm:tracking-[0.3em]">Why Choose Us</p>
            <h2 className="text-4xl font-display leading-tight sm:text-5xl lg:text-6xl xl:text-7xl">Our Ingredients</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
              Real ingredients, made with care — here is what makes every Sweet Drip bite special.
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6 xl:max-w-7xl">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative flex min-h-[11rem] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-5 shadow-soft backdrop-blur-sm transition duration-300 hover:border-accent/50 hover:shadow-glow sm:min-h-[12rem] sm:rounded-3xl sm:p-6 lg:min-h-[14rem] lg:p-7"
              >
                <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-accent/20 blur-2xl transition duration-300 group-hover:bg-accent/30" />
                <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-gold text-primary shadow-soft sm:h-14 sm:w-14 lg:h-16 lg:w-16">
                  <f.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                </div>
                <h3 className="relative text-lg font-display leading-snug text-primary sm:text-xl lg:text-2xl">{f.title}</h3>
                <p className="relative mt-2 text-sm font-medium text-accent sm:text-base">{f.desc}</p>
                <p className="relative mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{f.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
