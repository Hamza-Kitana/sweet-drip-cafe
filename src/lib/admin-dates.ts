import type { Order } from "@/lib/store";

export type OrderDayFilter = "today" | "yesterday" | "all" | (string & {});
export type AnalyticsRange = "today" | "yesterday" | "7d" | "30d" | "all";

export const ANALYTICS_RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

export function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getTodayKey(): string {
  return toDayKey(new Date());
}

export function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDayKey(d);
}

export function getOrderDayKey(createdAt: string): string {
  return toDayKey(new Date(createdAt));
}

export function formatDayLabel(dayKey: string): string {
  const today = getTodayKey();
  const yesterday = getYesterdayKey();
  if (dayKey === today) return "Today";
  if (dayKey === yesterday) return "Yesterday";

  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(y !== new Date().getFullYear() ? { year: "numeric" as const } : {}),
  });
}

export function getDistinctOrderDays(orders: Order[]): string[] {
  const keys = new Set(orders.map((o) => getOrderDayKey(o.createdAt)));
  return [...keys].sort((a, b) => b.localeCompare(a));
}

export function buildOrderDayOptions(orders: Order[]): { value: OrderDayFilter; label: string }[] {
  const today = getTodayKey();
  const yesterday = getYesterdayKey();
  const options: { value: OrderDayFilter; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
  ];

  for (const day of getDistinctOrderDays(orders)) {
    if (day === today || day === yesterday) continue;
    options.push({ value: day, label: formatDayLabel(day) });
  }

  options.push({ value: "all", label: "All days" });
  return options;
}

export function resolveOrderDayFilter(filter: OrderDayFilter): string | "all" {
  if (filter === "all") return "all";
  if (filter === "today") return getTodayKey();
  if (filter === "yesterday") return getYesterdayKey();
  return filter;
}

export function filterOrdersByDay(orders: Order[], filter: OrderDayFilter): Order[] {
  const resolved = resolveOrderDayFilter(filter);
  const filtered =
    resolved === "all"
      ? [...orders]
      : orders.filter((o) => getOrderDayKey(o.createdAt) === resolved);

  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function filterOrdersByAnalyticsRange(orders: Order[], range: AnalyticsRange): Order[] {
  const today = getTodayKey();
  const yesterday = getYesterdayKey();
  const now = Date.now();

  const filtered = orders.filter((o) => {
    const dayKey = getOrderDayKey(o.createdAt);
    if (range === "all") return true;
    if (range === "today") return dayKey === today;
    if (range === "yesterday") return dayKey === yesterday;

    const ageMs = now - new Date(o.createdAt).getTime();
    const maxMs = range === "7d" ? 7 * 86400000 : 30 * 86400000;
    return ageMs >= 0 && ageMs <= maxMs;
  });

  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function orderAnalytics(orders: Order[]) {
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const count = orders.length;
  const newCount = orders.filter((o) => o.status === "new").length;
  const doneCount = orders.filter((o) => o.status === "done").length;
  const avg = count > 0 ? revenue / count : 0;

  return { revenue, count, newCount, doneCount, avg };
}

/** Format API ISO date for `<input type="datetime-local" />`. */
export function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Normalize datetime-local or ISO string for the offers API. */
export function normalizeOfferSchedule(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return trimmed;
  return d.toISOString();
}
