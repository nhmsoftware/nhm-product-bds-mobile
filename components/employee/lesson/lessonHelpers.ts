import { apiNumber, apiText } from "../utils/apiNormalizers";
import { isApiObject } from "../utils/apiNormalizers";
import type { LearningLessonAttachment } from "@/services/employee/types";
import type { LessonCourseQuizStatus } from "../utils/sharedHelpers";

export function htmlToPlainText(content: string) {
  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatWatchTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function lessonCourseQuizStatusFromLabel(value: unknown): LessonCourseQuizStatus | null {
  const label = apiText(value, "").trim().toLocaleLowerCase("vi-VN");

  if (!label) return null;
  if (label.includes("xem lại")) return "completed";
  if (label.includes("chưa đạt")) return "failed";
  if (label.includes("đang chấm")) return "grading";
  if (label.includes("làm bài kiểm tra")) return "available";

  return null;
}

export function attachmentTitle(attachment: LearningLessonAttachment) {
  return attachment.title || attachment.name || attachment.file_name || attachment.fileName || "Tài liệu bài học";
}

export function attachmentSize(attachment: LearningLessonAttachment) {
  return attachment.size || attachment.file_size || attachment.fileSize || "Tài liệu đính kèm";
}

export function attachmentType(attachment: LearningLessonAttachment): "pdf" | "doc" {
  const value = `${attachmentTitle(attachment)} ${attachment.mime_type || attachment.mimeType || attachment.type || ""}`;
  return value.toLowerCase().includes("pdf") ? "pdf" : "doc";
}

export function normalizeQuizOptions(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((option, index) => {
      if (isApiObject(option)) {
        return {
          label: apiText(option.label ?? option.text ?? option.title ?? option.name, ""),
          value: apiNumber(option.value ?? option.id ?? index, index)
        };
      }

      return {
        label: apiText(option, ""),
        value: index
      };
    }).filter((option) => option.label);
  }

  if (isApiObject(value)) {
    return Object.entries(value)
      .map(([key, label], index) => ({
        label: apiText(label, ""),
        value: apiNumber(key, index)
      }))
      .filter((option) => option.label)
      .sort((a, b) => a.value - b.value);
  }

  return [];
}
