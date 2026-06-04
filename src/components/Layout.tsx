import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Menu as MenuIcon, X, Lock, Instagram, Facebook, Phone, MapPin, Clock } from "lucide-react";
import { CAFE_ADDRESS, CAFE_MAPS_URL } from "@/lib/location";
import logo from "@/assets/logo.png";
import { useCart, useAdmin } from "@/lib/store";
import { AdminLoginDialog } from "./AdminLoginDialog";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.5 6.6a5.6 5.6 0 0 1-3.3-1V15a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.9a2.8 2.8 0 1 0 2 2.7V2h2.8a5.6 5.6 0 0 0 3.3 4.6Z"/>
    </svg>
  );
}

function PageLoader() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] gradient-hero flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <motion.img
              src={logo}
              alt="Sweet Drip"
              className="w-40 sm:w-56 drop-shadow-xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-primary"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Layout() {
  const items = useCart(s => s.items);
  const { isAdmin } = useAdmin();
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: s => s.location.pathname });
  const count = items.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    document.documentElement.dataset.headerScrolled = window.scrollY > 24 ? "true" : "false";
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.headerScrolled = scrolled ? "true" : "false";
  }, [scrolled]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty("--site-header-height", `${el.offsetHeight}px`);
    };

    syncHeaderHeight();
    const ro = new ResizeObserver(syncHeaderHeight);
    ro.observe(el);
    window.addEventListener("resize", syncHeaderHeight);
    window.addEventListener("scroll", syncHeaderHeight, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
      window.removeEventListener("scroll", syncHeaderHeight);
    };
  }, [pathname]);

  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen flex flex-col">
      <PageLoader />

      <header ref={headerRef} className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "py-2" : "py-3 sm:py-4"}`}>
        <div
          className={`section-inner transition-all duration-500 ${
            scrolled
              ? "glass shadow-soft md:rounded-b-2xl"
              : "bg-transparent shadow-none backdrop-blur-none"
          }`}
        >
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Link to="/" className="flex shrink-0 items-center min-w-0">
              <img
                src={logo}
                alt="Sweet Drip"
                className={`w-auto object-contain transition-all duration-500 drop-shadow-[0_2px_12px_rgba(0,0,0,0.15)] ${
                  scrolled
                    ? "h-11 max-w-[160px] sm:h-14 sm:max-w-[200px] md:h-16 md:max-w-[240px]"
                    : "h-14 max-w-[180px] sm:h-20 sm:max-w-[260px] md:h-24 md:max-w-[320px]"
                }`}
              />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(n => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="px-4 py-2 rounded-full text-sm font-medium text-foreground/80 hover:text-primary hover:bg-accent/30 transition-colors"
                  activeProps={{ className: "text-primary bg-accent/40" }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Link to="/cart" className="relative p-2.5 rounded-full hover:bg-accent/40 transition">
                <ShoppingBag className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Link>
              <button onClick={() => setOpen(true)} className="md:hidden p-2.5 rounded-full hover:bg-accent/40">
                <MenuIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close menu"
              className="fixed inset-0 z-[55] bg-black/50 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26 }}
              className="fixed inset-y-0 right-0 z-[60] w-[min(100%,20rem)] bg-card shadow-glow p-6 pt-[max(1.5rem,env(safe-area-inset-top))] flex flex-col gap-1 md:hidden"
            >
              <button type="button" onClick={() => setOpen(false)} className="self-end p-2 -mr-2" aria-label="Close">
                <X />
              </button>
              {NAV.map(n => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="py-3.5 px-4 rounded-xl hover:bg-accent/30 text-lg font-medium"
                  onClick={() => setOpen(false)}
                >
                  {n.label}
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className={`flex-1 ${pathname === "/" ? "pt-0" : "pt-[5.5rem] sm:pt-28 lg:pt-32"}`}>
        <Outlet />
      </main>

      <footer className="relative mt-auto overflow-hidden bg-primary text-primary-foreground">
        <div className="h-1 w-full gradient-gold" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.78_0.14_55/0.22),transparent)]"
          aria-hidden
        />

        <div className="section-inner relative py-14 md:py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="flex flex-col items-center text-center lg:col-span-5 lg:items-start lg:text-left">
              <Link to="/" className="inline-block transition hover:opacity-90">
                <span className="inline-flex rounded-2xl bg-primary-foreground px-5 py-3 shadow-[0_8px_28px_rgba(0,0,0,0.28)] ring-1 ring-primary-foreground/20 md:px-6 md:py-4">
                  <img src={logo} alt="Sweet Drip" className="h-28 w-auto md:h-36 lg:h-40" />
                </span>
              </Link>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-primary-foreground/75">
                Where every bite is a <span className="font-script text-gradient-gold text-lg">sweet escape</span>.
                Crafted with love in Chicago.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 lg:justify-start">
                {[
                  { href: "https://www.instagram.com/sweetdrip_desserts/", label: "Instagram", Icon: Instagram },
                  { href: "https://www.facebook.com/profile.php?id=61557068464580", label: "Facebook", Icon: Facebook },
                  { href: "https://www.tiktok.com/@sweet.drip.cafe", label: "TikTok", Icon: TikTokIcon },
                ].map(({ href, label, Icon }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/15 bg-primary-foreground/5 transition hover:border-accent hover:bg-accent hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-10 sm:grid-cols-3 lg:col-span-7 lg:gap-8">
              <div className="text-center sm:text-left">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">Visit</p>
                <ul className="space-y-3 text-sm text-primary-foreground/85">
                  <li>
                    <a
                      href={CAFE_MAPS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-start gap-3 text-left transition hover:text-accent"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10">
                        <MapPin className="h-4 w-4 text-accent" />
                      </span>
                      <span className="pt-1.5 leading-snug">{CAFE_ADDRESS}</span>
                    </a>
                  </li>
                  <li>
                    <a href="tel:+17739664332" className="group inline-flex items-center gap-3 transition hover:text-accent">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10">
                        <Phone className="h-4 w-4 text-accent" />
                      </span>
                      +1 (773) 966-4332
                    </a>
                  </li>
                  <li className="inline-flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10">
                      <Clock className="h-4 w-4 text-accent" />
                    </span>
                    Mon–Sun · 9 AM – 9 PM
                  </li>
                </ul>
              </div>

              <div className="text-center sm:text-left">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">Explore</p>
                <ul className="space-y-2.5 text-sm">
                  {NAV.map((n) => (
                    <li key={n.to}>
                      <Link
                        to={n.to}
                        className="inline-block text-primary-foreground/85 transition hover:translate-x-0.5 hover:text-accent"
                      >
                        {n.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center sm:text-left">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">Legal</p>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link to="/privacy" className="text-primary-foreground/85 transition hover:text-accent">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-primary-foreground/85 transition hover:text-accent">
                      Terms & Conditions
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 bg-black/15">
          <div className="section-inner flex flex-col items-center justify-between gap-3 py-5 text-center text-xs text-primary-foreground/60 sm:flex-row sm:text-left">
            <span>© {new Date().getFullYear()} Sweet Drip Dessert Cafe. All rights reserved.</span>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/10 px-3 py-1.5 transition hover:border-accent/40 hover:text-accent"
            >
              <Lock className="h-3 w-3" /> {isAdmin ? "Admin" : "Staff"}
            </button>
          </div>
        </div>
      </footer>

      <AdminLoginDialog open={adminOpen} onOpenChange={setAdminOpen} />
    </div>
  );
}