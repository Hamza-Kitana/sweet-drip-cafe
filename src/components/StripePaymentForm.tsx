import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { ChevronDown, CreditCard, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { fmt } from "@/lib/store";
import { cn } from "@/lib/utils";

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
  const [linkOpen, setLinkOpen] = useState(false);
  const [elementKey, setElementKey] = useState(0);

  const toggleLink = (open: boolean) => {
    setLinkOpen(open);
    setElementKey((k) => k + 1);
  };

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
      <Collapsible open={linkOpen} onOpenChange={toggleLink}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[oklch(0.72_0.09_350/0.22)] bg-muted/20 px-4 py-3 text-left text-sm transition hover:bg-muted/40"
          >
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>
                <span className="font-medium text-foreground">Pay faster next time with Link</span>
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Optional
                </span>
              </span>
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", linkOpen && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-1 pt-2">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Enable Stripe Link to save your card securely for faster checkout on your next visit. Extra fields will
            appear below the card form.
          </p>
        </CollapsibleContent>
      </Collapsible>

      <PaymentElement
        key={elementKey}
        options={{
          layout: "tabs",
          wallets: {
            link: linkOpen ? "auto" : "never",
            applePay: "never",
            googlePay: "never",
          },
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
      <p className="text-center text-xs text-muted-foreground">Secure payment powered by Stripe</p>
    </form>
  );
}
