import { createFileRoute } from "@tanstack/react-router";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import CardView, { CardRightPanel } from "~/views/card";

export const Route = createFileRoute("/templates/$boardId/cards/$cardId")({
  component: TemplateCardPage,
});

function TemplateCardPage() {
  return getDashboardLayout(
    <>
      <CardView isTemplate />
      <Popup />
    </>,
    <CardRightPanel isTemplate />,
    true,
  );
}
