import type { dbClient } from "~/db/client";

export async function assertUserInWorkspace(
  _db: dbClient,
  _userId: string,
  _workspaceId: number,
  _role?: "admin" | "member",
) {
  return;
}
