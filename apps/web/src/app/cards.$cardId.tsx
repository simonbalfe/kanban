import { createFileRoute } from "@tanstack/react-router";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import CardView, { CardRightPanel } from "~/views/card";

export const Route = createFileRoute("/cards/$cardId")({
  component: CardPage,
});

function CardPage() {
  return getDashboardLayout(
    <>
      <CardView />
      <Popup />
    </>,
    <CardRightPanel />,
    true,
  );
}
