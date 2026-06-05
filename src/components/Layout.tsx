import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Menu as MenuIcon, X, Lock, Instagram, Facebook, Phone, MapPin, Clock } from "lucide-react";
import { CAFE_ADDRESS, CAFE_MAPS_URL, CAFE_HOURS_FOOTER } from "@/lib/location";
import logo from "@/assets/Sweet_Drip_Logo..png";
import { useCart, useAdmin } from "@/lib/store";
import { AdminLoginDialog } from "./AdminLoginDialog";
import { CartDrawer } from "./CartDrawer";
import { PinkBackgroundAccents } from "./PinkBackgroundAccents";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/catering", label: "Catering" },
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
          className="page-loader-bg fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -right-16 top-[12%] h-72 w-72 rounded-full bg-[oklch(0.84_0.11_350/0.22)] blur-3xl" />
            <div className="absolute -left-20 bottom-[10%] h-64 w-64 rounded-full bg-[oklch(0.88_0.09_348/0.18)] blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.9_0.07_355/0.14)] blur-3xl" />
          </div>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative z-[1] flex flex-col items-center gap-6"
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
                  className="h-2.5 w-2.5 rounded-full bg-[oklch(0.62_0.12_348)]"
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
  const setDrawerOpen = useCart(s => s.setDrawerOpen);
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
    <div className="relative min-h-screen flex flex-col">
      <PinkBackgroundAccents />
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
            <Link to="/" className="flex shrink-0 items-center min-w-0 transition hover:opacity-90">
              <img
                src={logo}
                alt="Sweet Drip"
                className={`w-auto object-contain transition-all duration-500 ${
                  scrolled
                    ? "h-14 max-w-[200px] sm:h-16 sm:max-w-[240px] md:h-[4.5rem] md:max-w-[280px]"
                    : "h-16 max-w-[220px] sm:h-20 sm:max-w-[300px] md:h-24 md:max-w-[360px] lg:h-28 lg:max-w-[420px]"
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
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative rounded-full p-2.5 transition hover:bg-accent/40"
                aria-label="Open cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
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

      <footer className="site-footer relative mt-auto overflow-hidden">
        <div className="h-1 w-full gradient-gold" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.88_0.08_355/0.28),transparent)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_50%,oklch(0.78_0.1_10/0.16),transparent)]"
          aria-hidden
        />

        <div className="section-inner relative py-14 md:py-16 lg:py-20">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-12">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <Link to="/" className="inline-block transition hover:opacity-90">
                <img
                  src={logo}
                  alt="Sweet Drip"
                  className="h-24 w-auto drop-shadow-md md:h-32 lg:h-36"
                />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 lg:col-span-3 lg:gap-8">
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <p className="footer-heading">Visit</p>
                <ul className="w-full space-y-3 text-sm">
                  <li>
                    <a
                      href={CAFE_MAPS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="footer-link flex items-start gap-3 text-left"
                    >
                      <span className="footer-icon-box">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 pt-1.5 leading-snug">{CAFE_ADDRESS}</span>
                    </a>
                  </li>
                  <li>
                    <a href="tel:+17739664332" className="footer-link flex items-center gap-3 text-left">
                      <span className="footer-icon-box">
                        <Phone className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 leading-snug">+1 (773) 966-4332</span>
                    </a>
                  </li>
                  <li>
                    <div className="footer-link flex items-center gap-3 text-left">
                      <span className="footer-icon-box">
                        <Clock className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 leading-snug">{CAFE_HOURS_FOOTER}</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <p className="footer-heading">Explore</p>
                <ul className="w-full space-y-2.5 text-sm">
                  {NAV.map((n) => (
                    <li key={n.to}>
                      <Link to={n.to} className="footer-link inline-block transition hover:translate-x-0.5">
                        {n.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <p className="footer-heading">Legal</p>
                <ul className="w-full space-y-2.5 text-sm">
                  <li>
                    <Link to="/privacy" className="footer-link inline-block transition hover:translate-x-0.5">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="footer-link inline-block transition hover:translate-x-0.5">
                      Terms & Conditions
                    </Link>
                  </li>
                </ul>
                <div className="mt-6 flex items-center justify-center gap-2 sm:justify-start">
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
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[oklch(0.32_0.08_40/0.2)] bg-[oklch(0.32_0.08_40/0.08)] text-[var(--footer-fg)] transition hover:border-[oklch(0.32_0.08_40/0.35)] hover:bg-[oklch(0.32_0.08_40/0.14)]"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="site-footer-bar">
          <div className="section-inner relative flex flex-col items-center gap-3 py-5 sm:min-h-[3.25rem] sm:justify-center">
            <span className="w-full text-center text-xs text-white/95">
              © {new Date().getFullYear()} Sweet Drip Dessert Cafe. All rights reserved.
            </span>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.32_0.08_40/0.2)] px-3 py-1.5 text-xs text-[var(--footer-muted)] transition hover:border-[oklch(0.32_0.08_40/0.35)] hover:text-[var(--footer-fg)] sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2"
            >
              <Lock className="h-3 w-3" /> {isAdmin ? "Admin" : "Staff"}
            </button>
          </div>
        </div>
      </footer>

      <AdminLoginDialog open={adminOpen} onOpenChange={setAdminOpen} />
      <CartDrawer />
    </div>
  );
}