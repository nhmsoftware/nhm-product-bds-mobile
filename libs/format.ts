import type { Language } from "@/libs/i18n";
import { translate } from "@/libs/i18n";

const localeByLanguage: Record<Language, string> = {
  vi: "vi-VN",
  en: "en-US"
};

export function validationMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return "";
}

export function firstValidationError(errors?: Record<string, string[]>) {
  if (!errors) {
    return undefined;
  }

  const firstKey = Object.keys(errors)[0];
  return firstKey ? errors[firstKey]?.[0] : undefined;
}

export function formatCurrencyVnd(value: number, language: Language = "vi") {
  const locale = localeByLanguage[language];

  if (value >= 1_000_000_000) {
    const formattedValue = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1
    }).format(value / 1_000_000_000);
    return translate("unit.billionVnd", { value: formattedValue }, language);
  }

  if (value >= 1_000_000) {
    const formattedValue = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0
    }).format(value / 1_000_000);
    return translate("unit.millionVnd", { value: formattedValue }, language);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatArea(areaM2: number, language: Language = "vi") {
  return `${new Intl.NumberFormat(localeByLanguage[language], {
    maximumFractionDigits: 1
  }).format(areaM2)} m2`;
}

export function formatRelativeCount(value: number, language: Language = "vi") {
  return new Intl.NumberFormat(localeByLanguage[language]).format(value);
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 giây";

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0) parts.push(`${minutes} phút`);
  if (secs > 0) parts.push(`${secs} giây`);

  return parts.join(" ");
}
