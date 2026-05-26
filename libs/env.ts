export const APP_NAME = "NHM BDS";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export const STORAGE_KEYS = {
  auth: "nhm-bds.auth",
  language: "nhm-bds.language",
  layoutMode: "nhm-bds.layout_mode",
  savedListings: "nhm-bds.saved_listings"
} as const;
