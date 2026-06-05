import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCart } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — Sweet Drip" }] }),
  component: CartRedirect,
});

function CartRedirect() {
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);
  const navigate = useNavigate();

  useEffect(() => {
    setDrawerOpen(true);
    navigate({ to: "/menu", replace: true });
  }, [navigate, setDrawerOpen]);

  return null;
}
