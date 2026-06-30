import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { VideoView, useVideoPlayer } from "expo-video";
import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator, AppState, Alert, BackHandler, Clipboard, Image, Linking, Modal,
  KeyboardAvoidingView, Platform, Pressable as RNPressable, RefreshControl, ScrollView, Share,
  StyleSheet, Text, TextInput, useWindowDimensions,
  type GestureResponderEvent, type ImageSourcePropType, type LayoutChangeEvent,
  type NativeScrollEvent, type NativeSyntheticEvent, type TextLayoutEventData, View
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { Path, Svg, SvgUri } from "react-native-svg";
import {
  EMPLOYEE_HEADER_HEIGHT, EmployeeAvatarButton, EmployeeBadge, EmployeeButton, EmployeeCard,
  EmployeeInputPreview, EmployeeListRow, EmployeeMetric, EmployeeNotificationButton,
  EmployeePage, EmployeeSectionTitle
} from "@/components/EmployeeUI";
import { employeePalette } from "@/libs/employee-theme";
import { API_URL, STORAGE_KEYS } from "@/libs/env";
import { useI18n } from "@/libs/i18n";
import { appLogger } from "@/libs/logger";
import { mediaSource, mediaUrl } from "@/libs/media";
import { notifyError, notifySuccess } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { ApiRequestError } from "@/libs/api";
import { isBaseEmployeeRole, isDepartmentTransferApproverRole, isExecutiveAdminRole, isManagerAccessRole, isRecruitmentApproverRole } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";
import type { AuthSession, AuthUser } from "@/services/auth/types";
import { employeeApi } from "@/services/employee/api";
import { useNotificationState, useRealtimeEvent, useRealtimeRoom } from "@/services/notifications/provider";
import type { LearningLessonAttachment, LearningLessonDetail, LearningLessonProgressUpdate, MandatoryLearningCourse, MandatoryLearningLesson, MandatoryLearningQuiz } from "@/services/employee/types";
import WebView from "react-native-webview";
import { RichText, Toolbar, DEFAULT_TOOLBAR_ITEMS, useEditorBridge, useBridgeState, ImageBridge, TenTapStartKit } from "@10play/tentap-editor";
import RenderHtml from "react-native-render-html";
import { styles } from "@/components/employee/utils/styles";
import { apiList, apiText, isApiObject } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { formatApiDateTime, formatTwoDigits } from "./utils/formatters";
import { back } from "./utils/navigation";
type PersonalProfileForm = {
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

type MeetClientRecentItem = {
  id: string;
  location: string;
  name: string;
  status?: string;
  time: string;
};

function documentFileExtension(title: string, url?: string) {
  const source = (url || title).split("?")[0]?.split("#")[0] || title;
  return source.split(".").pop()?.trim().toLowerCase() || "";
}

function isImageDocument(extension: string) {
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
}

function safeEmployeeDocumentFileName(title: string, url?: string) {
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

function uniqueEmployeeDocumentFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  const suffix = `${Date.now()}-${Math.round(Math.random() * 10000)}`;

  if (dotIndex <= 0) {
    return `${fileName}-${suffix}`;
  }

  return `${fileName.slice(0, dotIndex)}-${suffix}${fileName.slice(dotIndex)}`;
}

function deleteExistingFile(file: FileSystem.File) {
  const writableFile = file as unknown as { exists?: boolean; delete?: () => void };

  try {
    if (writableFile.exists && writableFile.delete) {
      writableFile.delete();
    }
  } catch {
    // Nếu file không tồn tại hoặc hệ điều hành không cho xóa, cứ để download báo lỗi chi tiết.
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

async function downloadEmployeeDocumentFile(
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

async function saveEmployeeDocumentToDevice(url: string, title: string) {
  const fileName = safeEmployeeDocumentFileName(title, url);
  const file = await downloadEmployeeDocumentFile(url, title, "cache", { unique: true });

  await Share.share({
    title: fileName,
    url: file.uri,
    message: fileName
  });

  return fileName;
}

const employeeDocumentMaxBytes = 10 * 1024 * 1024;
const employeeAvatarMaxBytes = 5 * 1024 * 1024;
const employeeDocumentMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png"
];

function employeeDocumentMimeType(fileName: string, mimeType?: string | null) {
  if (mimeType) return mimeType;

  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";

  return "application/octet-stream";
}

const emptyPersonalProfileForm: PersonalProfileForm = {
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
function hasApprovedEmployeeProfile(user?: AuthUser | null) {
  if (!user || !isBaseEmployeeRole(user.role)) {
    return true;
  }

  return Boolean(user.isActive && user.jobPosition?.trim());
}

function employeeApplicationStatusText(user?: AuthUser | null) {
  if (!user?.isActive) {
    return "Hồ sơ ứng tuyển đang chờ quản trị viên duyệt.";
  }

  return "Chưa có chức danh nhân sự. Vui lòng gửi hồ sơ ứng tuyển để quản trị viên xét duyệt.";
}
function profileValue(value: unknown, fallback = "") {
  const text = apiText(value, fallback).trim();
  return text === "Chưa cập nhật." ? "" : text;
}

function parsePersonalDate(value: unknown) {
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

function formatPersonalDateValue(date: Date) {
  return `${date.getFullYear()}-${formatTwoDigits(date.getMonth() + 1)}-${formatTwoDigits(date.getDate())}`;
}

function normalizePersonalDate(value: unknown) {
  const parsed = parsePersonalDate(value);
  return parsed ? formatPersonalDateValue(parsed) : profileValue(value);
}

function formatPersonalDateDisplay(value: unknown) {
  const parsed = parsePersonalDate(value);
  if (!parsed) {
    return profileValue(value);
  }

  return `${formatTwoDigits(parsed.getDate())}/${formatTwoDigits(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
}

function personalCalendarCells(month: Date) {
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

function personalFormFromProfile(profile: ApiObject, user: AuthUser | undefined): PersonalProfileForm {
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

function personalAttachments(profile: ApiObject): ApiObject[] {
  const attachments = isApiObject(profile.attachments) ? profile.attachments : {};
  return apiList(attachments.list);
}

export function DocumentViewerScreen() {
  const params = useLocalSearchParams<{ title?: string; url?: string }>();
  const rawTitle = Array.isArray(params.title) ? params.title[0] : params.title;
  const rawUrl = Array.isArray(params.url) ? params.url[0] : params.url;
  const title = apiText(rawTitle, "Tài liệu");
  const documentUrl = mediaUrl(rawUrl);
  const extension = documentFileExtension(title, documentUrl);
  const imageDocument = isImageDocument(extension);
  const [localDocumentUri, setLocalDocumentUri] = useState("");
  const [viewerLoading, setViewerLoading] = useState(Boolean(documentUrl));
  const [viewerFailed, setViewerFailed] = useState(false);
  const [downloadingDocument, setDownloadingDocument] = useState(false);

  useEffect(() => {
    if (!documentUrl) {
      setLocalDocumentUri("");
      setViewerLoading(false);
      setViewerFailed(false);
      return undefined;
    }

    let mounted = true;
    setViewerLoading(true);
    setViewerFailed(false);
    setLocalDocumentUri("");

    downloadEmployeeDocumentFile(documentUrl, title, "cache", { unique: true })
      .then((file) => {
        if (mounted) {
          setLocalDocumentUri(file.uri);
        }
      })
      .catch((error) => {
        if (mounted) {
          setViewerFailed(true);
          appLogger.warn("employee.profile.document.preview", "Không thể tải tài liệu để xem trong ứng dụng.", { title, url: documentUrl, error });
        }
      })
      .finally(() => {
        if (mounted) {
          setViewerLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [documentUrl, title]);

  async function downloadDocument() {
    if (!documentUrl) {
      notifyError("Tài liệu này chưa có đường dẫn để tải về.");
      return;
    }

    setDownloadingDocument(true);
    try {
      const fileName = await saveEmployeeDocumentToDevice(documentUrl, title);
      notifySuccess({ message: `Đã chuẩn bị tài liệu: ${fileName}. Chọn "Lưu vào Tệp" để lưu về máy.` });
    } catch (error) {
      appLogger.warn("employee.profile.document.download", "Không thể tải tài liệu nhân sự.", { title, url: documentUrl, error });
      notifyError(error, "Không thể tải tài liệu này.");
    } finally {
      setDownloadingDocument(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.documentViewerSafe}>
      <View style={styles.documentViewerHeader}>
        <Pressable accessibilityRole="button" onPress={() => back()} style={styles.documentViewerHeaderButton}>
          <Ionicons name="arrow-back" size={22} color={employeePalette.text} />
        </Pressable>
        <Text numberOfLines={1} style={styles.documentViewerTitle}>{title}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!documentUrl || downloadingDocument}
          onPress={downloadDocument}
          style={({ pressed }) => [styles.documentViewerHeaderButton, pressed && styles.pressed]}
        >
          <Ionicons name={downloadingDocument ? "hourglass-outline" : "download-outline"} size={21} color={documentUrl ? employeePalette.text : "#b8aaa8"} />
        </Pressable>
      </View>

      <View style={styles.documentViewerBody}>
        {!documentUrl ? (
          <Text style={styles.documentViewerMessage}>Tài liệu này chưa có đường dẫn để mở.</Text>
        ) : viewerLoading ? (
          <Text style={styles.documentViewerMessage}>Đang tải tài liệu...</Text>
        ) : viewerFailed || !localDocumentUri ? (
          <Text style={styles.documentViewerMessage}>Không thể tải tài liệu để xem. Vui lòng kiểm tra quyền truy cập hoặc cấu hình storage.</Text>
        ) : imageDocument ? (
          <Image source={{ uri: localDocumentUri }} style={styles.documentViewerImage} resizeMode="contain" />
        ) : (
          <WebView
            originWhitelist={["*"]}
            source={{ uri: localDocumentUri }}
            style={styles.documentViewerWebView}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function meetClientStatusText(value: unknown) {
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

function apiDisplayText(value: unknown, fallback = ""): string {
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

function firstApiDisplayText(values: unknown[], fallback: string): string {
  for (const value of values) {
    const text = apiDisplayText(value, "").trim();

    if (text) {
      return text;
    }
  }

  return fallback;
}

type SiteTourHistoryItem = {
  completed: boolean;
  customer: string;
  id: string;
  statusLabel: string;
  time: string;
  title: string;
};

function mapSiteTourHistory(item: ApiObject, index: number): SiteTourHistoryItem {
  const project = firstApiDisplayText(
    [
      item.project_name,
      item.projectName,
      item.project,
      item.area_name,
      item.areaName,
      item.area,
      item.land_area,
      item.landArea,
      item.location
    ],
    "Khu đất"
  );
  const unitCode = firstApiDisplayText(
    [item.unit_code, item.unitCode, item.lot_code, item.lotCode, item.apartment_code, item.apartmentCode],
    ""
  );
  const customerName = firstApiDisplayText(
    [item.customer_name, item.customerName, item.client_name, item.clientName, item.customer, item.client],
    "Khách hàng"
  );
  const rawStatus = apiDisplayText(item.status_label ?? item.status ?? item.state, "");
  const normalizedStatus = rawStatus.trim().toLowerCase();
  const completed = ["completed", "done", "success", "finished", "approved", "hoàn tất", "thành công"].some((status) =>
    normalizedStatus.includes(status)
  );

  return {
    completed,
    customer: `Khách: ${customerName}`,
    id: apiText(item.id ?? item.uuid, `site-tour-${index}`),
    statusLabel: completed ? "HOÀN THÀNH" : rawStatus ? rawStatus.toUpperCase() : "ĐÃ GHI NHẬN",
    time: formatApiDateTime(item.check_in_at ?? item.checkInAt ?? item.created_at ?? item.createdAt ?? item.time),
    title: unitCode ? `${project} - ${unitCode}` : project
  };
}

function mapMeetClientRecent(item: ApiObject, index: number): MeetClientRecentItem {
  const customerName = firstApiDisplayText([
    item.customer_name,
    item.customerName,
    item.client_name,
    item.clientName,
    item.customer,
    item.client,
    item.name
  ], "Khách hàng");
  const project = firstApiDisplayText([
    item.project_name,
    item.projectName,
    item.project,
    item.area,
    item.land_area,
    item.landArea,
    item.location,
    item.address
  ], "Khu đất");
  const time = formatApiDateTime(
    item.check_in_at ?? item.checkInAt ?? item.meeting_at ?? item.created_at ?? item.time
  );
  const status = meetClientStatusText(item.status_label ?? item.status);

  return {
    id: apiText(item.id, `meeting-${index}`),
    location: project,
    name: customerName,
    status: status || undefined,
    time
  };
}

