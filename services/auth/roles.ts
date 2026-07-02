import { translate, type Language } from "@/libs/i18n";
import type { AppAccessRole, AuthRole, AuthSession } from "@/services/auth/types";

export type RoleHomeHref = "/(app)/(tabs)" | "/employee" | "/(app)/forbidden";

const roleHomeHref: Record<AppAccessRole, RoleHomeHref> = {
  customer: "/(app)/(tabs)",
  employee: "/employee"
};

export function normalizeAccessRole(role?: AuthRole | null): AppAccessRole | null {
  const normalized = typeof role === "string" ? role.toLowerCase() : role;

  if (
    normalized === "customer" ||
    normalized === "buyer" ||
    normalized === "6" ||
    normalized === 6 ||
    normalized === "99" ||
    normalized === 99
  ) {
    return "customer";
  }

  if (
    normalized === "employee" ||
    normalized === "manager" ||
    normalized === "director" ||
    normalized === "ceo" ||
    normalized === "super_admin" ||
    normalized === "agent" ||
    normalized === "broker" ||
    normalized === "admin" ||
    normalized === "tp_kd" ||
    normalized === "gdkd" ||
    normalized === "gdcn" ||
    normalized === "hr_manager" ||
    normalized === "ctv" ||
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
  allowedRoles: AppAccessRole[],
  permissions?: string[]
) {
  const normalizedRole = normalizeAccessRole(role);
  if (normalizedRole === "customer") {
    return allowedRoles.includes("customer");
  }

  if (permissions) {
    const isSuperAdmin = permissions.includes("manage_all");
    if (!isSuperAdmin && !permissions.includes("access_mobile")) {
      return false;
    }
  }
  return normalizedRole !== null && allowedRoles.includes(normalizedRole);
}

export function isManagerAccessRole(role?: AuthRole | null, permissions?: string[]) {
  if (permissions) {
    if (permissions.includes("manage_all") || permissions.includes("manage_all_mobile")) {
      return true;
    }
    if (permissions.includes("mobile_approve_leave")) {
      return true;
    }
  }
  const normalized = typeof role === "string" ? role.toLowerCase() : role;

  return (
    normalized === "manager" ||
    normalized === "director" ||
    normalized === "ceo" ||
    normalized === "super_admin" ||
    normalized === "admin" ||
    normalized === "tp_kd" ||
    normalized === "gdkd" ||
    normalized === "gdcn" ||
    normalized === "hr_manager" ||
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

export function isBaseEmployeeRole(role?: AuthRole | null) {
  const normalized = typeof role === "string" ? role.toLowerCase() : role;

  return (
    normalized === "employee" ||
    normalized === "ctv" ||
    normalized === "1" ||
    normalized === 1
  );
}

export function isDepartmentTransferApproverRole(role?: AuthRole | null, permissions?: string[]) {
  if (permissions) {
    if (permissions.includes("manage_all") || permissions.includes("manage_all_mobile")) {
      return true;
    }
    if (permissions.includes("mobile_approve_transfer")) {
      return true;
    }
  }
  const normalized = typeof role === "string" ? role.toLowerCase() : role;

  return (
    normalized === "director" ||
    normalized === "ceo" ||
    normalized === "super_admin" ||
    normalized === "admin" ||
    normalized === "gdkd" ||
    normalized === "gdcn" ||
    normalized === "3" ||
    normalized === "4" ||
    normalized === "5" ||
    normalized === 3 ||
    normalized === 4 ||
    normalized === 5
  );
}

export function isExecutiveAdminRole(role?: AuthRole | null) {
  const normalized = typeof role === "string" ? role.toLowerCase() : role;

  return (
    normalized === "ceo" ||
    normalized === "super_admin" ||
    normalized === "admin" ||
    normalized === "4" ||
    normalized === "5" ||
    normalized === 4 ||
    normalized === 5
  );
}

export function isRecruitmentApproverRole(role?: AuthRole | null, permissions?: string[]) {
  if (permissions) {
    if (permissions.includes("manage_all") || permissions.includes("manage_all_mobile")) {
      return true;
    }
    if (permissions.includes("mobile_approve_recruitment")) {
      return true;
    }
  }
  const normalized = typeof role === "string" ? role.toLowerCase() : role;

  return (
    normalized === "director" ||
    normalized === "ceo" ||
    normalized === "super_admin" ||
    normalized === "admin" ||
    normalized === "gdkd" ||
    normalized === "gdcn" ||
    normalized === "3" ||
    normalized === "4" ||
    normalized === "5" ||
    normalized === 3 ||
    normalized === 4 ||
    normalized === 5
  );
}

export function hasEmployeeListAccess(role?: AuthRole | null, permissions?: string[]) {
  if (permissions) {
    if (permissions.includes("manage_all") || permissions.includes("manage_all_mobile")) {
      return true;
    }
    if (permissions.includes("mobile_employee_list")) {
      return true;
    }
  }
  return isManagerAccessRole(role, permissions);
}

export function getHomeHrefForRole(role?: AuthRole | null, permissions?: string[]): RoleHomeHref {
  const normalizedRole = normalizeAccessRole(role);
  if (normalizedRole === "customer") {
    return "/(app)/(tabs)";
  }

  if (permissions) {
    const isSuperAdmin = permissions.includes("manage_all");
    if (!isSuperAdmin && !permissions.includes("access_mobile")) {
      return "/(app)/forbidden";
    }
  }
  return normalizedRole ? roleHomeHref[normalizedRole] : "/(app)/forbidden";
}

export function getHomeHrefForSession(session?: AuthSession | null): RoleHomeHref {
  return getHomeHrefForRole(session?.user.role, session?.user.permissions);
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
