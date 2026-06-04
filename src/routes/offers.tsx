import { createFileRoute, redirect } from "@tanstack/react-router";
import { isOffersSectionVisible } from "@/lib/catalog";
import { OFFERS_MENU_FILTER } from "@/lib/offers";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/offers")({
  beforeLoad: () => {
    const { offersSectionVisible } = useShop.getState();
    throw redirect({
      to: "/menu",
      search: isOffersSectionVisible(offersSectionVisible) ? { cat: OFFERS_MENU_FILTER } : {},
    });
  },
});
