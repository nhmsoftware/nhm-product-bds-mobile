import { mediaUrl } from "@/libs/media";
import type { ApiObject } from "./apiNormalizers";
import { apiText, apiBoolean, apiNullableNumber, isApiObject } from "./apiNormalizers";
import { formatVietnamPriceAmount, parsePriceNumber } from "./formatters";

export type InventoryLotStatus = "available" | "held" | "sold" | "unavailable";

export function normalizeInventoryLotStatus(value: unknown): InventoryLotStatus {
  if (typeof value === "number") {
    if (value === 2) return "sold";
    if (value === 3) return "held";
    if (value === 4) return "unavailable";
    return "available";
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return normalizeInventoryLotStatus(Number(value));
  }

  const status = apiText(value, "available").trim().toLowerCase();

  if (
    status.includes("sold") ||
    status.includes("đã bán") ||
    status.includes("da ban") ||
    status.includes("ban")
  ) {
    return "sold";
  }

  if (
    status.includes("held") ||
    status.includes("hold") ||
    status.includes("reserved") ||
    status.includes("giữ") ||
    status.includes("giu") ||
    status.includes("cọc") ||
    status.includes("coc")
  ) {
    return "held";
  }

  if (
    status.includes("unavailable") ||
    status.includes("disabled") ||
    status.includes("not_sale") ||
    status.includes("not sale") ||
    status.includes("không bán") ||
    status.includes("khong ban")
  ) {
    return "unavailable";
  }

  return "available";
}

export function inventoryLotStatusLabel(status: InventoryLotStatus, isLocked?: unknown) {
  if (apiBoolean(isLocked)) return "ĐÃ KHÓA";
  if (status === "sold") return "ĐÃ BÁN";
  if (status === "held") return "ĐANG GIỮ CHỖ";
  if (status === "unavailable") return "KHÔNG KHẢ DỤNG";
  return "ĐANG MỞ BÁN";
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

  return `${formatVietnamPriceAmount(number)} tr/m²`;
}

export function inventoryLotCode(item: ApiObject, fallback: string) {
  return apiText(
    item.code ??
      item.name ??
      item.title ??
      item.lot_code ??
      item.lotCode ??
      item.unit_code ??
      item.unitCode ??
      item.apartment_code ??
      item.apartmentCode,
    fallback
  );
}

export function inventoryLotStatus(item: ApiObject, fallback?: unknown): InventoryLotStatus {
  const status = normalizeInventoryLotStatus(
    item.status ??
      item.state ??
      item.availability ??
      item.sale_status ??
      item.saleStatus ??
      fallback
  );

  if (status === "sold" || status === "unavailable") {
    return status;
  }

  if (apiBoolean(item.is_locked ?? item.isLocked ?? item.locked ?? item.is_reserved ?? item.isReserved)) {
    return "held";
  }

  return status;
}

export function inventoryLotOrder(item: ApiObject) {
  return apiNullableNumber(
    item.display_order ??
      item.displayOrder ??
      item.sort_order ??
      item.sortOrder ??
      item.order ??
      item.position ??
      item.lot_number ??
      item.lotNumber
  );
}

export function compareInventoryLots(left: ApiObject, right: ApiObject) {
  const leftOrder = inventoryLotOrder(left);
  const rightOrder = inventoryLotOrder(right);

  if (leftOrder !== null && rightOrder !== null && leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  const codeCompare = inventoryLotCode(left, "").localeCompare(inventoryLotCode(right, ""), "vi", {
    numeric: true,
    sensitivity: "base"
  });

  if (codeCompare !== 0) {
    return codeCompare;
  }

  const leftY = apiNullableNumber(left.coordinate_y ?? left.coordinateY ?? left.y);
  const rightY = apiNullableNumber(right.coordinate_y ?? right.coordinateY ?? right.y);

  if (leftY !== null && rightY !== null && leftY !== rightY) {
    return leftY - rightY;
  }

  const leftX = apiNullableNumber(left.coordinate_x ?? left.coordinateX ?? left.x);
  const rightX = apiNullableNumber(right.coordinate_x ?? right.coordinateX ?? right.x);

  if (leftX !== null && rightX !== null && leftX !== rightX) {
    return leftX - rightX;
  }

  return 0;
}

export function sortInventoryLots(lots: ApiObject[]) {
  return [...lots].sort(compareInventoryLots);
}

export function imageUrisFromApiValue(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => item.trim());
        }
      } catch {
        return [trimmed];
      }
    }

    return trimmed.includes(",")
      ? trimmed.split(",").map((s) => s.trim()).filter(Boolean)
      : [trimmed];
  }

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim());
  }

  return [];
}

export function lotImageUris(lot: ApiObject) {
  const primaryImage = mediaUrl(lot.image_url ?? lot.imageUrl);
  const images = imageUrisFromApiValue(lot.images);
  const allImages = primaryImage ? [primaryImage, ...images] : images;

  if (allImages.length > 0) {
    return allImages;
  }

  return [mediaUrl("") || ""].filter(Boolean);
}
