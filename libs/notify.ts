import { showMessage } from "react-native-flash-message";

import { validationMessage } from "@/libs/format";
import { translate } from "@/libs/i18n";

const DEFAULT_DURATION_MS = 3000;

type NotifyOptions = {
  message: string;
  description?: string;
  duration?: number;
  onPress?: () => void;
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

export function notifyError(error: unknown, fallback = translate("errors.generic")) {
  showMessage({
    duration: DEFAULT_DURATION_MS,
    message: validationMessage(error) || fallback,
    type: "danger"
  });
}

export function notifyInfo({
  message,
  description,
  duration = DEFAULT_DURATION_MS,
  onPress
}: NotifyOptions) {
  showMessage({
    description,
    duration,
    hideOnPress: true,
    message,
    onPress,
    type: "info"
  });
}
