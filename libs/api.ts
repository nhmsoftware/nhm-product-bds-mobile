import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";

import { API_URL, STORAGE_KEYS } from "@/libs/env";
import { translate } from "@/libs/i18n";
import { appLogger } from "@/libs/logger";
import type { AuthSession } from "@/services/auth/types";

export type ApiResponse<T> = {
  message: string;
  data: T;
};

export type ApiValidationErrors = Record<string, string[]>;

export class ApiRequestError extends Error {
  status: number;
  errors?: ApiValidationErrors;

  constructor(message: string, status = 0, errors?: ApiValidationErrors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let unauthorizedHandling = false;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function handleUnauthorized() {
  if (!unauthorizedHandler || unauthorizedHandling) {
    return;
  }

  unauthorizedHandling = true;
  Promise.resolve(unauthorizedHandler()).finally(() => {
    setTimeout(() => {
      unauthorizedHandling = false;
    }, 1000);
  });
}

type OnboardingHandler = () => void | Promise<void>;

let onboardingHandler: OnboardingHandler | null = null;
let onboardingHandling = false;

export function setOnboardingHandler(handler: OnboardingHandler | null) {
  onboardingHandler = handler;
}

function handleOnboardingRequired() {
  if (!onboardingHandler || onboardingHandling) {
    return;
  }

  onboardingHandling = true;
  Promise.resolve(onboardingHandler()).finally(() => {
    setTimeout(() => {
      onboardingHandling = false;
    }, 1000);
  });
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use(async (config) => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.auth);
  if (raw) {
    const session = JSON.parse(raw) as AuthSession;
    if (session.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: ApiValidationErrors }>) => {
    if (error.response) {
      const message = error.response.data?.message || translate("errors.generic");
      const status = error.response.status;

      appLogger.error("api.response", message, {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        status,
        errors: error.response.data?.errors
      });

      if (status === 401) {
        handleUnauthorized();
      }

      if (status === 403) {
        const msg = (error.response.data?.message || "").toLowerCase();
        if (msg.includes("onboarding")) {
          handleOnboardingRequired();
        }
      }

      throw new ApiRequestError(message, status, error.response.data?.errors);
    }

    if (error.request) {
      appLogger.error("api.network", translate("errors.networkNoResponse"), {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        code: error.code,
        message: error.message
      });

      throw new ApiRequestError(
        translate("errors.networkNoResponseWithHint"),
        0
      );
    }

    appLogger.error("api.request", translate("errors.requestFailed"), {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      code: error.code,
      message: error.message
    });

    throw new ApiRequestError(translate("errors.requestFailed"), 0);
  }
);

export async function getData<T>(url: string, params?: Record<string, unknown>) {
  const response = await apiClient.get<ApiResponse<T>>(url, { params });
  return response.data;
}

export async function postData<T>(url: string, body?: unknown) {
  const response = await apiClient.post<ApiResponse<T>>(url, body);
  return response.data;
}

export async function putData<T>(url: string, body?: unknown) {
  const response = await apiClient.put<ApiResponse<T>>(url, body);
  return response.data;
}

export async function deleteData<T>(url: string) {
  const response = await apiClient.delete<ApiResponse<T>>(url);
  return response.data;
}
