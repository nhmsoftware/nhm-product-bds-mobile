import { translate, type Language } from "@/libs/i18n";
import type { AppAccessRole, AuthRole, AuthSession } from "@/services/auth/types";

export type RoleHomeHref = "/(app)/(tabs)" | "/(app)/employee" | "/(app)/forbidden";

const roleHomeHref: Record<AppAccessRole, RoleHomeHref> = {
  customer: "/(app)/(tabs)",
  employee: "/(app)/employee"
};

export function normalizeAccessRole(role?: AuthRole | null): AppAccessRole | null {
  const normalized = typeof role === "string" ? role.toLowerCase() : role;

  if (normalized === "customer" || normalized === "buyer" || normalized === "6" || normalized === 6) {
    return "customer";
  }

  if (
    normalized === "employee" ||
    normalized === "manager" ||
    normalized === "director" ||
    normalized === "ceo" ||
    normalized === "super_admin" ||
    // Legacy role names kept for old local sessions/test data.
    normalized === "agent" ||
    normalized === "broker" ||
    normalized === "admin" ||
    normalized === "1" ||
    normalized === "2" ||
    normalized === "3" ||
    normalized === "4" ||
    normalized === "5" ||
    normalized === 1 ||
    normalized === 2 ||
    normalized === 3 ||
    normalized === 4 ||
    normalized === 5
  ) {
    return "employee";
  }

  return null;
}

export function canAccessRole(
  role: AuthRole | null | undefined,
  allowedRoles: AppAccessRole[]
) {
  const normalizedRole = normalizeAccessRole(role);
  return normalizedRole !== null && allowedRoles.includes(normalizedRole);
}

export function isManagerAccessRole(role?: AuthRole | null) {
  const normalized = typeof role === "string" ? role.toLowerCase() : role;

  return (
    normalized === "manager" ||
    normalized === "director" ||
    normalized === "ceo" ||
    normalized === "super_admin" ||
    normalized === "admin" ||
    normalized === "2" ||
    normalized === "3" ||
    normalized === "4" ||
    normalized === "5" ||
    normalized === 2 ||
    normalized === 3 ||
    normalized === 4 ||
    normalized === 5
  );
}

export function getHomeHrefForRole(role?: AuthRole | null): RoleHomeHref {
  const normalizedRole = normalizeAccessRole(role);
  return normalizedRole ? roleHomeHref[normalizedRole] : "/(app)/forbidden";
}

export function getHomeHrefForSession(session?: AuthSession | null): RoleHomeHref {
  return getHomeHrefForRole(session?.user.role);
}

export function getRoleLabel(role?: AuthRole | null, language?: Language) {
  const normalizedRole = normalizeAccessRole(role);

  if (normalizedRole === "customer") {
    return translate("role.customer", undefined, language);
  }

  if (normalizedRole === "employee") {
    return translate("role.employee", undefined, language);
  }

  return translate("role.unknown", undefined, language);
}
