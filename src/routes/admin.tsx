import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useShop, useAdmin, fmt, initShopSync, groupCartItems, HERO_SLIDE_COUNT, FLOAT_IMAGE_COUNT, normalizeBackgroundSlides, normalizeFloatingImages, type HeroSettings, type Product, type Category, type Offer, type Order, type LargeOrderRequest } from "@/lib/store";
import { AdminGuard } from "@/components/AdminGuard";
import { ImageDropzone } from "@/components/ImageDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, Plus, Pencil, Trash2, Image as ImageIcon, Package, Tag, Receipt, Home, Layers, Eye, EyeOff, Search, X, UtensilsCrossed, KeyRound } from "lucide-react";
import { isCategoryVisible } from "@/lib/catalog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Sweet Drip" }] }),
  component: () => <AdminGuard><Dashboard /></AdminGuard>,
});

type Tab = "overview" | "orders" | "catering" | "products" | "offers" | "site";

function Dashboard() {
  const { setAdmin } = useAdmin();
  const isAdmin = useAdmin((s) => s.isAdmin);
  const orders = useShop((s) => s.orders);
  const largeOrders = useShop((s) => s.largeOrders);
  const newOrderCount = orders.filter((o) => o.status === "new").length;
  const newCateringCount = largeOrders.filter((o) => o.status === "new").length;
  const [tab, setTab] = useState<Tab>("overview");
  const lastSeenOrderId = useRef<string | null>(null);
  const lastSeenCateringId = useRef<string | null>(null);

  useEffect(() => {
    initShopSync();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const latest = orders[0];
    if (!latest) {
      lastSeenOrderId.current = null;
      return;
    }

    if (lastSeenOrderId.current === null) {
      lastSeenOrderId.current = latest.id;
      return;
    }

    if (latest.id !== lastSeenOrderId.current && latest.status === "new") {
      lastSeenOrderId.current = latest.id;
      toast.success(`New order #${latest.id} · ${latest.customer.name}`, {
        description: `${fmt(latest.total)} · ${latest.customer.date} ${latest.customer.time}`,
      });
      setTab("orders");
    }
  }, [isAdmin, orders]);

  useEffect(() => {
    if (!isAdmin) return;

    const latest = largeOrders[0];
    if (!latest) {
      lastSeenCateringId.current = null;
      return;
    }

    if (lastSeenCateringId.current === null) {
      lastSeenCateringId.current = latest.id;
      return;
    }

    if (latest.id !== lastSeenCateringId.current && latest.status === "new") {
      lastSeenCateringId.current = latest.id;
      toast.success(`New catering request #${latest.id} · ${latest.name}`, {
        description: `${latest.date} ${latest.time} · ${latest.guests} guests`,
      });
      setTab("catering");
    }
  }, [isAdmin, largeOrders]);

  const NAV: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "orders",   label: "Orders",   icon: Receipt },
    { id: "catering", label: "Catering", icon: UtensilsCrossed },
    { id: "products", label: "Products", icon: Package },
    { id: "offers",   label: "Offers",   icon: Tag },
    { id: "site",     label: "Site",     icon: Layers },
  ];
  return (
    <div className="section-inner py-8">
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <aside className="lg:sticky lg:top-28 h-fit">
          <div className="admin-sidebar rounded-3xl p-5 shadow-soft">
            <div className="mb-3 text-xs uppercase tracking-widest text-[var(--footer-muted)]">Admin</div>
            <nav className="space-y-1">
              {NAV.map(n => (
                <button key={n.id} onClick={() => setTab(n.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${tab === n.id ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-[var(--footer-muted)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                  <n.icon className="w-4 h-4" /> {n.label}
                  {n.id === "orders" && newOrderCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-primary">
                      {newOrderCount}
                    </span>
                  )}
                  {n.id === "catering" && newCateringCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-primary">
                      {newCateringCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <Button
              variant="outline"
              className="mt-4 w-full border-sidebar-border bg-transparent text-[var(--footer-muted)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => { setAdmin(false); toast.success("Signed out"); }}
            >
              <LogOut className="w-4 h-4 mr-2" />Sign out
            </Button>
            <Link to="/" className="mt-3 block text-center text-xs text-[var(--footer-muted)] transition hover:text-[var(--footer-fg)]">View site →</Link>
          </div>
        </aside>
        <main className="min-w-0">
          {tab === "overview"   && <Overview />}
          {tab === "orders"     && <OrdersPanel />}
          {tab === "catering"   && <CateringPanel />}
          {tab === "products"   && <ProductsPanel />}
          {tab === "offers"     && <OffersPanel />}
          {tab === "site"       && <SitePanel />}
        </main>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: any) {
  return <div className={`rounded-3xl bg-card border shadow-soft p-6 ${className}`}>{children}</div>;
}

function Overview() {
  const { orders, products, categories, offers } = useShop();
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const stats = [
    { label: "Revenue", value: fmt(revenue) },
    { label: "Orders", value: orders.length },
    { label: "Products", value: products.length },
    { label: "Categories", value: categories.length },
    { label: "Active Offers", value: offers.filter(o => o.active).length },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display text-primary">Welcome back</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="border-[oklch(0.72_0.09_350/0.28)] bg-gradient-to-br from-[oklch(0.98_0.02_350)] to-card">
            <div className="text-sm font-medium text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-3xl font-display text-primary">{s.value}</div>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="font-display text-xl text-primary mb-4">Recent orders</h2>
        {orders.length === 0 ? <p className="text-muted-foreground">No orders yet.</p> : (
          <ul className="divide-y">
            {orders.slice(0, 5).map(o => (
              <li key={o.id} className="py-3 flex justify-between text-sm">
                <span>#{o.id} · {o.customer.name}</span>
                <span className="font-semibold">{fmt(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function OrdersPanel() {
  const { orders, updateOrderStatus } = useShop();
  const newCount = orders.filter((o) => o.status === "new").length;

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-primary">Orders</h2>
          {newCount > 0 && (
            <p className="mt-1 text-sm text-accent">{newCount} new order(s) waiting</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{orders.length} total</p>
      </div>
      {orders.length === 0 ? <p className="text-muted-foreground">No orders yet.</p> : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className={`border rounded-2xl p-4 ${o.status === "new" ? "border-accent/50 bg-accent/5" : ""}`}>
              <div className="flex flex-wrap justify-between gap-2 items-start">
                <div>
                  <div className="font-semibold">#{o.id} · {o.customer.name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()} · {o.customer.phone} · {o.customer.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Pickup: {o.customer.date} {o.customer.time}
                    {o.customer.guests != null ? ` · ${o.customer.guests} guests` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl">{fmt(o.total)}</div>
                  <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v as Order["status"])}>
                    <SelectTrigger className="w-36 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["new","preparing","ready","done","cancelled"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <ul className="mt-3 text-sm text-muted-foreground">
                {groupCartItems(o.items).map((i) => (
                  <li key={i.uid}>• {i.qty}× {i.name}{i.noteChoice ? ` (${i.noteChoice})` : ""}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CateringPanel() {
  const { largeOrders, updateLargeOrderStatus } = useShop();
  const newCount = largeOrders.filter((o) => o.status === "new").length;

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-primary">Catering</h2>
          {newCount > 0 && (
            <p className="mt-1 text-sm text-accent">{newCount} new request(s) waiting</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{largeOrders.length} total</p>
      </div>
      {largeOrders.length === 0 ? (
        <p className="text-muted-foreground">No catering requests yet.</p>
      ) : (
        <div className="space-y-3">
          {largeOrders.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border p-4 ${r.status === "new" ? "border-accent/50 bg-accent/5" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    #{r.id} · {r.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()} · {r.phone} · {r.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Event: {r.date} {r.time} · {r.guests} guests
                  </div>
                  {r.message && <p className="mt-2 text-sm italic text-muted-foreground">&ldquo;{r.message}&rdquo;</p>}
                </div>
                <Select value={r.status} onValueChange={(v) => updateLargeOrderStatus(r.id, v as LargeOrderRequest["status"])}>
                  <SelectTrigger className="mt-1 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["new", "contacted", "done"] as const).map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function productMatchesQuery(product: Product, query: string) {
  const haystack = [product.name, product.description, product.notes, fmt(product.price), String(product.price)]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function ProductsPanel() {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory } = useShop();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [sectionImage, setSectionImage] = useState("");
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    return categories
      .map((cat) => {
        const sectionProducts = products.filter((p) => p.categoryId === cat.id);
        if (!query) return { cat, products: sectionProducts };

        const sectionMatch = cat.name.toLowerCase().includes(query);
        const matchedProducts = sectionProducts.filter((p) => productMatchesQuery(p, query));

        if (sectionMatch) return { cat, products: sectionProducts, sectionMatch: true };
        if (matchedProducts.length > 0) return { cat, products: matchedProducts, sectionMatch: false };
        return null;
      })
      .filter((entry): entry is { cat: Category; products: Product[]; sectionMatch?: boolean } => entry !== null);
  }, [categories, products, query]);

  const resultCount = filteredSections.reduce((sum, s) => sum + s.products.length, 0);

  const startNewProduct = (categoryId: string) => {
    setEditing(null);
    setActiveCategoryId(categoryId);
    setOpen(true);
  };

  const startEditProduct = (p: Product) => {
    setEditing(p);
    setActiveCategoryId(p.categoryId);
    setOpen(true);
  };

  const addSection = () => {
    if (!sectionName.trim()) {
      toast.error("Enter a section name");
      return;
    }
    addCategory({
      name: sectionName.trim(),
      image: sectionImage || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800",
      visible: true,
    });
    setSectionName("");
    setSectionImage("");
    toast.success("Section added");
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-2xl text-primary">Products</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a menu section first, then add products inside each section.
        </p>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sections or products…"
            className="h-11 rounded-2xl border-border/80 bg-background pl-10 pr-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {query && (
          <p className="mt-2 text-xs text-muted-foreground">
            {filteredSections.length === 0
              ? "No sections or products match your search."
              : `${filteredSections.length} section(s) · ${resultCount} product(s) found`}
          </p>
        )}

        <div className="mt-6 rounded-2xl border bg-muted/30 p-4">
          <h3 className="mb-3 text-sm font-semibold text-primary">Add section</h3>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input placeholder="Section name (e.g. Cakes)" value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
            <Input placeholder="Image URL (optional)" value={sectionImage} onChange={(e) => setSectionImage(e.target.value)} />
            <Button onClick={addSection} className="gradient-choco text-primary-foreground">
              <Plus className="mr-1 h-4 w-4" />Add section
            </Button>
          </div>
        </div>
      </Card>

      {categories.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">No sections yet. Add your first section above.</p>
        </Card>
      ) : query && filteredSections.length === 0 ? (
        <Card>
          <p className="text-center text-muted-foreground">Nothing found for &ldquo;{search.trim()}&rdquo;</p>
        </Card>
      ) : (
        filteredSections.map(({ cat, products: sectionProducts, sectionMatch }) => (
            <Card key={cat.id} className={!isCategoryVisible(cat) ? "opacity-60" : ""}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b pb-4">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {cat.image && <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      className="max-w-xs font-semibold"
                      defaultValue={cat.name}
                      onBlur={(e) => updateCategory(cat.id, { name: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {sectionProducts.length} product(s)
                      {query && !sectionMatch && " · filtered"}
                      {!isCategoryVisible(cat) && " · Hidden on site"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
                    {isCategoryVisible(cat) ? <Eye className="h-3.5 w-3.5 text-accent" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    <Switch
                      checked={isCategoryVisible(cat)}
                      onCheckedChange={(v) => updateCategory(cat.id, { visible: v })}
                      aria-label={`Show ${cat.name} on website`}
                    />
                    <span className="text-xs font-medium">{isCategoryVisible(cat) ? "Visible" : "Hidden"}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const url = prompt("New image URL", cat.image);
                      if (url) updateCategory(cat.id, { image: url });
                    }}
                  >
                    <ImageIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Delete "${cat.name}" and all its products?`)) deleteCategory(cat.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Button onClick={() => startNewProduct(cat.id)} className="rounded-full gradient-choco text-primary-foreground">
                  <Plus className="mr-1 h-4 w-4" />Add product
                </Button>
              </div>

              {sectionProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products in this section yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sectionProducts.map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-2xl border">
                      <div className="aspect-video bg-muted">
                        {(p.image || cat.image) && (
                          <img src={p.image || cat.image} alt={p.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="p-3">
                        <div className="truncate font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{fmt(p.price)}</div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEditProduct(p)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("Delete product?")) deleteProduct(p.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
      )}

      <ProductDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        categories={categories}
        defaultCategoryId={activeCategoryId}
        onSave={(data: Omit<Product, "id">) => {
          editing ? updateProduct(editing.id, data) : addProduct(data);
          toast.success("Saved");
          setOpen(false);
        }}
      />
    </div>
  );
}

function categoryImage(categories: Category[], categoryId: string) {
  return categories.find((c) => c.id === categoryId)?.image ?? "";
}

function ProductDialog({ open, onOpenChange, editing, categories, defaultCategoryId, onSave }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Product | null;
  categories: Category[];
  defaultCategoryId?: string;
  onSave: (data: Omit<Product, "id">) => void;
}) {
  const initialCategoryId = editing?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "";
  const productImageFor = (categoryId: string, existing?: string) =>
    existing?.trim() || categoryImage(categories, categoryId);

  const [f, setF] = useState<Omit<Product, "id">>({
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    price: editing?.price ?? 0,
    image: editing
      ? productImageFor(initialCategoryId, editing.image)
      : categoryImage(categories, initialCategoryId),
    categoryId: initialCategoryId,
    notes: editing?.notes ?? "Sweetness",
    noteChoices: editing?.noteChoices ?? ["Regular", "Less sugar", "No sugar"],
  });
  const [choicesText, setChoicesText] = useState(f.noteChoices.join("\n"));

  const resetForm = () => {
    const categoryId = editing?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "";
    setF({
      name: editing?.name ?? "",
      description: editing?.description ?? "",
      price: editing?.price ?? 0,
      image: editing ? productImageFor(categoryId, editing.image) : categoryImage(categories, categoryId),
      categoryId,
      notes: editing?.notes ?? "Sweetness",
      noteChoices: editing?.noteChoices ?? ["Regular", "Less sugar", "No sugar"],
    });
    setChoicesText((editing?.noteChoices ?? ["Regular", "Less sugar", "No sugar"]).join("\n"));
  };

  const handleCategoryChange = (nextCategoryId: string) => {
    const prevCategoryImage = categoryImage(categories, f.categoryId);
    const inheritsSectionImage = f.image === "" || f.image === prevCategoryImage;
    setF({
      ...f,
      categoryId: nextCategoryId,
      image: inheritsSectionImage ? categoryImage(categories, nextCategoryId) : f.image,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (v) resetForm();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} product</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name"><Input value={f.name} onChange={e => setF({...f, name: e.target.value})} /></Field>
          <Field label="Price"><Input type="number" step="0.01" value={f.price} onChange={e => setF({...f, price: +e.target.value})} /></Field>
          <div className="sm:col-span-2"><Field label="Description"><Textarea rows={2} value={f.description} onChange={e => setF({...f, description: e.target.value})} /></Field></div>
          <Field label="Section">
            <Select value={f.categoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map((c: Category) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Image URL">
            <Input
              value={f.image}
              onChange={(e) => setF({ ...f, image: e.target.value })}
              placeholder={categoryImage(categories, f.categoryId) || "Uses section image by default"}
            />
            {f.image && (
              <img src={f.image} alt="" className="mt-2 max-h-24 rounded-lg border object-cover" />
            )}
          </Field>
          <Field label="Note label (e.g. Sweetness)"><Input value={f.notes} onChange={e => setF({...f, notes: e.target.value})} /></Field>
          <Field label="Note choices (one per line)">
            <Textarea rows={3} value={choicesText} onChange={e => setChoicesText(e.target.value)} />
          </Field>
        </div>
        <Button className="w-full mt-4 rounded-full gradient-choco text-primary-foreground"
          onClick={() => onSave({
            ...f,
            image: (f.image ?? "").trim() || categoryImage(categories, f.categoryId),
            noteChoices: choicesText.split("\n").map(s => s.trim()).filter(Boolean),
          })}>Save product</Button>
      </DialogContent>
    </Dialog>
  );
}

function OffersPanel() {
  const { offers, addOffer, updateOffer, deleteOffer, offersSectionVisible, setOffersSectionVisible } = useShop();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const startNew = () => { setEditing(null); setOpen(true); };
  return (
    <Card>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-muted/30 p-4">
        <div>
          <h3 className="font-semibold text-primary">Offers section on website</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Hides the whole offers area (menu tab, homepage block). Individual offers can still be turned off below.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
          {offersSectionVisible ? <Eye className="h-3.5 w-3.5 text-accent" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
          <Switch
            checked={offersSectionVisible}
            onCheckedChange={setOffersSectionVisible}
            aria-label="Show offers section on website"
          />
          <span className="text-xs font-medium">{offersSectionVisible ? "Visible" : "Hidden"}</span>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-2xl text-primary">Offers</h2>
        <Button onClick={startNew} className="rounded-full gradient-choco text-primary-foreground"><Plus className="w-4 h-4 mr-1" />Add offer</Button>
      </div>
      <div className="space-y-3">
        {offers.map(o => (
          <div key={o.id} className="border rounded-2xl p-4 flex flex-wrap gap-3 items-center">
            <img src={o.image} alt={o.title} className="w-20 h-20 rounded-xl object-cover" />
            <div className="flex-1 min-w-[200px]">
              <div className="font-semibold">{o.title} <span className="text-primary">· {fmt(o.price)}</span></div>
              <div className="text-xs text-muted-foreground">{o.description}</div>
              {(o.startAt || o.endAt) && <div className="text-xs text-muted-foreground mt-1">{o.startAt || "—"} → {o.endAt || "—"}</div>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">{o.active ? "Live" : "Off"}</span>
              <Switch checked={o.active} onCheckedChange={(v) => updateOffer(o.id, { active: v })} aria-label={`${o.active ? "Disable" : "Enable"} ${o.title}`} />
              <Button size="sm" variant="outline" onClick={() => { setEditing(o); setOpen(true); }}><Pencil className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete?")) deleteOffer(o.id); }}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
      <OfferDialog open={open} onOpenChange={setOpen} editing={editing}
        onSave={(d: Omit<Offer, "id">) => { editing ? updateOffer(editing.id, d) : addOffer(d); toast.success("Saved"); setOpen(false); }} />
    </Card>
  );
}

function OfferDialog({ open, onOpenChange, editing, onSave }: any) {
  const { products } = useShop();
  const [f, setF] = useState<Omit<Offer, "id">>({
    title: "", description: "", price: 0, image: "", productIds: [], active: true, startAt: "", endAt: "",
  });
  const toggleProduct = (productId: string) => {
    setF((prev) => ({
      ...prev,
      productIds: prev.productIds?.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...(prev.productIds ?? []), productId],
    }));
  };
  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (v) setF({
        title: editing?.title ?? "", description: editing?.description ?? "", price: editing?.price ?? 0,
        image: editing?.image ?? "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=900",
        productIds: editing?.productIds ?? [],
        active: editing?.active ?? true, startAt: editing?.startAt ?? "", endAt: editing?.endAt ?? "",
      });
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} offer</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Title"><Input value={f.title} onChange={e => setF({...f, title: e.target.value})} /></Field>
          <Field label="Description"><Textarea rows={2} value={f.description} onChange={e => setF({...f, description: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price"><Input type="number" step="0.01" value={f.price} onChange={e => setF({...f, price: +e.target.value})} /></Field>
            <Field label="Image URL"><Input value={f.image} onChange={e => setF({...f, image: e.target.value})} /></Field>
          </div>
          <Field label="Included products">
            <div className="max-h-40 space-y-2 overflow-auto rounded-xl border p-3">
              {products.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={f.productIds?.includes(p.id) ?? false}
                    onChange={() => toggleProduct(p.id)}
                    className="rounded border-border"
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts (optional)"><Input type="datetime-local" value={f.startAt} onChange={e => setF({...f, startAt: e.target.value})} /></Field>
            <Field label="Ends (optional)"><Input type="datetime-local" value={f.endAt} onChange={e => setF({...f, endAt: e.target.value})} /></Field>
          </div>
          <div className="flex items-center gap-2"><Switch checked={f.active} onCheckedChange={(v) => setF({...f, active: v})} /><span className="text-sm">Active</span></div>
        </div>
        <Button className="w-full mt-4 rounded-full gradient-choco text-primary-foreground" onClick={() => onSave(f)}>Save</Button>
      </DialogContent>
    </Dialog>
  );
}

function SitePanel() {
  const { hero, setHero } = useShop();
  const { username, updateCredentials } = useAdmin();
  const [f, setF] = useState<HeroSettings>(() => ({
    ...hero,
    backgroundSlides: normalizeBackgroundSlides(hero.backgroundSlides),
    floatingImages: normalizeFloatingImages(hero.floatingImages),
  }));
  const [account, setAccount] = useState({
    username,
    password: "",
    confirm: "",
    currentPassword: "",
  });

  useEffect(() => {
    setAccount((a) => ({ ...a, username }));
  }, [username]);

  const slides = normalizeBackgroundSlides(f.backgroundSlides);
  const floats = normalizeFloatingImages(f.floatingImages);

  const updateSlideImage = (index: number, value: string) => {
    const next = slides.map((slide, i) =>
      i === index ? { ...slide, image: value } : slide,
    );
    setF({ ...f, backgroundSlides: next });
  };

  const updateSlideCaption = (index: number, caption: string) => {
    const next = slides.map((slide, i) =>
      i === index ? { ...slide, caption } : slide,
    );
    setF({ ...f, backgroundSlides: next });
  };

  const clearSlide = (index: number) => {
    const next = slides.map((slide, i) =>
      i === index ? { ...slide, image: "" } : slide,
    );
    setF({ ...f, backgroundSlides: next });
  };

  const updateFloat = (index: number, value: string) => {
    const next = [...floats];
    next[index] = value;
    setF({ ...f, floatingImages: next });
  };

  const clearFloat = (index: number) => {
    const next = [...floats];
    next[index] = "";
    setF({ ...f, floatingImages: next });
  };

  const saveHero = () => {
    setHero({
      tagline: f.tagline,
      image: f.image,
      floatingImages: normalizeFloatingImages(f.floatingImages),
      aboutImage: f.aboutImage,
      backgroundSlides: normalizeBackgroundSlides(f.backgroundSlides),
      heroBadge: f.heroBadge,
      heroTitleBefore: f.heroTitleBefore,
      heroTitleAccent: f.heroTitleAccent,
      heroTitleAfter: f.heroTitleAfter,
    });
    toast.success("Saved");
  };

  return (
    <div className="space-y-6 max-w-3xl">
    <Card>
      <h2 className="font-display text-2xl text-primary mb-4">Site Images & Hero</h2>
      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium">Hero headline</Label>
          <p className="mt-1 mb-3 text-xs text-muted-foreground">
            Text beside the moving photo on the homepage.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Badge">
              <Input
                value={f.heroBadge}
                onChange={(e) => setF({ ...f, heroBadge: e.target.value })}
                placeholder="Dessert Cafe · Chicago"
              />
            </Field>
            <Field label="Tagline">
              <Input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} />
            </Field>
            <Field label="Title — first word">
              <Input
                value={f.heroTitleBefore}
                onChange={(e) => setF({ ...f, heroTitleBefore: e.target.value })}
                placeholder="Sweet"
              />
            </Field>
            <Field label="Title — accent (script)">
              <Input
                value={f.heroTitleAccent}
                onChange={(e) => setF({ ...f, heroTitleAccent: e.target.value })}
                placeholder="Drip"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Title — last line">
                <Input
                  value={f.heroTitleAfter}
                  onChange={(e) => setF({ ...f, heroTitleAfter: e.target.value })}
                  placeholder="Every Day."
                />
              </Field>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Rotating background ({HERO_SLIDE_COUNT} images)</Label>
          <p className="mt-1 mb-3 text-xs text-muted-foreground">
            Homepage slideshow behind the hero — drag & drop photos and add optional text on each slide.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {slides.map((slide, i) => (
              <div key={i} className="rounded-xl border bg-muted/20 p-3">
                <span className="mb-2 block text-xs font-medium text-muted-foreground">Slide {i + 1}</span>
                <ImageDropzone
                  value={slide.image}
                  onChange={(v) => updateSlideImage(i, v)}
                  onClear={() => clearSlide(i)}
                  previewClassName="aspect-[4/3]"
                />
                <div className="mt-3">
                  <Field label="Text on slide">
                    <Input
                      value={slide.caption}
                      onChange={(e) => updateSlideCaption(i, e.target.value)}
                      placeholder="Optional caption shown on this photo"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Main moving hero image</Label>
          <p className="mt-1 mb-2 text-xs text-muted-foreground">
            The large dessert photo that floats beside the headline on desktop.
          </p>
          <ImageDropzone
            value={f.image}
            onChange={(v) => setF({ ...f, image: v })}
            onClear={() => setF({ ...f, image: "" })}
            previewClassName="aspect-square max-h-52"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Floating side images ({FLOAT_IMAGE_COUNT})</Label>
          <p className="mt-1 mb-3 text-xs text-muted-foreground">
            Small decorative photos that move around the main hero image on desktop.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {floats.map((src, i) => (
              <div key={i}>
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Float {i + 1}</span>
                <ImageDropzone
                  value={src}
                  onChange={(v) => updateFloat(i, v)}
                  onClear={() => clearFloat(i)}
                  previewClassName="aspect-square"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">About page image</Label>
          <p className="mt-1 mb-2 text-xs text-muted-foreground">Photo on the About page.</p>
          <ImageDropzone
            value={f.aboutImage}
            onChange={(v) => setF({ ...f, aboutImage: v })}
            onClear={() => setF({ ...f, aboutImage: "" })}
            previewClassName="aspect-video"
          />
        </div>

        <Button
          className="rounded-full gradient-choco text-primary-foreground"
          onClick={saveHero}
        >
          Save changes
        </Button>
      </div>
    </Card>

    <Card>
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-accent" />
        <h2 className="font-display text-2xl text-primary">Admin login</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Change the username and password used to sign in to this dashboard.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Username">
          <Input
            value={account.username}
            onChange={(e) => setAccount({ ...account, username: e.target.value })}
            autoComplete="username"
          />
        </Field>
        <Field label="Current password *">
          <Input
            type="password"
            value={account.currentPassword}
            onChange={(e) => setAccount({ ...account, currentPassword: e.target.value })}
            autoComplete="current-password"
          />
        </Field>
        <Field label="New password *">
          <Input
            type="password"
            value={account.password}
            onChange={(e) => setAccount({ ...account, password: e.target.value })}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password *">
          <Input
            type="password"
            value={account.confirm}
            onChange={(e) => setAccount({ ...account, confirm: e.target.value })}
            autoComplete="new-password"
          />
        </Field>
      </div>
      <Button
        className="mt-4 rounded-full gradient-choco text-primary-foreground"
        onClick={() => {
          if (account.password !== account.confirm) {
            toast.error("New passwords do not match");
            return;
          }
          const result = updateCredentials({
            username: account.username,
            password: account.password,
            currentPassword: account.currentPassword,
          });
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Admin login updated");
          setAccount({ username: account.username, password: "", confirm: "", currentPassword: "" });
        }}
      >
        Save admin login
      </Button>
    </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block text-sm">{label}</Label>{children}</div>;
}