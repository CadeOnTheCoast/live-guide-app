export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export function canManageAdminArea(role: Role | null | undefined): boolean {
  return role === "ADMIN";
}

export function canEditProject(role: Role | null | undefined): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

export function isViewer(role: Role | null | undefined): boolean {
  return role === "VIEWER";
}
