import { showMessage } from "react-native-flash-message";

import { validationMessage } from "@/libs/format";

const DEFAULT_DURATION_MS = 3000;

type NotifyOptions = {
  message: string;
  description?: string;
  duration?: number;
};

export function notifySuccess({
  message,
  description,
  duration = DEFAULT_DURATION_MS
}: NotifyOptions) {
  showMessage({
    description,
    duration,
    message,
    type: "success"
  });
}

export function notifyError(error: unknown, fallback = "Đã xảy ra lỗi.") {
  showMessage({
    duration: DEFAULT_DURATION_MS,
    message: typeof error === "string" ? error : validationMessage(error) || fallback,
    type: "danger"
  });
}

export function notifyInfo({
  message,
  description,
  duration = DEFAULT_DURATION_MS
}: NotifyOptions) {
  showMessage({
    description,
    duration,
    message,
    type: "info"
  });
}
