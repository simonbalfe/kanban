import { TRPCError } from "@trpc/server";

import type { dbClient } from "@kan/db/client";
import * as memberRepo from "@kan/db/repository/member.repo";
import { and, eq, isNull } from "drizzle-orm";
import { workspaceMembers } from "@kan/db/schema";

type Role = "admin" | "member" | "guest";

async function getMemberRole(
  db: dbClient,
  userId: string,
  workspaceId: number,
): Promise<{ id: number; role: Role } | undefined> {
  const [member] = await db
    .select({
      id: workspaceMembers.id,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.workspaceId, workspaceId),
        isNull(workspaceMembers.deletedAt),
      ),
    )
    .limit(1);

  return member as { id: number; role: Role } | undefined;
}

export async function assertMember(
  db: dbClient,
  userId: string,
  workspaceId: number,
): Promise<void> {
  const member = await getMemberRole(db, userId, workspaceId);

  if (!member) {
    throw new TRPCError({
      message: "You are not a member of this workspace",
      code: "FORBIDDEN",
    });
  }
}

export async function assertAdmin(
  db: dbClient,
  userId: string,
  workspaceId: number,
): Promise<void> {
  const member = await getMemberRole(db, userId, workspaceId);

  if (!member || member.role !== "admin") {
    throw new TRPCError({
      message: "You must be an admin to perform this action",
      code: "FORBIDDEN",
    });
  }
}

export async function assertCanDelete(
  db: dbClient,
  userId: string,
  workspaceId: number,
  createdBy: string | null,
): Promise<void> {
  const member = await getMemberRole(db, userId, workspaceId);

  if (!member) {
    throw new TRPCError({
      message: "You are not a member of this workspace",
      code: "FORBIDDEN",
    });
  }

  if (member.role === "admin") return;
  if (createdBy && createdBy === userId) return;

  throw new TRPCError({
    message: "You do not have permission to delete this",
    code: "FORBIDDEN",
  });
}

export async function assertCanEdit(
  db: dbClient,
  userId: string,
  workspaceId: number,
  createdBy: string | null,
): Promise<void> {
  const member = await getMemberRole(db, userId, workspaceId);

  if (!member) {
    throw new TRPCError({
      message: "You are not a member of this workspace",
      code: "FORBIDDEN",
    });
  }

  if (member.role === "admin" || member.role === "member") return;
  if (createdBy && createdBy === userId) return;

  throw new TRPCError({
    message: "You do not have permission to edit this",
    code: "FORBIDDEN",
  });
}

export async function assertCanManageMember(
  db: dbClient,
  managerUserId: string,
  workspaceId: number,
  targetMemberId: number,
): Promise<void> {
  const manager = await getMemberRole(db, managerUserId, workspaceId);

  if (!manager || manager.role !== "admin") {
    throw new TRPCError({
      message: "You must be an admin to manage members",
      code: "FORBIDDEN",
    });
  }

  const target = await memberRepo.getById(db, targetMemberId);

  if (!target) {
    throw new TRPCError({
      message: "Target member not found",
      code: "NOT_FOUND",
    });
  }
}
