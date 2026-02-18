import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import BoardView from "~/views/board";

const boardSearchSchema = z.object({
  members: z.array(z.string()).optional().default([]),
  labels: z.array(z.string()).optional().default([]),
  lists: z.array(z.string()).optional().default([]),
  dueDate: z.array(z.string()).optional().default([]),
});

export const Route = createFileRoute("/boards/$boardId")({
  validateSearch: boardSearchSchema,
  component: BoardPage,
});

function BoardPage() {
  return getDashboardLayout(
    <>
      <BoardView />
      <Popup />
    </>,
  );
}
