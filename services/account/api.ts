import { getData, postData } from "@/libs/api";
import type { PaginatedTradingAccounts, TradingAccount } from "@/services/account/types";

export const accountApi = {
  async list(type?: string) {
    const response = await getData<PaginatedTradingAccounts>("/api/list-account", { type });

    return {
      ...response,
      data: Array.isArray(response.data?.items) ? response.data.items : []
    };
  },

  toggleProtect(accountId: string) {
    return postData<TradingAccount>("/api/active-protect-account", {
      account_id: accountId
    });
  }
};
