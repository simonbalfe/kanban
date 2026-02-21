import { createFileRoute } from "@tanstack/react-router";
import { getDashboardLayout } from "~/components/Dashboard";
import KnowledgeView from "~/views/knowledge";

export const Route = createFileRoute("/knowledge/")({
  component: KnowledgePage,
});

function KnowledgePage() {
  return getDashboardLayout(<KnowledgeView />);
}
