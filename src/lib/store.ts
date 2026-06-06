import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isApiMode } from "@/lib/api/client";
import heroDessert from "@/assets/hero-dessert.jpg";
import aboutCafe from "@/assets/about-cafe.jpg";
import float1 from "@/assets/float-1.png";
import float2 from "@/assets/float-2.png";
import float3 from "@/assets/float-3.png";

export type ProductOption = { name: string; choices: string[] };
export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  notes: string;          // label like "Sugar level"
  noteChoices: string[];  // ["With sugar","No sugar","Medium"]
};
export type Category = { id: string; name: string; image: string; visible?: boolean };
export type Offer = {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  productIds?: string[];
  startAt?: string;
  endAt?: string;
  active: boolean;
};
export type CartItem = {
  uid: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
  noteChoice?: string;
  image?: string;
};
export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    phone: string;
    guests?: number;
    date: string;
    time: string;
    message?: string;
  };
  subtotal: number;
  tip: number;
  tax: number;
  /** Tax rate % at time of order */
  taxRate?: number;
  total: number;
  status: "new" | "preparing" | "ready" | "done" | "cancelled" | "awaiting_payment";
  paymentStatus?: "pending" | "paid" | "failed";
  paymentFailureReason?: string;
  stripePaymentIntentId?: string;
};

export type LargeOrderRequest = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  message?: string;
  status: "new" | "contacted" | "done";
};

type AdminState = {
  isAdmin: boolean;
  username: string;
  password: string;
  setAdmin: (v: boolean) => void;
  login: (username: string, password: string) => boolean;
  updateCredentials: (input: {
    username: string;
    password: string;
    currentPassword: string;
  }) => { ok: true } | { ok: false; error: string };
};

export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "admin123";

const seedCategories: Category[] = [
  { id: "cakes",     name: "Cakes",      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800" },
  { id: "icecream",  name: "Ice Cream",  image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800" },
  { id: "drinks",    name: "Drinks",     image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800" },
  { id: "pastries",  name: "Pastries",   image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800" },
];

const seedProducts: Product[] = [
  { id: "p1", categoryId: "cakes", name: "Belgian Chocolate Cake", description: "Rich layered cake with Belgian chocolate ganache and fresh berries.", price: 8.5, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900", notes: "Sweetness", noteChoices: ["Regular sugar","Less sugar","No sugar"] },
  { id: "p2", categoryId: "cakes", name: "Pistachio Dream", description: "Layers of pistachio cream with a hint of rose.", price: 7.5, image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=900", notes: "Sweetness", noteChoices: ["Regular","Less sweet","Extra sweet"] },
  { id: "p3", categoryId: "icecream", name: "Triple Scoop Cone", description: "Three premium scoops in a fresh waffle cone.", price: 6.0, image: "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=900", notes: "Flavors", noteChoices: ["Choco/Vanilla/Pistachio","Strawberry/Vanilla/Choco","Surprise me"] },
  { id: "p4", categoryId: "icecream", name: "Chocolate Sundae", description: "Vanilla ice cream drowned in warm chocolate sauce.", price: 5.5, image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=900", notes: "Toppings", noteChoices: ["With nuts","Without nuts","Extra chocolate"] },
  { id: "p5", categoryId: "drinks", name: "Iced Caramel Latte", description: "Espresso, milk, caramel and ice. Smooth and sweet.", price: 4.5, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=900", notes: "Sugar", noteChoices: ["Regular","Less sugar","No sugar"] },
  { id: "p6", categoryId: "drinks", name: "Hot Chocolate", description: "Velvety dark hot chocolate with whipped cream.", price: 4.0, image: "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=900", notes: "Style", noteChoices: ["Classic","With marshmallows","Spicy"] },
  { id: "p7", categoryId: "pastries", name: "Butter Croissant", description: "Flaky, golden, perfectly buttery.", price: 3.5, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=900", notes: "Filling", noteChoices: ["Plain","Chocolate","Almond"] },
  { id: "p8", categoryId: "pastries", name: "Cinnamon Roll", description: "Warm, gooey, swirled with cinnamon glaze.", price: 4.0, image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=900", notes: "Glaze", noteChoices: ["Regular","Extra glaze","No glaze"] },
];

export type BackgroundSlide = {
  image: string;
  caption: string;
};

export type HeroSettings = {
  tagline: string;
  /** Hero foreground image (beside headline on desktop) */
  image: string;
  /** Three decorative images that float beside the main hero photo */
  floatingImages: string[];
  aboutImage: string;
  /** Up to 5 rotating homepage background slides */
  backgroundSlides: BackgroundSlide[];
  heroBadge: string;
  heroTitleBefore: string;
  heroTitleAccent: string;
  heroTitleAfter: string;
};

export const HERO_SLIDE_COUNT = 5;
export const FLOAT_IMAGE_COUNT = 3;

const defaultBackgroundSlideUrls = [
  heroDessert,
  aboutCafe,
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1400&q=80",
  "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1400&q=80",
  "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=1400&q=80",
];

const defaultFloatingImages = [float1, float2, float3];

export function normalizeBackgroundSlides(
  slides?: BackgroundSlide[] | string[],
): BackgroundSlide[] {
  let parsed: BackgroundSlide[];
  if (!slides?.length) {
    parsed = defaultBackgroundSlideUrls.map((image) => ({ image, caption: "" }));
  } else if (typeof slides[0] === "string") {
    parsed = (slides as string[]).map((image) => ({ image: image ?? "", caption: "" }));
  } else {
    parsed = (slides as BackgroundSlide[]).map((s) => ({
      image: s.image ?? "",
      caption: s.caption ?? "",
    }));
  }
  const padded = [...parsed];
  while (padded.length < HERO_SLIDE_COUNT) padded.push({ image: "", caption: "" });
  return padded.slice(0, HERO_SLIDE_COUNT);
}

export function activeBackgroundSlides(
  slides?: BackgroundSlide[] | string[],
): BackgroundSlide[] {
  const normalized = normalizeBackgroundSlides(slides);
  const filled = normalized.filter((s) => s.image);
  if (filled.length > 0) return filled;
  return defaultBackgroundSlideUrls.map((image) => ({ image, caption: "" }));
}

export function normalizeFloatingImages(images?: string[]): string[] {
  const source = images?.length ? [...images] : [...defaultFloatingImages];
  const padded = [...source];
  while (padded.length < FLOAT_IMAGE_COUNT) padded.push("");
  return padded.slice(0, FLOAT_IMAGE_COUNT);
}

const seedHero: HeroSettings = {
  image: heroDessert,
  floatingImages: defaultFloatingImages,
  aboutImage: aboutCafe,
  tagline: "Where every bite is a sweet escape.",
  backgroundSlides: defaultBackgroundSlideUrls.map((image) => ({ image, caption: "" })),
  heroBadge: "Dessert Cafe · Chicago",
  heroTitleBefore: "Sweet",
  heroTitleAccent: "Drip",
  heroTitleAfter: "Every Day.",
};

const seedOffers: Offer[] = [
  {
    id: "o1",
    title: "Sweet Trio",
    description: "1 Cake slice + 1 Drink + 1 Ice cream scoop",
    price: 12,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=900",
    productIds: ["p1", "p5", "p3"],
    active: true,
  },
  {
    id: "o2",
    title: "Coffee & Croissant",
    description: "Any hot drink + butter croissant",
    price: 6,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900",
    productIds: ["p6", "p7"],
    active: true,
  },
];

type ShopState = {
  categories: Category[];
  products: Product[];
  offers: Offer[];
  orders: Order[];
  largeOrders: LargeOrderRequest[];
  hero: HeroSettings;
  /** Sales tax % applied to product subtotal only (tip is added after tax) */
  taxRatePercent: number;
  /** Show offers tab, homepage block, and menu filter */
  offersSectionVisible: boolean;

  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addOffer: (o: Omit<Offer, "id">) => void;
  updateOffer: (id: string, o: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;

  addOrder: (o: Omit<Order, "id" | "createdAt" | "status">) => Order;
  updateOrderStatus: (id: string, s: Order["status"]) => void;
  deleteOrder: (id: string) => void;

  addLargeOrder: (o: Omit<LargeOrderRequest, "id" | "createdAt" | "status">) => LargeOrderRequest;
  updateLargeOrderStatus: (id: string, s: LargeOrderRequest["status"]) => void;
  deleteLargeOrder: (id: string) => void;

  setHero: (h: Partial<HeroSettings>) => void;
  setTaxRatePercent: (rate: number) => void;
  setOffersSectionVisible: (visible: boolean) => void;
};

export function normalizeTaxRate(rate?: number): number {
  const n = Number(rate);
  if (Number.isNaN(n) || n < 0) return 0;
  if (n > 100) return 100;
  return +n.toFixed(2);
}

export function calcTaxAmount(subtotal: number, taxRatePercent: number): number {
  return +(subtotal * (normalizeTaxRate(taxRatePercent) / 100)).toFixed(2);
}

export function calcOrderTotal(subtotal: number, tip: number, taxRatePercent: number) {
  const tax = calcTaxAmount(subtotal, taxRatePercent);
  const total = +(subtotal + tax + tip).toFixed(2);
  return { tax, total };
}

const id = () => Math.random().toString(36).slice(2, 10);

function cartLineKey(item: Pick<CartItem, "productId" | "price" | "noteChoice" | "note">) {
  return [item.productId, item.price, item.noteChoice ?? "", (item.note ?? "").trim()].join("|");
}

/** Merge identical cart lines (same product, options, and price) into one row with combined qty */
export function groupCartItems(items: CartItem[]): CartItem[] {
  const grouped = new Map<string, CartItem>();
  for (const item of items) {
    const key = cartLineKey(item);
    const existing = grouped.get(key);
    if (existing) {
      grouped.set(key, { ...existing, qty: existing.qty + item.qty });
    } else {
      grouped.set(key, { ...item });
    }
  }
  return [...grouped.values()];
}

export const SHOP_STORAGE_KEY = "sweetdrip-shop";
export const SHOP_SYNC_CHANNEL = "sweetdrip-shop-sync";

export function notifyNewOrder(order: Order) {
  if (typeof window === "undefined") return;
  try {
    new BroadcastChannel(SHOP_SYNC_CHANNEL).postMessage({ type: "new-order", orderId: order.id });
  } catch {
    /* BroadcastChannel unavailable */
  }
}

export function notifyNewLargeOrder(request: LargeOrderRequest) {
  if (typeof window === "undefined") return;
  try {
    new BroadcastChannel(SHOP_SYNC_CHANNEL).postMessage({ type: "new-large-order", requestId: request.id });
  } catch {
    /* BroadcastChannel unavailable */
  }
}

export function initShopSync() {
  if (typeof window === "undefined") return;
  const flag = "__sweetdripShopSyncInit";
  if ((window as Window & { [flag]?: boolean })[flag]) return;
  (window as Window & { [flag]?: boolean })[flag] = true;

  const rehydrate = () => {
    void useShop.persist.rehydrate();
  };

  window.addEventListener("storage", (event) => {
    if (event.key === SHOP_STORAGE_KEY) rehydrate();
  });

  try {
    const channel = new BroadcastChannel(SHOP_SYNC_CHANNEL);
    channel.onmessage = (event) => {
      if (event.data?.type === "new-order" || event.data?.type === "new-large-order") rehydrate();
      if (event.data?.type === "catalog-updated") {
        void import("@/lib/api/hydrate").then(({ hydrateShopFromApi }) => hydrateShopFromApi());
      }
    };
  } catch {
    /* BroadcastChannel unavailable */
  }
}

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      categories: seedCategories,
      products: seedProducts,
      offers: seedOffers,
      orders: [],
      largeOrders: [],
      hero: seedHero,
      taxRatePercent: 10.25,
      offersSectionVisible: true,

      addCategory: (c) =>
        set({
          categories: [...get().categories, { ...c, id: id(), visible: c.visible ?? true }],
        }),
      updateCategory: (cid, c) => set({ categories: get().categories.map(x => x.id === cid ? { ...x, ...c } : x) }),
      deleteCategory: (cid) => set({ categories: get().categories.filter(x => x.id !== cid), products: get().products.filter(p => p.categoryId !== cid) }),

      addProduct: (p) => set({ products: [...get().products, { ...p, id: id() }] }),
      updateProduct: (pid, p) => set({ products: get().products.map(x => x.id === pid ? { ...x, ...p } : x) }),
      deleteProduct: (pid) => set({ products: get().products.filter(x => x.id !== pid) }),

      addOffer: (o) => set({ offers: [...get().offers, { ...o, id: id() }] }),
      updateOffer: (oid, o) => set({ offers: get().offers.map(x => x.id === oid ? { ...x, ...o } : x) }),
      deleteOffer: (oid) => set({ offers: get().offers.filter(x => x.id !== oid) }),

      addOrder: (o) => {
        const order: Order = {
          ...o,
          items: groupCartItems(o.items.map((item) => ({ ...item }))),
          customer: { ...o.customer },
          id: "SD-" + Date.now().toString().slice(-6),
          createdAt: new Date().toISOString(),
          status: "new",
        };
        set({ orders: [order, ...get().orders] });
        notifyNewOrder(order);
        return order;
      },
      updateOrderStatus: (oid, s) => set({ orders: get().orders.map(x => x.id === oid ? { ...x, status: s } : x) }),
      deleteOrder: (id) => set({ orders: get().orders.filter((x) => x.id !== id) }),

      addLargeOrder: (o) => {
        const request: LargeOrderRequest = {
          ...o,
          id: "LO-" + Date.now().toString().slice(-6),
          createdAt: new Date().toISOString(),
          status: "new",
        };
        set({ largeOrders: [request, ...get().largeOrders] });
        notifyNewLargeOrder(request);
        return request;
      },
      updateLargeOrderStatus: (id, s) =>
        set({ largeOrders: get().largeOrders.map((x) => (x.id === id ? { ...x, status: s } : x)) }),
      deleteLargeOrder: (id) => set({ largeOrders: get().largeOrders.filter((x) => x.id !== id) }),

      setHero: (h) => {
        const current = get().hero;
        set({
          hero: {
            ...current,
            ...h,
            backgroundSlides: h.backgroundSlides
              ? normalizeBackgroundSlides(h.backgroundSlides)
              : normalizeBackgroundSlides(current.backgroundSlides),
            floatingImages: h.floatingImages
              ? normalizeFloatingImages(h.floatingImages)
              : normalizeFloatingImages(current.floatingImages),
          },
        });
      },
      setTaxRatePercent: (rate) => set({ taxRatePercent: normalizeTaxRate(rate) }),
      setOffersSectionVisible: (visible) => set({ offersSectionVisible: visible }),
    }),
    {
      name: SHOP_STORAGE_KEY,
      partialize: (state) => {
        if (isApiMode) {
          return {
            orders: state.orders,
            largeOrders: state.largeOrders,
          };
        }
        return {
          categories: state.categories,
          products: state.products,
          offers: state.offers,
          hero: state.hero,
          orders: state.orders,
          largeOrders: state.largeOrders,
          taxRatePercent: state.taxRatePercent,
          offersSectionVisible: state.offersSectionVisible,
        };
      },
      merge: (persisted, current) => {
        const saved = persisted as Partial<ShopState>;
        const orders = (saved.orders ?? current.orders ?? []).map((o) => ({
          ...o,
          tax: o.tax ?? Math.max(0, +(o.total - o.subtotal - o.tip).toFixed(2)),
        }));

        if (isApiMode) {
          return {
            ...current,
            orders,
            largeOrders: saved.largeOrders ?? current.largeOrders ?? [],
          };
        }

        const state = { ...current, ...saved };
        const persistedHero = saved.hero;
        state.hero = {
          ...seedHero,
          ...current.hero,
          ...persistedHero,
          backgroundSlides: normalizeBackgroundSlides(
            persistedHero?.backgroundSlides ?? current.hero.backgroundSlides,
          ),
          floatingImages: normalizeFloatingImages(
            persistedHero?.floatingImages ?? current.hero.floatingImages,
          ),
        };
        state.largeOrders = saved.largeOrders ?? current.largeOrders ?? [];
        state.taxRatePercent = normalizeTaxRate(
          saved.taxRatePercent ?? current.taxRatePercent,
        );
        state.orders = orders;
        return state;
      },
    },
  )
);

export const useAdmin = create<AdminState>()(
  persist(
    (set, get) => ({
      isAdmin: false,
      username: DEFAULT_ADMIN_USERNAME,
      password: DEFAULT_ADMIN_PASSWORD,
      setAdmin: (v) => set({ isAdmin: v }),
      login: (username, password) => {
        const state = get();
        if (username === state.username && password === state.password) {
          set({ isAdmin: true });
          return true;
        }
        return false;
      },
      updateCredentials: ({ username, password, currentPassword }) => {
        const state = get();
        if (currentPassword !== state.password) {
          return { ok: false, error: "Current password is incorrect" };
        }
        const nextUsername = username.trim();
        const nextPassword = password.trim();
        if (!nextUsername) {
          return { ok: false, error: "Username is required" };
        }
        if (nextPassword.length < 6) {
          return { ok: false, error: "Password must be at least 6 characters" };
        }
        set({ username: nextUsername, password: nextPassword });
        return { ok: true };
      },
    }),
    {
      name: "sweetdrip-admin",
      merge: (persisted, current) => {
        const saved = persisted as Partial<AdminState>;
        return {
          ...current,
          ...saved,
          username: saved.username ?? DEFAULT_ADMIN_USERNAME,
          password: saved.password ?? DEFAULT_ADMIN_PASSWORD,
        };
      },
    },
  ),
);

// CART
type CartState = {
  items: CartItem[];
  tip: number;
  lastOrderId: string | null;
  drawerOpen: boolean;
  add: (i: Omit<CartItem, "uid">) => void;
  remove: (uid: string) => void;
  setQty: (uid: string, qty: number) => void;
  setTip: (tip: number) => void;
  clear: () => void;
  setLastOrderId: (id: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
};
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tip: 0,
      lastOrderId: null,
      drawerOpen: false,
      add: (i) => {
        const items = get().items;
        const incoming = { ...i, qty: i.qty || 1 };
        const match = items.find((x) => cartLineKey(x) === cartLineKey(incoming));
        if (match) {
          set({
            items: items.map((x) =>
              x.uid === match.uid ? { ...x, qty: x.qty + incoming.qty } : x,
            ),
            drawerOpen: true,
          });
          return;
        }
        set({ items: [...items, { ...incoming, uid: id() }], drawerOpen: true });
      },
      remove: (uid) => set({ items: get().items.filter(x => x.uid !== uid) }),
      setQty: (uid, qty) => set({ items: get().items.map(x => x.uid === uid ? { ...x, qty: Math.max(1, qty) } : x) }),
      setTip: (tip) => set({ tip: Math.max(0, Math.round((Number(tip) || 0) * 100) / 100) }),
      clear: () => set({ items: [], tip: 0 }),
      setLastOrderId: (id) => set({ lastOrderId: id }),
      setDrawerOpen: (open) => set({ drawerOpen: open }),
    }),
    {
      name: "sweetdrip-cart",
      partialize: (state) => ({
        items: state.items,
        tip: state.tip,
        lastOrderId: state.lastOrderId,
      }),
    },
  )
);

export const fmt = (n: number) => "$" + n.toFixed(2);