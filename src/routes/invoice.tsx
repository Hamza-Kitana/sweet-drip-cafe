import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCart, useShop, fmt, groupCartItems, type Order } from "@/lib/store";
import { motion } from "motion/react";
import { Check, Printer, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isApiMode } from "@/lib/api/client";
import * as api from "@/lib/api/backend";

export const Route = createFileRoute("/invoice")({
  head: () => ({ meta: [{ title: "Your Invoice — Sweet Drip" }] }),
  component: InvoicePage,
});

function InvoicePage() {
  const lastOrderId = useCart((s) => s.lastOrderId);
  const orders = useShop((s) => s.orders);
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const order = orders.find((o) => o.id === lastOrderId) ?? fetchedOrder;
  const invoiceItems = order ? groupCartItems(order.items) : [];

  useEffect(() => {
    if (!isApiMode || !lastOrderId || orders.some((o) => o.id === lastOrderId)) return;
    void api.fetchOrder(lastOrderId).then(setFetchedOrder).catch(() => setFetchedOrder(null));
  }, [lastOrderId, orders]);

  if (!order) {
    return (
      <div className="p-20 text-center">
        <p>No recent order found.</p>
        <Link to="/menu" className="text-primary underline">
          Browse menu
        </Link>
      </div>
    );
  }

  return (
    <div className="section-inner py-12 max-w-3xl mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="mx-auto w-20 h-20 rounded-full gradient-gold flex items-center justify-center text-primary shadow-glow"
      >
        <Check className="w-9 h-9" strokeWidth={3} />
      </motion.div>
      <h1 className="mt-6 text-4xl font-display text-center text-primary">
        Thank you, {order.customer.name.split(" ")[0]}!
      </h1>
      <p className="text-center text-muted-foreground mt-2">Save this invoice — please present it when you arrive.</p>

      <div className="mt-8 rounded-3xl bg-card border shadow-glow overflow-hidden print:shadow-none">
        <div className="gradient-choco text-primary-foreground p-6 flex justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">Invoice</p>
            <p className="text-2xl font-display">#{order.id}</p>
          </div>
          <div className="text-right text-sm opacity-90">
            <p>{new Date(order.createdAt).toLocaleString()}</p>
            <p className="capitalize">{order.paymentStatus === "paid" ? "paid" : order.status}</p>
          </div>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-4 text-sm border-b">
          <div>
            <p className="text-muted-foreground">Customer</p>
            <p className="font-semibold">{order.customer.name}</p>
            <p>{order.customer.email}</p>
            <p>{order.customer.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reservation</p>
            <p>
              {order.customer.date} · {order.customer.time}
            </p>
            {order.customer.guests != null && <p>Guests: {order.customer.guests}</p>}
            {order.customer.message && <p className="italic mt-1">&ldquo;{order.customer.message}&rdquo;</p>}
          </div>
        </div>
        <div className="p-6">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left">
              <tr>
                <th className="py-2">Item</th>
                <th>Qty</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((i) => (
                <tr key={i.uid} className="border-t">
                  <td className="py-2">
                    {i.name}
                    {i.noteChoice && <div className="text-xs text-muted-foreground">{i.noteChoice}</div>}
                    {i.note && <div className="text-xs text-muted-foreground italic">&ldquo;{i.note}&rdquo;</div>}
                  </td>
                  <td>{i.qty}</td>
                  <td className="text-right">{fmt(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 space-y-1 text-sm border-t pt-4">
            <Row label="Subtotal" value={fmt(order.subtotal)} />
            <Row label="Tip" value={fmt(order.tip)} />
            <Row
              label={order.taxRate != null ? `Tax (${order.taxRate}%)` : "Tax"}
              value={fmt(order.tax ?? Math.max(0, order.total - order.subtotal - order.tip))}
            />
            <Row label="Total" value={fmt(order.total)} bold />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 justify-center print:hidden">
        <Button onClick={() => window.print()} variant="outline" className="rounded-full">
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
        <Button asChild className="rounded-full gradient-choco text-primary-foreground">
          <Link to="/menu">Order again</Link>
        </Button>
      </div>

      <div className="mt-10 text-center text-sm text-muted-foreground print:mt-6">
        <p className="flex items-center justify-center gap-2">
          <MapPin className="h-4 w-4" /> Sweet Drip Dessert Cafe
        </p>
        <p className="flex items-center justify-center gap-2 mt-1">
          <Phone className="h-4 w-4" /> Present this invoice at pickup
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-display text-lg text-primary pt-2" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
