import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { useShop } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarClock, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { formatUsPhoneFull, formatUsPhoneLocal, usPhoneDigits } from "@/lib/phone";

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  email: z.string().trim().email("Invalid email").max(120),
  phone: z
    .string()
    .transform(usPhoneDigits)
    .refine((digits) => digits.length === 10, "Enter a valid 10-digit US phone number")
    .transform(formatUsPhoneFull),
  guests: z.coerce.number().min(1, "Must be at least 1").max(500),
  date: z.string().min(1, "Date required"),
  time: z.string().min(1, "Time required"),
  message: z.string().max(500).optional(),
});

export const Route = createFileRoute("/catering")({
  head: () => ({
    meta: [
      { title: "Catering — Sweet Drip" },
      { name: "description", content: "Request catering and large dessert orders for your event." },
    ],
  }),
  component: CateringPage,
});

function CateringPage() {
  const addLargeOrder = useShop((s) => s.addLargeOrder);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    guests: "1",
    date: "",
    time: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    addLargeOrder(result.data);
    setSent(true);
    toast.success("Catering request sent! We'll contact you soon.");
    setForm({ name: "", email: "", phone: "", guests: "1", date: "", time: "", message: "" });
  };

  return (
    <div className="section-inner py-10 sm:py-16">
      <div className="mx-auto max-w-2xl px-1 text-center">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-secondary sm:mb-3 sm:tracking-[0.3em]">
          Events & Parties
        </p>
        <h1 className="font-display text-4xl leading-tight text-primary sm:text-5xl lg:text-6xl">
          <span className="font-script text-gradient-gold">Catering</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
          Planning a party, office treat, or special celebration? Tell us what you need and we&apos;ll prepare a custom
          quote for your group.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-8 max-w-2xl rounded-2xl border bg-card p-5 shadow-soft sm:rounded-3xl sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
          <Users className="h-5 w-5 shrink-0 text-accent" />
          <p>Ideal for birthdays, weddings, corporate events, and orders of 10+ guests.</p>
        </div>

        {sent && (
          <div className="mb-6 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-primary">
            Thanks! Your catering request was received. Our team will reach out by email or phone.
          </div>
        )}

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name *">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email *">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone Number *">
            <div className="flex overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring">
              <span className="flex shrink-0 items-center border-r border-input bg-muted/50 px-3 text-sm font-medium text-muted-foreground">
                +1
              </span>
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                className="border-0 shadow-none focus-visible:ring-0"
                value={formatUsPhoneLocal(form.phone)}
                placeholder="(773) 966-4332"
                onChange={(e) => setForm({ ...form, phone: usPhoneDigits(e.target.value) })}
              />
            </div>
          </Field>
          <Field label="Guest Count *">
            <Input
              type="number"
              min="1"
              value={form.guests}
              onChange={(e) => setForm({ ...form, guests: e.target.value })}
            />
          </Field>
          <Field label="Date *">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Time *">
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Message">
              <Textarea
                rows={4}
                value={form.message}
                placeholder="Tell us about your event, preferred desserts, dietary notes…"
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </Field>
          </div>
          <Button
            type="submit"
            size="lg"
            className="sm:col-span-2 mt-1 rounded-full gradient-choco text-primary-foreground"
          >
            <Send className="mr-2 h-4 w-4" /> Submit request
          </Button>
        </form>

        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          Please submit at least 48 hours before your event when possible.
        </p>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
    </div>
  );
}
