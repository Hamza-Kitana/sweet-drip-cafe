import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Plus, Minus, ShoppingBag } from "lucide-react";
import { useShop, useCart, fmt } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  notFoundComponent: () => <div className="p-12 text-center">Product not found</div>,
});

function ProductPage() {
  const { id } = useParams({ from: "/product/$id" });
  const navigate = useNavigate();
  const { products, categories } = useShop();
  const add = useCart(s => s.add);
  const product = products.find(p => p.id === id);
  const [qty, setQty] = useState(1);
  const [choice, setChoice] = useState<string | undefined>(undefined);
  const [note, setNote] = useState("");

  if (!product) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-3xl mb-4">Product not found</h1>
        <Link to="/menu" className="text-primary underline">Back to menu</Link>
      </div>
    );
  }
  const cat = categories.find(c => c.id === product.categoryId);
  const img = product.image || cat?.image;

  const onAdd = () => {
    add({ productId: product.id, name: product.name, price: product.price, qty, image: img, noteChoice: choice, note });
    toast.success("Added to cart");
  };

  return (
    <div className="section-inner py-8 sm:py-12">
      <button onClick={() => navigate({ to: "/menu" })} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 sm:mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to menu
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="aspect-square max-h-[min(85vw,28rem)] md:max-h-none mx-auto w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-glow gradient-hero">
          {img && <img src={img} alt={product.name} className="w-full h-full object-cover" />}
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">{cat?.name}</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display text-primary mt-2">{product.name}</h1>
          <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-display text-gradient-gold">{fmt(product.price)}</div>
          <p className="mt-5 text-muted-foreground leading-relaxed">{product.description}</p>

          {product.noteChoices.length > 0 && (
            <div className="mt-8">
              <Label className="mb-3 block font-semibold">{product.notes}</Label>
              <div className="flex flex-wrap gap-2">
                {product.noteChoices.map(c => (
                  <button key={c} onClick={() => setChoice(c)}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition ${choice === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                  >{c}</button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <Label htmlFor="note" className="mb-2 block font-semibold">Extra note (optional)</Label>
            <Textarea id="note" value={note} onChange={e => setNote(e.target.value)} placeholder="Allergies, special instructions..." rows={3} />
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="inline-flex items-center gap-3 border-2 border-border rounded-full p-1 self-start">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"><Minus className="w-4 h-4" /></button>
              <span className="w-6 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"><Plus className="w-4 h-4" /></button>
            </div>
            <Button onClick={onAdd} size="lg" className="w-full sm:w-auto rounded-full gradient-choco text-primary-foreground hover:opacity-90 px-6 sm:px-8">
              <ShoppingBag className="w-4 h-4 mr-2" /> Add to cart · {fmt(product.price * qty)}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}