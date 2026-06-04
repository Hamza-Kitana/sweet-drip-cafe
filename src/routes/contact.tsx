import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Clock, Instagram, Facebook } from "lucide-react";
import { motion } from "motion/react";
import { MapLocationBox } from "@/components/MapLocationBox";
import { CAFE_EMAIL, CAFE_HOURS } from "@/lib/location";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Sweet Drip" }] }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="section-inner py-10 sm:py-16">
      <div className="text-center mb-8 sm:mb-12 px-1">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-secondary mb-2 sm:mb-3">Get in Touch</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display text-primary leading-tight">Say <span className="font-script text-gradient-gold">hello</span></h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <InfoCard icon={MapPin} title="Visit us" lines={["1658 E 53rd St", "Chicago, IL 60615"]} />
        <InfoCard icon={Phone} title="Call" lines={["+1 (773) 966-4332"]} />
        <InfoCard icon={Mail} title="Email" lines={[CAFE_EMAIL]} />
        <InfoCard icon={Clock} title="Hours" lines={["Monday to Sunday", CAFE_HOURS]} />
      </motion.div>

      <div className="mt-10 sm:mt-12 text-center">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-secondary mb-4 sm:mb-5">Follow us</p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
          <Social href="https://www.instagram.com/sweetdrip_desserts/" Icon={Instagram} label="Instagram" />
          <Social href="https://www.facebook.com/profile.php?id=61557068464580" Icon={Facebook} label="Facebook" />
          <Social href="https://www.tiktok.com/@sweet.drip.cafe" Icon={TikTokIcon} label="TikTok" />
        </div>
      </div>

      <div className="mt-10 sm:mt-12">
        <h2 className="mb-4 text-center text-2xl font-display text-primary sm:text-3xl">Our location</h2>
        <MapLocationBox aspectClassName="aspect-[4/3] lg:aspect-[21/9]" borderClassName="border" />
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, lines }: { icon: React.ComponentType<{ className?: string }>; title: string; lines: string[] }) {
  return (
    <div className="flex gap-4 rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-choco text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        {lines.map((l, i) => (
          <p key={i} className="text-sm text-muted-foreground">{l}</p>
        ))}
      </div>
    </div>
  );
}

function Social({ href, Icon, label }: { href: string; Icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border bg-card shadow-soft transition hover:gradient-choco hover:text-primary-foreground hover:shadow-glow sm:h-[4.5rem] sm:w-[4.5rem] sm:rounded-3xl"
    >
      <Icon className="h-8 w-8 sm:h-9 sm:w-9" />
    </a>
  );
}

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.5 6.6a5.6 5.6 0 0 1-3.3-1V15a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.9a2.8 2.8 0 1 0 2 2.7V2h2.8a5.6 5.6 0 0 0 3.3 4.6Z" />
    </svg>
  );
}
