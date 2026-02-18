export type Role = "admin" | "member" | "guest";

export function isAdmin(role: string): boolean {
  return role === "admin";
}

export function isAdminOrMember(role: string): boolean {
  return role === "admin" || role === "member";
}
