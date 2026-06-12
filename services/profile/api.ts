import type { ApiResponse } from "@/libs/api";
import { putData } from "@/libs/api";
import { translate } from "@/libs/i18n";
import { authApi } from "@/services/auth/api";
import type { CustomerProfile, UpdateProfileInput } from "@/services/profile/types";

let sampleProfile: CustomerProfile = {
  id: "demo-user",
  cccd: null,
  fullName: "Nguyễn Minh",
  email: "demo@nhmbds.local",
  phone: "0901 234 567",
  address: "TP. Hồ Chí Minh",
  avatar: null,
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
      const response = await authApi.me();
      const user = response.data;
      const address = user.address || "Chưa cập nhật";

      sampleProfile = {
        ...sampleProfile,
        id: user.id,
        cccd: user.cccd ?? null,
        fullName: user.fullName || user.email,
        email: user.email,
        phone: user.phone || "",
        address,
        avatar: user.avatar ?? null,
        preferredCity: address
      };

      return {
        ...response,
        data: sampleProfile
      };
    } catch {
      // Fallback mock keeps customer profile usable before backend data is complete.
    }

    return createResponse(sampleProfile);
  },

  async updateProfile(input: UpdateProfileInput) {
    const response = await putData<{
      id: string;
      cccd?: string | null;
      name?: string;
      email: string;
      phone?: string;
      address?: string | null;
      avatar?: string | null;
    }>("/api/v1/auth/profile", {
      name: input.fullName,
      email: input.email,
      phone: input.phone,
      address: input.address
    });

    const address = response.data.address || input.address || "Chưa cập nhật";
    sampleProfile = {
      ...sampleProfile,
      id: response.data.id,
      cccd: response.data.cccd ?? sampleProfile.cccd ?? null,
      fullName: response.data.name || input.fullName,
      email: response.data.email,
      phone: response.data.phone || input.phone,
      address,
      avatar: response.data.avatar ?? sampleProfile.avatar ?? null,
      preferredCity: address
    };
    return createResponse(sampleProfile, response.message || translate("notifications.profileUpdated"));
  }
};
