import { createFileRoute } from "@tanstack/react-router";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import BoardView from "~/views/board";

export const Route = createFileRoute("/templates/$boardId/")({
  component: TemplatePage,
});

function TemplatePage() {
  return getDashboardLayout(
    <>
      <BoardView isTemplate />
      <Popup />
    </>,
  );
}
