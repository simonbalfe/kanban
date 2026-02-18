import { createFileRoute } from "@tanstack/react-router";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import BoardsView from "~/views/boards";

export const Route = createFileRoute("/templates/")({
  component: TemplatesPage,
});

function TemplatesPage() {
  return getDashboardLayout(
    <>
      <BoardsView isTemplate />
      <Popup />
    </>,
  );
}
