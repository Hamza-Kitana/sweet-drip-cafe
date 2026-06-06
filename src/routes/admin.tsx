import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useShop, useAdmin, fmt, initShopSync, groupCartItems, HERO_SLIDE_COUNT, FLOAT_IMAGE_COUNT, normalizeBackgroundSlides, normalizeFloatingImages, normalizeTaxRate, parseTaxRateInput, normalizeOrderStatus, EDITABLE_ORDER_STATUSES, formatOrderStatusLabel, type HeroSettings, type Product, type Category, type Offer, type Order, type LargeOrderRequest } from "@/lib/store";
import { toDatetimeLocalValue } from "@/lib/admin-dates";
import { AdminGuard } from "@/components/AdminGuard";
import { ConfirmProvider, useConfirm } from "@/components/ConfirmDialog";
import { ImageDropzone, ImageUploadButton } from "@/components/ImageDropzone";
import { ProductImageDisplay } from "@/components/ProductImageDisplay";
import { ProductImagePicker } from "@/components/ProductImagePicker";
import { ProductOptionsEditor } from "@/components/ProductOptionsEditor";
import { PRODUCT_IMAGE_SECTION, parseProductImageStored } from "@/lib/product-image";
import { normalizeNoteChoices, type ProductNoteChoice } from "@/lib/product-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, Plus, Pencil, Trash2, Package, Tag, Receipt, Home, Layers, Eye, EyeOff, Search, X, UtensilsCrossed, KeyRound, CalendarDays, Percent, Settings, Phone, Mail, Users, MessageSquare, Clock, Loader2, User } from "lucide-react";
import { isCategoryVisible } from "@/lib/catalog";
import { formatUsPhoneFull } from "@/lib/phone";
import {
  ANALYTICS_RANGE_OPTIONS,
  buildOrderDayOptions,
  filterOrdersByAnalyticsRange,
  filterOrdersByDay,
  formatDayLabel,
  orderAnalytics,
  resolveOrderDayFilter,
  type AnalyticsRange,
  type OrderDayFilter,
} from "@/lib/admin-dates";
import { toast } from "sonner";
import { isApiMode, setAdminToken } from "@/lib/api/client";
import * as api from "@/lib/api/backend";
import { hydrateShopFromApi, refreshAdminDataFromApi } from "@/lib/api/hydrate";
import {
  patchCategory,
  patchCateringStatus,
  patchOffer,
  patchOrderStatus,
  removeCategory,
  removeOffer,
  removeOrder,
  removeCatering,
  removeProduct,
  loadAdminProfileFromApi,
  loadTaxRateFromApi,
  updateAdminCredentialsToApi,
  saveCategory,
  saveHeroToApi,
  saveOffer,
  saveOffersVisibleToApi,
  saveProduct,
  saveTaxRateToApi,
} from "@/lib/api/admin-actions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Sweet Drip" }] }),
  component: () => (
    <AdminGuard>
      <ConfirmProvider>
        <Dashboard />
      </ConfirmProvider>
    </AdminGuard>
  ),
});

type Tab = "overview" | "orders" | "catering" | "products" | "offers" | "site" | "settings";

const SEEN_ORDERS_KEY = "sweetdrip-admin-seen-orders";
const SEEN_CATERING_KEY = "sweetdrip-admin-seen-catering";

function loadSeenIds(key: string): Set<string> {
  if (typeof sessionStorage === "undefined") return new Set();
  try {
    return new Set(JSON.parse(sessionStorage.getItem(key) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function saveSeenIds(key: string, ids: Set<string>) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify([...ids]));
}

function markSeenNewOrders(orders: Order[], prev: Set<string>) {
  const next = new Set(prev);
  for (const o of orders) {
    if (o.status === "new") next.add(o.id);
  }
  saveSeenIds(SEEN_ORDERS_KEY, next);
  return next;
}

function markSeenNewCatering(requests: LargeOrderRequest[], prev: Set<string>) {
  const next = new Set(prev);
  for (const r of requests) {
    if (r.status === "new") next.add(r.id);
  }
  saveSeenIds(SEEN_CATERING_KEY, next);
  return next;
}

function isOrderPaid(o: Order) {
  return o.paymentStatus === "paid";
}

function NewPulseDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex h-2 w-2 shrink-0 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
    </span>
  );
}

function NewBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
      <NewPulseDot />
      New
    </span>
  );
}

function SidebarNewAlert({ count, label = "New" }: { count: number; label?: string }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-600 shadow-sm">
      <NewPulseDot />
      {label}
      <span className="tabular-nums">{count}</span>
    </span>
  );
}

function NewOrdersAlertBanner({ count, onView }: { count: number; onView: () => void }) {
  if (count <= 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/[0.08] via-red-500/[0.04] to-transparent px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
          <NewPulseDot className="scale-125" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <NewBadge />
            <span className="text-sm font-semibold text-primary">
              {count} new order{count === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Paid orders waiting — open Orders to prepare them.</p>
        </div>
      </div>
      <Button size="sm" className="rounded-full gradient-choco text-primary-foreground" onClick={onView}>
        View orders
      </Button>
    </div>
  );
}

function Dashboard() {
  const { setAdmin } = useAdmin();
  const isAdmin = useAdmin((s) => s.isAdmin);
  const orders = useShop((s) => s.orders);
  const largeOrders = useShop((s) => s.largeOrders);
  const [seenOrderIds, setSeenOrderIds] = useState(() => loadSeenIds(SEEN_ORDERS_KEY));
  const [seenCateringIds, setSeenCateringIds] = useState(() => loadSeenIds(SEEN_CATERING_KEY));
  const sidebarOrderBadge = orders.filter(
    (o) => o.status === "new" && isOrderPaid(o) && !seenOrderIds.has(o.id),
  ).length;
  const sidebarCateringBadge = largeOrders.filter((o) => o.status === "new" && !seenCateringIds.has(o.id)).length;
  const [tab, setTab] = useState<Tab>("overview");
  const lastSeenOrderId = useRef<string | null>(null);
  const lastSeenCateringId = useRef<string | null>(null);

  useEffect(() => {
    initShopSync();
    if (isApiMode) {
      void hydrateShopFromApi({ broadcast: false });
      if (isAdmin) {
        void refreshAdminDataFromApi();
        void loadAdminProfileFromApi().catch(() => {
          /* profile load optional */
        });
      }
    }
  }, [isAdmin]);

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

  useEffect(() => {
    if (tab !== "orders") return;
    setSeenOrderIds((prev) => markSeenNewOrders(orders, prev));
  }, [tab, orders]);

  useEffect(() => {
    if (tab !== "catering") return;
    setSeenCateringIds((prev) => markSeenNewCatering(largeOrders, prev));
  }, [tab, largeOrders]);

  const NAV: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "orders",   label: "Orders",   icon: Receipt },
    { id: "catering", label: "Catering", icon: UtensilsCrossed },
    { id: "products", label: "Products", icon: Package },
    { id: "offers",   label: "Offers",   icon: Tag },
    { id: "site",     label: "Site",     icon: Layers },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <div className="section-inner py-5 sm:py-8">
      <div className="mb-4 lg:hidden">
        <div className="mobile-scroll-x -mx-1 px-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setTab(n.id)}
              className={`admin-mobile-tab ${tab === n.id ? "is-active" : ""}`}
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {n.label}
              {n.id === "orders" && sidebarOrderBadge > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {sidebarOrderBadge}
                </span>
              )}
              {n.id === "catering" && sidebarCateringBadge > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {sidebarCateringBadge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Link to="/" className="text-xs text-[var(--footer-muted)] transition hover:text-[var(--footer-fg)]">
            View site →
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="border-sidebar-border bg-transparent text-[var(--footer-muted)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => {
              setAdminToken(null);
              setAdmin(false);
              toast.success("Signed out");
            }}
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(17rem,280px)_1fr] gap-6">
        <aside className="hidden lg:block lg:sticky lg:top-28 lg:max-h-[calc(100svh-8rem)] lg:overflow-y-auto">
          <div className="admin-sidebar rounded-3xl p-5 shadow-soft">
            <div className="mb-3 text-xs uppercase tracking-widest text-[var(--footer-muted)]">Admin</div>
            <nav className="space-y-1">
              {NAV.map(n => (
                <button key={n.id} onClick={() => setTab(n.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${tab === n.id ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-[var(--footer-muted)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                  <n.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{n.label}</span>
                  {n.id === "orders" && <SidebarNewAlert count={sidebarOrderBadge} />}
                  {n.id === "catering" && sidebarCateringBadge > 0 && (
                    <SidebarNewAlert count={sidebarCateringBadge} label="New" />
                  )}
                </button>
              ))}
            </nav>

            <Button
              variant="outline"
              className="mt-4 w-full border-sidebar-border bg-transparent text-[var(--footer-muted)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => { setAdminToken(null); setAdmin(false); toast.success("Signed out"); }}
            >
              <LogOut className="w-4 h-4 mr-2" />Sign out
            </Button>
            <Link to="/" className="mt-3 block text-center text-xs text-[var(--footer-muted)] transition hover:text-[var(--footer-fg)]">View site →</Link>
          </div>
        </aside>
        <main className="min-w-0">
          {tab === "overview"   && (
            <Overview
              unseenNewOrderCount={sidebarOrderBadge}
              onOpenOrders={() => setTab("orders")}
            />
          )}
          {tab === "orders"     && <OrdersPanel />}
          {tab === "catering"   && <CateringPanel />}
          {tab === "products"   && <ProductsPanel />}
          {tab === "offers"     && <OffersPanel />}
          {tab === "site"       && <SitePanel />}
          {tab === "settings"   && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const { taxRatePercent } = useShop();
  const { username, updateCredentials } = useAdmin();
  const [taxRate, setTaxRate] = useState(String(taxRatePercent));
  const [taxSaving, setTaxSaving] = useState(false);
  const taxTimer = useRef<number>();
  const taxSaveGen = useRef(0);
  const taxLoaded = useRef(false);

  useEffect(() => {
    if (!isApiMode) {
      taxLoaded.current = true;
      return;
    }
    void loadAdminProfileFromApi().catch(() => {
      /* keep cached username */
    });
    void loadTaxRateFromApi()
      .then(() => {
        setTaxRate(String(useShop.getState().taxRatePercent));
        taxLoaded.current = true;
      })
      .catch(() => {
        taxLoaded.current = true;
      });
  }, []);

  useEffect(() => () => window.clearTimeout(taxTimer.current), []);

  useEffect(() => {
    if (!taxLoaded.current) return;
    const parsed = parseTaxRateInput(taxRate);
    if (parsed === null || parsed === taxRatePercent) return;

    window.clearTimeout(taxTimer.current);
    taxTimer.current = window.setTimeout(() => {
      const gen = ++taxSaveGen.current;
      setTaxSaving(true);
      void saveTaxRateToApi(parsed)
        .then((saved) => {
          if (gen !== taxSaveGen.current) return;
          setTaxRate(String(saved));
          toast.success(`Tax rate set to ${saved}%`);
        })
        .catch((err) => {
          if (gen !== taxSaveGen.current) return;
          toast.error(err instanceof Error ? err.message : "Could not save tax rate");
          setTaxRate(String(taxRatePercent));
        })
        .finally(() => {
          if (gen === taxSaveGen.current) setTaxSaving(false);
        });
    }, 700);
  }, [taxRate, taxRatePercent]);

  useEffect(() => {
    if (taxSaving) return;
    setTaxRate(String(taxRatePercent));
    taxLoaded.current = true;
  }, [taxRatePercent, taxSaving]);

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl text-primary">Sales tax</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {taxSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                Saving…
              </>
            ) : (
              <>Saved to database</>
            )}
          </div>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Tax is calculated on products only. Tip is added after subtotal and tax. Changes save automatically.
        </p>
        <Field label="Tax rate (%)">
          <Input
            type="text"
            inputMode="decimal"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            placeholder="10.25"
            className="max-w-xs"
          />
        </Field>
      </Card>

      <AdminLoginSettings username={username} updateCredentials={updateCredentials} />
    </div>
  );
}

function AdminLoginSettings({
  username,
  updateCredentials,
}: {
  username: string;
  updateCredentials: ReturnType<typeof useAdmin>["updateCredentials"];
}) {
  const [usernameDraft, setUsernameDraft] = useState(username);
  const [usernamePassword, setUsernamePassword] = useState("");
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    setUsernameDraft(username);
  }, [username]);

  const saveCredentials = async (input: {
    username: string;
    password: string;
    currentPassword: string;
  }) => {
    if (isApiMode) {
      await updateAdminCredentialsToApi(input);
      return;
    }
    const result = updateCredentials(input);
    if (!result.ok) throw new Error(result.error);
  };

  const updateUsername = async () => {
    const nextUsername = usernameDraft.trim();
    if (!nextUsername) {
      toast.error("Username is required");
      return;
    }
    if (nextUsername === username) {
      toast.error("Choose a different username");
      return;
    }
    if (!usernamePassword.trim()) {
      toast.error("Enter your current password to change username");
      return;
    }
    setUsernameSaving(true);
    try {
      await saveCredentials({
        username: nextUsername,
        password: "",
        currentPassword: usernamePassword,
      });
      toast.success("Username updated");
      setUsernamePassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update username");
    } finally {
      setUsernameSaving(false);
    }
  };

  const updatePassword = async () => {
    if (!passwordCurrent.trim()) {
      toast.error("Enter your current password");
      return;
    }
    if (passwordNew.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordNew !== passwordConfirm) {
      toast.error("New passwords do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      await saveCredentials({
        username,
        password: passwordNew,
        currentPassword: passwordCurrent,
      });
      toast.success("Password updated");
      setPasswordCurrent("");
      setPasswordNew("");
      setPasswordConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl text-primary">Admin login</h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Signed in as <span className="font-semibold text-primary">{username}</span>. Update username and password separately — each step saves to the database.
      </p>

      <div className="space-y-4">
        <section className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-primary">Step 1 · Change username</h3>
          </div>
          <div className="space-y-4">
            <Field label="Current username">
              <Input value={username} disabled className="bg-muted/40" />
            </Field>
            <Field label="New username">
              <Input
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                autoComplete="username"
                placeholder="Enter new username"
              />
            </Field>
            <Field label="Current password (required)">
              <Input
                type="password"
                value={usernamePassword}
                onChange={(e) => setUsernamePassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Confirm with your current password"
              />
            </Field>
            <Button
              className="rounded-full gradient-choco text-primary-foreground"
              disabled={usernameSaving}
              onClick={() => void updateUsername()}
            >
              {usernameSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving username…
                </>
              ) : (
                "Save username"
              )}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-primary">Step 2 · Change password</h3>
          </div>
          <div className="space-y-4">
            <Field label="Current password">
              <Input
                type="password"
                value={passwordCurrent}
                onChange={(e) => setPasswordCurrent(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password">
                <Input
                  type="password"
                  value={passwordNew}
                  onChange={(e) => setPasswordNew(e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                />
              </Field>
              <Field label="Confirm new password">
                <Input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <Button
              className="rounded-full gradient-choco text-primary-foreground"
              disabled={passwordSaving}
              onClick={() => void updatePassword()}
            >
              {passwordSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving password…
                </>
              ) : (
                "Save password"
              )}
            </Button>
          </div>
        </section>
      </div>
    </Card>
  );
}

function Card({ children, className = "" }: any) {
  return <div className={`rounded-3xl bg-card border shadow-soft p-6 ${className}`}>{children}</div>;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-[oklch(0.72_0.09_350/0.28)] bg-gradient-to-br from-[oklch(0.98_0.02_350)] to-card">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-display text-primary">{value}</div>
    </Card>
  );
}

function SalesSummaryBar({ orders }: { orders: Order[] }) {
  const { revenue, count, newCount, doneCount, avg } = orderAnalytics(orders);

  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-[oklch(0.72_0.09_350/0.22)] bg-muted/30 px-4 py-3 text-sm">
      <span className="font-medium text-primary">{count} order{count === 1 ? "" : "s"}</span>
      <span className="text-muted-foreground">·</span>
      <span className="font-semibold text-primary">{fmt(revenue)} revenue</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">{fmt(avg)} avg</span>
      {newCount > 0 && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium text-accent">{newCount} new</span>
        </>
      )}
      {doneCount > 0 && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{doneCount} completed</span>
        </>
      )}
    </div>
  );
}

function Overview({
  unseenNewOrderCount,
  onOpenOrders,
}: {
  unseenNewOrderCount: number;
  onOpenOrders: () => void;
}) {
  const { orders, products, categories, offers } = useShop();
  const [range, setRange] = useState<AnalyticsRange>("today");
  const filtered = useMemo(() => filterOrdersByAnalyticsRange(orders, range), [orders, range]);
  const { revenue, count, newCount, avg } = orderAnalytics(filtered);
  const rangeLabel = ANALYTICS_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "Period";

  return (
    <div className="space-y-6">
      <NewOrdersAlertBanner count={unseenNewOrderCount} onView={onOpenOrders} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-primary">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sales insights for {rangeLabel.toLowerCase()}.</p>
        </div>
        <div className="min-w-[200px]">
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Analytics period</Label>
          <Select value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
            <SelectTrigger className="rounded-xl">
              <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANALYTICS_RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <SalesSummaryBar orders={filtered} />

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sales</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Revenue" value={fmt(revenue)} />
          <StatCard label="Orders" value={count} />
          <StatCard label="Avg order" value={fmt(avg)} />
          <StatCard label="New pending" value={newCount} />
          <StatCard label="Unpaid" value={filtered.filter((o) => o.paymentStatus && o.paymentStatus !== "paid").length} />
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Catalog</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Products" value={products.length} />
          <StatCard label="Categories" value={categories.length} />
          <StatCard label="Active Offers" value={offers.filter((o) => o.active).length} />
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl text-primary">Orders · {rangeLabel}</h2>
          <span className="text-sm text-muted-foreground">{count} in period</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-muted-foreground">No orders in this period.</p>
        ) : (
          <ul className="divide-y">
            {filtered.slice(0, 8).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">#{o.id} · {o.customer.name}</span>
                    {o.status === "new" && isOrderPaid(o) && <NewBadge />}
                    {o.status !== "new" && (
                      <span className="text-xs capitalize text-muted-foreground">{o.status}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()} · Pickup {o.customer.date} {o.customer.time}
                  </div>
                </div>
                <span className="font-display text-lg text-primary">{fmt(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function paymentBadge(o: Order) {
  if (!o.paymentStatus) return null;
  const styles =
    o.paymentStatus === "paid"
      ? "bg-emerald-500/10 text-emerald-700"
      : o.paymentStatus === "failed"
        ? "bg-destructive/10 text-destructive"
        : "bg-amber-500/10 text-amber-700";
  return (
    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles}`}>
      {o.paymentStatus === "paid" ? "Paid" : o.paymentStatus === "failed" ? "Payment failed" : "Unpaid"}
    </span>
  );
}

function OrderStatusControl({ order }: { order: Order }) {
  const status = normalizeOrderStatus(order.status);
  const canEdit = isOrderPaid(order) && status !== "awaiting_payment";
  const selectValue = EDITABLE_ORDER_STATUSES.includes(status as (typeof EDITABLE_ORDER_STATUSES)[number])
    ? status
    : "new";

  if (!canEdit) {
    const label = !isOrderPaid(order) ? "Awaiting payment" : formatOrderStatusLabel(status);
    return (
      <span className="mt-1 inline-flex h-9 min-w-[9rem] items-center justify-center rounded-md border border-amber-400/35 bg-amber-500/10 px-3 text-sm font-medium text-amber-800">
        {label}
      </span>
    );
  }

  return (
    <Select value={selectValue} onValueChange={(v) => void patchOrderStatus(order.id, v as Order["status"])}>
      <SelectTrigger className="mt-1 w-36 capitalize">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {EDITABLE_ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">
            {formatOrderStatusLabel(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OrdersPanel() {
  const { orders } = useShop();
  const confirm = useConfirm();
  const dayOptions = useMemo(() => buildOrderDayOptions(orders), [orders]);
  const [dayFilter, setDayFilter] = useState<OrderDayFilter>("today");
  const [paymentFilter, setPaymentFilter] = useState<"unpaid" | "paid">("paid");
  const dayFiltered = useMemo(() => filterOrdersByDay(orders, dayFilter), [orders, dayFilter]);
  const paidOrders = useMemo(() => dayFiltered.filter(isOrderPaid), [dayFiltered]);
  const unpaidOrders = useMemo(() => dayFiltered.filter((o) => !isOrderPaid(o)), [dayFiltered]);
  const filtered = paymentFilter === "paid" ? paidOrders : unpaidOrders;
  const { newCount } = orderAnalytics(filtered);
  const periodLabel =
    dayFilter === "all"
      ? "All days"
      : formatDayLabel(resolveOrderDayFilter(dayFilter));

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl text-primary">Orders</h2>
            {newCount > 0 && paymentFilter === "paid" && <NewBadge />}
          </div>
          {newCount > 0 && paymentFilter === "paid" && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              <span className="font-medium text-red-600">{newCount} New</span> — ready to prepare
            </p>
          )}
        </div>
        <div className="w-full sm:w-[240px]">
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">View orders for</Label>
          <Select value={dayFilter} onValueChange={(v) => setDayFilter(v as OrderDayFilter)}>
            <SelectTrigger className="rounded-xl">
              <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dayOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={paymentFilter === "paid" ? "default" : "outline"}
          className={`rounded-full ${paymentFilter === "paid" ? "gradient-choco text-primary-foreground" : ""}`}
          onClick={() => setPaymentFilter("paid")}
        >
          Paid
          <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">{paidOrders.length}</span>
        </Button>
        <Button
          type="button"
          variant={paymentFilter === "unpaid" ? "default" : "outline"}
          className={`rounded-full ${paymentFilter === "unpaid" ? "gradient-choco text-primary-foreground" : ""}`}
          onClick={() => setPaymentFilter("unpaid")}
        >
          Unpaid
          <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">{unpaidOrders.length}</span>
        </Button>
      </div>

      <div className="mb-5 space-y-2">
        <p className="text-sm font-medium text-primary">{periodLabel}</p>
        <SalesSummaryBar orders={filtered} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-10 text-center">
          <p className="text-muted-foreground">
            No {paymentFilter === "paid" ? "paid" : "unpaid"} orders for {periodLabel.toLowerCase()}.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Choose another day or switch Paid / Unpaid above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <div key={o.id} className={`border rounded-2xl p-4 ${o.status === "new" ? "border-accent/50 bg-accent/5" : ""} ${o.paymentStatus === "failed" || o.paymentStatus === "pending" ? "border-amber-400/40" : ""}`}>
              <div className="flex flex-wrap justify-between gap-2 items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-semibold">
                    <span>#{o.id} · {o.customer.name}</span>
                    {o.status === "new" && isOrderPaid(o) && <NewBadge />}
                  </div>
                  {paymentBadge(o)}
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()} · {o.customer.phone} · {o.customer.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pickup: {o.customer.date} {o.customer.time}
                    {o.customer.guests != null ? ` · ${o.customer.guests} guests` : ""}
                  </div>
                </div>
                <div className="flex flex-wrap items-start justify-end gap-2">
                  <div className="font-display text-xl">{fmt(o.total)}</div>
                  <OrderStatusControl order={o} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1"
                    aria-label={`Delete order ${o.id}`}
                    onClick={() => {
                      void (async () => {
                        const ok = await confirm({
                          title: "Delete order?",
                          description: `Order #${o.id} for ${o.customer.name} (${fmt(o.total)}) will be removed permanently.`,
                          confirmLabel: "Delete order",
                        });
                        if (!ok) return;
                        try {
                          await removeOrder(o.id);
                          toast.success("Order deleted");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Delete failed");
                        }
                      })();
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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

function cateringStatusBadge(status: LargeOrderRequest["status"]) {
  const styles =
    status === "new"
      ? "bg-accent/15 text-accent"
      : status === "contacted"
        ? "bg-amber-500/10 text-amber-800"
        : "bg-emerald-500/10 text-emerald-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles}`}>
      {status}
    </span>
  );
}

function CateringDetail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-background/80 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </div>
      <div className="text-sm font-medium text-primary">{children}</div>
    </div>
  );
}

function CateringPanel() {
  const { largeOrders } = useShop();
  const confirm = useConfirm();
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
        <div className="space-y-4">
          {largeOrders.map((r) => {
            const phoneDisplay = formatUsPhoneFull(r.phone) || r.phone;
            const phoneHref = r.phone.replace(/\D/g, "").length >= 10 ? `tel:+1${r.phone.replace(/\D/g, "").slice(-10)}` : undefined;

            return (
              <div
                key={r.id}
                className={`rounded-2xl border p-4 sm:p-5 ${r.status === "new" ? "border-accent/50 bg-accent/5" : "bg-muted/10"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg text-primary">#{r.id}</span>
                      <span className="font-semibold text-primary">{r.name}</span>
                      {cateringStatusBadge(r.status)}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      Submitted {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
                    <div className="min-w-[10rem] flex-1 sm:flex-none">
                      <Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
                      <Select value={r.status} onValueChange={(v) => void patchCateringStatus(r.id, v as LargeOrderRequest["status"])}>
                        <SelectTrigger className="w-full rounded-xl sm:w-40">
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
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Delete catering request ${r.id}`}
                      onClick={() => {
                        void (async () => {
                          const ok = await confirm({
                            title: "Delete catering request?",
                            description: `Request #${r.id} from ${r.name} will be removed permanently.`,
                            confirmLabel: "Delete request",
                          });
                          if (!ok) return;
                          try {
                            await removeCatering(r.id);
                            toast.success("Request deleted");
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Delete failed");
                          }
                        })();
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <CateringDetail icon={Phone} label="Phone">
                    {phoneHref ? (
                      <a href={phoneHref} className="text-primary underline-offset-2 hover:underline">
                        {phoneDisplay}
                      </a>
                    ) : (
                      phoneDisplay
                    )}
                  </CateringDetail>
                  <CateringDetail icon={Mail} label="Email">
                    <a href={`mailto:${r.email}`} className="break-all text-primary underline-offset-2 hover:underline">
                      {r.email}
                    </a>
                  </CateringDetail>
                  <CateringDetail icon={CalendarDays} label="Event date & time">
                    {r.date} · {r.time}
                  </CateringDetail>
                  <CateringDetail icon={Users} label="Guests">
                    {r.guests} {r.guests === 1 ? "guest" : "guests"}
                  </CateringDetail>
                </div>

                {r.message?.trim() && (
                  <div className="mt-4 rounded-xl border border-dashed bg-muted/20 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{r.message}</p>
                  </div>
                )}
              </div>
            );
          })}
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
  const { products, categories } = useShop();
  const confirm = useConfirm();
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

  const addSection = async () => {
    if (!sectionName.trim()) {
      toast.error("Enter a section name");
      return;
    }
    try {
      await saveCategory(null, {
        name: sectionName.trim(),
        image: sectionImage || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800",
        visible: true,
      });
      setSectionName("");
      setSectionImage("");
      toast.success("Section added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add section");
    }
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Section name (e.g. Cakes)" value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
            <ImageDropzone
              value={sectionImage}
              onChange={setSectionImage}
              onClear={() => setSectionImage("")}
              hint="Section photo (optional)"
              previewClassName="aspect-video max-h-28"
            />
          </div>
          <Button onClick={addSection} className="mt-3 gradient-choco text-primary-foreground">
            <Plus className="mr-1 h-4 w-4" />Add section
          </Button>
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
                      onBlur={(e) => void patchCategory(cat.id, { name: e.target.value })}
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
                      onCheckedChange={(v) => void patchCategory(cat.id, { visible: v })}
                      aria-label={`Show ${cat.name} on website`}
                    />
                    <span className="text-xs font-medium">{isCategoryVisible(cat) ? "Visible" : "Hidden"}</span>
                  </div>
                  <ImageUploadButton
                    title="Upload section photo"
                    onUpload={(image) => {
                      void patchCategory(cat.id, { image })
                        .then(() => toast.success("Section photo updated"))
                        .catch((err) => toast.error(err instanceof Error ? err.message : "Upload failed"));
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void (async () => {
                        const ok = await confirm({
                          title: "Delete section?",
                          description: `"${cat.name}" and all products inside it will be removed permanently.`,
                          confirmLabel: "Delete section",
                        });
                        if (!ok) return;
                        try {
                          await removeCategory(cat.id);
                          toast.success("Section deleted");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Delete failed");
                        }
                      })();
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
                        <ProductImageDisplay
                          image={p.image}
                          categoryImage={cat.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
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
                              void (async () => {
                                const ok = await confirm({
                                  title: "Delete product?",
                                  description: `"${p.name}" will be removed from the menu permanently.`,
                                  confirmLabel: "Delete product",
                                });
                                if (!ok) return;
                                try {
                                  await removeProduct(p.id);
                                  toast.success("Product deleted");
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Delete failed");
                                }
                              })();
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
        onSave={async (data: Omit<Product, "id">) => {
          try {
            await saveProduct(editing, data);
            toast.success("Saved");
            setOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save product");
          }
        }}
      />
    </div>
  );
}

function categoryImage(categories: Category[], categoryId: string) {
  return categories.find((c) => c.id === categoryId)?.image ?? "";
}

function productHasOptions(product?: Product | null) {
  return (product?.noteChoices?.length ?? 0) > 0;
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
  const [notesEnabled, setNotesEnabled] = useState(() => productHasOptions(editing));

  const [f, setF] = useState<Omit<Product, "id">>({
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    price: editing?.price ?? 0,
    image: editing?.image?.trim() || PRODUCT_IMAGE_SECTION,
    categoryId: initialCategoryId,
    notes: editing?.notes ?? "Sweetness",
    noteChoices: normalizeNoteChoices(editing?.noteChoices ?? []),
  });
  const [choiceRows, setChoiceRows] = useState<ProductNoteChoice[]>(() =>
    normalizeNoteChoices(editing?.noteChoices ?? []),
  );

  const resetForm = () => {
    const categoryId = editing?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "";
    const enabled = productHasOptions(editing);
    setNotesEnabled(enabled);
    setF({
      name: editing?.name ?? "",
      description: editing?.description ?? "",
      price: editing?.price ?? 0,
      image: editing?.image?.trim() || PRODUCT_IMAGE_SECTION,
      categoryId,
      notes: editing?.notes ?? "Sweetness",
      noteChoices: normalizeNoteChoices(editing?.noteChoices ?? []),
    });
    setChoiceRows(normalizeNoteChoices(editing?.noteChoices ?? []));
  };

  const handleCategoryChange = (nextCategoryId: string) => {
    const prevCategoryImage = categoryImage(categories, f.categoryId);
    const parsed = parseProductImageStored(f.image, prevCategoryImage);
    let nextImage = f.image;
    if (parsed.mode === "upload" && f.image === prevCategoryImage && prevCategoryImage) {
      nextImage = PRODUCT_IMAGE_SECTION;
    } else if (!f.image.trim()) {
      nextImage = PRODUCT_IMAGE_SECTION;
    }
    setF({ ...f, categoryId: nextCategoryId, image: nextImage });
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
          <div className="sm:col-span-2">
            <Field label="Section">
              <Select value={f.categoryId} onValueChange={handleCategoryChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c: Category) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Product photo">
              <p className="mb-2 text-xs text-muted-foreground">
                Empty, section photo, icon, or upload your own image.
              </p>
              <ProductImagePicker
                value={f.image}
                categoryImage={categoryImage(categories, f.categoryId)}
                onChange={(encoded) => setF({ ...f, image: encoded })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <ProductOptionsEditor
              enabled={notesEnabled}
              onEnabledChange={setNotesEnabled}
              optionLabel={f.notes}
              onOptionLabelChange={(notes) => setF({ ...f, notes })}
              choices={choiceRows}
              onChoicesChange={setChoiceRows}
            />
          </div>
        </div>
        <Button className="w-full mt-4 rounded-full gradient-choco text-primary-foreground"
          onClick={() => {
            const noteChoices = notesEnabled
              ? choiceRows
                  .map((row) => ({
                    label: row.label.trim(),
                    extraPrice: Math.max(0, +row.extraPrice || 0),
                  }))
                  .filter((row) => row.label)
              : [];
            if (notesEnabled && noteChoices.length === 0) {
              toast.error("Add at least one choice, or turn off customization options");
              return;
            }
            onSave({
              ...f,
              image: (f.image ?? "").trim() || PRODUCT_IMAGE_SECTION,
              notes: notesEnabled ? f.notes.trim() || "Option" : "",
              noteChoices,
            });
          }}>Save product</Button>
      </DialogContent>
    </Dialog>
  );
}

function OffersPanel() {
  const { offers, offersSectionVisible } = useShop();
  const confirm = useConfirm();
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
            onCheckedChange={(v) => void saveOffersVisibleToApi(v).catch((err) => toast.error(err instanceof Error ? err.message : "Could not save"))}
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
              <Switch checked={o.active} onCheckedChange={(v) => void patchOffer(o.id, { active: v }).catch((err) => toast.error(err instanceof Error ? err.message : "Could not save"))} aria-label={`${o.active ? "Disable" : "Enable"} ${o.title}`} />
              <Button size="sm" variant="outline" onClick={() => { setEditing(o); setOpen(true); }}><Pencil className="w-3 h-3" /></Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void (async () => {
                    const ok = await confirm({
                      title: "Delete offer?",
                      description: `"${o.title}" will be removed permanently.`,
                      confirmLabel: "Delete offer",
                    });
                    if (!ok) return;
                    try {
                      await removeOffer(o.id);
                      toast.success("Offer deleted");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Delete failed");
                    }
                  })();
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <OfferDialog open={open} onOpenChange={setOpen} editing={editing}
        onSave={async (d: Omit<Offer, "id">) => {
          try {
            await saveOffer(editing, d);
            toast.success("Saved");
            setOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save offer");
          }
        }} />
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
        active: editing?.active ?? true,
        startAt: toDatetimeLocalValue(editing?.startAt),
        endAt: toDatetimeLocalValue(editing?.endAt),
      });
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} offer</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Title"><Input value={f.title} onChange={e => setF({...f, title: e.target.value})} /></Field>
          <Field label="Description"><Textarea rows={2} value={f.description} onChange={e => setF({...f, description: e.target.value})} /></Field>
          <Field label="Price"><Input type="number" step="0.01" value={f.price} onChange={e => setF({...f, price: +e.target.value})} /></Field>
          <div className="sm:col-span-2">
            <Field label="Offer photo">
              <ImageDropzone
                value={f.image}
                onChange={(v) => setF({ ...f, image: v })}
                onClear={() => setF({ ...f, image: "" })}
                previewClassName="aspect-video max-h-36"
              />
            </Field>
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
  const { hero } = useShop();
  const [f, setF] = useState<HeroSettings>(() => ({
    ...hero,
    backgroundSlides: normalizeBackgroundSlides(hero.backgroundSlides),
    floatingImages: normalizeFloatingImages(hero.floatingImages),
  }));
  const [saving, setSaving] = useState(false);
  const fRef = useRef(f);
  const saveTimer = useRef<number>();
  const saveGen = useRef(0);

  fRef.current = f;
  const slides = normalizeBackgroundSlides(f.backgroundSlides);
  const floats = normalizeFloatingImages(f.floatingImages);

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  const heroPayload = (draft: HeroSettings): HeroSettings => ({
    tagline: draft.tagline,
    image: draft.image,
    floatingImages: normalizeFloatingImages(draft.floatingImages),
    aboutImage: draft.aboutImage,
    backgroundSlides: normalizeBackgroundSlides(draft.backgroundSlides),
    heroBadge: draft.heroBadge,
    heroTitleBefore: draft.heroTitleBefore,
    heroTitleAccent: draft.heroTitleAccent,
    heroTitleAfter: draft.heroTitleAfter,
  });

  const persistHero = (draft: HeroSettings, immediate = false) => {
    window.clearTimeout(saveTimer.current);
    const run = async () => {
      const gen = ++saveGen.current;
      setSaving(true);
      try {
        await saveHeroToApi(heroPayload(draft));
        if (gen !== saveGen.current) return;
        if (immediate) toast.success("Updated on website");
      } catch (err) {
        if (gen !== saveGen.current) return;
        toast.error(err instanceof Error ? err.message : "Could not save");
      } finally {
        if (gen === saveGen.current) setSaving(false);
      }
    };
    if (immediate) void run();
    else saveTimer.current = window.setTimeout(() => void run(), 700);
  };

  const applyHero = (buildNext: (prev: HeroSettings) => HeroSettings, immediate = false) => {
    const next = buildNext(fRef.current);
    fRef.current = next;
    setF(next);
    persistHero(next, immediate);
  };

  const updateSlideImage = (index: number, value: string) => {
    applyHero(
      (prev) => ({
        ...prev,
        backgroundSlides: normalizeBackgroundSlides(prev.backgroundSlides).map((slide, i) =>
          i === index ? { ...slide, image: value } : slide,
        ),
      }),
      true,
    );
  };

  const updateSlideCaption = (index: number, caption: string) => {
    applyHero((prev) => ({
      ...prev,
      backgroundSlides: normalizeBackgroundSlides(prev.backgroundSlides).map((slide, i) =>
        i === index ? { ...slide, caption } : slide,
      ),
    }));
  };

  const clearSlide = (index: number) => {
    applyHero(
      (prev) => ({
        ...prev,
        backgroundSlides: normalizeBackgroundSlides(prev.backgroundSlides).map((slide, i) =>
          i === index ? { ...slide, image: "" } : slide,
        ),
      }),
      true,
    );
  };

  const updateFloat = (index: number, value: string) => {
    applyHero((prev) => {
      const next = normalizeFloatingImages(prev.floatingImages);
      next[index] = value;
      return { ...prev, floatingImages: next };
    }, true);
  };

  const clearFloat = (index: number) => {
    applyHero((prev) => {
      const next = normalizeFloatingImages(prev.floatingImages);
      next[index] = "";
      return { ...prev, floatingImages: next };
    }, true);
  };

  return (
    <div className="space-y-6 max-w-3xl">
    <Card>
      <div className="sticky top-24 z-10 -mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-3 border-b bg-card/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div>
          <h2 className="font-display text-2xl text-primary">Site Images & Hero</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Every change saves automatically and goes live on the website right away.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              Saving…
            </>
          ) : (
            <>Live on site</>
          )}
        </div>
      </div>
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
                onChange={(e) => applyHero((prev) => ({ ...prev, heroBadge: e.target.value }))}
                placeholder="Dessert Cafe · Chicago"
              />
            </Field>
            <Field label="Tagline">
              <Input
                value={f.tagline}
                onChange={(e) => applyHero((prev) => ({ ...prev, tagline: e.target.value }))}
              />
            </Field>
            <Field label="Title — first word">
              <Input
                value={f.heroTitleBefore}
                onChange={(e) => applyHero((prev) => ({ ...prev, heroTitleBefore: e.target.value }))}
                placeholder="Sweet"
              />
            </Field>
            <Field label="Title — accent (script)">
              <Input
                value={f.heroTitleAccent}
                onChange={(e) => applyHero((prev) => ({ ...prev, heroTitleAccent: e.target.value }))}
                placeholder="Drip"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Title — last line">
                <Input
                  value={f.heroTitleAfter}
                  onChange={(e) => applyHero((prev) => ({ ...prev, heroTitleAfter: e.target.value }))}
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
            onChange={(v) => applyHero((prev) => ({ ...prev, image: v }), true)}
            onClear={() => applyHero((prev) => ({ ...prev, image: "" }), true)}
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
            onChange={(v) => applyHero((prev) => ({ ...prev, aboutImage: v }), true)}
            onClear={() => applyHero((prev) => ({ ...prev, aboutImage: "" }), true)}
            previewClassName="aspect-video"
          />
        </div>
      </div>
    </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block text-sm">{label}</Label>{children}</div>;
}