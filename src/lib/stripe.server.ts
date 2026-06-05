import Stripe from "stripe";

export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || "";
}

export function isStripeConfigured() {
  return Boolean(getStripeSecretKey());
}

export function getStripeClient() {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secretKey, {
    apiVersion: "2026-05-27.dahlia",
  });
}
