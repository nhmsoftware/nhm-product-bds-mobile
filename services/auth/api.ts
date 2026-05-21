import { getData, postData } from "@/libs/api";
import type {
  AuthResponse,
  AuthUser,
  EmailVerificationResponse,
  ForgotPasswordResponse,
  RegisterResponse,
  VerifyResetCodeResponse
} from "@/services/auth/types";

export const authApi = {
  register(input: {
    fullName: string;
    email: string;
    password: string;
    referralCode?: string;
  }) {
    return postData<RegisterResponse>("/api/auth/register", input);
  },

  verifyEmail(input: { email: string; code: string }) {
    return postData<EmailVerificationResponse>("/api/auth/verify-email", input);
  },

  resendVerificationEmail(input: { email: string }) {
    return postData<EmailVerificationResponse>(
      "/api/auth/resend-verification-email",
      input
    );
  },

  login(input: { email: string; password: string }) {
    return postData<AuthResponse>("/api/auth/login", input);
  },

  me() {
    return getData<AuthUser>("/api/auth/me");
  },

  logout() {
    return postData<{ success: boolean }>("/api/auth/logout");
  },

  forgotPassword(input: { email: string }) {
    return postData<ForgotPasswordResponse>("/api/auth/forgot-password", input);
  },

  verifyResetCode(input: { email: string; code: string }) {
    return postData<VerifyResetCodeResponse>("/api/auth/verify-reset-code", input);
  },

  resetPassword(input: {
    resetToken: string;
    password: string;
  }) {
    return postData<{ success: boolean }>("/api/auth/reset-password", input);
  },

  changePassword(input: { currentPassword: string; newPassword: string }) {
    return postData<{ success: boolean }>("/api/auth/change-password", input);
  }
};
