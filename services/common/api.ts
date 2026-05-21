import { getData } from "@/libs/api";
import type { AppConfig, Bank } from "@/services/common/types";

export const commonApi = {
  banks() {
    return getData<Bank[]>("/api/common/banks");
  },

  configs() {
    return getData<AppConfig[]>("/api/config/list");
  }
};
