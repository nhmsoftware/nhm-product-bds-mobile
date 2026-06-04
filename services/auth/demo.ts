import { normalizeAccessRole } from "@/services/auth/roles";
import type { AppAccessRole, AuthRole, AuthSession } from "@/services/auth/types";

export const DEMO_AUTH_ENABLED = true;

export type DemoLoginRole = AppAccessRole | "manager" | "director";

export const DEMO_LOGIN_OPTIONS: Array<{
  role: DemoLoginRole;
  labelKey: "auth.login.demoCustomer" | "auth.login.demoEmployee" | "auth.login.demoManager" | "auth.login.demoDirector";
}> = [
  { role: "customer", labelKey: "auth.login.demoCustomer" },
  { role: "employee", labelKey: "auth.login.demoEmployee" },
  { role: "manager", labelKey: "auth.login.demoManager" },
  { role: "director", labelKey: "auth.login.demoDirector" }
];

export function createDemoSession(role: DemoLoginRole = "customer"): AuthSession {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const accessRole = normalizeAccessRole(role);
  const isEmployeeAccess = accessRole === "employee";
  const demoRole: AuthRole = role;
  const isDirector = role === "director";
  const isManager = role === "manager";
  const fullName = isDirector
    ? "Giám đốc Demo"
    : isManager
    ? "Mai Đức Dương"
    : isEmployeeAccess
      ? "Nguyễn Văn Huy"
      : "Nguyễn Minh";
  const email = isDirector
    ? "director@gmail.com"
    : isManager
    ? "maiducduong201@gmail.com"
    : isEmployeeAccess
      ? "employee@nhmbds.local"
      : "demo@nhmbds.local";

  return {
    accessToken: "demo-local-session",
    expiresAtUtc: expiresAt,
    isDemo: true,
    user: {
      id: isEmployeeAccess ? `demo-${role}` : "demo-customer",
      fullName,
      email,
      phone: isEmployeeAccess ? "0902 456 789" : "0901 234 567",
      role: demoRole,
      isActive: true,
      emailVerified: true
    }
  };
}

export function isDemoSession(session?: AuthSession | null) {
  return DEMO_AUTH_ENABLED && Boolean(session?.isDemo);
}

export function canUseDemoLearning(session?: AuthSession | null) {
  return isDemoSession(session) && normalizeAccessRole(session?.user.role) === "employee";
}
