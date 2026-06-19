export type AppAccessRole = "customer" | "employee";

export type BackendAuthRole =
  | "employee"
  | "manager"
  | "director"
  | "ceo"
  | "super_admin"
  | "buyer"
  | "EMPLOYEE"
  | "MANAGER"
  | "DIRECTOR"
  | "CEO"
  | "SUPER_ADMIN"
  | "BUYER"
  // Legacy role names kept for old local sessions/test data.
  | "agent"
  | "broker"
  | "admin"
  | "AGENT"
  | "BROKER"
  | "ADMIN"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6;

export type AuthRole = AppAccessRole | BackendAuthRole;

export type AuthUser = {
  id: string;
  staffCode?: string;
  cccd?: string | null;
  fullName: string;
  email: string;
  phone?: string;
  address?: string | null;
  avatar?: string | null;
  department?: string | null;
  jobPosition?: string | null;
  role: AuthRole;
  isActive: boolean;
  emailVerified: boolean;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  expiresAtUtc: string;
  isDemo?: boolean;
};

export type AuthSession = AuthResponse;

export type RegisterResponse = {
  user: AuthUser;
  emailVerificationRequired: boolean;
  verificationCodeExpiresAtUtc?: string | null;
};

export type ForgotPasswordResponse = {
  username?: string;
  retry_after_seconds?: number;
  expires_at?: string | null;
  otp_code?: string | number | null;
};

export type VerifyResetCodeResponse = {
  username: string;
  resetToken: string;
};
