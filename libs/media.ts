import type { ImageSourcePropType } from "react-native";

import { API_URL } from "@/libs/env";

export function mediaUrl(path?: unknown) {
  if (typeof path !== "string" || !path.trim()) {
    return undefined;
  }

  const value = path.trim();
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${API_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

export function mediaSource(path: unknown, fallback: ImageSourcePropType): ImageSourcePropType {
  const url = mediaUrl(path);
  return url ? { uri: url } : fallback;
}
