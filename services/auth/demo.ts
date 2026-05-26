import { normalizeAccessRole } from "@/services/auth/roles";
import type { AppAccessRole, AuthSession } from "@/services/auth/types";

export const DEMO_AUTH_ENABLED = true;

export type DemoLoginRole = AppAccessRole;

export const DEMO_LOGIN_OPTIONS: Array<{
  role: DemoLoginRole;
  labelKey: "auth.login.demoCustomer" | "auth.login.demoEmployee";
}> = [
  { role: "customer", labelKey: "auth.login.demoCustomer" },
  { role: "employee", labelKey: "auth.login.demoEmployee" }
];

export function createDemoSession(role: DemoLoginRole = "customer"): AuthSession {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const isEmployee = role === "employee";

  return {
    accessToken: "demo-local-session",
    expiresAtUtc: expiresAt,
    isDemo: true,
    user: {
      id: isEmployee ? "demo-employee" : "demo-customer",
      fullName: isEmployee ? "Nguyễn Văn Huy" : "Nguyễn Minh",
      email: isEmployee ? "employee@nhmbds.local" : "demo@nhmbds.local",
      phone: isEmployee ? "0902 456 789" : "0901 234 567",
      role,
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
