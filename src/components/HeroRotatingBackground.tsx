import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import heroDessert from "@/assets/hero-dessert.jpg";
import aboutCafe from "@/assets/about-cafe.jpg";

const FALLBACK_SLIDES = [
  heroDessert,
  aboutCafe,
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1400&q=80",
  "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1400&q=80",
  "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=1400&q=80",
];

type HeroRotatingBackgroundProps = {
  images?: string[];
  intervalMs?: number;
};

export function HeroRotatingBackground({
  images,
  intervalMs = 5500,
}: HeroRotatingBackgroundProps) {
  const slides = useMemo(() => {
    const custom = (images ?? []).filter(Boolean);
    if (custom.length > 0) return custom.slice(0, 5);
    return FALLBACK_SLIDES.slice(0, 5);
  }, [images]);

  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion || slides.length <= 1) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      intervalMs,
    );
    return () => window.clearInterval(timer);
  }, [slides.length, intervalMs, reduceMotion]);

  const active = reduceMotion ? 0 : index;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {slides.map((src, i) => (
        <motion.div
          key={`${i}-${src.slice(0, 32)}`}
          className="absolute inset-0"
          initial={false}
          animate={{
            opacity: i === active ? 1 : 0,
            scale: i === active ? 1.04 : 1.1,
          }}
          transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </motion.div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-background/88 via-background/72 to-background/92" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/55" />
      <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.96_0.04_70/0.35),transparent_55%)]" />
    </div>
  );
}
