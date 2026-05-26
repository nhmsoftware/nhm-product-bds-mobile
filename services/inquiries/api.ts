import type { ApiResponse } from "@/libs/api";
import { translate } from "@/libs/i18n";
import type { Inquiry, InquiryInput } from "@/services/inquiries/types";

function createResponse<T>(data: T, message = translate("common.success")): ApiResponse<T> {
  return { message, data };
}

export const inquiryApi = {
  async create(input: InquiryInput) {
    const inquiry: Inquiry = {
      ...input,
      id: `INQ-${Date.now()}`,
      status: "new",
      createdAt: new Date().toISOString()
    };

    return createResponse(inquiry, translate("inquiry.success.submit"));
  }
};
