import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCart, useShop, fmt, calcOrderTotal } from "@/lib/store";
import { isApiMode } from "@/lib/api/client";
import * as api from "@/lib/api/backend";
import { createStripePaymentIntent } from "@/lib/api/payment.functions";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Loader2 } from "lucide-react";
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
  date: z.string().min(1, "Date required"),
  time: z.string().min(1, "Time required"),
  message: z.string().max(500).optional(),
});

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

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
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);
  const taxRatePercent = useShop((s) => s.taxRatePercent);
  const navigate = useNavigate();
  const [step, setStep] = useState<"details" | "payment">("details");
  const [tipInput, setTipInput] = useState(tip > 0 ? String(tip) : "");
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", time: "", message: "" });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tipAmount = parseTipInput(tipInput);
  const totals = useMemo(
    () => calcOrderTotal(subtotal, tipAmount, taxRatePercent),
    [subtotal, tipAmount, taxRatePercent],
  );

  const applyTip = (value: string) => {
    setTipInput(value);
    setTip(parseTipInput(value));
  };

  const stripeEnabled = Boolean(stripePublishableKey);

  const initPayment = useCallback(async (customer: z.infer<typeof schema>) => {
    if (!stripeEnabled) return;

    setPaymentLoading(true);
    setPaymentError(null);
    setClientSecret(null);

    try {
      if (isApiMode) {
        const result = await api.checkoutOrder({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            qty: i.qty,
            note: i.note,
            noteChoice: i.noteChoice,
            image: i.image,
          })),
          tip: tipAmount,
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            date: customer.date,
            time: customer.time,
            message: customer.message,
          },
        });
        setPendingOrderId(result.orderId);
        setClientSecret(result.clientSecret);
      } else {
        const result = await createStripePaymentIntent({
          data: {
            items: items.map((i) => ({
              productId: i.productId,
              name: i.name,
              price: i.price,
              qty: i.qty,
            })),
            tip: tipAmount,
            taxRatePercent,
            customer: {
              name: customer.name,
              email: customer.email,
            },
          },
        });
        setPendingOrderId(null);
        setClientSecret(result.clientSecret);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start payment";
      setPaymentError(message);
      toast.error(message);
    } finally {
      setPaymentLoading(false);
    }
  }, [items, stripeEnabled, taxRatePercent, tipAmount]);

  useEffect(() => {
    if (step !== "payment" || !stripeEnabled) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) return;
    void initPayment(parsed.data);
  }, [step, stripeEnabled, form, initPayment]);

  if (items.length === 0) {
    return (
      <div className="p-20 text-center">
        <p>Your cart is empty.</p>
        <Link to="/menu" className="text-primary underline">
          Browse menu
        </Link>
      </div>
    );
  }

  const onSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      toast.error(r.error.issues[0].message);
      return;
    }
    setTip(tipAmount);
    setStep("payment");
  };

  const onPaymentSuccess = async (paymentIntentId: string) => {
    try {
      if (isApiMode && pendingOrderId) {
        const order = await api.confirmOrderPayment(pendingOrderId, paymentIntentId);
        setLastOrderId(order.id);
        clear();
        toast.success("Payment successful");
        navigate({ to: "/invoice", search: { payment: paymentIntentId } as never });
        return;
      }

      const data = schema.parse(form);
      const order = useShop.getState().addOrder({
        items,
        customer: data,
        subtotal,
        tip: tipAmount,
        tax: totals.tax,
        taxRate: taxRatePercent,
        total: totals.total,
      });
      setLastOrderId(order.id);
      clear();
      toast.success("Payment successful");
      navigate({ to: "/invoice", search: { payment: paymentIntentId } as never });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not confirm payment";
      toast.error(message);
    }
  };

  return (
    <div className="section-inner py-8 sm:py-12">
      <button
        onClick={() => {
          if (step === "payment") {
            setStep("details");
            setClientSecret(null);
            setPendingOrderId(null);
            setPaymentError(null);
          } else {
            setDrawerOpen(true);
            navigate({ to: "/menu" });
          }
        }}
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary sm:mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="mb-6 font-display text-3xl text-primary sm:mb-8 sm:text-4xl">
        {step === "details" ? "Your details" : "Payment"}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="rounded-2xl border bg-card p-4 shadow-soft sm:rounded-3xl sm:p-6">
          {step === "details" ? (
            <form onSubmit={onSubmitDetails} className="grid gap-4 sm:grid-cols-2">
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
              <Field label="Date *">
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Time *">
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Message">
                  <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </Field>
              </div>
              <Button type="submit" size="lg" className="mt-2 rounded-full gradient-choco text-primary-foreground sm:col-span-2">
                Continue to payment
              </Button>
            </form>
          ) : !stripeEnabled ? (
            <StripeSetupNotice missing="publishable" />
          ) : paymentLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Preparing secure checkout…</p>
            </div>
          ) : paymentError ? (
            <div className="space-y-4">
              <StripeSetupNotice missing="server" message={paymentError} />
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  const parsed = schema.safeParse(form);
                  if (parsed.success) void initPayment(parsed.data);
                }}
              >
                Try again
              </Button>
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements
              key={clientSecret}
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#5c3d2e",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <StripePaymentForm
                total={totals.total}
                customerEmail={form.email}
                onSuccess={onPaymentSuccess}
              />
            </Elements>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border bg-card p-5 shadow-soft sm:rounded-3xl sm:p-6 lg:sticky lg:top-28">
          <h2 className="mb-4 font-display text-xl text-primary">Order summary</h2>
          <ul className="max-h-60 space-y-2 overflow-auto pr-2 text-sm">
            {items.map((i) => (
              <li key={i.uid} className="flex justify-between gap-2">
                <span>
                  {i.qty}× {i.name}
                </span>
                <span>{fmt(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-2xl border border-[oklch(0.72_0.09_350/0.22)] bg-muted/25 p-4">
            <Label htmlFor="tip-amount" className="mb-2 block text-sm font-medium">
              Add a tip for the staff
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="tip-amount"
                className="pl-7"
                placeholder="0.00"
                inputMode="decimal"
                value={tipInput}
                onChange={(e) => applyTip(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 space-y-1 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tip</span>
              <span>{fmt(tipAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({taxRatePercent}%)</span>
              <span>{fmt(totals.tax)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 font-display text-lg">
              <span>Total</span>
              <span className="text-primary">{fmt(totals.total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StripeSetupNotice({
  missing,
  message,
}: {
  missing: "publishable" | "server";
  message?: string;
}) {
  return (
    <div className="rounded-2xl border border-[oklch(0.72_0.09_350/0.28)] bg-muted/30 p-5 text-sm">
      <p className="font-semibold text-primary">Stripe setup required</p>
      <p className="mt-2 text-muted-foreground">
        {message ??
          (missing === "publishable"
            ? "Add VITE_STRIPE_PUBLISHABLE_KEY to your .env file and restart the dev server."
            : "Add STRIPE_SECRET_KEY on the server and restart the app.")}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>Copy .env.example to .env in the project root</li>
        <li>Paste your Stripe test keys from dashboard.stripe.com/apikeys</li>
        <li>Restart with bun run dev</li>
      </ul>
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
