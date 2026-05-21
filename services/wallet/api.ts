import { getData, postData } from "@/libs/api";
import type { WalletTransaction, WalletTransactionPage } from "@/services/wallet/types";

export const walletApi = {
  list(page = 1) {
    return getData<WalletTransactionPage>("/api/wallet/list", { page });
  },

  withdraw(money: number) {
    return postData<WalletTransaction>("/api/wallet/withdraw", { money });
  }
};
