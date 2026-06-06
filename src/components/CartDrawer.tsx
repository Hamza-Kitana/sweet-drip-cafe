import { Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { useCart, fmt, useShop } from "@/lib/store";
import { isOfferCartItem } from "@/lib/offers";
import { ProductImageDisplay } from "@/components/ProductImageDisplay";
import { formatSelectedOptionsDetailed, formatSelectedOptionsSummary } from "@/lib/product-options";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function CartDrawer() {
  const { items, setQty, remove, drawerOpen, setDrawerOpen } = useCart();
  const { products, categories } = useShop();
  const navigate = useNavigate();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  const goToCheckout = () => {
    setDrawerOpen(false);
    navigate({ to: "/checkout" });
  };

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen} modal={false}>
      <SheetContent
        side="right"
        hideClose
        showOverlay
        overlayClassName="z-[60] pointer-events-none bg-[oklch(0.62_0.12_350/0.28)] backdrop-blur-[3px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="z-[70] inset-y-auto bottom-3 right-3 top-[calc(var(--site-header-height)+0.75rem)] flex h-auto max-h-[calc(100svh-var(--site-header-height)-1.5rem)] w-[min(calc(100vw-1.5rem),19rem)] flex-col gap-0 overflow-hidden rounded-3xl border border-[oklch(0.72_0.09_350/0.35)] bg-[oklch(0.99_0.02_350/0.58)] p-0 shadow-[0_16px_48px_oklch(0.55_0.12_350/0.22),0_4px_20px_oklch(0_0_0/0.1)] backdrop-blur-xl sm:bottom-4 sm:right-5 sm:top-[calc(var(--site-header-height)+1rem)] sm:max-h-[calc(100svh-var(--site-header-height)-2rem)] sm:w-[min(calc(100vw-2rem),19rem)]"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -right-8 top-12 h-28 w-28 rounded-full bg-[oklch(0.84_0.11_350/0.12)] blur-3xl" />
          <div className="absolute -left-6 bottom-24 h-24 w-24 rounded-full bg-[oklch(0.88_0.09_348/0.1)] blur-3xl" />
        </div>

        <SheetHeader className="relative z-[2] border-b border-[oklch(0.72_0.09_350/0.2)] px-4 pb-3 pt-5 text-left">
          <SheetClose
            onClick={() => setDrawerOpen(false)}
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[oklch(0.72_0.09_350/0.3)] bg-white/70 text-primary opacity-100 transition hover:bg-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close cart"
          >
            <X className="h-3.5 w-3.5" />
          </SheetClose>
          <div className="flex items-center gap-2.5 pr-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[oklch(0.72_0.09_350/0.15)] text-primary">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <div>
              <SheetTitle className="font-display text-xl text-primary">Your cart</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {count > 0 ? `${count} sweet item${count === 1 ? "" : "s"} ready to go` : "Add something delicious"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="relative z-[1] flex flex-col items-center justify-center px-4 py-10 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.72_0.09_350/0.12)]">
              <Sparkles className="h-7 w-7 text-primary/70" />
            </div>
            <p className="font-display text-lg text-primary">Your cart is empty</p>
            <p className="mt-1.5 text-xs text-muted-foreground">Treat yourself — browse our menu.</p>
            <Button
              size="sm"
              className="mt-5 rounded-full gradient-choco text-primary-foreground"
              onClick={() => {
                setDrawerOpen(false);
                navigate({ to: "/menu" });
              }}
            >
              Browse menu
            </Button>
          </div>
        ) : (
          <>
            <div className="relative z-[1] min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
              {items.map((it) => {
                const product = products.find((p) => p.id === it.productId);
                const categoryImage = categories.find((c) => c.id === product?.categoryId)?.image;
                const optionLines = product
                  ? formatSelectedOptionsDetailed(product, it.selectedOptions, fmt)
                  : [];
                const optionSummary = it.noteChoice || formatSelectedOptionsSummary(it.selectedOptions);
                return (
                <div
                  key={it.uid}
                  className="flex gap-2.5 rounded-xl border border-[oklch(0.72_0.09_350/0.2)] bg-white/45 p-2.5 shadow-soft backdrop-blur-md"
                >
                  <ProductImageDisplay
                    image={it.image}
                    categoryImage={categoryImage}
                    alt={it.name}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    iconClassName="h-6 w-6 text-primary/40"
                    emptyClassName="h-5 w-5 text-muted-foreground/35"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-primary">{it.name}</h3>
                        {isOfferCartItem(it.productId) && (
                          <span className="mt-0.5 inline-block rounded-full bg-accent/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Offer
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-primary">{fmt(it.price * it.qty)}</span>
                    </div>
                    {(optionLines.length > 0 || optionSummary) && (
                      <div className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">
                        {optionLines.length > 0
                          ? optionLines.map((line) => <p key={line}>{line}</p>)
                          : optionSummary && <p>{optionSummary}</p>}
                      </div>
                    )}
                    {it.note && (
                      <p className="text-xs italic text-muted-foreground">&ldquo;{it.note}&rdquo;</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1 rounded-full border border-[oklch(0.72_0.09_350/0.25)] bg-white/50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setQty(it.uid, it.qty - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-[oklch(0.72_0.09_350/0.12)]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center text-xs font-medium">{it.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(it.uid, it.qty + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-[oklch(0.72_0.09_350/0.12)]"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(it.uid)}
                        className="rounded-full p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>

            <div className="relative z-[1] border-t border-[oklch(0.72_0.09_350/0.22)] bg-white/40 px-4 py-4 backdrop-blur-lg">
              <div className="flex justify-between font-display text-base text-primary">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Tip & tax added at checkout.</p>

              <Button
                className="mt-3 w-full rounded-full gradient-choco text-primary-foreground shadow-soft"
                size="sm"
                onClick={goToCheckout}
              >
                Continue to checkout
              </Button>
              <Link
                to="/menu"
                onClick={() => setDrawerOpen(false)}
                className="mt-2 block w-full text-center text-xs text-muted-foreground transition hover:text-primary"
              >
                Keep shopping
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
