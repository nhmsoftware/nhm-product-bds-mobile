import { apiClient, getData, putData } from "@/libs/api";
import type {
  SubmitKycInput,
  UpdateProfileInput,
  UserProfile
} from "@/services/profile/types";

export const profileApi = {
  getProfile() {
    return getData<UserProfile>("/api/auth/user-profile");
  },

  updateProfile(input: UpdateProfileInput) {
    return putData<UserProfile>("/api/auth/user-profile", input);
  },

  async submitKyc(input: SubmitKycInput) {
    const form = new FormData();
    form.append("first_name", input.firstName);
    form.append("last_name", input.lastName);
    form.append("dob", input.dateOfBirth);
    form.append("gender", String(input.gender));
    form.append("phone_number", input.phoneNumber);
    form.append("address", input.address);
    form.append("bin_bank", input.binBank);
    form.append("account_bank", input.accountBank);
    form.append("account_bank_name", input.accountBankName);

    if (input.cccdFrontImage) {
      form.append("cccd_front_image", input.cccdFrontImage as unknown as Blob);
    }

    if (input.cccdBackImage) {
      form.append("cccd_back_image", input.cccdBackImage as unknown as Blob);
    }

    const response = await apiClient.post("/api/auth/verify-account", form, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    return response.data;
  }
};
