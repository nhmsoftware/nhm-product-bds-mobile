import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";

import { API_URL, STORAGE_KEYS } from "@/libs/env";
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
      const message = error.response.data?.message || "Đã xảy ra lỗi.";
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

      throw new ApiRequestError(message, status, error.response.data?.errors);
    }

    if (error.request) {
      appLogger.error("api.network", "Không nhận được phản hồi từ máy chủ.", {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        code: error.code,
        message: error.message
      });

      throw new ApiRequestError(
        "Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra backend/API URL.",
        0
      );
    }

    appLogger.error("api.request", "Không thể gửi yêu cầu.", {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      code: error.code,
      message: error.message
    });

    throw new ApiRequestError("Không thể gửi yêu cầu.", 0);
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
