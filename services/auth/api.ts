import { getData, postData, putData } from "@/libs/api";
import { appLogger } from "@/libs/logger";
import type {
  AuthResponse,
  AuthRole,
  AuthUser,
  ForgotPasswordResponse,
  RegisterResponse,
  VerifyResetCodeResponse
} from "@/services/auth/types";

type BackendUser = {
  id: string;
  staff_code?: string | null;
  name?: string | null;
  fullName?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  avatar?: string | null;
  department?: string | null;
  job_position?: string | null;
  area?: string | null;
  role?: AuthRole | null;
  is_active?: boolean | number;
  email_verified_at?: string | null;
};

type BackendLoginResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  user: BackendUser;
};

function mapUser(user: BackendUser): AuthUser {
  return {
    id: String(user.id),
    staffCode: user.staff_code ?? undefined,
    fullName: user.fullName || user.name || user.email,
    email: user.email,
    phone: user.phone ?? undefined,
    address: user.address ?? null,
    avatar: user.avatar ?? null,
    department: user.department ?? null,
    jobPosition: user.job_position ?? null,
    area: user.area ?? null,
    role: mapBackendRole(user.role),
    isActive: user.is_active === undefined ? true : Boolean(user.is_active),
    emailVerified: Boolean(user.email_verified_at)
  };
}

function mapBackendRole(role?: AuthRole | null): AuthRole {
  const normalized = typeof role === "string" ? role.toLowerCase() : role;

  if (normalized === 1 || normalized === "1") {
    return "employee";
  }

  if (normalized === 2 || normalized === "2") {
    return "manager";
  }

  if (normalized === 3 || normalized === "3") {
    return "director";
  }

  if (normalized === 4 || normalized === "4") {
    return "ceo";
  }

  if (normalized === 5 || normalized === "5") {
    return "super_admin";
  }

  if (normalized === 6 || normalized === "6") {
    return "buyer";
  }

  if (
    normalized === "employee" ||
    normalized === "manager" ||
    normalized === "director" ||
    normalized === "ceo" ||
    normalized === "super_admin" ||
    normalized === "buyer" ||
    normalized === "customer" ||
    // Legacy role names kept for old local sessions/test data.
    normalized === "admin" ||
    normalized === "agent" ||
    normalized === "broker"
  ) {
    return normalized;
  }

  return "buyer";
}

function expiresAtFromSeconds(seconds?: number) {
  return new Date(Date.now() + (seconds ?? 60 * 60) * 1000).toISOString();
}

function logDevOtp(username: string, data: ForgotPasswordResponse) {
  const otpCode = data.otp_code;

  if (!__DEV__ || otpCode === undefined || otpCode === null || otpCode === "") {
    return;
  }

  appLogger.info("auth.otp.dev", `[DEV ONLY] OTP for ${username}: ${String(otpCode)}`, {
    username,
    otp_code: String(otpCode),
    expires_at: data.expires_at ?? null,
    retry_after_seconds: data.retry_after_seconds ?? null
  });
}

function mapLogin(data: BackendLoginResponse): AuthResponse {
  return {
    accessToken: data.access_token,
    expiresAtUtc: expiresAtFromSeconds(data.expires_in),
    user: mapUser(data.user)
  };
}

export const authApi = {
  async login(input: { username: string; password: string; remember?: boolean }) {
    const response = await postData<BackendLoginResponse>("/api/v1/auth/login", input);
    return {
      ...response,
      data: mapLogin(response.data)
    };
  },

  async register(input: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    referralCode?: string;
    agreeTerms?: boolean;
  }) {
    const response = await postData<BackendUser>("/api/v1/auth/register", {
      name: input.fullName,
      email: input.email,
      phone: input.phone,
      password: input.password,
      referral_code: input.referralCode || undefined,
      agree_terms: input.agreeTerms ?? true
    });

    return {
      ...response,
      data: {
        user: mapUser(response.data),
        emailVerificationRequired: false,
        verificationCodeExpiresAtUtc: null
      } satisfies RegisterResponse
    };
  },

  async me() {
    const response = await getData<BackendUser>("/api/v1/auth/profile");
    return {
      ...response,
      data: mapUser(response.data)
    };
  },

  logout() {
    return postData<{ success: boolean } | null>("/api/v1/auth/logout");
  },

  async forgotPassword(input: { username: string }) {
    const response = await postData<ForgotPasswordResponse>("/api/v1/auth/forgot-password", input);
    logDevOtp(input.username, response.data);
    return response;
  },

  verifyResetCode(input: { username: string; code: string }) {
    return postData<VerifyResetCodeResponse>("/api/v1/auth/verify-otp", {
      username: input.username,
      otp: input.code
    });
  },

  resetPassword(input: {
    username: string;
    otp: string;
    password: string;
    passwordConfirmation: string;
  }) {
    return postData<null>("/api/v1/auth/reset-password", {
      username: input.username,
      otp: input.otp,
      password: input.password,
      password_confirmation: input.passwordConfirmation
    });
  },

  changePassword(input: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
  }) {
    return putData<null>("/api/v1/auth/change-password", {
      current_password: input.currentPassword,
      new_password: input.newPassword,
      new_password_confirmation: input.newPasswordConfirmation
    });
  },

  updatePushToken(token: string | null) {
    return putData<{ fcm_token: string | null }>("/api/v1/auth/fcm-token", {
      fcm_token: token
    });
  }
};
