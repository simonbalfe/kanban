import { app } from "@kan/api";
import { createFileRoute } from "@tanstack/react-router";

const handle = async ({ request }: { request: Request }) => {
  const response = await app.fetch(request);
  if (!response.ok) {
    const body = await response.clone().text();
    console.error(`[API] ${request.method} ${request.url} ${response.status}`, body);
  }
  return response;
};

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
