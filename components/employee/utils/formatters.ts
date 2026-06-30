import type { ApiObject } from "./apiNormalizers";
import { apiText, apiBoolean, apiNullableNumber, apiDisplayText } from "./apiNormalizers";

export function parsePriceNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const numericText = value.replace(/[^\d.,-]/g, "").trim();
  if (!numericText) {
    return null;
  }

  const separators = [...numericText].filter((char) => char === "." || char === ",");
  if (separators.length === 0) {
    const number = Number(numericText);
    return Number.isFinite(number) ? number : null;
  }

  const lastSeparator = separators[separators.length - 1];
  const parts = numericText.split(lastSeparator);
  const lastPart = parts[parts.length - 1] ?? "";
  const hasDecimalSeparator = separators.length === 1 && lastPart.length > 0 && lastPart.length < 3;
  const normalized = hasDecimalSeparator
    ? `${parts.slice(0, -1).join("").replace(/[.,]/g, "")}.${lastPart}`
    : numericText.replace(/[.,]/g, "");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

export function formatVietnamPriceAmount(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits
  }).format(value);
}

export function formatVietnamRealEstatePrice(value: unknown, fallback = "3,7 Tỷ VND") {
  const rawText = apiText(value, "").trim();
  const normalizedText = rawText.toLowerCase();
  const number = parsePriceNumber(value);

  if (number === null) {
    return rawText ? rawText.replace(/vnđ/gi, "VND") : fallback;
  }

  if (normalizedText.includes("tỷ") || normalizedText.includes("ty") || normalizedText.includes("billion")) {
    return `${formatVietnamPriceAmount(number)} Tỷ VND`;
  }

  if (
    normalizedText.includes("tr") ||
    normalizedText.includes("triệu") ||
    normalizedText.includes("trieu") ||
    normalizedText.includes("million")
  ) {
    return `${formatVietnamPriceAmount(number, 0)} Tr VND`;
  }

  if (number >= 1_000_000_000) {
    return `${formatVietnamPriceAmount(number / 1_000_000_000)} Tỷ VND`;
  }

  if (number >= 1_000_000) {
    return `${formatVietnamPriceAmount(number / 1_000_000, 0)} Tr VND`;
  }

  if (number >= 100) {
    return `${formatVietnamPriceAmount(number, 0)} Tr VND`;
  }

  return `${formatVietnamPriceAmount(number)} Tỷ VND`;
}

export function formatSquareMeters(value: unknown, fallback = "100.3 m²") {
  const text = apiText(value, "").trim();
  const number = Number(value);

  if (Number.isFinite(number)) {
    return `${formatVietnamPriceAmount(number)} m²`;
  }

  if (!text) {
    return fallback;
  }

  return `${text.replace(/\s*(m²|m2)$/i, "")} m²`;
}

export function formatUnitPricePerSquareMeter(value: unknown, fallback = "~44.8 tr/m²") {
  const rawText = apiText(value, "").trim();
  const normalizedText = rawText.toLowerCase();
  const number = parsePriceNumber(value);

  if (number === null) {
    if (!rawText) return fallback;
    return rawText.replace(/\s*(\/\s*m²|\/\s*m2)$/i, "/m²");
  }

  if (normalizedText.includes("tỷ") || normalizedText.includes("ty") || normalizedText.includes("billion")) {
    return `${formatVietnamPriceAmount(number)} tỷ/m²`;
  }

  if (
    normalizedText.includes("tr") ||
    normalizedText.includes("triệu") ||
    normalizedText.includes("trieu") ||
    normalizedText.includes("million")
  ) {
    return `${formatVietnamPriceAmount(number)} tr/m²`;
  }

  if (number >= 1_000_000_000) {
    return `${formatVietnamPriceAmount(number / 1_000_000_000)} tỷ/m²`;
  }

  if (number >= 1_000_000) {
    return `${formatVietnamPriceAmount(number / 1_000_000)} tr/m²`;
  }

  if (number >= 100) {
    return `${formatVietnamPriceAmount(number, 0)} tr/m²`;
  }

  return `${formatVietnamPriceAmount(number)} tr/m²`;
}

export function formatTwoDigits(value: number) {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}

export function formatSignedPoints(value: unknown, fallback = "+0") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return `${numeric > 0 ? "+" : ""}${numeric}`;
  }

  const text = String(value).trim();
  return text.startsWith("+") || text.startsWith("-") ? text : `+${text}`;
}

export function formatPercentChange(value: unknown, fallback = "0%") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return `${numeric > 0 ? "+" : ""}${numeric}%`;
  }

  return String(value);
}

export function formatApiDateTime(value: unknown, fallback = "Mới cập nhật") {
  const text = apiText(value, fallback);
  const trimmed = text.trim();

  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return text;
  }

  const hasTime = /[T\s]\d{2}:\d{2}/.test(trimmed);
  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return text;
  }

  const day = formatTwoDigits(parsed.getDate());
  const month = formatTwoDigits(parsed.getMonth() + 1);
  const year = parsed.getFullYear();

  if (!hasTime) {
    return `${day}/${month}/${year}`;
  }

  return `${formatTwoDigits(parsed.getHours())}:${formatTwoDigits(parsed.getMinutes())} - ${day}/${month}/${year}`;
}

export function normalizeRewardRank(value: unknown, fallback = "Chưa xếp hạng") {
  const rank = rewardRankName(value, fallback);
  return `HẠNG: ${rank.toLocaleUpperCase("vi-VN")}`;
}

export function rewardRankName(value: unknown, fallback = "Chưa xếp hạng") {
  const rankValue = typeof value === "object" && value !== null ? (value as ApiObject).label : value;
  return apiText(rankValue, fallback).replace(/^hạng[:\s]*/i, "");
}

export function formatScoreValue(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

export function formatScoreParam(value: unknown, fallback = "0") {
  const number = Number(value);
  return Number.isFinite(number) ? formatScoreValue(number) : fallback;
}

export function formatCertificateDate(value: unknown, fallback = "Đã hoàn thành") {
  const formatted = formatApiDateTime(value, fallback);
  return formatted.includes(" - ") ? formatted.split(" - ").pop() || formatted : formatted;
}

export function formatFileSize(bytes?: number | null) {
  if (!Number.isFinite(bytes ?? NaN)) return null;
  const value = Number(bytes);
  return {
    bytes: value,
    mb: Number((value / (1024 * 1024)).toFixed(2))
  };
}

export function commentInitials(name: unknown) {
  return apiText(name, "NV")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "NV";
}

export function profileValue(value: unknown, fallback = "") {
  const text = apiText(value, fallback).trim();
  return text === "Chưa cập nhật." ? "" : text;
}

export function getPositionLabel(posValue: number | string) {
  const val = Number(posValue);
  if (val === 1) return "Nhân viên";
  if (val === 2) return "Trưởng phòng";
  if (val === 3) return "Giám đốc";
  return "Không xác định";
}

export function leaveHistoryStatusLabel(status: "pending" | "approved" | "rejected") {
  if (status === "approved") return "Đã duyệt";
  if (status === "rejected") return "Từ chối";
  return "Chờ duyệt";
}

export function meetClientStatusText(value: unknown) {
  const rawStatus = apiDisplayText(value, "");
  const status = rawStatus.trim().toLowerCase();
  if (!status) return "";

  if (["completed", "done", "success", "finished", "approved"].includes(status)) {
    return "Hoàn tất";
  }

  if (["pending", "upcoming", "scheduled", "processing"].includes(status)) {
    return "Đang xử lý";
  }

  if (["rejected", "failed", "cancelled", "canceled"].includes(status)) {
    return "Không hợp lệ";
  }

  return rawStatus;
}

export function formatWatchTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}
