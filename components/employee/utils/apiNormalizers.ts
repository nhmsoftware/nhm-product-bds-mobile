export type ApiObject = Record<string, unknown>;

export function isApiObject(value: unknown): value is ApiObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function apiText(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    return fallback;
  }

  const text = String(value);
  return text.trim() === "[object Object]" ? fallback : text;
}

export function avatarInitial(value?: unknown) {
  return apiText(value, "N").trim().slice(0, 1).toUpperCase() || "N";
}

export function apiNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function apiNullableNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function apiBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }

  return fallback;
}

export function apiList(value: unknown): ApiObject[] {
  if (Array.isArray(value)) {
    return value.filter(isApiObject);
  }

  if (!isApiObject(value)) {
    return [];
  }

  const candidates = [
    value.items,
    value.data,
    value.results,
    value.rows,
    value.list,
    value.posts,
    value.news,
    value.areas,
    value.lots,
    value.requests,
    value.departments,
    value.history,
    value.meetings,
    value.site_tours,
    value.siteTours,
    value.tours,
    value.activities,
    value.members,
    value.notifications,
    value.comments,
    value.certificates
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isApiObject);
    }
  }

  return [];
}

export function normalizeExternalUrl(value: unknown) {
  const url = apiText(value, "").trim();

  if (!url) {
    return "";
  }

  if (/^(https?:|geo:|comgooglemaps:)/i.test(url)) {
    return url;
  }

  return `https://${url}`;
}

export function googleMapsUrlFromCoordinates(latitude: unknown, longitude: unknown) {
  const lat = apiNullableNumber(latitude);
  const lng = apiNullableNumber(longitude);

  if (lat === null || lng === null) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function directionUrlFromRecord(record: ApiObject) {
  const directUrl = normalizeExternalUrl(
    record.direction_url ??
      record.directionUrl ??
      record.google_maps_url ??
      record.googleMapsUrl ??
      record.googleMapsLink ??
      record.google_maps_link
  );

  if (directUrl) return directUrl;

  const lat = record.latitude ?? record.lat;
  const lng = record.longitude ?? record.lng ?? record.lon;

  if (lat !== undefined && lng !== undefined) {
    return googleMapsUrlFromCoordinates(lat, lng);
  }

  const locationName = apiText(
    record.area_name ??
      record.areaName ??
      record.area ??
      record.location_name ??
      record.locationName ??
      record.location ??
      record.address,
    ""
  ).trim();

  if (locationName) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`;
  }

  return "";
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

export function apiDisplayText(value: unknown, fallback = ""): string {
  if (Array.isArray(value)) {
    const text = value.map((item) => apiDisplayText(item, "")).filter(Boolean).join(", ");
    return text || fallback;
  }

  if (isApiObject(value)) {
    return apiDisplayText(
      value.name ??
        value.title ??
        value.project_name ??
        value.projectName ??
        value.project ??
        value.area_name ??
        value.areaName ??
        value.area ??
        value.land_area ??
        value.landArea ??
        value.location_name ??
        value.locationName ??
        value.customer_name ??
        value.customerName ??
        value.client_name ??
        value.clientName ??
        value.label ??
        value.value ??
        value.address,
      fallback
    );
  }

  return apiText(value, fallback);
}

export function firstApiDisplayText(values: unknown[], fallback: string): string {
  for (const value of values) {
    const text = apiDisplayText(value, "").trim();

    if (text) {
      return text;
    }
  }

  return fallback;
}
