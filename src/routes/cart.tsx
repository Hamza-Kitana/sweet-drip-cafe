import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, fmt } from "@/lib/store";
import { isOfferCartItem } from "@/lib/offers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — Sweet Drip" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, tip, setTip, setQty, remove } = useCart();
  const navigate = useNavigate();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = +(subtotal + tip).toFixed(2);

  const onTipChange = (value: string) => {
    if (value === "" || value === ".") {
      setTip(0);
      return;
    }
    const n = parseFloat(value);
    if (!Number.isNaN(n) && n >= 0) setTip(n);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-display text-primary">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Time to add something sweet.</p>
        <Link to="/menu" className="inline-flex mt-6 px-7 py-3 rounded-full gradient-choco text-primary-foreground">Browse menu</Link>
      </div>
    );
  }

  return (
    <div className="section-inner py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-display text-primary mb-6 sm:mb-8">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
        <div className="space-y-3 sm:space-y-4">
          {items.map(it => (
            <div key={it.uid} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-card border shadow-soft">
              {it.image && <img src={it.image} alt={it.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0" />}
              <div className="flex-1">
                <div className="flex justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{it.name}</h3>
                    {isOfferCartItem(it.productId) && (
                      <span className="mt-0.5 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Today&apos;s offer
                      </span>
                    )}
                  </div>
                  <span className="font-semibold">{fmt(it.price * it.qty)}</span>
                </div>
                {it.noteChoice && <p className="text-xs text-muted-foreground">Option: {it.noteChoice}</p>}
                {it.note && <p className="text-xs text-muted-foreground italic">"{it.note}"</p>}
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 border rounded-full p-1">
                    <button onClick={() => setQty(it.uid, it.qty - 1)} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="w-5 text-center text-sm">{it.qty}</span>
                    <button onClick={() => setQty(it.uid, it.qty + 1)} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button onClick={() => remove(it.uid)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="h-fit p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border shadow-soft lg:sticky lg:top-28">
          <h2 className="font-display text-2xl text-primary mb-4">Summary</h2>
          <div className="flex justify-between text-sm mb-2"><span>Items</span><span>{items.reduce((s,i)=>s+i.qty,0)}</span></div>
          <div className="flex justify-between text-sm mb-4"><span>Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span></div>

          <div className="mb-4">
            <Label htmlFor="cart-tip" className="mb-2 block text-sm font-medium">
              Tip for the team
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="cart-tip"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={tip === 0 ? "" : tip}
                onChange={(e) => onTipChange(e.target.value)}
                className="rounded-xl pl-7"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Enter any amount you like — optional.</p>
          </div>

          {tip > 0 && (
            <div className="flex justify-between text-sm mb-4">
              <span>Tip</span>
              <span className="font-semibold">{fmt(tip)}</span>
            </div>
          )}

          <div className="border-t pt-4 flex justify-between text-lg font-display">
            <span>Total</span><span className="text-primary">{fmt(total)}</span>
          </div>
          <Button className="w-full mt-5 rounded-full gradient-choco text-primary-foreground" size="lg" onClick={() => navigate({ to: "/checkout" })}>
            Continue to checkout
          </Button>
          <Link to="/menu" className="block text-center text-sm text-muted-foreground mt-3 hover:text-primary">Add more items</Link>
        </div>
      </div>
    </div>
  );
}