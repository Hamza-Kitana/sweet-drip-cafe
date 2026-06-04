import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useShop } from "@/lib/store";
import { CAFE_ADDRESS, CAFE_MAPS_URL } from "@/lib/location";
import { SectionHeading } from "@/components/SectionHeading";
import {
  Award,
  ArrowRight,
  Cake,
  Clock,
  Coffee,
  Heart,
  IceCream,
  Leaf,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Sweet Drip" },
      { name: "description", content: "Our story, our values, and the Hyde Park cafe behind every sweet bite." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Heart, title: "Made with love", desc: "Every dessert is prepared by hand, fresh throughout the day." },
  { icon: Leaf, title: "Real ingredients", desc: "Belgian chocolate, premium pistachios, and real cream — never shortcuts." },
  { icon: Award, title: "Neighborhood favorite", desc: "A cozy Hyde Park spot locals return to for birthdays, dates, and slow afternoons." },
  { icon: Star, title: "Warm hospitality", desc: "Great service is part of the recipe — we want you to feel at home." },
];

const highlights = [
  { icon: Cake, label: "Signature cakes & slices" },
  { icon: IceCream, label: "Scoops, sundaes & seasonal flavors" },
  { icon: Coffee, label: "Espresso drinks & iced lattes" },
  { icon: Sparkles, label: "Limited-time bundles & offers" },
];

const milestones = [
  { year: "2019", title: "The first drip", desc: "Sweet Drip opened on E 53rd St with a small menu and a big dream." },
  { year: "2021", title: "Growing the menu", desc: "Added pistachio favorites, ice cream bar treats, and weekend specials." },
  { year: "Today", title: "Your sweet escape", desc: "Still family-run, still baking daily — now a staple of Hyde Park dessert culture." },
];

const aboutSection =
  "flex min-h-[100svh] flex-col justify-center section-pad";

function AboutPage() {
  const { hero } = useShop();

  return (
    <div>
      <section className={aboutSection}>
        <div className="section-inner w-full">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="order-2 text-center lg:order-1 lg:text-left"
          >
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-secondary sm:mb-3 sm:tracking-[0.3em]">
              Our Story
            </p>
            <h1 className="font-display text-4xl leading-tight text-primary sm:text-5xl lg:text-6xl">
              A little café with a <span className="font-script text-gradient-gold">big heart</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
              Sweet Drip began as a love letter to slow afternoons, warm chocolate, and people you want to linger with.
              We craft every dessert from the very best ingredients and serve them in a space designed to feel like home.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              From our kitchen in Hyde Park, Chicago, we&apos;ve shared thousands of sweet moments — birthdays, study
              breaks, first dates, and quiet treats just because. We can&apos;t wait to share one with you.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-full gradient-choco px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:scale-[1.02]"
              >
                Explore our menu <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={CAFE_MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-primary transition hover:border-accent hover:text-accent"
              >
                <MapPin className="h-4 w-4" /> Get directions
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="order-1 lg:order-2"
          >
            <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl shadow-glow ring-1 ring-border/50 sm:rounded-3xl">
              <img
                src={hero.aboutImage}
                alt="Inside Sweet Drip cafe"
                className="h-52 w-full object-cover sm:h-60 lg:h-72"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/80 to-transparent px-4 py-4 text-left text-primary-foreground sm:px-5 sm:py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Hyde Park · Chicago</p>
                <p className="mt-1 font-display text-lg sm:text-xl">Where every bite is a sweet escape</p>
              </div>
            </div>
          </motion.div>
        </div>
        </div>
      </section>

      <section className={`${aboutSection} border-y border-border/60 bg-muted/40`}>
        <div className="section-inner w-full">
          <SectionHeading
            eyebrow="What we stand for"
            title="More than dessert"
            sub="Four promises we keep every single day."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border bg-card p-6 text-center shadow-soft sm:rounded-3xl sm:p-8"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl gradient-choco text-primary-foreground">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className={aboutSection}>
        <div className="section-inner w-full">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <div>
              <SectionHeading
                eyebrow="On the menu"
                title="Cravings we love"
                sub="A taste of what you'll find when you walk in."
              />
              <ul className="mx-auto grid max-w-md gap-3 sm:max-w-none">
                {highlights.map((item, i) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 rounded-2xl border bg-card px-4 py-3.5 shadow-soft sm:px-5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/25 text-primary">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium sm:text-base">{item.label}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div>
              <SectionHeading eyebrow="Our journey" title="How we got here" />
              <div className="relative mx-auto max-w-md space-y-6 sm:max-w-none">
                <span className="absolute bottom-2 left-[1.125rem] top-2 w-px bg-border sm:left-5" aria-hidden />
                {milestones.map((m, i) => (
                  <motion.div
                    key={m.year}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative flex gap-4 sm:gap-5"
                  >
                    <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-gold text-xs font-bold text-primary shadow-soft sm:h-10 sm:w-10">
                      {m.year.slice(2)}
                    </span>
                    <div className="rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">{m.year}</p>
                      <h3 className="mt-1 font-semibold text-primary">{m.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${aboutSection} bg-primary text-primary-foreground`}>
        <div className="section-inner w-full">
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm sm:p-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">Visit us</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">
              Pull up a chair at <span className="font-script text-gradient-gold">Sweet Drip</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed opacity-85 sm:text-base">
              We&apos;re open seven days a week in the heart of Hyde Park — perfect for a post-dinner treat, a study
              break, or a celebration with someone special.
            </p>
            <ul className="mt-6 inline-flex flex-col gap-3 text-left text-sm sm:text-base">
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-accent" />
                {CAFE_ADDRESS}
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-accent" />
                Mon – Sun · 9 AM – 9 PM
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full gradient-gold px-6 py-2.5 text-sm font-semibold text-primary shadow-soft transition hover:scale-[1.02]"
              >
                Contact us <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium transition hover:border-accent hover:text-accent"
              >
                View menu
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
