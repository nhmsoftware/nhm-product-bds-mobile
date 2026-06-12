export const APP_NAME = "NHM BDS";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export const REALTIME_URL =
  process.env.EXPO_PUBLIC_REALTIME_URL?.replace(/\/$/, "") ??
  API_URL.replace(/:\d+$/, ":8012");

export const EAS_PROJECT_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "";

export const STORAGE_KEYS = {
  auth: "nhm-bds.auth",
  language: "nhm-bds.language",
  layoutMode: "nhm-bds.layout_mode",
  savedListings: "nhm-bds.saved_listings",
  consultationHistory: "nhm-bds.consultation_history"
} as const;
