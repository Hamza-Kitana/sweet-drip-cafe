import { isApiMode } from "./client";
import * as api from "./backend";
import { pullCatalogFromServer } from "./catalog-sync";
import { normalizeOrderStatus, useShop } from "@/lib/store";
import { SHOP_SYNC_CHANNEL } from "@/lib/store";
const PUBLIC_POLL_MS = 3000;
const ADMIN_POLL_MS = 2000;

let pollTimer: number | undefined;
let lastCatalogRevision: number | null = null;
let lastAdminRevision: number | null = null;
let adminMode = false;
let pollMs = PUBLIC_POLL_MS;

export function syncRevisionBaseline(rev: { catalogRevision: number; adminRevision: number }) {
  lastCatalogRevision = rev.catalogRevision;
  lastAdminRevision = rev.adminRevision;
}

export async function loadRevisionBaseline() {
  if (!isApiMode) return;
  const rev = await api.fetchSyncRevision();
  syncRevisionBaseline(rev);
}

export async function ackCatalogMutation() {
  if (!isApiMode) return;
  try {
    const rev = await api.fetchSyncRevision();
    lastCatalogRevision = rev.catalogRevision;
  } catch {
    /* offline */
  }
}

export async function ackAdminMutation() {
  if (!isApiMode) return;
  try {
    const rev = await api.fetchSyncRevision();
    lastAdminRevision = rev.adminRevision;
  } catch {
    /* offline */
  }
}

export function configureLiveSync(options: { admin?: boolean }) {
  const nextAdmin = Boolean(options.admin);
  const nextPollMs = nextAdmin ? ADMIN_POLL_MS : PUBLIC_POLL_MS;
  if (nextAdmin === adminMode && nextPollMs === pollMs) return;
  adminMode = nextAdmin;
  pollMs = nextPollMs;
  if (pollTimer !== undefined) restartPollInterval();
}

async function pollTick() {
  if (!isApiMode || document.hidden) return;

  try {
    const rev = await api.fetchSyncRevision();
    if (lastCatalogRevision === null) {
      syncRevisionBaseline(rev);
      return;
    }

    const catalogChanged = rev.catalogRevision !== lastCatalogRevision;
    const adminChanged = adminMode && rev.adminRevision !== lastAdminRevision;

    if (catalogChanged) {
      lastCatalogRevision = rev.catalogRevision;
      await pullCatalogFromServer(true);
    }

    if (adminChanged) {
      lastAdminRevision = rev.adminRevision;
      const [orders, catering] = await Promise.all([api.fetchOrders(), api.fetchCatering()]);
      useShop.setState({
        orders: orders.map((o) => ({
          ...o,
          status: normalizeOrderStatus(o.status),
          paymentStatus: o.paymentStatus,
        })),
        largeOrders: catering,
      });
    }
  } catch {
    /* offline — retry on next tick */
  }
}

function onVisible() {
  if (!document.hidden) void pollTick();
}

function restartPollInterval() {
  if (pollTimer === undefined) return;
  window.clearInterval(pollTimer);
  pollTimer = window.setInterval(() => void pollTick(), pollMs);
}

export function startLiveSync() {
  stopLiveSync();
  if (!isApiMode) return;

  void loadRevisionBaseline().finally(() => {
    void pollTick();
  });

  pollTimer = window.setInterval(() => void pollTick(), pollMs);
  document.addEventListener("visibilitychange", onVisible);
}

export function stopLiveSync() {
  if (pollTimer !== undefined) {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  }
  document.removeEventListener("visibilitychange", onVisible);
}

export function notifyLocalCatalogChanged() {
  if (typeof window === "undefined") return;
  try {
    new BroadcastChannel(SHOP_SYNC_CHANNEL).postMessage({ type: "catalog-updated" });
  } catch {
    /* BroadcastChannel unavailable */
  }
}

export function notifyLocalAdminDataChanged() {
  if (typeof window === "undefined") return;
  try {
    new BroadcastChannel(SHOP_SYNC_CHANNEL).postMessage({ type: "admin-data-updated" });
  } catch {
    /* BroadcastChannel unavailable */
  }
}
