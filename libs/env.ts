export const APP_NAME = "Zentrix";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

export const STORAGE_KEYS = {
  auth: "zentrix.auth",
  layoutMode: "zentrix.layout_mode"
} as const;
