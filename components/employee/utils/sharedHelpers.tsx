import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Share } from "react-native";
import { Path, Svg } from "react-native-svg";
import { employeeApi } from "@/services/employee/api";
import { STORAGE_KEYS } from "@/libs/env";
import { appLogger } from "@/libs/logger";
import { isManagerAccessRole } from "@/services/auth/roles";
import type { AuthUser } from "@/services/auth/types";
import type { AuthSession } from "@/services/auth/types";
import { apiText, apiBoolean, apiList, apiNullableNumber, apiNumber, isApiObject, type ApiObject } from "./apiNormalizers";
import { formatTwoDigits, formatApiDateTime, formatCertificateDate, formatFileSize, profileValue } from "./formatters";
import { certificateFallbackImages, NEWS_IMAGE_EXTENSIONS } from "./constants";

export type CertificateCardItem = {
  id: string;
  image: import("react-native").ImageSourcePropType;
  issuedAt: string;
  provider: string;
  status: string;
  title: string;
};

export type ProfileQuizScoreItem = {
  badge: string;
  date: string;
  score: string;
  title: string;
  tone: "red" | "gold";
};

export type LearningCertificateData = {
  certificates: CertificateCardItem[];
  quizRows: ProfileQuizScoreItem[];
};

export type PersonalProfileForm = {
  address: string;
  avatar: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  cccd: string;
  dob: string;
  education: string;
  email: string;
  employee_title: string;
  experience: string;
  major: string;
  name: string;
  phone: string;
};

export function AvatarEditPencilIcon() {
  return (
    <Svg width={10.5} height={10.5} viewBox="0 0 10.5 10.5" fill="none">
      <Path
        d="M1.16667 9.33333H1.99792L7.7 3.63125L6.86875 2.8L1.16667 8.50208V9.33333V9.33333M0 10.5V8.02083L7.7 0.335417C7.81667 0.228472 7.94549 0.145833 8.08646 0.0875C8.22743 0.0291667 8.37569 0 8.53125 0C8.68681 0 8.8375 0.0291667 8.98333 0.0875C9.12917 0.145833 9.25556 0.233333 9.3625 0.35L10.1646 1.16667C10.2812 1.27361 10.3663 1.4 10.4198 1.54583C10.4733 1.69167 10.5 1.8375 10.5 1.98333C10.5 2.13889 10.4733 2.28715 10.4198 2.42812C10.3663 2.5691 10.2812 2.69792 10.1646 2.81458L2.47917 10.5H0V10.5M9.33333 1.98333V1.98333L8.51667 1.16667V1.16667L9.33333 1.98333V1.98333M7.27708 3.22292L6.86875 2.8V2.8L7.7 3.63125V3.63125L7.27708 3.22292V3.22292"
        fill="#ffffff"
      />
    </Svg>
  );
}

export function canCreateInternalNews(user?: AuthUser | null) {
  const role = typeof user?.role === "string" ? user.role.toLowerCase() : user?.role;

  if (role === "manager" || role === "2" || role === 2) {
    return Boolean(apiText(user?.department, "").trim());
  }

  if (role === "director" || role === "3" || role === 3) {
    return Boolean(apiText(user?.department, "").trim());
  }

  return isManagerAccessRole(user?.role);
}

export function formatLessonDuration(seconds: number) {
  return `${Math.ceil(seconds / 60)} Phút`;
}

export function learningCourseFromPayload(value: unknown): ApiObject | null {
  if (!isApiObject(value)) return null;
  const course = value.course;
  return isApiObject(course) ? course : null;
}

export function isLearningCourseCompleted(course: ApiObject | null) {
  if (!course) return false;
  const progress = isApiObject(course.progress) ? course.progress : {};
  const status = apiText(progress.status ?? course.status, "").toLowerCase();
  return status === "completed";
}

export function certificateFromCourse(course: ApiObject, certificate: ApiObject | null, index = 0): CertificateCardItem {
  const completedAt = certificate?.completed_at ?? certificate?.completedAt ?? course.completed_at ?? course.completedAt;
  const code = apiText(certificate?.certificate_code ?? certificate?.certificateCode ?? course.id, `certificate-${index}`);

  return {
    id: code,
    image: certificateFallbackImages[index % certificateFallbackImages.length],
    issuedAt: formatCertificateDate(completedAt),
    provider: apiText(certificate?.provider ?? certificate?.issuer, "NHM Academy"),
    status: "verified",
    title: apiText(certificate?.course_title ?? certificate?.courseTitle ?? course.title ?? course.name, "Chứng chỉ hoàn thành khóa học")
  };
}

export function quizScoreRowsFromCourse(course: ApiObject | null): ProfileQuizScoreItem[] {
  if (!course) return [];
  const quiz = isApiObject(course.quiz) ? course.quiz : {};
  const score = apiNullableNumber(quiz.lastScore ?? quiz.last_score ?? quiz.score);
  const status = apiText(quiz.status, "").toLowerCase();
  const isPassed = apiBoolean(quiz.isPassed ?? quiz.is_passed, status === "passed" || status === "completed");

  if (score === null && !isPassed) return [];

  const scoreValue = score ?? apiNumber(quiz.passingScore ?? quiz.passing_score, 0);

  return [{
    badge: isPassed ? "ĐẠT" : "CHƯA ĐẠT",
    date: "Gần nhất",
    score: String(Math.round(scoreValue * 10) / 10),
    title: apiText(course.title ?? course.name, "Bài kiểm tra khóa học"),
    tone: isPassed ? "red" : "gold"
  }];
}

export async function loadLearningCertificateData(): Promise<{ data: LearningCertificateData }> {
  const coursesResponse = await employeeApi.courses();
  const payload: ApiObject = isApiObject(coursesResponse.data) ? coursesResponse.data : {};
  const courses = apiList(payload.courses);
  const fallbackCourse = learningCourseFromPayload(coursesResponse.data);
  const courseRows = courses.length > 0 ? courses : fallbackCourse ? [fallbackCourse] : [];
  const quizRows = courseRows.flatMap((course) => quizScoreRowsFromCourse(course));
  const completedCourses = courseRows.filter(isLearningCourseCompleted);

  if (completedCourses.length === 0) {
    return { data: { certificates: [], quizRows } };
  }

  const certificates = await Promise.all(completedCourses.map(async (course, index) => {
    const courseId = apiText(course.id, "");
    const certificateResponse = courseId ? await employeeApi.courseCertificate(courseId).catch(() => null) : null;
    const certificate = isApiObject(certificateResponse?.data) ? certificateResponse.data : null;

    return certificateFromCourse(course, certificate, index);
  }));

  return {
    data: {
      certificates,
      quizRows
    }
  };
}

export function openQuizResultScreen(courseId: string, result: ApiObject) {
  const details = apiList(result.details);
  const status = apiText(result.status, "");
  const needsManualReview =
    status === "grading" ||
    status === "pending_review" ||
    status === "pending";

  const quizResult = {
    courseId,
    score: result.score,
    totalQuestions: result.totalQuestions ?? result.total_questions,
    correctAnswers: result.correctAnswers ?? result.correct_answers,
    passed: result.passed,
    status,
    needsManualReview,
    details
  };

  // Navigation is done inline in the calling component
  return quizResult;
}

export async function logImageUploadAsset(scope: string, photo: ImagePicker.ImagePickerAsset) {
  let fileSystemSize: number | null = null;

  try {
    const info = await FileSystem.getInfoAsync(photo.uri);
    fileSystemSize = info.exists && typeof info.size === "number" ? info.size : null;
  } catch (error) {
    appLogger.warn(scope, "Không thể đọc dung lượng ảnh từ file system.", { error, uri: photo.uri });
  }

  appLogger.info(scope, "Thông tin ảnh chuẩn bị upload.", {
    fileName: photo.fileName,
    fileSystemSize: formatFileSize(fileSystemSize),
    height: photo.height,
    mimeType: photo.mimeType,
    pickerFileSize: formatFileSize(photo.fileSize),
    uri: photo.uri,
    width: photo.width
  });
}

export function resolveNewsImageAsset(photo: ImagePicker.ImagePickerAsset): { uri: string; name: string; type: string } {
  const uri = photo.uri;
  const fileName = photo.fileName || `image-${Date.now()}.jpg`;
  let mimeType = photo.mimeType;

  if (!mimeType) {
    const dotIndex = fileName.lastIndexOf(".");
    const ext = dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
    mimeType = NEWS_IMAGE_EXTENSIONS[ext] || "image/jpeg";
  }

  return { name: fileName, type: mimeType, uri };
}

export function documentFileExtension(title: string, url?: string) {
  const source = (url || title).split("?")[0]?.split("#")[0] || title;
  return source.split(".").pop()?.trim().toLowerCase() || "";
}

export function isImageDocument(extension: string) {
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
}

export function safeEmployeeDocumentFileName(title: string, url?: string) {
  const urlPath = url?.split("?")[0]?.split("#")[0] ?? "";
  const urlName = urlPath.split("/").pop() || "";
  let decodedUrlName = urlName;

  try {
    decodedUrlName = decodeURIComponent(urlName);
  } catch {
    decodedUrlName = urlName;
  }

  const rawName = title.includes(".") ? title : decodedUrlName || title;
  const cleaned = rawName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
  const extension = documentFileExtension(cleaned, url);

  if (!cleaned) return `tai-lieu-${Date.now()}`;
  if (cleaned.includes(".") || !extension) return cleaned;
  return `${cleaned}.${extension}`;
}

export function uniqueEmployeeDocumentFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  const suffix = `${Date.now()}-${Math.round(Math.random() * 10000)}`;

  if (dotIndex <= 0) {
    return `${fileName}-${suffix}`;
  }

  return `${fileName.slice(0, dotIndex)}-${suffix}${fileName.slice(dotIndex)}`;
}

export function deleteExistingFile(file: FileSystem.File) {
  const writableFile = file as unknown as { exists?: boolean; delete?: () => void };

  try {
    if (writableFile.exists && writableFile.delete) {
      writableFile.delete();
    }
  } catch {
    // File may not exist or OS denies deletion
  }
}

async function employeeDocumentDownloadHeaders() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.auth);
  if (!raw) return undefined;

  try {
    const session = JSON.parse(raw) as AuthSession;
    return session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
  } catch {
    return undefined;
  }
}

export async function downloadEmployeeDocumentFile(
  url: string,
  title: string,
  destination: "cache" | "document",
  options: { unique?: boolean } = {}
) {
  const baseFileName = safeEmployeeDocumentFileName(title, url);
  const fileName = options.unique ? uniqueEmployeeDocumentFileName(baseFileName) : baseFileName;
  const directory = destination === "document" ? FileSystem.Paths.document : FileSystem.Paths.cache;
  const target = new FileSystem.File(directory, fileName);
  const headers = await employeeDocumentDownloadHeaders();

  deleteExistingFile(target);

  return FileSystem.File.downloadFileAsync(url, target, {
    headers,
    idempotent: true
  });
}

export async function saveEmployeeDocumentToDevice(url: string, title: string) {
  const fileName = safeEmployeeDocumentFileName(title, url);
  const file = await downloadEmployeeDocumentFile(url, title, "cache", { unique: true });

  await Share.share({
    title: fileName,
    url: file.uri,
    message: fileName
  });

  return fileName;
}

export function hasApprovedEmployeeProfile(user?: AuthUser | null) {
  if (!user || !isBaseEmployeeRole(user.role)) {
    return true;
  }

  return Boolean(user.isActive && user.jobPosition?.trim());
}

export function employeeApplicationStatusText(user?: AuthUser | null) {
  if (!user?.isActive) {
    return "Hồ sơ ứng tuyển đang chờ quản trị viên duyệt.";
  }

  return "Chưa có chức danh nhân sự. Vui lòng gửi hồ sơ ứng tuyển để quản trị viên xét duyệt.";
}

export function parsePersonalDate(value: unknown) {
  const text = profileValue(value);
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const viMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (viMatch) {
    return new Date(Number(viMatch[3]), Number(viMatch[2]) - 1, Number(viMatch[1]));
  }

  return null;
}

export function formatPersonalDateValue(date: Date) {
  return `${date.getFullYear()}-${formatTwoDigits(date.getMonth() + 1)}-${formatTwoDigits(date.getDate())}`;
}

export function normalizePersonalDate(value: unknown) {
  const parsed = parsePersonalDate(value);
  return parsed ? formatPersonalDateValue(parsed) : profileValue(value);
}

export function formatPersonalDateDisplay(value: unknown) {
  const parsed = parsePersonalDate(value);
  if (!parsed) {
    return profileValue(value);
  }

  return `${formatTwoDigits(parsed.getDate())}/${formatTwoDigits(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
}

export function personalCalendarCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export const emptyPersonalProfileForm: PersonalProfileForm = {
  address: "",
  avatar: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_name: "",
  cccd: "",
  dob: "",
  education: "",
  email: "",
  employee_title: "",
  experience: "",
  major: "",
  name: "",
  phone: ""
};

export function personalFormFromProfile(profile: ApiObject, user: AuthUser | undefined): PersonalProfileForm {
  const profileUser = isApiObject(profile.user) ? profile.user : {};
  const details = isApiObject(profile.employee_details) ? profile.employee_details : {};
  const bank = isApiObject(profile.bank_info) ? profile.bank_info : {};
  const education = isApiObject(profile.education_experience) ? profile.education_experience : {};

  return {
    address: profileValue(profileUser.address ?? user?.address),
    avatar: profileValue(profileUser.avatar ?? user?.avatar),
    bank_account_name: profileValue(bank.bank_account_name),
    bank_account_number: profileValue(bank.bank_account_number),
    bank_name: profileValue(bank.bank_name),
    cccd: profileValue(profileUser.cccd ?? details.identity_card ?? user?.cccd),
    dob: normalizePersonalDate(details.dob),
    education: profileValue(education.education),
    email: profileValue(profileUser.email ?? user?.email),
    employee_title: profileValue(details.employee_title ?? user?.jobPosition),
    experience: profileValue(education.experience),
    major: profileValue(education.major),
    name: profileValue(profileUser.name ?? user?.fullName),
    phone: profileValue(profileUser.phone ?? user?.phone)
  };
}

export function personalAttachments(profile: ApiObject): ApiObject[] {
  const attachments = isApiObject(profile.attachments) ? profile.attachments : {};
  return apiList(attachments.list);
}

// Re-export isBaseEmployeeRole for hasApprovedEmployeeProfile
import { isBaseEmployeeRole } from "@/services/auth/roles";

export type LessonCourseQuizStatus = "unknown" | "available" | "locked" | "none" | "grading" | "passed" | "failed" | "completed" | "in_progress";

export function normalizeLessonCourseQuizStatus(value: unknown): LessonCourseQuizStatus {
  const status = apiText(value, "").trim().toLowerCase();

  if (!status) return "available";
  if (["passed", "pass", "success", "done", "completed", "complete"].includes(status)) return "passed";
  if (["failed", "fail", "not_passed", "not passed", "chua_dat", "chưa đạt"].includes(status)) return "failed";
  if (["grading", "pending", "pending_review", "manual_review", "reviewing", "submitted", "waiting_review"].includes(status)) {
    return "grading";
  }
  if (["in_progress", "draft", "started", "doing"].includes(status)) return "in_progress";
  if (["locked", "forbidden"].includes(status)) return "locked";
  if (["none", "not_available", "unavailable", "no_quiz"].includes(status)) return "none";

  return "available";
}

export function quizResultStatus(result: ApiObject): LessonCourseQuizStatus {
  const details = apiList(result.details);
  const status = normalizeLessonCourseQuizStatus(result.status);

  if (status === "grading" || details.some((item) => item.is_correct === null || item.is_correct === undefined)) {
    return "grading";
  }

  if (status === "passed" || status === "failed") {
    return status;
  }

  if (result.is_passed !== undefined || result.isPassed !== undefined) {
    return apiBoolean(result.is_passed ?? result.isPassed) ? "passed" : "failed";
  }

  if (result.score !== undefined || details.length > 0) {
    return "completed";
  }

  return status;
}

// Re-export for convenience
export type { AuthUser };
