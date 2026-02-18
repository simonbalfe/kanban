import { TRPCError } from "@trpc/server";

import type { dbClient } from "~/db/client";
import * as memberRepo from "~/db/repository/member.repo";

export async function assertMember(
  _db: dbClient,
  _userId: string,
  _workspaceId: number,
): Promise<void> {
  return;
}

export async function assertAdmin(
  _db: dbClient,
  _userId: string,
  _workspaceId: number,
): Promise<void> {
  return;
}

export async function assertPermission(
  _db: dbClient,
  _userId: string,
  _workspaceId: number,
  _permission: string,
): Promise<void> {
  return;
}

export async function assertCanDelete(
  _db: dbClient,
  _userId: string,
  _workspaceId: number,
  _permission: string,
  _createdBy: string | null,
): Promise<void> {
  return;
}

export async function assertCanEdit(
  _db: dbClient,
  _userId: string,
  _workspaceId: number,
  _permission: string,
  _createdBy: string | null,
): Promise<void> {
  return;
}

export async function assertCanManageMember(
  db: dbClient,
  _managerUserId: string,
  _workspaceId: number,
  targetMemberId: number,
): Promise<void> {
  const target = await memberRepo.getById(db, targetMemberId);

  if (!target) {
    throw new TRPCError({
      message: "Target member not found",
      code: "NOT_FOUND",
    });
  }
}
