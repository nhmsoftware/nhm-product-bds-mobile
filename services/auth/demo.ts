import { normalizeAccessRole } from "@/services/auth/roles";
import type { AppAccessRole, AuthRole, AuthSession } from "@/services/auth/types";

export const DEMO_AUTH_ENABLED = true;

export type DemoLoginRole = AppAccessRole | "candidate" | "employee2" | "manager" | "director" | "ceo" | "super_admin";

export const DEMO_LOGIN_OPTIONS: Array<{
  role: DemoLoginRole;
  labelKey:
    | "auth.login.demoCustomer"
    | "auth.login.demoEmployee"
    | "auth.login.demoCandidate"
    | "auth.login.demoEmployee2"
    | "auth.login.demoManager"
    | "auth.login.demoDirector"
    | "auth.login.demoCeo"
    | "auth.login.demoSuperAdmin";
}> = [
  { role: "customer", labelKey: "auth.login.demoCustomer" },
  { role: "employee", labelKey: "auth.login.demoEmployee" },
  { role: "candidate", labelKey: "auth.login.demoCandidate" },
  { role: "employee2", labelKey: "auth.login.demoEmployee2" },
  { role: "manager", labelKey: "auth.login.demoManager" },
  { role: "director", labelKey: "auth.login.demoDirector" },
  { role: "ceo", labelKey: "auth.login.demoCeo" },
  { role: "super_admin", labelKey: "auth.login.demoSuperAdmin" }
];

export function createDemoSession(role: DemoLoginRole = "customer"): AuthSession {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const sessionRole: AuthRole = role === "employee2" || role === "candidate" ? "employee" : role;
  const accessRole = normalizeAccessRole(sessionRole);
  const isEmployeeAccess = accessRole === "employee";
  const demoRole: AuthRole = sessionRole;
  const demoProfiles: Record<DemoLoginRole, { fullName: string; email: string; phone: string }> = {
    customer: {
      fullName: "Khách hàng Demo",
      email: "[EMAIL_ADDRESS]",
      phone: "0901 234 567"
    },
    employee: {
      fullName: "Nguyễn Văn Nhân Viên",
      email: "[EMAIL_ADDRESS]",
      phone: "0900 000 001"
    },
    candidate: {
      fullName: "Ứng Viên Chưa Duyệt",
      email: "[EMAIL_ADDRESS]",
      phone: "0900 000 008"
    },
    employee2: {
      fullName: "Võ Thị Nhân Viên Mới",
      email: "[EMAIL_ADDRESS]",
      phone: "0900 000 006"
    },
    manager: {
      fullName: "Trần Thị Trưởng Phòng",
      email: "[EMAIL_ADDRESS]",
      phone: "0900 000 002"
    },
    director: {
      fullName: "Lê Văn Giám Đốc",
      email: "[EMAIL_ADDRESS]",
      phone: "0900 000 003"
    },
    ceo: {
      fullName: "Phạm Thị Tổng Giám Đốc",
      email: "[EMAIL_ADDRESS]",
      phone: "0900 000 004"
    },
    super_admin: {
      fullName: "Phạm Thị Tổng Giám Đốc",
      email: "[EMAIL_ADDRESS]",
      phone: "0900 000 005"
    }
  };
  const profile = demoProfiles[role];

  return {
    accessToken: "demo-local-session",
    expiresAtUtc: expiresAt,
    isDemo: true,
    user: {
      id: isEmployeeAccess ? `demo-${role}` : "demo-customer",
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      role: demoRole,
      isActive: true,
      emailVerified: true,
      department:
        role === "employee"
          ? "Đào tạo"
          : role === "employee2" || role === "manager" || role === "director"
          ? "Kinh doanh"
          : null,
      jobPosition: role === "candidate" ? null : isEmployeeAccess ? "Nhân viên kinh doanh" : null
    }
  };
}

export function isDemoSession(session?: AuthSession | null) {
  return DEMO_AUTH_ENABLED && Boolean(session?.isDemo);
}

export function canUseDemoLearning(session?: AuthSession | null) {
  return isDemoSession(session) && normalizeAccessRole(session?.user.role) === "employee";
}
