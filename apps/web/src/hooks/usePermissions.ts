import { useContext } from "react";

import { WorkspaceContext } from "~/providers/workspace";

interface UsePermissionsResult {
  role: string | null;
  isAdmin: boolean;
  isMember: boolean;
  isAdminOrMember: boolean;
}

export function usePermissions(): UsePermissionsResult {
  const workspaceContext = useContext(WorkspaceContext);

  if (!workspaceContext) {
    return {
      role: null,
      isAdmin: false,
      isMember: false,
      isAdminOrMember: false,
    };
  }

  const { workspace } = workspaceContext;
  const role = workspace.role ?? null;
  const isAdmin = role === "admin";
  const isMember = role === "member";

  return {
    role,
    isAdmin,
    isMember,
    isAdminOrMember: isAdmin || isMember,
  };
}
