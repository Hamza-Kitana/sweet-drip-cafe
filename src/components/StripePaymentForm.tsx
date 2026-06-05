import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/store";

type StripePaymentFormProps = {
  total: number;
  customerEmail: string;
  onSuccess: (paymentIntentId: string) => void;
};

export function StripePaymentForm({ total, customerEmail, onSuccess }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/invoice`,
        receipt_email: customerEmail,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
      return;
    }

    setError("Payment was not completed. Please try again.");
    setSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={!stripe || !elements || submitting}
        className="w-full rounded-full gradient-choco text-primary-foreground"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {fmt(total)}
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Secure payment powered by Stripe
      </p>
    </form>
  );
}
