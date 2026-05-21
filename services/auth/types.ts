export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  emailVerified: boolean;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  expiresAtUtc: string;
};

export type AuthSession = AuthResponse;

export type RegisterResponse = {
  user: AuthUser;
  emailVerificationRequired: boolean;
  verificationCodeExpiresAtUtc: string;
  emailVerificationCode?: string | null;
};

export type EmailVerificationResponse = {
  email: string;
  emailVerified: boolean;
  emailVerifiedAtUtc?: string | null;
  verificationCodeExpiresAtUtc?: string | null;
  emailVerificationCode?: string | null;
};

export type ForgotPasswordResponse = {
  email: string;
  resetCodeExpiresAtUtc?: string | null;
  resetCode?: string | null;
};

export type VerifyResetCodeResponse = {
  email: string;
  resetToken: string;
  resetTokenExpiresAtUtc: string;
};
