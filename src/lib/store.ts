import { create } from "zustand";
import { persist } from "zustand/middleware";
import heroDessert from "@/assets/hero-dessert.jpg";
import aboutCafe from "@/assets/about-cafe.jpg";

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
    name: string; email: string; phone: string;
    guests: number; date: string; time: string; message?: string;
  };
  subtotal: number;
  tip: number;
  total: number;
  status: "new" | "preparing" | "ready" | "done" | "cancelled";
};

type AdminState = {
  isAdmin: boolean;
  setAdmin: (v: boolean) => void;
};

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

export type HeroSettings = {
  tagline: string;
  /** Hero foreground image (beside headline on desktop) */
  image: string;
  aboutImage: string;
  /** Up to 5 rotating homepage background slides */
  backgroundSlides: string[];
};

export const HERO_SLIDE_COUNT = 5;

const defaultBackgroundSlides = [
  heroDessert,
  aboutCafe,
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1400&q=80",
  "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1400&q=80",
  "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=1400&q=80",
];

export function normalizeBackgroundSlides(slides?: string[]): string[] {
  const source = slides?.length ? [...slides] : [...defaultBackgroundSlides];
  const padded = [...source];
  while (padded.length < HERO_SLIDE_COUNT) padded.push("");
  return padded.slice(0, HERO_SLIDE_COUNT);
}

export function activeBackgroundSlides(slides?: string[]): string[] {
  const filled = normalizeBackgroundSlides(slides).filter(Boolean);
  return filled.length > 0 ? filled : defaultBackgroundSlides;
}

const seedHero: HeroSettings = {
  image: heroDessert,
  aboutImage: aboutCafe,
  tagline: "Where every bite is a sweet escape.",
  backgroundSlides: defaultBackgroundSlides,
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
  hero: HeroSettings;
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

  setHero: (h: Partial<HeroSettings>) => void;
  setOffersSectionVisible: (visible: boolean) => void;
};

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
      if (event.data?.type === "new-order") rehydrate();
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
      hero: seedHero,
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

      setHero: (h) => {
        const current = get().hero;
        set({
          hero: {
            ...current,
            ...h,
            backgroundSlides: h.backgroundSlides
              ? normalizeBackgroundSlides(h.backgroundSlides)
              : normalizeBackgroundSlides(current.backgroundSlides),
          },
        });
      },
      setOffersSectionVisible: (visible) => set({ offersSectionVisible: visible }),
    }),
    {
      name: SHOP_STORAGE_KEY,
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as Partial<ShopState>) };
        state.hero = {
          ...seedHero,
          ...current.hero,
          ...(persisted as Partial<ShopState>)?.hero,
          backgroundSlides: normalizeBackgroundSlides(
            (persisted as Partial<ShopState>)?.hero?.backgroundSlides ?? current.hero.backgroundSlides,
          ),
        };
        return state;
      },
    },
  )
);

export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({ isAdmin: false, setAdmin: (v) => set({ isAdmin: v }) }),
    { name: "sweetdrip-admin" }
  )
);

// CART
type CartState = {
  items: CartItem[];
  tip: number;
  lastOrderId: string | null;
  add: (i: Omit<CartItem, "uid">) => void;
  remove: (uid: string) => void;
  setQty: (uid: string, qty: number) => void;
  setTip: (tip: number) => void;
  clear: () => void;
  setLastOrderId: (id: string | null) => void;
};
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tip: 0,
      lastOrderId: null,
      add: (i) => {
        const items = get().items;
        const incoming = { ...i, qty: i.qty || 1 };
        const match = items.find((x) => cartLineKey(x) === cartLineKey(incoming));
        if (match) {
          set({
            items: items.map((x) =>
              x.uid === match.uid ? { ...x, qty: x.qty + incoming.qty } : x,
            ),
          });
          return;
        }
        set({ items: [...items, { ...incoming, uid: id() }] });
      },
      remove: (uid) => set({ items: get().items.filter(x => x.uid !== uid) }),
      setQty: (uid, qty) => set({ items: get().items.map(x => x.uid === uid ? { ...x, qty: Math.max(1, qty) } : x) }),
      setTip: (tip) => set({ tip: Math.max(0, Math.round((Number(tip) || 0) * 100) / 100) }),
      clear: () => set({ items: [], tip: 0 }),
      setLastOrderId: (id) => set({ lastOrderId: id }),
    }),
    { name: "sweetdrip-cart" }
  )
);

export const fmt = (n: number) => "$" + n.toFixed(2);