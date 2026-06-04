import { motion, useScroll, useTransform } from "motion/react";
import { Link } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import float1 from "@/assets/float-1.png";
import float2 from "@/assets/float-2.png";
import float3 from "@/assets/float-3.png";
import heroDessert from "@/assets/hero-dessert.jpg";
import { activeBackgroundSlides, useShop } from "@/lib/store";
import { isOffersSectionVisible } from "@/lib/catalog";
import { OFFERS_MENU_FILTER } from "@/lib/offers";
import { useIsMobile } from "@/hooks/use-mobile";
import { HeroRotatingBackground } from "@/components/HeroRotatingBackground";

export function Hero3D() {
  const ref = useRef<HTMLDivElement>(null);
  const { hero, offersSectionVisible } = useShop();
  const bgSlides = useMemo(
    () => activeBackgroundSlides(hero.backgroundSlides),
    [hero.backgroundSlides],
  );
  const isMobile = useIsMobile();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 600], [0, isMobile ? 0 : -150]);
  const y2 = useTransform(scrollY, [0, 600], [0, isMobile ? 0 : 120]);
  const y3 = useTransform(scrollY, [0, 600], [0, isMobile ? 0 : -80]);
  const rotateMain = useTransform(scrollY, [0, 600], [0, isMobile ? 0 : 12]);
  const scaleMain = useTransform(scrollY, [0, 600], [1, isMobile ? 1 : 0.9]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, isMobile ? 1 : 0.35]);

  return (
    <section ref={ref} className="relative overflow-hidden md:min-h-[100svh]">
      <HeroRotatingBackground images={bgSlides} />

      <div className="pointer-events-none absolute inset-0 z-[1] hidden md:block">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute -top-10 w-2 h-6 rounded-b-full bg-primary/60 blur-[0.5px]"
            style={{
              left: `${(i * 7 + 4) % 100}%`,
              animation: `drip ${4 + (i % 5)}s linear ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Mobile hero */}
      <div className="relative z-[2] section-inner pt-24 pb-10 md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-primary text-[10px] font-semibold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Dessert Cafe · Chicago
          </span>
          <h1 className="mt-4 text-[2.35rem] leading-[1.05] font-display text-primary">
            Sweet <span className="font-script text-gradient-gold">Drip</span>
            <br />
            Every Day.
          </h1>
          <p className="mt-3 text-base text-muted-foreground mx-auto max-w-sm">{hero.tagline}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative mx-auto mt-4 h-[min(58vw,280px)] max-w-sm"
        >
          <img
            src={hero.image || heroDessert}
            alt="Signature dessert"
            className="h-full w-full object-contain drop-shadow-2xl"
          />
        </motion.div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/menu"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full gradient-choco px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Explore Menu <ArrowRight className="w-4 h-4" />
          </Link>
          {isOffersSectionVisible(offersSectionVisible) && (
            <Link
              to="/menu"
              search={{ cat: OFFERS_MENU_FILTER }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-6 py-3.5 text-sm font-medium text-primary"
            >
              Today&apos;s Offers
            </Link>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 text-center text-sm">
          <div className="rounded-2xl glass p-4 border shadow-soft">
            <div className="text-2xl font-display text-primary">9AM</div>
            <div className="text-muted-foreground text-xs mt-1">Opens daily</div>
          </div>
          <div className="rounded-2xl glass p-4 border shadow-soft">
            <div className="text-2xl font-display text-primary">★ 4.9</div>
            <div className="text-muted-foreground text-xs mt-1">Loved locally</div>
          </div>
        </div>
      </div>

      {/* Desktop hero — side-by-side grid */}
      <div className="relative z-[2] section-inner hidden min-h-[calc(100svh-4rem)] grid-cols-2 items-center gap-6 pb-16 pt-28 sm:pt-32 md:grid lg:min-h-[100svh] lg:gap-10 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          style={{ opacity: heroOpacity }}
          className="relative max-w-xl"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-primary text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Dessert Cafe · Chicago
          </span>
          <h1 className="mt-5 text-5xl lg:text-7xl xl:text-8xl font-display leading-[0.95] text-primary">
            Sweet <span className="font-script text-gradient-gold">Drip</span>
            <br />
            Every Day.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-md">{hero.tagline}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full gradient-choco text-primary-foreground font-medium shadow-glow hover:scale-105 transition"
            >
              Explore Menu <ArrowRight className="w-4 h-4" />
            </Link>
            {isOffersSectionVisible(offersSectionVisible) && (
              <Link
                to="/menu"
                search={{ cat: OFFERS_MENU_FILTER }}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-primary text-primary font-medium hover:bg-primary hover:text-primary-foreground transition"
              >
                Today&apos;s Offers
              </Link>
            )}
          </div>
          <div className="mt-10 flex items-center gap-8 text-sm">
            <div>
              <div className="text-3xl font-display text-primary">9AM</div>
              <div className="text-muted-foreground">Opens daily</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <div className="text-3xl font-display text-primary">★ 4.9</div>
              <div className="text-muted-foreground">Loved locally</div>
            </div>
          </div>
        </motion.div>

        <div className="relative flex h-[min(72vh,620px)] min-h-[420px] items-center justify-center overflow-visible">
          <div className="relative h-full w-full max-w-[520px] [perspective:1200px]">
            <motion.img
              src={hero.image || heroDessert}
              alt="Signature dessert"
              style={{ rotate: rotateMain, scale: scaleMain }}
              initial={{ opacity: 0, scale: 0.6, rotate: -16 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 m-auto h-[88%] w-[88%] object-contain drop-shadow-2xl animate-float-slow"
            />
            <motion.img
              src={float1}
              alt=""
              style={{ y: y1 }}
              className="absolute left-0 top-[8%] z-10 w-24 rotate-[-12deg] drop-shadow-xl lg:w-32 xl:w-36"
            />
            <motion.img
              src={float2}
              alt=""
              style={{ y: y2 }}
              className="absolute bottom-[6%] right-0 z-10 w-24 rotate-[8deg] drop-shadow-xl lg:w-32 xl:w-40"
            />
            <motion.img
              src={float3}
              alt=""
              style={{ y: y3 }}
              className="absolute right-[6%] top-[28%] z-10 w-20 rotate-[14deg] drop-shadow-xl lg:w-28 xl:w-32"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full border-2 border-dashed border-primary/30 opacity-50 lg:h-48 lg:w-48"
            />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 left-1/2 z-[2] hidden -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary/60 md:flex"
      >
        Scroll
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-px h-8 bg-primary/40" />
      </motion.div>
    </section>
  );
}
