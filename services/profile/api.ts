import type { ApiResponse } from "@/libs/api";
import { getData, putData } from "@/libs/api";
import { translate } from "@/libs/i18n";
import type { CustomerProfile, UpdateProfileInput } from "@/services/profile/types";

let sampleProfile: CustomerProfile = {
  id: "demo-user",
  fullName: "Nguyễn Minh",
  email: "demo@nhmbds.local",
  phone: "0901 234 567",
  preferredCity: "TP. Hồ Chí Minh",
  budgetLabel: "5 - 8 tỷ",
  demand: "buy"
};

function createResponse<T>(data: T, message = translate("common.success")): ApiResponse<T> {
  return { message, data };
}

export const profileApi = {
  async getProfile() {
    try {
      const response = await getData<{
        id: string;
        name?: string;
        email: string;
        phone?: string;
        address?: string | null;
      }>("/api/v1/auth/profile");
      return {
        ...response,
        data: {
          id: response.data.id,
          fullName: response.data.name || response.data.email,
          email: response.data.email,
          phone: response.data.phone || "",
          preferredCity: response.data.address || "Chưa cập nhật",
          budgetLabel: "Chưa cập nhật",
          demand: "buy" as const
        }
      };
    } catch {
      // Fallback mock keeps customer profile usable before backend data is complete.
    }

    return createResponse(sampleProfile);
  },

  async updateProfile(input: UpdateProfileInput) {
    try {
      const response = await putData<{
        id: string;
        name?: string;
        email: string;
        phone?: string;
        address?: string | null;
      }>("/api/v1/auth/profile", {
        name: input.fullName,
        email: sampleProfile.email,
        phone: input.phone,
        address: input.preferredCity
      });
      sampleProfile = {
        ...sampleProfile,
        id: response.data.id,
        fullName: response.data.name || input.fullName,
        email: response.data.email,
        phone: response.data.phone || input.phone,
        preferredCity: response.data.address || input.preferredCity,
        budgetLabel: input.budgetLabel,
        demand: input.demand
      };
      return createResponse(sampleProfile, response.message || translate("notifications.profileUpdated"));
    } catch {
      // Fall back to local update if backend profile fields are incomplete during development.
    }

    sampleProfile = {
      ...sampleProfile,
      ...input
    };

    return createResponse(sampleProfile, translate("notifications.profileUpdated"));
  }
};
