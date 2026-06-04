import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { Product } from "@/lib/store";
import { fmt } from "@/lib/store";

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.05 }}
    >
      <Link to="/product/$id" params={{ id: p.id }} className="group block">
        <div className="relative aspect-square overflow-hidden rounded-2xl sm:rounded-3xl bg-muted shadow-soft">
          {p.image && (
            <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
          )}
          <div className="overlay-pink-card-hover absolute inset-x-0 bottom-0 h-1/2 opacity-0 transition group-hover:opacity-100 hidden sm:block" />
          <span className="absolute top-2 right-2 sm:top-3 sm:right-3 glass px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold text-primary">{fmt(p.price)}</span>
        </div>
        <h3 className="mt-2 sm:mt-4 text-sm sm:text-lg font-semibold group-hover:text-primary transition line-clamp-2">{p.name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">{p.description}</p>
      </Link>
    </motion.div>
  );
}