import { getData } from "@/libs/api";
import type { Coin } from "@/services/market/types";

export const marketApi = {
  activeCoins() {
    return getData<Coin[]>("/api/coins");
  },

  coin(symbol: string) {
    return getData<Coin>(`/api/coins/${encodeURIComponent(symbol)}`);
  }
};
