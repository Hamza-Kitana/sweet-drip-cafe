import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import heroDessert from "@/assets/hero-dessert.jpg";
import aboutCafe from "@/assets/about-cafe.jpg";
import type { BackgroundSlide } from "@/lib/store";

const FALLBACK_SLIDES: BackgroundSlide[] = [
  { image: heroDessert, caption: "" },
  { image: aboutCafe, caption: "" },
  {
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1400&q=80",
    caption: "",
  },
  {
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1400&q=80",
    caption: "",
  },
  {
    image: "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=1400&q=80",
    caption: "",
  },
];

type HeroRotatingBackgroundProps = {
  slides?: BackgroundSlide[];
  intervalMs?: number;
};

export function HeroRotatingBackground({
  slides,
  intervalMs = 5500,
}: HeroRotatingBackgroundProps) {
  const resolved = useMemo(() => {
    const custom = (slides ?? []).filter((s) => s.image);
    if (custom.length > 0) return custom.slice(0, 5);
    return FALLBACK_SLIDES.slice(0, 5);
  }, [slides]);

  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion || resolved.length <= 1) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % resolved.length),
      intervalMs,
    );
    return () => window.clearInterval(timer);
  }, [resolved.length, intervalMs, reduceMotion]);

  const active = reduceMotion ? 0 : index;
  const activeCaption = resolved[active]?.caption?.trim();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {resolved.map((slide, i) => (
        <motion.div
          key={`${i}-${slide.image.slice(0, 32)}`}
          className="absolute inset-0"
          initial={false}
          animate={{
            opacity: i === active ? 1 : 0,
            scale: i === active ? 1.04 : 1.1,
          }}
          transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <img
            src={slide.image}
            alt=""
            className="h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </motion.div>
      ))}

      {activeCaption ? (
        <motion.div
          key={activeCaption}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute bottom-16 left-1/2 z-[1] max-w-lg -translate-x-1/2 px-6 text-center md:bottom-24"
        >
          <p className="rounded-2xl glass border px-5 py-3 font-display text-lg text-primary shadow-soft md:text-2xl">
            {activeCaption}
          </p>
        </motion.div>
      ) : null}

      <div className="overlay-pink-hero-vertical absolute inset-0" />
      <div className="overlay-pink-hero-side absolute inset-0" />
      <div className="overlay-pink-hero-tint absolute inset-0 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.92_0.06_350/0.32),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_88%_12%,oklch(0.84_0.11_350/0.28),transparent_42%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_8%_78%,oklch(0.88_0.09_348/0.22),transparent_38%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,oklch(0.9_0.07_355/0.2),transparent_45%)]" />
    </div>
  );
}
