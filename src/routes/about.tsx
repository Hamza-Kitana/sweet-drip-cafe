import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useShop } from "@/lib/store";
import { Award, Heart, Leaf, Star } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Sweet Drip" }, { name: "description", content: "Our story, our values, our cafe." }] }),
  component: AboutPage,
});

function AboutPage() {
  const { hero } = useShop();
  return (
    <div>
      <section className="section-inner section-pad grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="text-center lg:text-left order-2 lg:order-1">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-secondary mb-2 sm:mb-3">Our Story</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display text-primary leading-tight">A little café with a <span className="font-script text-gradient-gold">big heart</span></h1>
          <p className="mt-4 sm:mt-6 text-muted-foreground text-base sm:text-lg leading-relaxed">
            Sweet Drip began as a love letter to slow afternoons, warm chocolate and people you want to linger with. We craft every dessert from the very best — Belgian chocolate, premium pistachios, real cream — and serve them in a space designed to feel like home.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            From our tiny kitchen in Hyde Park, Chicago, we've shared thousands of sweet moments. We can't wait to share one with you.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
          className="relative aspect-[4/5] max-h-[70vh] lg:max-h-none rounded-2xl sm:rounded-3xl overflow-hidden shadow-glow order-1 lg:order-2">
          <img src={hero.aboutImage} alt="Inside Sweet Drip" className="w-full h-full object-cover" />
        </motion.div>
      </section>

      <section className="bg-muted/40 section-pad">
        <div className="section-inner grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { icon: Heart, t: "Made with love", d: "Every dessert is made by hand each morning." },
            { icon: Leaf,  t: "Real ingredients", d: "Premium, traceable, never artificial." },
            { icon: Award, t: "Award-winning", d: "Recognized by local food guides." },
            { icon: Star,  t: "5-star service",  d: "Hospitality is part of the recipe." },
          ].map((v, i) => (
            <motion.div key={v.t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card border text-center shadow-soft">
              <div className="w-12 h-12 mx-auto rounded-2xl gradient-choco flex items-center justify-center text-primary-foreground mb-4"><v.icon className="w-5 h-5" /></div>
              <h3 className="font-semibold text-lg">{v.t}</h3>
              <p className="text-sm text-muted-foreground mt-2">{v.d}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}