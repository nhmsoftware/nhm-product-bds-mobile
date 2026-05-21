export function formatMoney(value?: number | string | null) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2
  }).format(Number.isFinite(number) ? number : 0);
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function validationMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Đã xảy ra lỗi.";
}
