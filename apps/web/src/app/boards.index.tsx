import { createFileRoute } from "@tanstack/react-router";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import BoardsView from "~/views/boards";

export const Route = createFileRoute("/boards/")({
  component: BoardsPage,
});

function BoardsPage() {
  return getDashboardLayout(
    <>
      <BoardsView />
      <Popup />
    </>,
  );
}
