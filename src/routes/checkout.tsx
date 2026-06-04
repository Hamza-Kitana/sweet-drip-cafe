import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart, useShop, fmt } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, ChevronLeft } from "lucide-react";
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
  guests: z.coerce.number().min(1, "Must be at least 1").max(50),
  date: z.string().min(1, "Date required"),
  time: z.string().min(1, "Time required"),
  message: z.string().max(500).optional(),
});

const TIP_PRESETS = [0, 10, 15, 20];

function parseTipInput(value: string) {
  if (value === "" || value === ".") return 0;
  const n = parseFloat(value);
  return Number.isNaN(n) || n < 0 ? 0 : +n.toFixed(2);
}

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Sweet Drip" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, tip, setTip, clear, setLastOrderId } = useCart();
  const addOrder = useShop(s => s.addOrder);
  const navigate = useNavigate();
  const [step, setStep] = useState<"details" | "payment">("details");
  const [tipPct, setTipPct] = useState<number | "custom">(tip > 0 ? "custom" : 0);
  const [customTip, setCustomTip] = useState(tip > 0 ? String(tip) : "");
  const [form, setForm] = useState({ name: "", email: "", phone: "", guests: "1", date: "", time: "", message: "" });
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tipAmount =
    tipPct === "custom"
      ? parseTipInput(customTip)
      : +(subtotal * (tipPct / 100)).toFixed(2);
  const total = +(subtotal + tipAmount).toFixed(2);

  const applyCustomTip = (value: string) => {
    setCustomTip(value);
    setTipPct("custom");
    setTip(parseTipInput(value));
  };

  const applyPresetTip = (pct: number) => {
    setTipPct(pct);
    const amount = +(subtotal * (pct / 100)).toFixed(2);
    setCustomTip(pct === 0 ? "" : String(amount));
    setTip(amount);
  };

  if (items.length === 0) {
    return <div className="p-20 text-center"><p>Your cart is empty.</p><Link to="/menu" className="text-primary underline">Browse menu</Link></div>;
  }

  const onSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) { toast.error(r.error.issues[0].message); return; }
    setStep("payment");
  };

  const onPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (card.number.replace(/\s/g, "").length < 12) { toast.error("Enter a valid card number"); return; }
    if (!card.exp || !card.cvc) { toast.error("Complete card details"); return; }
    const data = schema.parse(form);
    const order = addOrder({ items, customer: data, subtotal, tip: tipAmount, total });
    setLastOrderId(order.id);
    clear();
    toast.success("Payment successful");
    navigate({ to: "/invoice" });
  };

  return (
    <div className="section-inner py-8 sm:py-12">
      <button onClick={() => step === "payment" ? setStep("details") : navigate({ to: "/cart" })} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 sm:mb-6">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-3xl sm:text-4xl font-display text-primary mb-6 sm:mb-8">{step === "details" ? "Your details" : "Payment"}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border shadow-soft">
          {step === "details" ? (
            <form onSubmit={onSubmitDetails} className="grid sm:grid-cols-2 gap-4">
              <Field label="Name *"><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
              <Field label="Email *"><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></Field>
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
              <Field label="Guest Count *"><Input type="number" min="1" value={form.guests} onChange={e => setForm({...form, guests: e.target.value})} /></Field>
              <Field label="Date *"><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></Field>
              <Field label="Time *"><Input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} /></Field>
              <div className="sm:col-span-2"><Field label="Message"><Textarea rows={3} value={form.message} onChange={e => setForm({...form, message: e.target.value})} /></Field></div>
              <Button type="submit" size="lg" className="sm:col-span-2 rounded-full gradient-choco text-primary-foreground mt-2">Continue to payment</Button>
            </form>
          ) : (
            <form onSubmit={onPay} className="space-y-4">
              <Field label="Card Number">
                <Input value={card.number} maxLength={19}
                  onChange={e => setCard({...card, number: e.target.value.replace(/[^0-9]/g, "").replace(/(.{4})/g, "$1 ").trim()})}
                  placeholder="4242 4242 4242 4242" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiry"><Input placeholder="MM/YY" maxLength={5} value={card.exp} onChange={e => setCard({...card, exp: e.target.value})} /></Field>
                <Field label="CVC"><Input maxLength={4} value={card.cvc} onChange={e => setCard({...card, cvc: e.target.value.replace(/[^0-9]/g, "")})} /></Field>
              </div>
              <div>
                <Label className="mb-2 block">Add a tip for the staff</Label>
                <div className="flex flex-wrap gap-2">
                  {TIP_PRESETS.map(p => (
                    <button type="button" key={p} onClick={() => applyPresetTip(p)}
                      className={`px-4 py-2 rounded-full text-sm border-2 transition ${tipPct === p ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                      {p === 0 ? "No tip" : `${p}%`}
                    </button>
                  ))}
                  <button type="button" onClick={() => setTipPct("custom")}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition ${tipPct === "custom" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>Custom</button>
                  {tipPct === "custom" && (
                    <div className="relative w-32">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input className="pl-7" placeholder="0.00" inputMode="decimal" value={customTip} onChange={e => applyCustomTip(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full rounded-full gradient-choco text-primary-foreground">
                <CreditCard className="w-4 h-4 mr-2" /> Pay {fmt(total)}
              </Button>
              <p className="text-xs text-center text-muted-foreground">Demo checkout — no real charges are made.</p>
            </form>
          )}
        </div>

        <aside className="h-fit p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border shadow-soft lg:sticky lg:top-28">
          <h2 className="font-display text-xl text-primary mb-4">Order summary</h2>
          <ul className="space-y-2 text-sm max-h-60 overflow-auto pr-2">
            {items.map(i => (
              <li key={i.uid} className="flex justify-between gap-2">
                <span>{i.qty}× {i.name}</span>
                <span>{fmt(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between"><span>Tip</span><span>{fmt(tipAmount)}</span></div>
            <div className="flex justify-between text-lg font-display pt-2 border-t mt-2"><span>Total</span><span className="text-primary">{fmt(total)}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block text-sm">{label}</Label>{children}</div>;
}