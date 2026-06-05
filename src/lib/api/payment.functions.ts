import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { calcOrderTotal, normalizeTaxRate } from "@/lib/store";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe.server";

const paymentItemSchema = z.object({
  productId: z.string(),
  name: z.string().min(1).max(120),
  price: z.number().positive().max(10_000),
  qty: z.number().int().positive().max(99),
});

const createPaymentIntentSchema = z.object({
  items: z.array(paymentItemSchema).min(1).max(50),
  tip: z.number().min(0).max(10_000),
  taxRatePercent: z.number().min(0).max(100),
  customer: z.object({
    name: z.string().min(1).max(80),
    email: z.string().email().max(120),
  }),
});

export const createStripePaymentIntent = createServerFn({ method: "POST" })
  .inputValidator(createPaymentIntentSchema)
  .handler(async ({ data }) => {
    if (!isStripeConfigured()) {
      throw new Error("Stripe is not configured on the server. Add STRIPE_SECRET_KEY to your environment.");
    }

    const taxRatePercent = normalizeTaxRate(data.taxRatePercent);
    const subtotal = +data.items
      .reduce((sum, item) => sum + item.price * item.qty, 0)
      .toFixed(2);
    const tip = +Math.max(0, data.tip).toFixed(2);
    const { tax, total } = calcOrderTotal(subtotal, tip, taxRatePercent);

    if (total < 0.5) {
      throw new Error("Order total must be at least $0.50");
    }

    const stripe = getStripeClient();
    const amountCents = Math.round(total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: data.customer.email,
      metadata: {
        customer_name: data.customer.name.slice(0, 500),
        customer_email: data.customer.email.slice(0, 500),
        item_count: String(data.items.reduce((n, i) => n + i.qty, 0)),
        subtotal: String(subtotal),
        tip: String(tip),
        tax: String(tax),
        tax_rate: String(taxRatePercent),
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe did not return a client secret");
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      subtotal,
      tip,
      tax,
      taxRatePercent,
      total,
      amountCents,
    };
  });
