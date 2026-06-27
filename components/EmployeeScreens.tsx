import {
  Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { VideoView,
  useVideoPlayer } from "expo-video";
import { router,
  useFocusEffect,
  useLocalSearchParams,
  type Href } from "expo-router";
import { useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode } from "react";
import {
  ActivityIndicator,
  AppState,
  Alert,
  BackHandler,
  Clipboard,
  Image,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable as RNPressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  type GestureResponderEvent,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
  View
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { Path, Svg, SvgUri } from "react-native-svg";

import {
  EMPLOYEE_HEADER_HEIGHT,
  EmployeeAvatarButton,
  EmployeeBadge,
  EmployeeButton,
  EmployeeCard,
  EmployeeInputPreview,
  EmployeeListRow,
  EmployeeMetric,
  EmployeeNotificationButton,
  EmployeePage,
  EmployeeSectionTitle
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
import type {
  LearningLessonAttachment,
  LearningLessonDetail,
  LearningLessonProgressUpdate,
  MandatoryLearningCourse,
  MandatoryLearningLesson,
  MandatoryLearningQuiz
} from "@/services/employee/types";
import WebView from "react-native-webview";
import { RichText, Toolbar, DEFAULT_TOOLBAR_ITEMS, useEditorBridge, useBridgeState, ImageBridge, TenTapStartKit } from "@10play/tentap-editor";
import RenderHtml from "react-native-render-html";

const learningImages = {
  legal: require("@/assets/images/learning/project-legal.png"),
  market: require("@/assets/images/learning/market-analysis.png"),
  negotiation: require("@/assets/images/learning/negotiation.png"),
  requiredHero: require("@/assets/images/learning/required-course-hero.png"),
  lessonVideo: require("@/assets/images/learning/lesson-video-thumbnail.png"),
  planningQuizMap: require("@/assets/images/learning/planning-quiz-map.png"),
  resultQuestion1: require("@/assets/images/learning/result-question-1.png"),
  resultQuestion2: require("@/assets/images/learning/result-question-2.png")
};

const imageNotFound = require("@/assets/images/placeholders/image_not_found.png");

const inventoryImages = {
  mapOverview: imageNotFound,
  lotHero: imageNotFound,
  planningArea: imageNotFound,
  staffProfile: require("@/assets/images/inventory/staff-profile.png"),
  zoneA: imageNotFound,
  zoneB: imageNotFound
};

const inventoryLotGridColumns = 7;
const inventoryLotGridHorizontalPadding = 18;
const inventoryLotCellSize = 40;

const profileImages = {
  headshot: require("@/assets/images/profile/employee-headshot.png"),
  certificateGold: require("@/assets/images/profile/certificate-bg-gold.png"),
  verifiedBadge: require("@/assets/images/profile/verified-badge.png"),
  personalAvatar: require("@/assets/images/employee/profile/personal-avatar.png")
};

const certificateImages = {
  realEstate: require("@/assets/images/profile/certificates/certificate-real-estate.png"),
  operations: require("@/assets/images/profile/certificates/certificate-operations.png"),
  digitalMarketing: require("@/assets/images/profile/certificates/certificate-digital-marketing.png"),
  negotiation: require("@/assets/images/profile/certificates/certificate-negotiation.png")
};

const showingImages = {
  gps: require("@/assets/images/showing/gps-icon.png"),
  chevronDown: require("@/assets/images/showing/chevron-down-icon.png"),
  camera: require("@/assets/images/showing/camera-icon.png"),
  play: require("@/assets/images/showing/play-icon.png"),
  timelineCheck: require("@/assets/images/showing/timeline-check-icon.png"),
  timelineHistory: require("@/assets/images/showing/timeline-history-icon.png")
};

const meetClientImages = {
  person: require("@/assets/images/meet-client/person-icon.png"),
  phone: require("@/assets/images/meet-client/phone-icon.png"),
  project: require("@/assets/images/meet-client/project-icon.png"),
  dropdown: require("@/assets/images/meet-client/dropdown-icon.png"),
  cameraEmpty: require("@/assets/images/meet-client/camera-empty-icon.png"),
  cameraButton: require("@/assets/images/meet-client/camera-button-icon.png"),
  historyForward: require("@/assets/images/meet-client/history-forward-icon.png"),
  time: require("@/assets/images/meet-client/time-icon.png"),
  location: require("@/assets/images/meet-client/location-icon.png"),
  recentClientA: require("@/assets/images/meet-client/recent-client-a.png"),
  recentClientB: require("@/assets/images/meet-client/recent-client-b.png")
};

type ApiObject = Record<string, unknown>;

type CertificateCardItem = {
  id: string;
  image: ImageSourcePropType;
  issuedAt: string;
  provider: string;
  status: "verified" | "new" | "pending";
  title: string;
};

type CertificateFilterValue = "all" | "verified" | "pending" | "new";

const certificateFilterOptions: Array<{ label: string; value: CertificateFilterValue }> = [
  { label: "Tất cả", value: "all" },
  { label: "Đã xác thực", value: "verified" },
  { label: "Chờ duyệt", value: "pending" },
  { label: "Mới", value: "new" }
];

type LearningCertificateData = {
  certificates: CertificateCardItem[];
  quizRows: ProfileQuizScoreItem[];
};

type ProfileQuizScoreItem = {
  badge: string;
  date: string;
  score: string;
  title: string;
  tone: "red" | "gold";
};

function isApiObject(value: unknown): value is ApiObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function apiText(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    return fallback;
  }

  const text = String(value);
  return text.trim() === "[object Object]" ? fallback : text;
}

function avatarInitial(value?: unknown) {
  return apiText(value, "N").trim().slice(0, 1).toUpperCase() || "N";
}

function AvatarEditPencilIcon() {
  return (
    <Svg width={10.5} height={10.5} viewBox="0 0 10.5 10.5" fill="none">
      <Path
        d="M1.16667 9.33333H1.99792L7.7 3.63125L6.86875 2.8L1.16667 8.50208V9.33333V9.33333M0 10.5V8.02083L7.7 0.335417C7.81667 0.228472 7.94549 0.145833 8.08646 0.0875C8.22743 0.0291667 8.37569 0 8.53125 0C8.68681 0 8.8375 0.0291667 8.98333 0.0875C9.12917 0.145833 9.25556 0.233333 9.3625 0.35L10.1646 1.16667C10.2812 1.27361 10.3663 1.4 10.4198 1.54583C10.4733 1.69167 10.5 1.8375 10.5 1.98333C10.5 2.13889 10.4733 2.28715 10.4198 2.42812C10.3663 2.5691 10.2812 2.69792 10.1646 2.81458L2.47917 10.5H0V10.5M9.33333 1.98333V1.98333L8.51667 1.16667V1.16667L9.33333 1.98333V1.98333M7.27708 3.22292L6.86875 2.8V2.8L7.7 3.63125V3.63125L7.27708 3.22292V3.22292"
        fill="#ffffff"
      />
    </Svg>
  );
}

function canCreateInternalNews(user?: AuthUser | null) {
  const role = typeof user?.role === "string" ? user.role.toLowerCase() : user?.role;

  if (role === "manager" || role === "2" || role === 2) {
    return Boolean(apiText(user?.department, "").trim());
  }

  if (role === "director" || role === "3" || role === 3) {
    return Boolean(apiText(user?.department, "").trim());
  }

  return isManagerAccessRole(user?.role);
}

function apiNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function apiNullableNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeExternalUrl(value: unknown) {
  const url = apiText(value, "").trim();

  if (!url) {
    return "";
  }

  if (/^(https?:|geo:|comgooglemaps:)/i.test(url)) {
    return url;
  }

  return `https://${url}`;
}

function googleMapsUrlFromCoordinates(latitude: unknown, longitude: unknown) {
  const lat = apiNullableNumber(latitude);
  const lng = apiNullableNumber(longitude);

  if (lat === null || lng === null) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

function directionUrlFromRecord(record: ApiObject) {
  const directUrl = normalizeExternalUrl(
    record.direction_url ??
      record.directionUrl ??
      record.google_maps_url ??
      record.googleMapsUrl ??
      record.maps_url ??
      record.mapsUrl ??
      record.location_url ??
      record.locationUrl
  );

  if (directUrl) {
    return directUrl;
  }

  return googleMapsUrlFromCoordinates(
    record.latitude ?? record.lat ?? record.gps_latitude ?? record.gpsLatitude,
    record.longitude ?? record.lng ?? record.lon ?? record.gps_longitude ?? record.gpsLongitude
  );
}

function parsePriceNumber(value: unknown) {
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

function formatVietnamPriceAmount(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits
  }).format(value);
}

function formatVietnamRealEstatePrice(value: unknown, fallback = "3,7 Tỷ VND") {
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

type InventoryLotStatus = "available" | "held" | "sold" | "unavailable";

function normalizeInventoryLotStatus(value: unknown): InventoryLotStatus {
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

function inventoryLotStatusLabel(status: InventoryLotStatus, isLocked?: unknown) {
  if (apiBoolean(isLocked)) return "ĐÃ KHÓA";
  if (status === "sold") return "ĐÃ BÁN";
  if (status === "held") return "ĐANG GIỮ CHỖ";
  if (status === "unavailable") return "KHÔNG KHẢ DỤNG";
  return "ĐANG MỞ BÁN";
}

function formatSquareMeters(value: unknown, fallback = "100.3 m²") {
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

function formatUnitPricePerSquareMeter(value: unknown, fallback = "~44.8 tr/m²") {
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

function inventoryLotCode(item: ApiObject, fallback: string) {
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

function inventoryLotStatus(item: ApiObject, fallback?: unknown): InventoryLotStatus {
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

function inventoryLotOrder(item: ApiObject) {
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

function compareInventoryLots(left: ApiObject, right: ApiObject) {
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

function sortInventoryLots(lots: ApiObject[]) {
  return [...lots].sort(compareInventoryLots);
}

function imageUrisFromApiValue(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values
    .map((item) => {
      if (isApiObject(item)) {
        return mediaUrl(item.url ?? item.image_url ?? item.imageUrl ?? item.src ?? item.path);
      }

      return mediaUrl(item);
    })
    .filter((uri): uri is string => Boolean(uri));
}

function lotImageUris(lot: ApiObject) {
  const primaryImage = mediaUrl(lot.image_url ?? lot.imageUrl);
  const images = imageUrisFromApiValue(lot.images);
  const allImages = primaryImage ? [primaryImage, ...images] : images;

  return Array.from(new Set(allImages));
}

function commentInitials(name: unknown) {
  return apiText(name, "NV")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "NV";
}

function formatFileSize(bytes?: number | null) {
  if (!Number.isFinite(bytes ?? NaN)) return null;
  const value = Number(bytes);
  return {
    bytes: value,
    mb: Number((value / (1024 * 1024)).toFixed(2))
  };
}

async function logImageUploadAsset(scope: string, photo: ImagePicker.ImagePickerAsset) {
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

const NEWS_IMAGE_EXTENSIONS: Record<string, string> = {
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

function resolveNewsImageAsset(photo: ImagePicker.ImagePickerAsset): { uri: string; name: string; type: string } {
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

function areaCommentKey(comment: ApiObject) {
  const id = apiText(comment.id, "").trim();
  if (id) return `id:${id}`;

  return [
    apiText(comment.user_id ?? comment.userId, ""),
    apiText(comment.content ?? comment.text, ""),
    apiText(comment.created_at ?? comment.createdAt, "")
  ].join("|");
}

function prependAreaComment(comments: ApiObject[], comment: ApiObject) {
  const nextKey = areaCommentKey(comment);

  if (nextKey && comments.some((item) => areaCommentKey(item) === nextKey)) {
    return comments;
  }

  return [comment, ...comments];
}

function mergeAreaComments(primary: ApiObject[], secondary: ApiObject[]) {
  return secondary.reduce((items, comment) => prependAreaComment(items, comment), primary);
}

function normalizeAreaComment(value: unknown, fallbackAreaId = "") {
  if (!isApiObject(value)) {
    return null;
  }

  const commentSource = isApiObject(value.comment) ? value.comment : value;
  const areaId = apiText(value.area_id ?? value.areaId ?? commentSource.area_id ?? commentSource.areaId, fallbackAreaId).trim();
  const content = apiText(commentSource.content ?? commentSource.text, "").trim();

  if (!areaId || !content) {
    return null;
  }

  return {
    areaId,
    comment: {
      ...commentSource,
      area_id: areaId
    }
  };
}

function normalizeRealtimeAreaComment(payload: unknown) {
  const root = isApiObject(payload) ? payload : {};
  const data = isApiObject(root.data) ? root.data : {};
  const nestedPayload = isApiObject(root.payload) ? root.payload : {};
  const candidate = isApiObject(root.comment) || root.area_id || root.areaId
    ? root
    : isApiObject(data.comment) || data.area_id || data.areaId
      ? data
      : nestedPayload;

  return normalizeAreaComment(candidate);
}

function useRealtimeAreaComments(areaId: string, fetchedComments: ApiObject[]) {
  const [realtimeComments, setRealtimeComments] = useState<ApiObject[]>([]);
  const areaDotRoom = areaId ? `area.${areaId}` : "";
  const areaColonRoom = areaId ? `area:${areaId}` : "";

  useEffect(() => {
    setRealtimeComments([]);
  }, [areaId]);

  const appendComment = useCallback((comment: ApiObject) => {
    setRealtimeComments((current) => prependAreaComment(current, comment));
  }, []);

  const comments = useMemo(
    () => mergeAreaComments(fetchedComments, realtimeComments),
    [fetchedComments, realtimeComments]
  );

  const handleRealtimeComment = useCallback((payload: unknown) => {
    const realtimeComment = normalizeRealtimeAreaComment(payload);

    if (!realtimeComment || realtimeComment.areaId !== areaId) {
      return;
    }

    appendComment(realtimeComment.comment);
  }, [appendComment, areaId]);

  useRealtimeEvent("*", handleRealtimeComment);
  useRealtimeRoom(areaDotRoom);
  useRealtimeRoom(areaColonRoom);

  return { appendComment, comments };
}

function apiBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }

  return fallback;
}

function apiList(value: unknown): ApiObject[] {
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

function formatSignedPoints(value: unknown, fallback = "+0") {
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

function formatPercentChange(value: unknown, fallback = "0%") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return `${numeric > 0 ? "+" : ""}${numeric}%`;
  }

  return String(value);
}

function formatApiDateTime(value: unknown, fallback = "Mới cập nhật") {
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

function normalizeRewardRank(value: unknown, fallback = "Chưa xếp hạng") {
  const rank = rewardRankName(value, fallback);
  return `HẠNG: ${rank.toLocaleUpperCase("vi-VN")}`;
}

function rewardRankName(value: unknown, fallback = "Chưa xếp hạng") {
  const rankValue = isApiObject(value) ? value.label : value;
  return apiText(rankValue, fallback).replace(/^hạng[:\s]*/i, "");
}

function formatTwoDigits(value: number) {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}
function formatScoreValue(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function formatScoreParam(value: unknown, fallback = "0") {
  const number = Number(value);
  return Number.isFinite(number) ? formatScoreValue(number) : fallback;
}


const certificateFallbackImages = [
  certificateImages.realEstate,
  certificateImages.operations,
  certificateImages.digitalMarketing,
  certificateImages.negotiation
];

function learningCourseFromPayload(value: unknown): ApiObject | null {
  if (!isApiObject(value)) return null;
  const course = value.course;
  return isApiObject(course) ? course : null;
}

function isLearningCourseCompleted(course: ApiObject | null) {
  if (!course) return false;
  const progress = isApiObject(course.progress) ? course.progress : {};
  const status = apiText(progress.status ?? course.status, "").toLowerCase();
  return status === "completed";
}

function formatCertificateDate(value: unknown, fallback = "Đã hoàn thành") {
  const formatted = formatApiDateTime(value, fallback);
  return formatted.includes(" - ") ? formatted.split(" - ").pop() || formatted : formatted;
}

function certificateFromCourse(course: ApiObject, certificate: ApiObject | null, index = 0): CertificateCardItem {
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

function quizScoreRowsFromCourse(course: ApiObject | null): ProfileQuizScoreItem[] {
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

async function loadLearningCertificateData(): Promise<{ data: LearningCertificateData }> {
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

const showProfileRewardHistoryShortcut = false;
const newsPostPreviewLines = 5;

function useEmployeeApiData<T>(
  loader: () => Promise<{ data: T }>,
  deps: readonly unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setFailed(false);

    loader()
      .then((response) => {
        if (mounted) {
          setData(response.data);
        }
      })
      .catch((error) => {
        if (mounted) {
          setFailed(true);
          appLogger.warn("employee.api", "Không thể tải dữ liệu employee.", { error });
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  // The caller provides a stable dependency list for the specific API resource.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, failed };
}

function back(fallback: "/employee" | "/(app)/(tabs)" = "/employee") {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function backFromNotifications(returnTo: string | string[] | undefined, fallback: "/employee" | "/(app)/(tabs)") {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  const target = paramValue(returnTo);

  if (target) {
    router.replace(target as Href);
    return;
  }

  router.replace(fallback);
}

function home() {
  router.replace("/employee");
}

function backToCheckIn() {
  router.replace("/employee/check-in");
}

function backToCheckInHistory() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  backToCheckIn();
}

function backToRequiredLearning() {
  router.dismissTo("/employee/required-learning");
}

function backToProfile() {
  router.replace("/employee/profile");
}

function isProfileBackSource(source: unknown) {
  const value = Array.isArray(source) ? source[0] : source;
  return value === "profile";
}

function backWithProfileSource(source: unknown) {
  if (isProfileBackSource(source)) {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    backToProfile();
    return;
  }

  back();
}

const vi = {
  tabs: {
    learningTitle: "Học tập & Phát triển",
    learningSubtitle: "Hoàn thành bài học, bài thi và chứng chỉ cần thiết.",
    newsTitle: "Bảng tin nội bộ",
    newsSubtitle: "Tin tức, thông báo và thảo luận trong đội ngũ.",
    profileTitle: "Hồ sơ",
    profileSubtitle: "Quản lý thông tin cá nhân, điểm và yêu cầu nội bộ.",
    managerTitle: "Hồ sơ trưởng phòng",
    managerSubtitle: "Theo dõi đội nhóm, phê duyệt yêu cầu và hiệu suất phòng ban.",
    requiredTitle: "Lộ trình học bắt buộc",
    requiredSubtitle: "Các khóa cần hoàn thành trước khi nhận giỏ hàng mới."
  },
  meetClient: {
    title: "Gặp khách",
    headerTitle: "Check-in Gặp Khách",
    customerInfo: "Thông tin khách hàng",
    customer: "Nhập tên khách hàng",
    phone: "09xx xxx xxx",
    project: "Chọn khu đất...",
    projects: ["Vinhomes Grand Park", "Masteri Centre Point", "The Beverly"],
    photoTitle: "Hình ảnh thực tế",
    photoCta: "Chụp ảnh thực tế",
    photoHelper: "Yêu cầu ảnh chụp cùng khách tại khu đất",
    recent: "Hoạt động gần đây",
    seeAll: "Xem tất cả"
  },
  showing: {
    title: "Dẫn khách",
    headerTitle: "Check-in Dẫn Khách",
    project: "The Grand Hanoi, Trần Duy Hưng",
    unit: "A10, Tòa S2.01",
    customer: "Nguyễn Văn A",
    tripInfo: "Thông tin lượt dẫn",
    proof: "Chụp ảnh tại khu đất",
    helper: "Hình ảnh cần hiển thị rõ vị trí hoặc khách hàng",
    action: "Bắt đầu Dẫn khách",
    history: "Lịch sử dẫn khách"
  },
  pointHistory: {
    title: "Lịch sử điểm",
    subtitle: "Theo dõi điểm tích lũy từ hoạt động và học tập.",
    total: "8,450",
    rank: "Hạng Vàng",
    month: "Tháng này",
    activity: "Hoạt động gần đây"
  },
  personalInfo: {
    title: "Thông tin cá nhân",
    subtitle: "Thông tin hồ sơ nhân viên và cấu hình liên hệ.",
    department: "Kinh doanh khu đất",
    code: "KNL-2024-001",
    role: "Chuyên viên tư vấn cấp cao",
    save: "Cập nhật hồ sơ"
  },
  qr: {
    title: "Mã QR Giới thiệu",
    subtitle: "Sử dụng mã này để giới thiệu khách hàng tham gia hệ thống.",
    recruitmentSubtitle: "Sử dụng mã này để giới thiệu ứng viên ứng tuyển vào hệ thống.",
    customerSubtitle: "Sử dụng mã này để giới thiệu khách hàng tham gia hệ thống.",
    employee: "MÃ TUYỂN DỤNG",
    customer: "MÃ GT KHÁCH HÀNG",
    share: "Chia sẻ mã"
  },
  requests: {
    leaveTitle: "Danh sách Xin nghỉ phép",
    transferTitle: "Danh sách xin chuyển phòng ban",
    staffTitle: "Danh sách nhân viên phòng ban",
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    approve: "Duyệt",
    reject: "Từ chối"
  },
  learning: {
    detailTitle: "Chi tiết Bài học",
    quizTitle: "Làm bài thi",
    resultTitle: "Kết quả học tập",
    certTitle: "Chứng Chỉ Của Tôi",
    start: "Bắt đầu học",
    submit: "Nộp bài",
    retake: "Làm lại",
    score: "Điểm số"
  },
  inventory: {
    listTitle: "Danh sách kho hàng",
    mapTitle: "Sơ đồ Bảng Hàng",
    detailTitle: "Chi tiết Lô Đất",
    available: "Còn hàng",
    reserved: "Đang giữ chỗ",
    sold: "Đã bán",
    consult: "Tư vấn khách",
    hold: "Giữ chỗ"
  },
  notifications: {
    title: "Thông báo",
    subtitle: "Cập nhật mới từ hệ thống và quản lý.",
    comments: "Bình luận & Thảo luận",
    send: "Gửi"
  }
};

const en: typeof vi = {
  tabs: {
    learningTitle: "Learning & Development",
    learningSubtitle: "Complete required lessons, quizzes, and certificates.",
    newsTitle: "Internal News",
    newsSubtitle: "Team updates, announcements, and discussion.",
    profileTitle: "Profile",
    profileSubtitle: "Manage personal info, points, and internal requests.",
    managerTitle: "Manager Profile",
    managerSubtitle: "Track team members, approvals, and department performance.",
    requiredTitle: "Required Learning Path",
    requiredSubtitle: "Courses to finish before receiving new inventory."
  },
  meetClient: {
    title: "Client meeting",
    headerTitle: "Client Meeting Check-in",
    customerInfo: "Customer information",
    customer: "Enter customer name",
    phone: "09xx xxx xxx",
    project: "Choose project...",
    projects: ["Vinhomes Grand Park", "Masteri Centre Point", "The Beverly"],
    photoTitle: "Real photo",
    photoCta: "Take real photo",
    photoHelper: "Photo must include the customer at project site",
    recent: "Recent activity",
    seeAll: "See all"
  },
  showing: {
    title: "Property tour",
    headerTitle: "Property Tour Check-in",
    project: "The Grand Hanoi, Tran Duy Hung",
    unit: "A10, Tower S2.01",
    customer: "Nguyen Van A",
    tripInfo: "Tour information",
    proof: "Take project photo",
    helper: "Photo should show location or customer clearly",
    action: "Start property tour",
    history: "Tour history"
  },
  pointHistory: {
    title: "Point history",
    subtitle: "Track points from activity and learning.",
    total: "8,450",
    rank: "Gold Tier",
    month: "This month",
    activity: "Recent activity"
  },
  personalInfo: {
    title: "Personal info",
    subtitle: "Employee profile and contact settings.",
    department: "Project sales",
    code: "KNL-2024-001",
    role: "Senior consultant",
    save: "Update profile"
  },
  qr: {
    title: "Referral QR",
    subtitle: "Use this code to refer new clients to the system.",
    recruitmentSubtitle: "Use this code to refer candidates to the system.",
    customerSubtitle: "Use this code to refer new clients to the system.",
    employee: "HIRING CODE",
    customer: "CLIENT REFERRAL",
    share: "Share code"
  },
  requests: {
    leaveTitle: "Leave requests",
    transferTitle: "Transfer requests",
    staffTitle: "Department staff",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    approve: "Approve",
    reject: "Reject"
  },
  learning: {
    detailTitle: "Lesson detail",
    quizTitle: "Quiz",
    resultTitle: "Learning result",
    certTitle: "My Certificates",
    start: "Start lesson",
    submit: "Submit",
    retake: "Retake",
    score: "Score"
  },
  inventory: {
    listTitle: "Inventory",
    mapTitle: "Inventory Map",
    detailTitle: "Lot Detail",
    available: "Available",
    reserved: "Reserved",
    sold: "Sold",
    consult: "Consult client",
    hold: "Reserve"
  },
  notifications: {
    title: "Notifications",
    subtitle: "System and manager updates.",
    comments: "Comments & Discussion",
    send: "Send"
  }
};

type LearningCourseRow = [string, string, number, ImageSourcePropType, boolean, string];
type LearningPathRow = [string, string, number, keyof typeof Ionicons.glyphMap, "active" | "default" | "locked"];

function useCopy() {
  const { language } = useI18n();
  return language === "en" ? en : vi;
}

export function LearningHomeScreen() {
  const { data, loading } = useEmployeeApiData(() => employeeApi.courses(), []);
  const [selectedLearningTab, setSelectedLearningTab] = useState<"inProgress" | "completed">("inProgress");
  const learningTabInitialized = useRef(false);
  const payload: ApiObject = isApiObject(data) ? data : {};
  const apiCourses = apiList(payload.courses);
  const fallbackCourse = isApiObject(payload.course) ? payload.course : null;
  const courseRecords = apiCourses.length > 0 ? apiCourses : fallbackCourse ? [fallbackCourse] : [];
  const totalCourses = courseRecords.length;
  const completedCourses = courseRecords.filter((course) => {
    const progress = isApiObject(course.progress) ? course.progress : {};
    return apiText(progress.status, "").toLowerCase() === "completed" || apiNumber(progress.percent, 0) >= 100;
  }).length;
  const courseProgressPercent = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
  const dynamicLearningPathRows: LearningPathRow[] = [
    [
      "Chuyên viên Bán hàng",
      `Hoàn thành ${completedCourses}/${totalCourses} khóa học cốt lõi.`,
      courseProgressPercent,
      "ribbon-outline",
      completedCourses >= totalCourses ? "default" : "active"
    ],
    [
      "Cố vấn Đầu tư Hạng sang",
      `Hoàn thành ${completedCourses}/${totalCourses} khóa học phát triển.`,
      courseProgressPercent,
      "star",
      completedCourses >= totalCourses ? "active" : "default"
    ],
    ["Giám đốc Khu vực", "Yêu cầu hoàn thành cấp độ Cố vấn Đầu tư.", 0, "lock-closed-outline", "locked"]
  ];
  const courses: LearningCourseRow[] = courseRecords.map((course) => {
    const progress = isApiObject(course.progress) ? course.progress : {};

    return [
      apiText(course.title, "Khóa học bắt buộc"),
      apiText(course.description, "Hoàn thành lộ trình học bắt buộc."),
      apiNumber(progress.percent, 0),
      mediaUrl(course.thumbnailUrl ?? course.thumbnail_url ?? course.thumbnail)
        ? { uri: mediaUrl(course.thumbnailUrl ?? course.thumbnail_url ?? course.thumbnail) }
        : learningImages.requiredHero,
      apiBoolean(course.isMandatory ?? course.is_mandatory, false),
      apiText(course.id, "")
    ];
  });
  const visibleCourses = courses.filter(([, , itemProgress]) => {
    const completed = itemProgress >= 100;
    return selectedLearningTab === "completed" ? completed : !completed;
  });

  useEffect(() => {
    if (loading || learningTabInitialized.current) {
      return;
    }

    learningTabInitialized.current = true;
    if (courses.length > 0 && courses.every(([, , itemProgress]) => itemProgress >= 100)) {
      setSelectedLearningTab("completed");
    }
  }, [courses, loading]);

  return (
    <EmployeePage
      title="Học viện Đào tạo"
      subtitle="Nâng tầm kỹ năng, chinh phục đỉnh cao bất động sản hạng sang."
      edges={["top", "left", "right"]}
      contentStyle={styles.learningContent}
    >
      <View style={styles.learningSection}>
        <View style={styles.learningSectionHeader}>
          <Text style={styles.learningSectionTitle}>Lộ trình phát triển</Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/employee/certificates",
                params: { from: "profile" }
              })
            }
            style={styles.learningDetailLink}
          >
            <Text style={styles.learningDetailText}>Xem chi tiết</Text>
            <Ionicons name="arrow-forward" size={12} color={employeePalette.goldDark} />
          </Pressable>
        </View>
        <View style={styles.learningPathList}>
          {dynamicLearningPathRows.map(([title, description, progress, icon, state]) => (
            <LearningPathCard
              key={title}
              description={description}
              icon={icon}
              progress={progress}
              state={state}
              title={title}
            />
          ))}
        </View>
      </View>

      <View style={styles.learningTabs}>
        <Pressable accessibilityRole="button" onPress={() => setSelectedLearningTab("inProgress")}>
          <Text style={selectedLearningTab === "inProgress" ? styles.learningTabActive : styles.learningTab}>Đang học</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setSelectedLearningTab("completed")}>
          <Text style={selectedLearningTab === "completed" ? styles.learningTabActive : styles.learningTab}>Hoàn thành</Text>
        </Pressable>
      </View>

      <View style={styles.learningCourseList}>
        {visibleCourses.length > 0 ? visibleCourses.map(([title, description, progress, image, required, courseId]) => (
          <LearningCourseCard
            key={title}
            description={description}
            courseId={courseId}
            image={image}
            progress={progress}
            required={required}
            title={title}
          />
        )) : (
          <Text style={styles.learningEmptyText}>
            {selectedLearningTab === "completed" ? "Chưa có khóa học hoàn thành." : "Hiện tại chưa có khóa học."}
          </Text>
        )}
      </View>
    </EmployeePage>
  );
}

function LearningPathCard({
  title,
  description,
  progress,
  icon,
  state
}: {
  title: string;
  description: string;
  progress: number;
  icon: keyof typeof Ionicons.glyphMap;
  state: "active" | "default" | "locked";
}) {
  const active = state === "active";
  const locked = state === "locked";
  return (
    <View style={[styles.learningPathCard, active && styles.learningPathCardActive, locked && styles.learningPathCardLocked]}>
      {!locked ? (
        <View
          pointerEvents="none"
          style={[styles.learningPathGlow, active ? styles.learningPathGlowActive : styles.learningPathGlowDefault]}
        />
      ) : null}
      <View style={[styles.learningPathIcon, active && styles.learningPathIconActive]}>
        <Ionicons
          name={icon}
          size={17}
          color={active ? employeePalette.goldDark : locked ? "#9aa0a6" : employeePalette.muted}
        />
      </View>
      <View style={styles.flex}>
        <Text style={styles.learningPathTitle}>{title}</Text>
        <Text style={styles.learningPathDescription}>{description}</Text>
        {progress > 0 ? (
          <View style={styles.learningProgressTrack}>
            <View
              style={[
                styles.learningProgressFill,
                active && styles.learningProgressFillActive,
                { width: `${progress}%` }
              ]}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function LearningCourseCard({
  title,
  courseId,
  description,
  progress,
  image,
  required
}: {
  title: string;
  courseId: string;
  description: string;
  progress: number;
  image: ImageSourcePropType;
  required: boolean;
}) {
  const openCourse = () => {
    if (!courseId) {
      notifyError("Khóa học chưa có dữ liệu lộ trình để mở.");
      return;
    }

    router.push({
      pathname: "/employee/required-learning",
      params: { courseId }
    });
  };

  return (
    <Pressable onPress={openCourse} style={({ pressed }) => [styles.learningCourseCard, pressed && styles.pressed]}>
      <View style={styles.learningCourseImageWrap}>
        <Image source={image} style={styles.learningCourseImage} />
        {required ? (
          <View style={styles.learningRequiredPill}>
            <Text style={styles.learningRequiredText}>BẮT BUỘC</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.learningCourseBody}>
        <Text style={styles.learningCourseTitle}>{title}</Text>
        <Text style={styles.learningCourseDescription}>{description}</Text>
        <View style={styles.learningCourseProgressHeader}>
          <Text style={styles.learningProgressLabel}>TIẾN ĐỘ</Text>
          <Text style={styles.learningProgressPercent}>{progress}%</Text>
        </View>
        <View style={styles.learningProgressTrack}>
          <View style={[styles.learningProgressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </Pressable>
  );
}

export function RequiredLearningScreen({
  course,
  onBack,
  refreshing,
  onRefresh
}: {
  course?: MandatoryLearningCourse | null;
  onBack?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const handleBack = onBack ?? back;

  if (!course) {
    return (
      <EmployeePage headerTitle="Lộ trình Học" back={handleBack} contentStyle={styles.requiredLearningContent}>
        <Text style={styles.requiredIntro}>Chưa có dữ liệu lộ trình học.</Text>
      </EmployeePage>
    );
  }

  const heroImage =
    course.thumbnailUrl && !thumbnailFailed
      ? { uri: course.thumbnailUrl }
      : learningImages.requiredHero;
  const quiz = course.quiz?.hasQuiz && course.quiz.courseId ? course.quiz : null;
  const allLessonsCompleted =
    course.progress.totalLessons > 0 && course.progress.completedLessons >= course.progress.totalLessons;
  const quizStatus = quiz?.status ?? "none";
  const backendQuizCanStart = quiz && typeof quiz.canStart === "boolean" ? quiz.canStart : null;
  const statusAllowsQuizAction =
    quizStatus === "not_started" ||
    quizStatus === "failed" ||
    quizStatus === "passed" ||
    quizStatus === "available" ||
    quizStatus === "completed" ||
    Boolean(quiz?.isPassed);
  const quizCanStart = backendQuizCanStart ?? (allLessonsCompleted && statusAllowsQuizAction);
  const canStartQuiz = Boolean(
    quiz &&
      quiz.courseId &&
      quizStatus !== "locked" &&
      quizStatus !== "none" &&
      quizStatus !== "grading" &&
      quizCanStart
  );

  return (
    <EmployeePage
      headerTitle={course.isMandatory ? "Lộ trình Học bắt buộc" : "Lộ trình Học"}
      back={handleBack}
      contentStyle={styles.requiredLearningContent}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <View style={styles.requiredHero}>
        <Image source={heroImage} onError={() => setThumbnailFailed(true)} style={styles.requiredHeroImage} />
        <View style={styles.requiredHeroOverlay} />
        <View style={styles.requiredHeroCopy}>
          <Text style={styles.requiredHeroKicker}>{course.label}</Text>
          <Text style={styles.requiredHeroTitle}>{course.title}</Text>
        </View>
      </View>

      <Text style={styles.requiredIntro}>{course.description}</Text>

      {course.notice ? (
        <View style={styles.requiredAlert}>
          <View style={styles.requiredAlertIcon}>
            <Ionicons name="information" size={17} color="#ffffff" />
          </View>
          <Text style={styles.requiredAlertText}>{course.notice.message}</Text>
        </View>
      ) : null}

      <View style={styles.requiredTimeline}>
        <View style={styles.requiredTimelineLine} />
        {course.lessons.map((lesson) => (
          <RequiredLessonCard key={lesson.id} lesson={lesson} />
        ))}
        {quiz ? <RequiredQuizCard quiz={quiz} canStart={canStartQuiz} /> : null}
      </View>
    </EmployeePage>
  );
}

export function MandatoryCourseListScreen({ onBack }: { onBack?: () => void }) {
  const { data, loading, failed } = useEmployeeApiData(() => employeeApi.courses(), []);
  const [thumbnailFailed, setThumbnailFailed] = useState<Record<string, boolean>>({});

  const courses = useMemo(() => {
    const payload: ApiObject = isApiObject(data) ? data : {};
    const apiCourses = apiList(payload.courses);
    const fallbackCourse = isApiObject(payload.course) ? payload.course : null;
    const allCourses = apiCourses.length > 0 ? apiCourses : fallbackCourse ? [fallbackCourse] : [];

    return allCourses.filter((course) => {
      const isMandatory = apiBoolean(course.isMandatory ?? course.is_mandatory, false);
      const courseProgress = isApiObject(course.progress) ? course.progress : {};
      const status = apiText(courseProgress.status, "").toLowerCase();
      const percent = apiNumber(courseProgress.percent, 0);
      const isCompleted = status === "completed" || percent >= 100;
      return isMandatory && !isCompleted;
    }).map((course) => {
      const courseProgress = isApiObject(course.progress) ? course.progress : {};
      const thumbnail = course.thumbnailUrl ?? course.thumbnail_url ?? course.image;

      return {
        id: apiText(course.id, ""),
        title: apiText(course.title, "Khóa học bắt buộc"),
        description: apiText(course.description, "Hoàn thành lộ trình bắt buộc để tiếp tục."),
        percent: apiNumber(courseProgress.percent, 0),
        totalLessons: apiNumber(courseProgress.totalLessons ?? courseProgress.total_lessons, 0),
        completedLessons: apiNumber(courseProgress.completedLessons ?? courseProgress.completed_lessons, 0),
        thumbnail: thumbnail ? String(thumbnail) : null,
        lessons: apiNumber(course.lessons_count ?? course.lessonCount, 0)
      };
    });
  }, [data]);

  function handleThumbnailError(id: string) {
    setThumbnailFailed((prev) => ({ ...prev, [id]: true }));
  }

  function openCourse(courseId: string) {
    if (!courseId) {
      notifyError(new Error("Khóa học chưa có dữ liệu lộ trình để mở."));
      return;
    }
    router.push({
      pathname: "/employee/required-learning",
      params: { courseId, returnTo: "/employee/mandatory-courses" }
    });
  }

  const handleBack = onBack ?? backToCheckInHistory;

  if (loading) {
    return (
      <EmployeePage headerTitle="Khóa học bắt buộc" back={handleBack} backType="previous">
        <View style={styles.meetingActivitiesHeader}>
          <ActivityIndicator color={employeePalette.goldDark} />
        </View>
      </EmployeePage>
    );
  }

  if (failed) {
    return (
      <EmployeePage headerTitle="Khóa học bắt buộc" back={handleBack} backType="previous">
        <View style={styles.meetingActivitiesHeader}>
          <Text style={styles.meetRecentStateText}>Không thể tải danh sách khóa học. Vui lòng thử lại.</Text>
        </View>
      </EmployeePage>
    );
  }

  return (
    <EmployeePage headerTitle="Khóa học bắt buộc" back={handleBack} backType="previous">
      <View style={styles.meetingActivitiesHeader}>
        <Text style={styles.meetingActivitiesTitle}>Lộ trình học bắt buộc</Text>
        <Text style={styles.meetingActivitiesSubtitle}>
          Hoàn thành tất cả khóa học bên dưới để sử dụng chức năng Gặp khách và Dẫn khách.
        </Text>
      </View>

      <View style={styles.mandatoryCourseList}>
        {courses.length === 0 ? (
          <View style={styles.mandatoryEmptyWrap}>
            <Ionicons name="checkmark-circle-outline" size={56} color="#1b8a5a" />
            <Text style={styles.mandatoryEmptyTitle}>Tất cả đã hoàn thành</Text>
            <Text style={styles.mandatoryEmptyDesc}>
              Bạn đã hoàn thành toàn bộ khóa học bắt buộc. Chức năng Gặp khách và Dẫn khách đã được mở khóa.
            </Text>
            <Pressable
              onPress={() => router.replace("/employee/(tabs)/check-in" as Href)}
              style={({ pressed }) => [styles.mandatoryContinueBtn, pressed && styles.pressed]}
            >
              <Text style={styles.mandatoryContinueBtnText}>Về trang chủ</Text>
            </Pressable>
          </View>
        ) : (
          courses.map((course) => {
            const thumbFailed = Boolean(thumbnailFailed[course.id]);
            const hasThumb = Boolean(course.thumbnail) && !thumbFailed;

            return (
              <Pressable
                key={course.id}
                onPress={() => openCourse(course.id)}
                style={({ pressed }) => [styles.mandatoryCourseCard, pressed && styles.pressed]}
              >
                <View style={styles.mandatoryCourseThumbWrap}>
                  {hasThumb ? (
                    <Image
                      source={{ uri: course.thumbnail! }}
                      style={styles.mandatoryCourseThumb}
                      onError={() => handleThumbnailError(course.id)}
                    />
                  ) : (
                    <View style={styles.mandatoryCourseThumbPlaceholder}>
                      <Ionicons name="book-outline" size={28} color="#ffffff" />
                    </View>
                  )}
                  <View style={styles.mandatoryBadge}>
                    <Text style={styles.mandatoryBadgeText}>BẮT BUỘC</Text>
                  </View>
                </View>

                <View style={styles.mandatoryCourseBody}>
                  <Text style={styles.mandatoryCourseTitle} numberOfLines={2}>{course.title}</Text>
                  <Text style={styles.mandatoryCourseDesc} numberOfLines={2}>{course.description}</Text>

                  <View style={styles.mandatoryCourseMeta}>
                    <Ionicons name="layers-outline" size={14} color={employeePalette.muted} />
                    <Text style={styles.mandatoryCourseMetaText}>
                      {course.totalLessons > 0
                        ? `${course.completedLessons}/${course.totalLessons} bài học`
                        : course.lessons > 0 ? `${course.lessons} bài học` : "Chưa có bài học"}
                    </Text>
                  </View>

                  <View style={styles.mandatoryProgressHeader}>
                    <Text style={styles.mandatoryProgressLabel}>TIẾN ĐỘ</Text>
                    <Text style={styles.mandatoryProgressPercent}>{course.percent}%</Text>
                  </View>
                  <View style={styles.learningProgressTrack}>
                    <View style={[styles.learningProgressFill, { width: `${course.percent}%` }]} />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </EmployeePage>
  );
}

function formatLessonDuration(seconds: number) {
  return `${Math.ceil(seconds / 60)} Phút`;
}

function RequiredLessonCard({ lesson }: { lesson: MandatoryLearningLesson }) {
  const locked = lesson.isLocked || lesson.status === "locked";
  const completed = lesson.status === "completed";
  const statusText = locked ? lesson.actionText : completed ? "Hoàn thành" : "Đang học";
  const showProgress = !locked && lesson.canContinue;

  return (
    <View style={styles.requiredTimelineRow}>
      <View style={[styles.requiredTimelineNode, locked ? styles.requiredTimelineNodeLocked : styles.requiredTimelineNodeActive]}>
        <Ionicons
          name={locked ? "lock-closed-outline" : completed ? "checkmark" : "play"}
          size={locked ? 15 : 20}
          color={locked ? "#9d8d8a" : "#ffffff"}
        />
      </View>

      <Pressable
        disabled={locked}
        onPress={() =>
          router.navigate({
            pathname: "/employee/lesson-detail",
            params: { lessonId: lesson.id }
          })
        }
        style={({ pressed }) => [
          styles.requiredLessonCard,
          locked && styles.requiredLessonCardLocked,
          pressed && styles.pressed
        ]}
      >
        <View style={styles.requiredLessonHeader}>
          <Text style={[styles.requiredLessonStep, locked && styles.requiredLessonMuted]}>BÀI {lesson.order}</Text>
          <View style={styles.requiredLessonStatus}>
            <Text style={[styles.requiredLessonStatusText, locked && styles.requiredLessonMuted]}>
              {statusText.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.requiredLessonTitle, locked && styles.requiredLessonTitleLocked]}>{lesson.title}</Text>
        <View style={styles.requiredLessonMeta}>
          <Ionicons name="time-outline" size={15} color={locked ? "#9d8d8a" : employeePalette.muted} />
          <Text style={[styles.requiredLessonDuration, locked && styles.requiredLessonMuted]}>
            {formatLessonDuration(lesson.durationSeconds)}
          </Text>
        </View>
        {showProgress ? (
          <>
            <View style={styles.requiredProgressTrack}>
              <View style={[styles.requiredProgressFill, { width: `${lesson.progressPercent}%` }]} />
            </View>
            <View style={styles.requiredProgressFooter}>
              <Text style={styles.requiredProgressText}>Đã xem {lesson.progressPercent}%</Text>
              <Text style={styles.requiredContinueText}>{lesson.actionText}</Text>
            </View>
          </>
        ) : null}
      </Pressable>
    </View>
  );
}

function openQuizResultScreen(courseId: string, result: ApiObject) {
  const details = apiList(result.details);
  const status = apiText(result.status, "");
  const needsManualReview =
    status === "grading" ||
    details.some((item) => item.is_correct === null || item.is_correct === undefined);
  const passed = apiBoolean(result.is_passed, status === "passed");

  router.push({
    pathname: "/employee/quiz-result",
    params: {
      score: formatScoreParam(result.score, "0"),
      maxScore: formatScoreParam(result.max_score ?? result.maxScore, "10"),
      totalQuestions: apiText(result.total_questions, "0"),
      correct: apiText(result.correct_count, "0"),
      courseId,
      passed: String(passed),
      pendingReview: String(needsManualReview),
      details: JSON.stringify(details)
    }
  });
}

function RequiredQuizCard({ canStart, quiz }: { canStart: boolean; quiz: MandatoryLearningQuiz }) {
  const [loadingResult, setLoadingResult] = useState(false);
  const normalizedQuizStatus = normalizeLessonCourseQuizStatus(quiz.status);
  const isPassed = normalizedQuizStatus === "passed" || quiz.isPassed;
  const isGrading = normalizedQuizStatus === "grading";
  const isFailed = normalizedQuizStatus === "failed";
  const hasQuizResult = isPassed || isFailed || normalizedQuizStatus === "completed";
  const buttonText =
    loadingResult ? "Đang tải..." : isGrading ? "Đang chấm" : hasQuizResult ? "Xem lại bài kiểm tra" : quiz.actionText ||
    "Làm bài kiểm tra";
  const buttonIcon = hasQuizResult ? "eye-outline" : isGrading ? "time-outline" : "play";
  const statusText = isPassed ? "Hoàn thành" : isGrading ? "Đang chấm" : isFailed ? "Chưa đạt" : "Chưa làm";
  const canPressQuiz = canStart && !isGrading && !loadingResult;

  useFocusEffect(
    useCallback(() => {
      setLoadingResult(false);
    }, [])
  );

  const handlePress = async () => {
    const courseId = quiz.courseId ?? "";
    if (!courseId) {
      notifyError("Không tìm thấy khóa học của bài kiểm tra.");
      return;
    }

    if (hasQuizResult) {
      setLoadingResult(true);
      try {
        const response = await employeeApi.courseQuizResult(courseId);
        const result = isApiObject(response.data) ? response.data : {};
        const resultStatus = quizResultStatus(result);
        if (resultStatus === "grading") {
          setLoadingResult(false);
          return;
        }
        setLoadingResult(false);
        openQuizResultScreen(courseId, result);
      } catch (error) {
        appLogger.warn("employee.quiz.result", "Không thể tải kết quả bài kiểm tra.", { error });
        notifyError(error, "Không thể tải kết quả bài kiểm tra.");
        setLoadingResult(false);
      }
      return;
    }

    router.push({
      pathname: "/employee/quiz",
      params: { courseId }
    });
  };

  return (
    <View style={styles.requiredTimelineRow}>
      <View style={[styles.requiredTimelineNode, canPressQuiz ? styles.requiredTimelineNodeActive : styles.requiredTimelineNodeLocked]}>
        <Ionicons
          name={canPressQuiz ? buttonIcon : isGrading ? "time-outline" : "lock-closed-outline"}
          size={canPressQuiz ? 20 : 15}
          color={canPressQuiz ? "#ffffff" : "#9d8d8a"}
        />
      </View>

      <View style={[styles.requiredQuizCard, !canStart && styles.requiredQuizCardLocked]}>
        <View style={styles.requiredLessonHeader}>
          <Text style={styles.requiredQuizKicker}>BÀI KIỂM TRA</Text>
          <View style={styles.requiredLessonStatus}>
            <Text style={[styles.requiredLessonStatusText, !canStart && styles.requiredLessonMuted]}>
              {statusText.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.requiredQuizTitle, !canStart && styles.requiredLessonTitleLocked]}>
          Làm bài kiểm tra để hoàn thành khóa học
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canPressQuiz }}
          disabled={!canPressQuiz}
          onPress={handlePress}
          style={({ pressed }) => [
            styles.requiredQuizButton,
            !canPressQuiz && styles.requiredQuizButtonLocked,
            pressed && styles.pressed
          ]}
        >
          <Ionicons name={loadingResult ? "reload" : buttonIcon} size={19} color="#ffffff" />
          <Text style={styles.requiredQuizButtonText}>{buttonText}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function NewsFeedScreen() {
  const { session } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const [newsRefreshKey, setNewsRefreshKey] = useState(0);
  const newsFocusedRef = useRef(false);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createExpanded, setCreateExpanded] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [newPostAttachments, setNewPostAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostImage, setEditPostImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [editPostThumbnailUrl, setEditPostThumbnailUrl] = useState("");
  const [editPostNewAttachments, setEditPostNewAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [editPostKeepAttachments, setEditPostKeepAttachments] = useState<any[]>([]);
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [updatingPost, setUpdatingPost] = useState(false);
  // Rich editor — tentap-editor dùng EditorBridge, không dùng useRef
  const [showRichModal, setShowRichModal] = useState(false);
  const [richModalMode, setRichModalMode] = useState<"create" | "edit">("create");
  const editorCreate = useEditorBridge({
    bridgeExtensions: TenTapStartKit,
    initialContent: "",
    avoidIosKeyboard: true
  });
  const editorEdit = useEditorBridge({
    bridgeExtensions: TenTapStartKit,
    initialContent: "",
    avoidIosKeyboard: true
  });
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.internalNews(), [newsRefreshKey]);
  const apiPosts = apiList(data);
  const posts: ApiObject[] = apiPosts;
  const showInitialLoading = loading && apiPosts.length === 0;
  const showEmptyState = !loading && !failed && apiPosts.length === 0;
  const canCreateNews = canCreateInternalNews(session?.user);
  const currentUserAvatarUri = mediaUrl(session?.user.avatar);

  useFocusEffect(
    useCallback(() => {
      if (!newsFocusedRef.current) {
        newsFocusedRef.current = true;
        return undefined;
      }

      setNewsRefreshKey((value) => value + 1);
      return undefined;
    }, [])
  );

  useEffect(() => {
    if (!loading) {
      setNewsRefreshing(false);
    }
  }, [loading]);

  function refreshNewsManually() {
    setNewsRefreshing(true);
    setNewsRefreshKey((value) => value + 1);
  }

  function openRichModal(mode: "create" | "edit") {
    setRichModalMode(mode);
    setShowRichModal(true);
    const content = mode === "create" ? newPostContent : editPostContent;
    const bridge = mode === "create" ? editorCreate : editorEdit;
    // Delay setContent to make sure WebView is fully mounted and ready
    setTimeout(() => {
      bridge.setContent(content);
    }, 400);
  }

  async function closeRichModalAndSave() {
    try {
      if (richModalMode === "create") {
        const html = await editorCreate.getHTML();
        setNewPostContent(html);
      } else {
        const html = await editorEdit.getHTML();
        setEditPostContent(html);
      }
    } catch (e) {
      console.warn("Failed to retrieve HTML content from editor:", e);
    }
    setShowRichModal(false);
  }

  async function insertInlineImageToRichEditor(mode: "create" | "edit") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notifyError("Vui lòng cấp quyền truy cập thư viện ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.85,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset) {
        try {
          const form = new FormData();
          form.append("image", {
            uri: asset.uri,
            name: asset.fileName || `inline-image-${Date.now()}.jpg`,
            type: asset.mimeType || "image/jpeg"
          } as any);

          const response = await employeeApi.uploadEvidence(form);
          if (response.success && response.data?.url) {
            const imageUrl = mediaUrl(response.data.url);
            if (imageUrl) {
              const bridge = mode === "edit" ? editorEdit : editorCreate;
              bridge.setImage(imageUrl);
            }
          } else {
            notifyError(response.message || "Không thể upload ảnh lên hệ thống.");
          }
        } catch (error) {
          appLogger.warn("employee.news.inlineImage", "Không thể upload ảnh inline.", { error });
          notifyError(error, "Lỗi khi upload ảnh.");
        }
      }
    }
  }

  async function pickNewsImage(target: "create" | "edit" = editingPostId ? "edit" : "create") {
    if (target === "create" && !canCreateNews) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notifyError("Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh bài viết.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.85,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible
    });

    if (!result.canceled) {
      const asset = result.assets[0] ?? null;
      if (asset?.fileSize && asset.fileSize > 8 * 1024 * 1024) {
        notifyError("Ảnh bài viết không được vượt quá 8MB.");
        return;
      }

      if (asset) {
        void logImageUploadAsset("employee.news.thumbnail", asset);
      }

      if (target === "edit") {
        setEditPostImage(asset);
        return;
      }

      setNewPostImage(asset);
      setCreateExpanded(true);
    }
  }

  async function pickNewsAttachment(target: "create" | "edit" = "create") {
    if (target === "create" && !canCreateNews) {
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
      type: employeeDocumentMimeTypes
    });

    if (result.canceled || !result.assets) return;

    const validAssets = result.assets.filter((asset) => {
      if (asset.size && asset.size > employeeDocumentMaxBytes) {
        notifyError(`Tài liệu "${asset.name}" vượt quá dung lượng 10MB.`);
        return false;
      }
      return true;
    });

    if (validAssets.length === 0) return;

    if (target === "edit") {
      setEditPostNewAttachments((current) => [...current, ...validAssets]);
    } else {
      setNewPostAttachments((current) => [...current, ...validAssets]);
      setCreateExpanded(true);
    }
  }

  async function submitInternalNews() {
    if (!canCreateNews) {
      return;
    }

    const content = newPostContent.trim();
    const title = newPostTitle.trim();

    if (!content) {
      notifyError("Vui lòng nhập nội dung bài viết.");
      return;
    }

    setCreating(true);
    try {
      const thumbnail = newPostImage
        ? resolveNewsImageAsset(newPostImage)
        : undefined;
      const response = await employeeApi.createInternalNews({
        attachments: newPostAttachments.length > 0
          ? newPostAttachments.map((attachment) => ({
              name: attachment.name || `tai-lieu-bai-viet-${Date.now()}`,
              type: employeeDocumentMimeType(attachment.name || "", attachment.mimeType),
              uri: attachment.uri
            }))
          : undefined,
        content,
        thumbnail,
        title: title || undefined
      });

      notifySuccess({ message: response.message || "Đăng bài viết thành công." });
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostImage(null);
      setNewPostAttachments([]);
      setCreateExpanded(false);
      setNewsRefreshKey((value) => value + 1);
    } catch (error) {
      appLogger.warn("employee.news.create", "Không thể đăng bài viết nội bộ.", { error });
      notifyError(error, "Không thể đăng bài viết.");
    } finally {
      setCreating(false);
    }
  }

  function cancelEditInternalNews() {
    setActivePostMenuId(null);
    setEditingPostId(null);
    setEditPostTitle("");
    setEditPostContent("");
    setEditPostImage(null);
    setEditPostThumbnailUrl("");
    setEditPostNewAttachments([]);
    setEditPostKeepAttachments([]);
  }

  function startEditInternalNews(postId: string, post: ApiObject) {
    setActivePostMenuId(null);
    setEditingPostId(postId);
    setEditPostTitle(apiText(post.title ?? post.name, ""));
    setEditPostContent(apiText(post.content ?? post.summary ?? post.excerpt ?? post.description ?? post.body, ""));
    setEditPostThumbnailUrl(apiText(post.image_url ?? post.thumbnail_url ?? post.thumbnail, ""));
    setEditPostImage(null);
    setEditPostNewAttachments([]);
    setEditPostKeepAttachments(apiList(post.attachments));
  }

  function confirmDeleteInternalNews(postId: string) {
    setActivePostMenuId(null);

    Alert.alert("Xóa bài viết", "Bạn có chắc chắn muốn xóa bài viết này không?", [
      {
        text: "Hủy",
        style: "cancel"
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          void deleteInternalNews(postId);
        }
      }
    ]);
  }

  async function deleteInternalNews(postId: string) {
    setDeletingPostId(postId);

    try {
      const response = await employeeApi.deleteInternalNews(postId);
      notifySuccess({ message: response.message || "Đã xóa bài viết." });
      if (editingPostId === postId) {
        cancelEditInternalNews();
      }
      setNewsRefreshKey((value) => value + 1);
    } catch (error) {
      appLogger.warn("employee.news.delete", "Không thể xóa bài viết nội bộ.", { postId, error });
      notifyError(error, "Không thể xóa bài viết.");
    } finally {
      setDeletingPostId(null);
    }
  }

  async function submitEditInternalNews() {
    if (!editingPostId) return;

    const content = editPostContent.trim();
    const title = editPostTitle.trim();

    if (!content) {
      notifyError("Vui lòng nhập nội dung bài viết.");
      return;
    }

    setUpdatingPost(true);
    try {
      const thumbnail = editPostImage
        ? resolveNewsImageAsset(editPostImage)
        : undefined;

      const response = await employeeApi.updateInternalNews(editingPostId, {
        attachments: editPostNewAttachments.length > 0
          ? editPostNewAttachments.map((attachment) => ({
              name: attachment.name || `tai-lieu-bai-viet-${Date.now()}`,
              type: employeeDocumentMimeType(attachment.name || "", attachment.mimeType),
              uri: attachment.uri
            }))
          : undefined,
        content,
        keep_attachments: JSON.stringify(editPostKeepAttachments),
        thumbnail,
        thumbnail_url: thumbnail ? undefined : editPostThumbnailUrl,
        title: title || undefined
      });

      notifySuccess({ message: response.message || "Cập nhật bài viết thành công." });
      cancelEditInternalNews();
      setNewsRefreshKey((value) => value + 1);
    } catch (error) {
      appLogger.warn("employee.news.update", "Không thể cập nhật bài viết nội bộ.", { postId: editingPostId, error });
      notifyError(error, "Không thể cập nhật bài viết.");
    } finally {
      setUpdatingPost(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.newsFeedSafe}>
      <View style={styles.newsFeedHeader}>
        <EmployeeAvatarButton imageUri={currentUserAvatarUri} label={session?.user.fullName} />
        <EmployeeNotificationButton returnTo="/employee/news" />
      </View>

      <ScrollView
        contentContainerStyle={styles.newsFeedScroll}
        refreshControl={
          <RefreshControl
            colors={[employeePalette.red]}
            onRefresh={refreshNewsManually}
            refreshing={newsRefreshing && loading}
            tintColor={employeePalette.red}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.newsFeedPageHeader}>
          <Text style={styles.newsFeedTitle}>Bảng tin nội bộ</Text>
          <Text style={styles.newsFeedSubtitle}>Bài viết, thông báo và thảo luận trong đội ngũ.</Text>
        </View>

        {canCreateNews ? (
          <View style={styles.newsCreateCard}>
            <View style={styles.newsCreateBody}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/employee/personal-info")}
                style={({ pressed }) => [styles.newsCreateAvatar, pressed && styles.pressed]}
              >
                {currentUserAvatarUri ? (
                  <Image source={{ uri: currentUserAvatarUri }} style={styles.newsFeedAvatarImage} />
                ) : (
                  <Text style={styles.newsAvatarInitial}>{avatarInitial(session?.user.fullName)}</Text>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCreateExpanded(true)}
                style={styles.newsCreatePromptButton}
              >
                <Text style={styles.newsCreatePlaceholder}>Chia sẻ thông tin khu đất mới{"\n"}hoặc thành tích...</Text>
              </Pressable>
            </View>
            {createExpanded ? (
              <View style={styles.newsCreateForm}>
                <TextInput
                  editable={!creating}
                  onChangeText={setNewPostTitle}
                  placeholder="Tiêu đề bài viết"
                  placeholderTextColor="rgba(91, 64, 60, 0.45)"
                  style={styles.newsCreateTitleInput}
                  value={newPostTitle}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { setCreateExpanded(true); openRichModal("create"); }}
                  style={styles.newsRichPreviewButton}
                >
                  {newPostContent ? (
                    <RenderHtml
                      contentWidth={screenWidth - 64}
                      source={{ html: newPostContent }}
                      tagsStyles={{
                        p: { color: "#3b2c2a", fontSize: 14, marginVertical: 2 },
                        img: { maxWidth: "100%", borderRadius: 8 }
                      }}
                    />
                  ) : (
                    <Text style={styles.newsCreatePlaceholder}>Nội dung bài viết... (hỗ trợ ảnh inline)</Text>
                  )}
                </Pressable>

                {newPostImage ? (
                  <View style={styles.newsCreateImagePreview}>
                    <Image source={{ uri: newPostImage.uri }} style={styles.newsCreateImage} />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setNewPostImage(null)}
                      style={styles.newsCreateImageRemove}
                    >
                      <Ionicons name="close" size={16} color="#ffffff" />
                    </Pressable>
                  </View>
                ) : null}
                {newPostAttachments.length > 0 ? (
                  <View style={styles.newsCreateAttachmentsList}>
                    {newPostAttachments.map((attachment, idx) => (
                      <View key={`new-attach-${idx}`} style={styles.newsCreateAttachmentPreview}>
                        <View style={styles.newsCreateAttachmentTitleRow}>
                          <Ionicons name="document-text-outline" size={18} color={employeePalette.red} />
                          <Text numberOfLines={1} style={styles.newsCreateAttachmentName}>{attachment.name}</Text>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setNewPostAttachments((current) => current.filter((_, i) => i !== idx))}
                          style={({ pressed }) => [styles.newsCreateAttachmentRemove, pressed && styles.pressed]}
                        >
                          <Ionicons name="close" size={16} color={employeePalette.muted} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            <View style={styles.newsCreateFooter}>
              <View style={styles.newsCreateTools}>
                <Pressable
                  accessibilityRole="button"
                  disabled={creating}
                  onPress={() => pickNewsImage("create")}
                  style={({ pressed }) => [styles.newsCreateToolButton, pressed && styles.pressed]}
                >
                  <Ionicons name="image-outline" size={20} color={employeePalette.red} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={creating}
                  onPress={() => pickNewsAttachment("create")}
                  style={({ pressed }) => [styles.newsCreateToolButton, pressed && styles.pressed]}
                >
                  <Ionicons name="attach-outline" size={22} color={employeePalette.red} />
                </Pressable>
              </View>
              {createExpanded ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={creating}
                  onPress={() => {
                    setCreateExpanded(false);
                    setNewPostTitle("");
                    setNewPostContent("");
                    setNewPostImage(null);
                    setNewPostAttachments([]);
                  }}
                  style={styles.newsCreateCancelButton}
                >
                  <Text style={styles.newsCreateCancelText}>Hủy</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={creating}
                onPress={createExpanded ? submitInternalNews : () => setCreateExpanded(true)}
                style={({ pressed }) => [
                  styles.newsCreateButton,
                  creating && styles.newsCreateButtonDisabled,
                  pressed && styles.pressed
                ]}
              >
                <Text style={styles.newsCreateButtonText}>{creating ? "Đang đăng..." : "Tạo bài viết"}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.newsFeedList}>
          {showInitialLoading ? <Text style={styles.bodyText}>Đang tải bảng tin...</Text> : null}
          {failed ? <Text style={styles.bodyText}>Không thể tải bảng tin, đang hiển thị dữ liệu gần nhất.</Text> : null}
          {showEmptyState ? <Text style={styles.bodyText}>Chưa có tin nội bộ mới.</Text> : null}
          {posts.map((post, index) => {
            const id = apiText(isApiObject(post) ? post.id : undefined, `post-${index}`);
            const postAuthor = isApiObject(post.author) ? post.author : null;
            const title = apiText(post.title ?? post.name, "Tin tức nội bộ");
            const content = apiText(post.summary ?? post.excerpt ?? post.content ?? post.description ?? post.body, "");
            const author = apiText(post.author_name ?? postAuthor?.name ?? post.created_by, "Ban quản lý");
            const authorAvatarUri = mediaUrl(post.author_avatar ?? postAuthor?.avatar ?? post.user_avatar ?? post.avatar);
            const authorId = apiText(post.author_id ?? post.user_id ?? post.created_by_id, "");
            const category = apiText(post.category ?? post.type, "Thông báo");
            const timeAgo = formatApiDateTime(post.time_ago ?? post.published_at ?? post.created_at ?? post.timeAgo);
            const likes = apiText(post.likes_count ?? post.likes, "0");
            const comments = apiText(post.comments_count ?? post.comments, "0");
            const image = apiText(post.image_url ?? post.thumbnail_url ?? post.thumbnail, "");
            const imageUri = mediaUrl(image);
            const attachments = apiList(post.attachments);
            const highlighted = index === 0;
            const currentUserName = apiText(session?.user.fullName, "").trim().toLowerCase();
            const authorName = author.trim().toLowerCase();
            const canManagePost =
              Boolean(authorId && session?.user.id && authorId === session.user.id) ||
              Boolean(!authorId && currentUserName && authorName === currentUserName);
            const isEditingPost = editingPostId === id;
            const isPostMenuActive = activePostMenuId === id;
            const isDeletingPost = deletingPostId === id;

            return (
              <View key={id} style={[styles.newsPostCard, highlighted && styles.newsPostHighlighted]}>
                <View style={styles.newsPostHeader}>
                  <View style={styles.newsPostAuthorRow}>
                    <View style={highlighted ? styles.newsPostAvatarGold : styles.newsPostAvatar}>
                      {authorAvatarUri ? (
                        <Image source={{ uri: authorAvatarUri }} style={styles.newsFeedAvatarImage} />
                      ) : (
                        <Text style={styles.newsAvatarInitial}>{avatarInitial(author)}</Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.newsPostAuthor}>{author}</Text>
                      <Text style={styles.newsPostMeta}>{timeAgo} • {category}</Text>
                    </View>
                  </View>
                  {canManagePost ? (
                    <View style={styles.newsPostMenuWrap}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={updatingPost || isDeletingPost}
                        onPress={() => setActivePostMenuId(isPostMenuActive ? null : id)}
                        style={({ pressed }) => [styles.newsPostMenuButton, pressed && styles.pressed]}
                      >
                        <Ionicons name="ellipsis-horizontal" size={20} color={employeePalette.muted} />
                      </Pressable>
                      {isPostMenuActive ? (
                        <View style={styles.newsPostMenu}>
                          <Pressable
                            accessibilityRole="button"
                            disabled={updatingPost}
                            onPress={() => (isEditingPost ? cancelEditInternalNews() : startEditInternalNews(id, post))}
                            style={({ pressed }) => [styles.newsPostMenuItem, pressed && styles.pressed]}
                          >
                            <Ionicons name={isEditingPost ? "close-outline" : "create-outline"} size={17} color={employeePalette.text} />
                            <Text style={styles.newsPostMenuItemText}>{isEditingPost ? "Hủy sửa" : "Chỉnh sửa"}</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            disabled={isDeletingPost}
                            onPress={() => confirmDeleteInternalNews(id)}
                            style={({ pressed }) => [styles.newsPostMenuItem, pressed && styles.pressed]}
                          >
                            <Ionicons name="trash-outline" size={17} color={employeePalette.red} />
                            <Text style={[styles.newsPostMenuItemText, styles.newsPostMenuItemDanger]}>
                              {isDeletingPost ? "Đang xóa..." : "Xóa bài viết"}
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
                {isEditingPost ? (
                  <View style={styles.newsEditForm}>
                    <TextInput
                      editable={!updatingPost}
                      onChangeText={setEditPostTitle}
                      placeholder="Tiêu đề bài viết"
                      placeholderTextColor="rgba(91, 64, 60, 0.45)"
                      style={styles.newsCreateTitleInput}
                      value={editPostTitle}
                    />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => openRichModal("edit")}
                      style={styles.newsRichPreviewButton}
                    >
                      {editPostContent ? (
                        <RenderHtml
                          contentWidth={screenWidth - 64}
                          source={{ html: editPostContent }}
                          tagsStyles={{
                            p: { color: "#3b2c2a", fontSize: 14, marginVertical: 2 },
                            img: { maxWidth: "100%", borderRadius: 8 }
                          }}
                        />
                      ) : (
                        <Text style={styles.newsCreatePlaceholder}>Nội dung bài viết... (hỗ trợ ảnh inline)</Text>
                      )}
                    </Pressable>

                    {editPostImage || editPostThumbnailUrl ? (
                      <View style={styles.newsCreateImagePreview}>
                        <Image source={{ uri: editPostImage?.uri || mediaUrl(editPostThumbnailUrl) }} style={styles.newsCreateImage} />
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            setEditPostImage(null);
                            setEditPostThumbnailUrl("");
                          }}
                          style={styles.newsCreateImageRemove}
                        >
                          <Ionicons name="close" size={16} color="#ffffff" />
                        </Pressable>
                      </View>
                    ) : null}
                    {editPostKeepAttachments.length > 0 ? (
                      <View style={styles.newsCreateAttachmentsList}>
                        {editPostKeepAttachments.map((attachment, idx) => (
                          <View key={`keep-attach-${idx}`} style={styles.newsCreateAttachmentPreview}>
                            <View style={styles.newsCreateAttachmentTitleRow}>
                              <Ionicons name="document-text-outline" size={18} color={employeePalette.red} />
                              <Text numberOfLines={1} style={styles.newsCreateAttachmentName}>
                                {attachment.name || attachment.title || "Tài liệu cũ"}
                              </Text>
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => setEditPostKeepAttachments((current) => current.filter((_, i) => i !== idx))}
                              style={({ pressed }) => [styles.newsCreateAttachmentRemove, pressed && styles.pressed]}
                            >
                              <Ionicons name="close" size={16} color={employeePalette.muted} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {editPostNewAttachments.length > 0 ? (
                      <View style={styles.newsCreateAttachmentsList}>
                        {editPostNewAttachments.map((attachment, idx) => (
                          <View key={`new-edit-attach-${idx}`} style={styles.newsCreateAttachmentPreview}>
                            <View style={styles.newsCreateAttachmentTitleRow}>
                              <Ionicons name="document-text-outline" size={18} color={employeePalette.red} />
                              <Text numberOfLines={1} style={styles.newsCreateAttachmentName}>{attachment.name}</Text>
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => setEditPostNewAttachments((current) => current.filter((_, i) => i !== idx))}
                              style={({ pressed }) => [styles.newsCreateAttachmentRemove, pressed && styles.pressed]}
                            >
                              <Ionicons name="close" size={16} color={employeePalette.muted} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.newsEditActions}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={updatingPost}
                        onPress={() => pickNewsImage("edit")}
                        style={({ pressed }) => [styles.newsEditImageButton, pressed && styles.pressed]}
                      >
                        <Ionicons name="image-outline" size={18} color={employeePalette.red} />
                        <Text style={styles.newsEditImageText}>Đổi ảnh</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={updatingPost}
                        onPress={() => pickNewsAttachment("edit")}
                        style={({ pressed }) => [styles.newsEditImageButton, pressed && styles.pressed, { marginLeft: 8 }]}
                      >
                        <Ionicons name="attach-outline" size={20} color={employeePalette.red} />
                        <Text style={styles.newsEditImageText}>Đính kèm</Text>
                      </Pressable>
                      <View style={styles.newsEditActionButtons}>
                        <Pressable
                          accessibilityRole="button"
                          disabled={updatingPost}
                          onPress={cancelEditInternalNews}
                          style={({ pressed }) => [styles.newsEditCancelButton, pressed && styles.pressed]}
                        >
                          <Text style={styles.newsEditCancelText}>Hủy</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          disabled={updatingPost}
                          onPress={submitEditInternalNews}
                          style={({ pressed }) => [
                            styles.newsEditSaveButton,
                            updatingPost && styles.newsCreateButtonDisabled,
                            pressed && styles.pressed
                          ]}
                        >
                          <Text style={styles.newsEditSaveText}>{updatingPost ? "Đang lưu..." : "Lưu"}</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={highlighted ? styles.newsPostTitle : styles.newsStandardBody}>{title}</Text>
                    {content ? <ExpandableNewsPostText content={content} /> : null}
                    {imageUri ? <Image source={{ uri: imageUri }} style={styles.newsPostImage} /> : null}
                    {attachments.length > 0 ? (
                      <View style={styles.newsPostAttachmentList}>
                        {attachments.map((attachment, attachmentIndex) => (
                          <NewsAttachmentChip
                            key={`${id}-attachment-${attachmentIndex}`}
                            attachment={attachment}
                          />
                        ))}
                      </View>
                    ) : null}
                  </>
                )}
                <NewsPostActions
                  initialLiked={apiBoolean(post.is_liked ?? post.liked)}
                  postId={id}
                  postSummary={content}
                  postTitle={title}
                  likes={likes}
                  comments={`${comments} Bình luận`}
                  share
                />
                {highlighted ? <View style={styles.newsGoldAccent} /> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Rich Editor Modal */}
      <Modal
        animationType="slide"
        onRequestClose={() => setShowRichModal(false)}
        presentationStyle="pageSheet"
        visible={showRichModal}
      >
        <SafeAreaView edges={["top", "left", "right"]} style={styles.richModalSafe}>
          {/* Header */}
          <View style={styles.richModalHeader}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowRichModal(false)}
              style={({ pressed }) => [styles.richModalClose, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={24} color={employeePalette.text} />
            </Pressable>
            <Text style={styles.richModalTitle}>Soạn nội dung</Text>
            <Pressable
              accessibilityRole="button"
              onPress={closeRichModalAndSave}
              style={({ pressed }) => [styles.richModalDone, pressed && styles.pressed]}
            >
              <Text style={styles.richModalDoneText}>Xong</Text>
            </Pressable>
          </View>

          {/* Editor chiếm toàn bộ không gian, thêm paddingBottom để không bị che bởi toolbar */}
          <RichText
            editor={richModalMode === "create" ? editorCreate : editorEdit}
            style={{ flex: 1 }}
          />

          {/*
            Toolbar: absolute-positioned KAV bám sát đáy màn hình.
            Khi bàn phím lên, KAV tự đẩy toolbar lên đúng phía trên bàn phím.
          */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
          >
            <NewsRichToolbar
              mode={richModalMode}
              editorCreate={editorCreate}
              editorEdit={editorEdit}
              onPickImage={() => insertInlineImageToRichEditor(richModalMode)}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Custom Rich Toolbar dùng Ionicons — không phụ thuộc vào PNG assets của TenTap
// ---------------------------------------------------------------------------
type NewsRichToolbarProps = {
  mode: "create" | "edit";
  editorCreate: ReturnType<typeof useEditorBridge>;
  editorEdit: ReturnType<typeof useEditorBridge>;
  onPickImage: () => void;
};
function NewsRichToolbar({ mode, editorCreate, editorEdit, onPickImage }: NewsRichToolbarProps) {
  const editor = mode === "create" ? editorCreate : editorEdit;
  const editorState = useBridgeState(editor);

  const txtBtn = (label: string, onPress: () => void, active = false, fontStyle?: "normal" | "italic", textDecorationLine?: "none" | "line-through" | "underline") => (
    <Pressable
      key={label + String(active)}
      onPress={onPress}
      style={({ pressed }) => [richToolbarBtnStyle, active && richToolbarBtnActive, pressed && richToolbarBtnPressed]}
    >
      <Text style={{
        color: active ? employeePalette.red : employeePalette.text,
        fontFamily: label === "B" ? appFonts.bold : appFonts.regular,
        fontStyle: fontStyle ?? "normal",
        fontSize: 14,
        textDecorationLine: textDecorationLine ?? "none"
      }}>{label}</Text>
    </Pressable>
  );

  const icoBtn = (icon: React.ComponentProps<typeof Ionicons>["name"], onPress: () => void, active = false) => (
    <Pressable
      key={icon}
      onPress={onPress}
      style={({ pressed }) => [richToolbarBtnStyle, active && richToolbarBtnActive, pressed && richToolbarBtnPressed]}
    >
      <Ionicons name={icon} size={19} color={active ? employeePalette.red : employeePalette.text} />
    </Pressable>
  );

  return (
    <View style={richToolbarWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={richToolbarScroll}
        keyboardShouldPersistTaps="always"
      >
        {txtBtn("B", () => editor.toggleBold(), editorState.isBoldActive)}
        {txtBtn("I", () => editor.toggleItalic(), editorState.isItalicActive, "italic")}
        {txtBtn("U", () => editor.toggleUnderline(), editorState.isUnderlineActive, "normal", "underline")}
        {txtBtn("S", () => editor.toggleStrike(), editorState.isStrikeActive, "normal", "line-through")}
        <View style={richToolbarDivider} />
        {icoBtn("list-outline", () => editor.toggleBulletList(), editorState.isBulletListActive)}
        {icoBtn("list-circle-outline", () => editor.toggleOrderedList(), editorState.isOrderedListActive)}
        <View style={richToolbarDivider} />
        {icoBtn("arrow-undo-outline", () => editor.undo(), false)}
        {icoBtn("arrow-redo-outline", () => editor.redo(), false)}
        <View style={richToolbarDivider} />
        {icoBtn("image-outline", onPickImage, false)}
      </ScrollView>
    </View>
  );
}
const richToolbarWrap: import("react-native").ViewStyle = {
  backgroundColor: "#fdf5f4",
  borderTopColor: "rgba(227,190,184,0.5)",
  borderTopWidth: StyleSheet.hairlineWidth
};
const richToolbarScroll: import("react-native").ViewStyle = {
  alignItems: "center",
  flexDirection: "row",
  gap: 2,
  paddingHorizontal: 8,
  paddingVertical: 6
};
const richToolbarBtnStyle: import("react-native").ViewStyle = {
  alignItems: "center",
  borderRadius: 8,
  height: 36,
  justifyContent: "center",
  width: 36
};
const richToolbarBtnActive: import("react-native").ViewStyle = {
  backgroundColor: "rgba(227,190,184,0.25)"
};
const richToolbarBtnPressed: import("react-native").ViewStyle = {
  opacity: 0.55
};
const richToolbarDivider: import("react-native").ViewStyle = {
  backgroundColor: "rgba(227,190,184,0.5)",
  height: 22,
  marginHorizontal: 4,
  width: StyleSheet.hairlineWidth
};

function ExpandableNewsPostText({ content }: { content: string }) {
  const { width: screenWidth } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  // Detect xem content có phải HTML không (có chứa HTML tag)
  const isHtmlContent = /<[a-z][\s\S]*>/i.test(content);

  function handleTextLayout(event: NativeSyntheticEvent<TextLayoutEventData>) {
    setCanExpand(event.nativeEvent.lines.length > newsPostPreviewLines);
  }

  if (isHtmlContent) {
    return (
      <View style={styles.newsPostBodyWrap}>
        <RenderHtml
          contentWidth={screenWidth - 32}
          source={{ html: content }}
          tagsStyles={{
            body: { color: "#3b2c2a", fontFamily: appFonts.regular, fontSize: 14, lineHeight: 22 },
            p: { marginVertical: 2 },
            strong: { fontFamily: appFonts.semiBold },
            img: { borderRadius: 8, maxWidth: "100%" },
            ul: { paddingLeft: 16 },
            ol: { paddingLeft: 16 }
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.newsPostBodyWrap}>
      <Text
        aria-hidden
        onTextLayout={handleTextLayout}
        style={[styles.newsPostBody, styles.newsPostBodyMeasure]}
      >
        {content}
      </Text>
      <Text numberOfLines={expanded ? undefined : newsPostPreviewLines} style={styles.newsPostBody}>
        {content}
      </Text>
      {canExpand ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((current) => !current)}
          style={({ pressed }) => [styles.newsReadMoreButton, pressed && styles.pressed]}
        >
          <Text style={styles.newsReadMore}>{expanded ? "Thu gọn" : "Xem thêm"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function NewsAttachmentChip({ attachment }: { attachment: ApiObject }) {
  const title = apiText(attachment.name ?? attachment.title ?? attachment.file_name ?? attachment.fileName, "Tài liệu đính kèm");
  const url = mediaUrl(attachment.url ?? attachment.file_url ?? attachment.fileUrl ?? attachment.path ?? attachment.uri);

  function openAttachment() {
    if (!url) {
      notifyError("Tài liệu này chưa có đường dẫn để mở.");
      return;
    }

    router.push({
      pathname: "/employee/document-viewer",
      params: { title, url }
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={openAttachment}
      style={({ pressed }) => [styles.newsPostAttachmentChip, pressed && styles.pressed]}
    >
      <Ionicons name="document-text-outline" size={17} color={employeePalette.red} />
      <Text numberOfLines={1} style={styles.newsPostAttachmentText}>{title}</Text>
      <Ionicons name="open-outline" size={15} color={employeePalette.muted} />
    </Pressable>
  );
}

function NewsPostActions({
  comments,
  initialLiked,
  likes,
  postId,
  postSummary,
  postTitle,
  share
}: {
  comments: string;
  initialLiked?: boolean;
  likes: string;
  postId?: string;
  postSummary?: string;
  postTitle?: string;
  share?: boolean;
}) {
  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [likesCount, setLikesCount] = useState(apiNumber(likes, 0));
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    setLiked(Boolean(initialLiked));
    setLikesCount(apiNumber(likes, 0));
  }, [initialLiked, likes, postId]);

  async function toggleLike() {
    if (!postId) return;
    const previousLiked = liked;
    const previousLikesCount = likesCount;
    setLiked(!previousLiked);
    setLikesCount((value) => Math.max(0, value + (previousLiked ? -1 : 1)));
    setLiking(true);

    try {
      const response = await employeeApi.likeInternalNews(postId);
      if (isApiObject(response.data)) {
        setLiked(apiBoolean(response.data.is_liked ?? response.data.liked, !previousLiked));
        setLikesCount(apiNumber(response.data.likes_count, previousLikesCount));
      }
    } catch (error) {
      setLiked(previousLiked);
      setLikesCount(previousLikesCount);
      appLogger.warn("employee.news.like", "Không thể thích bài viết nội bộ.", { postId, error });
      notifyError(error, "Không thể cập nhật lượt thích.");
    } finally {
      setLiking(false);
    }
  }

  async function sharePost() {
    const title = apiText(postTitle, "Tin tức nội bộ");
    const summary = apiText(postSummary, "");
    const message = summary ? `${title}\n\n${summary}` : title;

    try {
      await Share.share({ message, title });
    } catch (error) {
      appLogger.warn("employee.news.share", "Không thể chia sẻ bài viết nội bộ.", { postId, error });
      notifyError(error, "Không thể chia sẻ bài viết.");
    }
  }

  return (
    <View style={styles.newsPostActions}>
      <Pressable disabled={liking} onPress={toggleLike} style={({ pressed }) => [styles.newsPostAction, (pressed || liking) && styles.pressed]}>
        <Ionicons name={liked ? "thumbs-up" : "thumbs-up-outline"} size={20} color={liked ? employeePalette.red : employeePalette.muted} />
        <Text style={styles.newsPostActionText}>{likesCount}</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          if (!postId) return;
          router.push({ pathname: "/employee/comments", params: { postId, title: postTitle ?? "" } });
        }}
        style={styles.newsPostAction}
      >
        <Ionicons name="chatbox-outline" size={20} color={employeePalette.muted} />
        <Text style={styles.newsPostActionText}>{comments}</Text>
      </Pressable>
      {share ? (
        <Pressable
          accessibilityRole="button"
          onPress={sharePost}
          style={({ pressed }) => [styles.newsPostActionShare, pressed && styles.pressed]}
        >
          <Ionicons name="share-social-outline" size={20} color={employeePalette.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProfileOverviewScreen() {
  const qrCopy = useCopy().qr;
  const { session, signOut } = useAuth();
  const user = session?.user;
  const hidePersonalAchievementSections = isExecutiveAdminRole(user?.role);
  const skipPersonalAchievementApi = !user?.role || hidePersonalAchievementSections;
  const { data: profileData } = useEmployeeApiData(() => employeeApi.employeeProfile(), []);
  const { data: rewardOverviewData } = useEmployeeApiData(
    () => skipPersonalAchievementApi ? Promise.resolve({ data: {} }) : employeeApi.rewardPointOverview(),
    [skipPersonalAchievementApi]
  );
  const { data: customerQrData } = useEmployeeApiData(() => employeeApi.customerReferralQr(), []);
  const { data: recruitmentQrData } = useEmployeeApiData(() => employeeApi.recruitmentReferralQr(), []);
  const { data: learningCertificateData } = useEmployeeApiData(
    () => skipPersonalAchievementApi ? Promise.resolve({ data: { certificates: [], quizRows: [] } }) : loadLearningCertificateData(),
    [skipPersonalAchievementApi]
  );
  const [activeProfileQr, setActiveProfileQr] = useState<"recruitment" | "customer">("customer");
  const profile = isApiObject(profileData) ? profileData : {};
  const rewardOverview = isApiObject(rewardOverviewData) ? rewardOverviewData : {};
  const isManager = isManagerAccessRole(user?.role);
  const canApproveDepartmentTransfers = isDepartmentTransferApproverRole(user?.role);
  const fullName = apiText(profile.full_name ?? profile.name ?? user?.fullName, "Chưa cập nhật tên");
  const jobTitle = apiText(profile.job_position ?? profile.position ?? user?.jobPosition, "Chưa có chức danh");
  const approvedEmployeeProfile = hasApprovedEmployeeProfile(user);
  const profileRankValue = rewardOverview.rank ?? rewardOverview.rank_label ?? rewardOverview.tier ?? profile.rank ?? profile.rank_label ?? profile.tier;
  const profileRankName = rewardRankName(profileRankValue);
  const profileRankText = normalizeRewardRank(profileRankValue);
  const profileRewardPoints = apiText(
    rewardOverview.total_points ?? rewardOverview.reward_points ?? rewardOverview.points ?? profile.reward_points ?? profile.total_points,
    "0"
  );
  const profileRankSummary = `${profileRankName === "Chưa xếp hạng" ? profileRankName : `Hạng ${profileRankName}`} hiện tại với ${profileRewardPoints} điểm tích lũy.`;
  const customerQr = referralQrValue(customerQrData);
  const activeProfileQrValue = customerQr;
  const activeProfileReferralCode = isApiObject(customerQrData) ? apiText(customerQrData.referral_code ?? customerQrData.referralCode ?? customerQrData.code, "") : "";
  const profileCertificates = learningCertificateData?.certificates ?? [];
  const profileQuizRows = learningCertificateData?.quizRows ?? [];
  const profileUser = isApiObject(profile.user) ? profile.user : {};
  const profileAvatarUri = mediaUrl(user?.avatar ?? profileUser.avatar ?? profile.avatar);
  const profileInitial = avatarInitial(user?.fullName ?? profileUser.name ?? profile.name);

  function confirmSignOut() {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xác nhận", style: "destructive", onPress: () => void signOut() }
    ]);
  }

  async function shareProfileQr() {
    try {
      await Share.share({
        message: referralQrShareText(
          customerQrData,
          activeProfileQrValue || qrCopy.customerSubtitle
        )
      });
    } catch (error) {
      appLogger.warn("employee.profile.referral_qr.share", "Không thể chia sẻ mã giới thiệu.", { error });
      notifyError("Không thể chia sẻ mã lúc này.");
    }
  }

  return (
    <EmployeePage edges={["top", "left", "right"]} contentStyle={styles.profileFigmaContent}>
      <View style={styles.profileHeroCard}>
        <View style={styles.profileHeroDecoration} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/employee/personal-info", params: { from: "profile" } })}
          style={({ pressed }) => [styles.profileHeroAvatarButton, pressed && styles.pressed]}
        >
          {profileAvatarUri ? (
            <Image source={{ uri: profileAvatarUri }} style={styles.profileHeroAvatar} />
          ) : (
            <View style={styles.profileHeroAvatarFallback}>
              <Text style={styles.profileHeroAvatarInitial}>{profileInitial}</Text>
            </View>
          )}
        </Pressable>
        <Image source={profileImages.verifiedBadge} style={styles.profileVerifyBadgeImage} />
        <Text style={styles.profileHeroName}>{fullName}</Text>
        <Text style={styles.profileHeroRole}>{jobTitle}</Text>
        {hidePersonalAchievementSections ? null : (
          <View style={styles.profileRankPill}>
            <ProfileRankIcon />
            <Text style={styles.profileRankPillText}>{profileRankText}</Text>
          </View>
        )}
      </View>

      {hidePersonalAchievementSections ? null : (
        <>
          <Text style={styles.profileSectionTitle}>Xếp hạng</Text>
          <Text style={styles.bodyText}>{profileRankSummary}</Text>
          {showProfileRewardHistoryShortcut ? <ProfileRewardHistoryButton /> : null}

          <View style={styles.profileSectionHeader}>
            <Text style={styles.profileSectionTitle}>Chứng chỉ đã đạt</Text>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push({ pathname: "/employee/certificates", params: { from: "profile" } })}
              style={({ pressed }) => [styles.profileSeeAllButton, pressed && styles.pressed]}
            >
              <Text style={styles.profileSeeAll}>Xem tất cả</Text>
            </Pressable>
          </View>
          {profileCertificates.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileCertList}>
              {profileCertificates.map((certificate, index) => (
                <ProfileCertificateCard
                  key={certificate.id}
                  compact={index > 0}
                  date={certificate.issuedAt}
                  title={certificate.title}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.bodyText}>Chưa có chứng chỉ hoàn thành khóa học.</Text>
          )}

          <Text style={styles.profileSectionTitle}>Điểm thi trắc nghiệm</Text>
          <View style={styles.profileScoreList}>
            {profileQuizRows.length > 0 ? (
              profileQuizRows.map((row) => <ProfileScoreRow key={row.title} {...row} />)
            ) : (
              <Text style={styles.bodyText}>Chưa có điểm bài kiểm tra.</Text>
            )}
          </View>
        </>
      )}

      {isManager ? <ProfileManagerActions canApproveDepartmentTransfers={canApproveDepartmentTransfers} userRole={user?.role} /> : <ProfileEmployeeActions />}

      {approvedEmployeeProfile ? (
        <View style={styles.profileQrSection}>
          <Text style={[styles.profileSectionTitle, styles.profileQrTitle]}>{qrCopy.title}</Text>
          <ReferralQrPanel
            copy={qrCopy}
            mode="customer"
            onShare={shareProfileQr}
            qrValue={activeProfileQrValue}
            referralCode={activeProfileReferralCode}
          />
        </View>
      ) : (
        <View style={styles.profileQrSection}>
          <Text style={[styles.profileSectionTitle, styles.profileQrTitle]}>Hồ sơ ứng tuyển</Text>
          <Text style={styles.bodyText}>{employeeApplicationStatusText(user)}</Text>
          <EmployeeButton title="Mở form ứng tuyển" tone="red" icon="document-text-outline" onPress={() => router.push("/(app)/employee/application" as Href)} />
        </View>
      )}
      <EmployeeButton title="Đăng xuất" tone="light" icon="log-out-outline" onPress={confirmSignOut} style={styles.logoutButton} />
    </EmployeePage>
  );
}

function ProfileEmployeeActions() {
  return (
    <View style={styles.profileActionCard}>
      <Pressable
        onPress={() => router.push({ pathname: "/(app)/employee/leave-requests", params: { from: "profile" } })}
        style={({ pressed }) => [styles.profileLeaveButton, pressed && styles.pressed]}
      >
        <Text style={styles.profileLeaveButtonText}>Xin phép nghỉ</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push({ pathname: "/(app)/employee/transfer-requests", params: { from: "profile" } })}
        style={({ pressed }) => [styles.profileTransferButton, pressed && styles.pressed]}
      >
        <Ionicons name="send" size={17} color="#ffffff" />
        <Text style={styles.profileTransferButtonText}>Xin phép chuyển phòng ban</Text>
      </Pressable>
    </View>
  );
}

function ProfileManagerActions({ canApproveDepartmentTransfers, userRole }: { canApproveDepartmentTransfers: boolean; userRole?: any }) {
  return (
    <View style={styles.profileActionCard}>
      <Pressable
        onPress={() => router.push({ pathname: "/(app)/employee/leave-requests", params: { from: "profile" } })}
        style={({ pressed }) => [styles.profileLeaveButton, pressed && styles.pressed]}
      >
        <Text style={styles.profileLeaveButtonText}>Duyệt đơn xin nghỉ phép</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push({ pathname: "/(app)/employee/transfer-requests", params: { from: "profile" } })}
        style={({ pressed }) => [styles.profileTransferButton, pressed && styles.pressed]}
      >
        <Ionicons name={canApproveDepartmentTransfers ? "swap-horizontal" : "send"} size={17} color="#ffffff" />
        <Text style={styles.profileTransferButtonText}>
          {canApproveDepartmentTransfers ? "Duyệt đơn xin chuyển phòng ban" : "Xin phép chuyển phòng ban"}
        </Text>
      </Pressable>
      {isRecruitmentApproverRole(userRole) ? (
        <Pressable
          onPress={() => router.push({ pathname: "/(app)/employee/recruitment-approvals", params: { from: "profile" } })}
          style={({ pressed }) => [styles.profileLeaveButton, { backgroundColor: "#795900", borderColor: "#795900", marginTop: 8 }, pressed && styles.pressed]}
        >
          <Text style={[styles.profileLeaveButtonText, { color: "#FFD700" }]}>Duyệt đơn ứng tuyển</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => router.push({ pathname: "/(app)/employee/department-staff", params: { from: "profile" } })}
        style={({ pressed }) => [styles.profileReceiveTransferButton, pressed && styles.pressed]}
      >
        <Ionicons name="send" size={17} color="#ffffff" />
        <Text style={styles.profileTransferButtonText}>Danh sách nhân viên</Text>
      </Pressable>
    </View>
  );
}

function ProfileRewardHistoryButton() {
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/employee/point-history", params: { from: "profile" } })}
      style={({ pressed }) => [styles.profileRewardHistoryButton, pressed && styles.pressed]}
    >
      <View style={styles.profileRewardHistoryIcon}>
        <ProfileRankIcon />
      </View>
      <View style={styles.flex}>
        <Text style={styles.profileRewardHistoryTitle}>Lịch sử điểm</Text>
        <Text style={styles.profileRewardHistorySubtitle}>Xem điểm thưởng và thành tích tích lũy</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={employeePalette.muted} />
    </Pressable>
  );
}

function ProfileRankingCard({
  tone,
  label,
  rank,
  suffix,
  icon,
  progress
}: {
  tone: "green" | "red";
  label: string;
  rank: string;
  suffix: string;
  icon: keyof typeof Ionicons.glyphMap;
  progress: number;
}) {
  const isGreen = tone === "green";
  const backgroundColor = isGreen ? "#1e9a46" : employeePalette.red;

  return (
    <View style={[styles.profileRankingCard, { backgroundColor }]}>
      <View style={styles.profileRankingGlow} />
      <View style={styles.flex}>
        <Text style={styles.profileRankingLabel}>{label}</Text>
        <View style={styles.profileRankingValueRow}>
          <Text style={styles.profileRankingValue}>{rank}</Text>
          <Text style={styles.profileRankingSuffix}>{suffix}</Text>
        </View>
        <View style={styles.profileRankingTrack}>
          <View style={[styles.profileRankingFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
      <View style={styles.profileRankingIcon}>
        <Ionicons name={icon} size={26} color="#ffdf9f" />
      </View>
    </View>
  );
}

function ProfileCertificateCard({ title, date, compact }: { title: string; date: string; compact?: boolean }) {
  return (
    <View style={[styles.profileCertificateCard, compact && styles.profileCertificateCardCompact]}>
      <Image source={profileImages.certificateGold} style={styles.profileCertificateBg} />
      <Ionicons name="ribbon" size={25} color="#eec05b" />
      <Text style={styles.profileCertificateTitle} numberOfLines={compact ? 2 : 1}>{title}</Text>
      <Text style={styles.profileCertificateDate}>{date}</Text>
    </View>
  );
}

function ProfileScoreRow({
  title,
  badge,
  date,
  score,
  tone
}: {
  title: string;
  badge: string;
  date: string;
  score: string;
  tone: "red" | "gold";
}) {
  const isRed = tone === "red";

  return (
    <View style={styles.profileScoreRow}>
      <View style={styles.flex}>
        <Text style={styles.profileScoreTitle}>{title}</Text>
        <View style={styles.profileScoreMeta}>
          <View style={[styles.profileScoreBadge, isRed ? styles.profileScoreBadgeRed : styles.profileScoreBadgeGold]}>
            <Text style={[styles.profileScoreBadgeText, isRed ? styles.profileScoreBadgeTextRed : styles.profileScoreBadgeTextGold]}>
              {badge}
            </Text>
          </View>
          <Text style={styles.profileScoreDate}>{date}</Text>
        </View>
      </View>
      <View style={styles.profileScoreDivider} />
      <View style={styles.profileScoreValueRow}>
        <Text style={[styles.profileScoreValue, isRed && styles.profileScoreValueRed]}>{score}</Text>
        <Text style={styles.profileScoreMax}>/10</Text>
      </View>
    </View>
  );
}

export function ManagerProfileScreen() {
  const c = useCopy().tabs;
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);

  return (
    <EmployeePage title={c.managerTitle} subtitle={c.managerSubtitle} back={handleBack}>
      <View style={styles.metricRow}>
        <EmployeeMetric value="24" label="Nhân viên" tone="red" />
        <EmployeeMetric value="92%" label="KPI phòng" tone="green" />
      </View>
      <EmployeeListRow
        icon="people-outline"
        title="Nhân viên phòng ban"
        description="Danh sách và hiệu suất đội nhóm"
        onPress={() => router.push({ pathname: "/employee/department-staff", params: { from: "profile" } })}
      />
      <EmployeeListRow
        icon="calendar-outline"
        title="Duyệt nghỉ phép"
        description="3 yêu cầu đang chờ xử lý"
        onPress={() => router.push({ pathname: "/employee/leave-requests", params: { from: "profile" } })}
      />
      <EmployeeListRow
        icon="swap-horizontal-outline"
        title="Duyệt chuyển phòng ban"
        description="2 yêu cầu cần xem xét"
        onPress={() => router.push({ pathname: "/employee/transfer-requests", params: { from: "profile" } })}
      />
    </EmployeePage>
  );
}

export function MandatoryCourseGate({ children, returnTo }: { children: ReactNode; returnTo: string }) {
  const { loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    let active = true;
    setChecking(true);

    employeeApi
      .learningAccess()
      .then((result) => {
        if (!active) return;
        const completed = Boolean(result.mandatoryLearningCompleted);
        setAllowed(completed);
        if (!completed && !redirected.current) {
          redirected.current = true;
          router.replace({
            pathname: "/employee/mandatory-courses",
            params: { returnTo }
          });
        }
      })
      .catch(() => {
        if (active) setAllowed(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => { active = false; };
  }, [authLoading, returnTo]);

  if (authLoading || checking) {
    return (
      <EmployeePage headerTitle="" back={() => router.back()} backType="previous">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
          <ActivityIndicator color={employeePalette.goldDark} />
        </View>
      </EmployeePage>
    );
  }

  if (!allowed) {
    return (
      <EmployeePage headerTitle="" back={() => router.back()} backType="previous">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
          <ActivityIndicator color={employeePalette.goldDark} />
        </View>
      </EmployeePage>
    );
  }

  return <>{children}</>;
}

export function MeetClientScreen() {
  const c = useCopy().meetClient;
  const { data, failed: recentFailed, loading: recentLoading } = useEmployeeApiData(() => employeeApi.recentMeetings(), []);
  const { data: areasData } = useEmployeeApiData(() => employeeApi.areas(), []);
  const recent = useMemo(() => apiList(data).map(mapMeetClientRecent), [data]);
  const projectOptions = useMemo(() => {
    return apiList(areasData)
      .map((item, index) => {
        const project = isApiObject(item.project) ? item.project : {};

        return {
          id: apiText(item.id ?? item.area_id ?? item.project_id ?? project.id ?? item.project_uuid, ""),
          name: apiText(item.name ?? item.title ?? item.project_name, c.projects[index % c.projects.length] ?? "Khu đất")
        };
      })
      .filter((item) => item.id)
      .sort((left, right) => left.name.localeCompare(right.name, "vi"));
  }, [areasData, c.projects]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedProject = projectOptions.find((project) => project.id === selectedProjectId);

  useEffect(() => {
    if (!selectedProjectId && projectOptions[0]?.id) {
      setSelectedProjectId(projectOptions[0].id);
    }
  }, [projectOptions, selectedProjectId]);

  async function captureMeetingPhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Vui lòng cấp quyền camera để chụp ảnh thực tế.");
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        mediaTypes: ["images"],
        quality: 0.75
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      notifyError(error);
    }
  }

  async function submitMeeting() {
    const normalizedName = customerName.trim();
    const normalizedPhone = customerPhone.replace(/\D/g, "");
    if (!normalizedName) {
      notifyError(new Error("Vui lòng nhập tên khách hàng."));
      return;
    }
    if (!normalizedPhone) {
      notifyError(new Error("Vui lòng nhập số điện thoại khách hàng."));
      return;
    }
    if (!selectedProjectId) {
      notifyError(new Error("Vui lòng chọn khu đất quan tâm."));
      return;
    }
    if (!photo) {
      notifyError(new Error("Vui lòng chụp ảnh thực tế."));
      return;
    }

    setSubmitting(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Vui lòng cấp quyền vị trí để xác nhận gặp khách.");
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const extension = photo.uri.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = photo.mimeType || `image/${extension === "jpg" ? "jpeg" : extension}`;

      await logImageUploadAsset("employee.meet-client.image", photo);

      await employeeApi.checkInMeetCustomer({
        customer_name: normalizedName,
        customer_phone: normalizedPhone,
        image: {
          name: photo.fileName || `meet-customer-${Date.now()}.${extension}`,
          type: mimeType,
          uri: photo.uri
        },
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
        project_id: selectedProjectId
      });
      notifySuccess({ message: "Xác nhận gặp khách thành công." });
      router.back();
    } catch (error) {
      appLogger.warn("employee.meet-client", "Không thể check-in gặp khách.", { error });
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <EmployeePage headerTitle={c.headerTitle} back={backToCheckInHistory} backType="previous">
      <Text style={styles.meetSectionLabel}>{c.customerInfo}</Text>
      <MeetClientField
        icon={meetClientImages.person}
        iconStyle={styles.meetPersonIcon}
        label="TÊN KHÁCH HÀNG"
        onChangeText={setCustomerName}
        placeholder={c.customer}
        value={customerName}
      />
      <MeetClientField
        icon={meetClientImages.phone}
        iconStyle={styles.meetPhoneIcon}
        keyboardType="phone-pad"
        label="SỐ ĐIỆN THOẠI"
        onChangeText={setCustomerPhone}
        placeholder={c.phone}
        value={customerPhone}
      />
      <View style={styles.divider} />
      <Text style={styles.meetSectionLabel}>DỰ ÁN QUAN TÂM</Text>
      <Pressable
        accessibilityRole="button"
        disabled={projectOptions.length === 0}
        onPress={() => setProjectPickerVisible(true)}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <MeetClientField
          editable={false}
          value={selectedProject?.name ?? c.project}
          icon={meetClientImages.project}
          iconStyle={styles.meetProjectIcon}
          rightIcon={meetClientImages.dropdown}
          rightIconStyle={styles.meetDropdownIcon}
        />
      </Pressable>
      <MeetClientProjectPicker
        options={projectOptions}
        selectedProjectId={selectedProjectId}
        visible={projectPickerVisible}
        onClose={() => setProjectPickerVisible(false)}
        onSelect={(projectId) => {
          setSelectedProjectId(projectId);
          setProjectPickerVisible(false);
        }}
      />
      <View style={styles.divider} />
      <View style={styles.rowBetween}>
        <Text style={styles.meetSectionLabel}>{c.photoTitle}</Text>
        <EmployeeBadge label="BẮT BUỘC" />
      </View>
      <CheckInPhotoProof
        buttonTitle={c.photoCta}
        helper={c.photoHelper}
        photoUri={photo?.uri}
        status={photo ? "Đã chụp ảnh thực tế" : "Chạm để chụp ảnh"}
        onPress={captureMeetingPhoto}
      />
      <Pressable
        accessibilityRole="button"
        disabled={submitting}
        onPress={submitMeeting}
        style={({ pressed }) => [
          styles.meetConfirmButton,
          (pressed || submitting) && styles.pressed
        ]}
      >
        <Text style={styles.meetConfirmButtonText}>{submitting ? "Đang xác nhận..." : "Xác nhận gặp khách"}</Text>
      </Pressable>
      <View style={styles.divider} />
      <View style={styles.rowBetween}>
        <Text style={styles.meetSectionLabel}>{c.recent}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/employee/meeting-activities")}
          style={({ pressed }) => [styles.meetSeeAll, pressed && styles.pressed]}
        >
          <Text style={styles.meetSeeAllText}>{c.seeAll}</Text>
          <Image source={meetClientImages.historyForward} style={styles.meetForwardIcon} />
        </Pressable>
      </View>
      <View style={styles.meetRecentList}>
        {recentLoading ? <Text style={styles.meetRecentStateText}>Đang tải hoạt động gần đây...</Text> : null}
        {!recentLoading && recentFailed ? (
          <Text style={styles.meetRecentStateText}>Không thể tải hoạt động gần đây. Vui lòng thử lại.</Text>
        ) : null}
        {!recentLoading && !recentFailed && recent.length === 0 ? (
          <Text style={styles.meetRecentStateText}>Chưa có hoạt động gần đây.</Text>
        ) : null}
        {!recentLoading && !recentFailed ? recent.slice(0, 2).map((item, index) => (
          <MeetRecentCard
            key={item.id}
            avatar={index === 0 ? meetClientImages.recentClientA : meetClientImages.recentClientB}
            name={item.name}
            time={item.time}
            location={item.location}
            status={item.status}
          />
        )) : null}
      </View>
    </EmployeePage>
  );
}

export function MeetingActivitiesScreen() {
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.recentMeetings(), []);
  const recent = useMemo(() => apiList(data).map(mapMeetClientRecent), [data]);

  return (
    <EmployeePage headerTitle="Hoạt động gần đây" back={backToCheckInHistory} backType="previous">
      <View style={styles.meetingActivitiesHeader}>
        <Text style={styles.meetingActivitiesTitle}>Lịch sử gặp khách</Text>
        <Text style={styles.meetingActivitiesSubtitle}>Toàn bộ hoạt động gặp khách đã được ghi nhận từ hệ thống.</Text>
      </View>
      <View style={styles.meetRecentList}>
        {loading ? <Text style={styles.meetRecentStateText}>Đang tải hoạt động gần đây...</Text> : null}
        {!loading && failed ? (
          <Text style={styles.meetRecentStateText}>Không thể tải hoạt động gần đây. Vui lòng thử lại.</Text>
        ) : null}
        {!loading && !failed && recent.length === 0 ? (
          <Text style={styles.meetRecentStateText}>Chưa có hoạt động gần đây.</Text>
        ) : null}
        {!loading && !failed ? recent.map((item, index) => (
          <MeetRecentCard
            key={`${item.id}-${index}`}
            avatar={index % 2 === 0 ? meetClientImages.recentClientA : meetClientImages.recentClientB}
            name={item.name}
            time={item.time}
            location={item.location}
            status={item.status}
          />
        )) : null}
      </View>
    </EmployeePage>
  );
}

export function SiteTourActivitiesScreen() {
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.siteTourHistory(), []);
  const tours = useMemo(() => apiList(data).map(mapSiteTourHistory), [data]);

  return (
    <EmployeePage headerTitle="Lịch sử dẫn khách" back={backToCheckInHistory} backType="previous">
      <View style={styles.meetingActivitiesHeader}>
        <Text style={styles.meetingActivitiesTitle}>Lịch sử dẫn khách</Text>
        <Text style={styles.meetingActivitiesSubtitle}>Toàn bộ hoạt động dẫn khách đã được ghi nhận từ hệ thống.</Text>
      </View>
      <ShowingHistoryTimeline
        failed={failed}
        items={tours}
        loading={loading}
      />
    </EmployeePage>
  );
}

function MeetClientProjectPicker({
  onClose,
  onSelect,
  options,
  selectedProjectId,
  visible
}: {
  onClose: () => void;
  onSelect: (projectId: string) => void;
  options: Array<{ id: string; name: string }>;
  selectedProjectId: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.meetProjectModalBackdrop} onPress={onClose}>
        <Pressable style={styles.meetProjectModal} onPress={(event) => event.stopPropagation()}>
          <View style={styles.meetProjectModalHeader}>
            <Text style={styles.meetProjectModalTitle}>Chọn khu đất quan tâm</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.meetProjectModalClose}>
              <Ionicons color={employeePalette.text} name="close" size={20} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.meetProjectModalList}>
            {options.map((project) => {
              const active = project.id === selectedProjectId;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={project.id}
                  onPress={() => onSelect(project.id)}
                  style={[styles.meetProjectModalOption, active && styles.meetProjectModalOptionActive]}
                >
                  <Text style={[styles.meetProjectModalOptionText, active && styles.meetProjectModalOptionTextActive]}>
                    {project.name}
                  </Text>
                  {active ? <Ionicons color={employeePalette.goldDark} name="checkmark" size={20} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MeetClientField({
  editable = true,
  keyboardType,
  label,
  icon,
  iconStyle,
  onChangeText,
  placeholder,
  rightIcon,
  rightIconStyle,
  value
}: {
  editable?: boolean;
  keyboardType?: "default" | "phone-pad";
  label?: string;
  icon: number;
  iconStyle: object;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  rightIcon?: number;
  rightIconStyle?: object;
  value: string;
}) {
  return (
    <View style={styles.meetField}>
      {label ? <Text style={styles.meetFieldLabel}>{label}</Text> : null}
      <View style={styles.meetFieldInput}>
        <Image source={icon} style={iconStyle} />
        {onChangeText ? (
          <TextInput
            editable={editable}
            keyboardType={keyboardType}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={employeePalette.muted}
            style={styles.meetFieldTextInput}
            value={value}
          />
        ) : (
          <Text style={styles.meetFieldValue}>{value}</Text>
        )}
        {rightIcon ? <Image source={rightIcon} style={rightIconStyle} /> : null}
      </View>
    </View>
  );
}

function MeetClientPhotoButton({ onPress, title }: { onPress?: () => void; title: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.meetPhotoButton, pressed && styles.pressed]}>
      <Image source={meetClientImages.cameraButton} style={styles.meetCameraButtonIcon} />
      <Text style={styles.meetPhotoButtonText}>{title}</Text>
    </Pressable>
  );
}

function CheckInPhotoProof({
  buttonTitle,
  helper,
  onPress,
  photoUri,
  status
}: {
  buttonTitle: string;
  helper: string;
  onPress?: () => void;
  photoUri?: string;
  status: string;
}) {
  return (
    <>
      <View style={styles.meetPhotoBox}>
        {photoUri ? (
          <View style={styles.meetPhotoPreviewFrame}>
            <Image source={{ uri: photoUri }} style={styles.meetPhotoPreview} />
          </View>
        ) : (
          <View style={styles.roundCamera}>
            <Image source={meetClientImages.cameraEmpty} style={styles.meetCameraEmptyIcon} />
          </View>
        )}
        <Text style={styles.photoTapText}>{status}</Text>
        <Text style={styles.photoHelper}>{helper}</Text>
      </View>
      <MeetClientPhotoButton title={buttonTitle} onPress={onPress} />
    </>
  );
}

function MeetRecentCard({
  avatar,
  name,
  time,
  location,
  status
}: {
  avatar: number;
  name: string;
  time: string;
  location: string;
  status?: string;
}) {
  return (
    <View style={styles.meetRecentCard}>
      <Image source={avatar} style={styles.meetRecentAvatar} />
      <View style={styles.meetRecentCopy}>
        <Text style={styles.meetRecentName}>{name}</Text>
        <View style={styles.meetRecentMetaRow}>
          <Image source={meetClientImages.time} style={styles.meetRecentTimeIcon} />
          <Text style={styles.meetRecentMetaText}>{time}</Text>
        </View>
        <View style={styles.meetRecentMetaRow}>
          <Image source={meetClientImages.location} style={styles.meetRecentLocationIcon} />
          <Text style={styles.meetRecentMetaText}>{location}</Text>
        </View>
      </View>
      {status ? (
        <View style={styles.meetRecentStatus}>
          <Text style={styles.meetRecentStatusText}>{status}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ShowingClientScreen() {
  const c = useCopy().showing;
  const { data: areasData } = useEmployeeApiData(() => employeeApi.areas(), []);
  const { data: historyData, failed: historyFailed, loading: historyLoading } = useEmployeeApiData(
    () => employeeApi.siteTourHistory(),
    []
  );
  const { data: recentData, failed: recentFailed, loading: recentLoading } = useEmployeeApiData(
    () => employeeApi.siteToursRecent(),
    []
  );
  const projectOptions = useMemo(() => {
    return apiList(areasData)
      .map((item) => {
        const project = isApiObject(item.project) ? item.project : {};

        return {
          id: apiText(item.id ?? item.area_id ?? item.project_id ?? project.id ?? item.project_uuid, ""),
          name: apiDisplayText(item.name ?? item.title ?? item.project_name ?? project.name ?? project.title, "Khu đất")
        };
      })
      .filter((item) => item.id)
      .sort((left, right) => left.name.localeCompare(right.name, "vi"));
  }, [areasData]);
  const historySourceItems = useMemo(() => apiList(historyData), [historyData]);
  const recentSourceItems = useMemo(() => apiList(recentData), [recentData]);
  const historyItems = useMemo(() => {
    const historyRows = historySourceItems.map(mapSiteTourHistory);

    if (historyRows.length > 0) {
      return historyRows;
    }

    return recentSourceItems.map(mapSiteTourHistory);
  }, [historySourceItems, recentSourceItems]);
  const timelineLoading = historyLoading || (historySourceItems.length === 0 && recentLoading);
  const timelineFailed = historyFailed && recentFailed;
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [lotPickerVisible, setLotPickerVisible] = useState(false);
  const [lotOptions, setLotOptions] = useState<Array<{ id: string; code: string }>>([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentLocationAddress, setCurrentLocationAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selectedProject = projectOptions.find((project) => project.id === selectedProjectId);
  const selectedLot = lotOptions.find((lot) => lot.id === selectedLotId);
  const currentLocationText = currentLocation ? currentLocationAddress || "Đã lấy vị trí hiện tại" : "Bấm để lấy vị trí hiện tại";

  useEffect(() => {
    if (!selectedProjectId && projectOptions[0]?.id) {
      setSelectedProjectId(projectOptions[0].id);
    }
  }, [projectOptions, selectedProjectId]);

  useEffect(() => {
    setSelectedLotId("");
    setLotOptions([]);

    if (!selectedProjectId) return;

    let cancelled = false;
    setLotsLoading(true);

    employeeApi.inventoryMap(selectedProjectId)
      .then((response) => {
        if (cancelled) return;
        const lots = apiList(response?.data).map((lot) => ({
          id: apiText(lot.id ?? lot.lot_id, ""),
          code: apiText(lot.code ?? lot.lot_code ?? lot.lotCode, "—")
        })).filter((lot) => lot.id);
        setLotOptions(lots.sort((a, b) => a.code.localeCompare(b.code, "vi")));
      })
      .catch(() => {
        if (!cancelled) setLotOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLotsLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedProjectId]);

  async function captureSiteTourPhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Vui lòng cấp quyền camera để chụp ảnh tại khu đất.");
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        mediaTypes: ["images"],
        quality: 0.35
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      notifyError(error);
    }
  }

  function formatSiteTourAddress(address: Location.LocationGeocodedAddress) {
    return [
      address.name,
      address.street,
      address.district,
      address.subregion,
      address.city,
      address.region
    ]
      .filter((part, index, parts) => Boolean(part) && parts.indexOf(part) === index)
      .join(", ");
  }

  async function getSiteTourLocation() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Vui lòng cấp quyền vị trí để xác nhận dẫn khách.");
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const nextLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      const [address] = await Location.reverseGeocodeAsync(nextLocation);

      setCurrentLocation(nextLocation);
      setCurrentLocationAddress(address ? formatSiteTourAddress(address) : "");
      return nextLocation;
    } catch (error) {
      appLogger.warn("employee.site-tour.location", "Không thể lấy vị trí hiện tại.", { error });
      notifyError(error);
      return null;
    } finally {
      setLocating(false);
    }
  }

  async function submitSiteTour() {
    const lotCode = selectedLot?.code ?? "";
    const normalizedCustomerName = customerName.trim();

    if (!selectedProjectId) {
      notifyError(new Error("Vui lòng chọn khu đất."));
      return;
    }
    if (!lotCode) {
      notifyError(new Error("Vui lòng chọn mã lô/căn hộ."));
      return;
    }
    if (!normalizedCustomerName) {
      notifyError(new Error("Vui lòng nhập tên khách hàng."));
      return;
    }
    if (!photo) {
      notifyError(new Error("Vui lòng chụp ảnh tại khu đất."));
      return;
    }

    setSubmitting(true);
    try {
      const siteTourLocation = currentLocation ?? await getSiteTourLocation();
      if (!siteTourLocation) return;

      const extension = photo.uri.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = photo.mimeType || `image/${extension === "jpg" ? "jpeg" : extension}`;

      await logImageUploadAsset("employee.site-tour.image", photo);

      await employeeApi.checkInSiteTour({
        customer_name: normalizedCustomerName,
        image: {
          name: photo.fileName || `site-tour-${Date.now()}.${extension}`,
          type: mimeType,
          uri: photo.uri
        },
        latitude: String(siteTourLocation.latitude),
        longitude: String(siteTourLocation.longitude),
        project_id: selectedProjectId,
        unit_code: lotCode
      });
      notifySuccess({ message: "Check-in dẫn khách thành công." });
      router.back();
    } catch (error) {
      appLogger.warn("employee.site-tour", "Không thể check-in dẫn khách.", { error });
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <EmployeePage headerTitle={c.headerTitle} back={backToCheckInHistory} backType="previous">
      <Pressable
        accessibilityRole="button"
        disabled={locating || submitting}
        onPress={getSiteTourLocation}
        style={({ pressed }) => [
          styles.showingGpsCard,
          (pressed || locating || submitting) && styles.pressed
        ]}
      >
        <View style={styles.locationRow}>
          <Image source={showingImages.gps} style={styles.showingGpsIcon} />
          <View style={styles.showingGpsCopy}>
            <Text style={[styles.bodyText, styles.showingGpsText]}>
              <Text style={styles.inlineStrong}>Vị trí: </Text>
              {locating ? "Đang lấy vị trí..." : currentLocationText}
            </Text>
          </View>
          <Ionicons name="locate-outline" size={20} color={employeePalette.red} />
        </View>
      </Pressable>
      <EmployeeSectionTitle title={c.tripInfo} />
      <View style={styles.showingForm}>
        <Pressable
          accessibilityRole="button"
          disabled={projectOptions.length === 0}
          onPress={() => setProjectPickerVisible(true)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <ShowingField
            dropdown
            label="DỰ ÁN"
            muted={!selectedProject}
            value={selectedProject?.name ?? "Chọn khu đất..."}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!selectedProjectId || lotsLoading || lotOptions.length === 0}
          onPress={() => setLotPickerVisible(true)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <ShowingField
            dropdown
            label="MÃ LÔ/CĂN HỘ"
            muted={!selectedLot}
            value={lotsLoading ? "Đang tải dữ liệu lô..." : selectedLot?.code ?? (selectedProjectId ? "Chọn lô/căn hộ..." : "Chọn khu đất trước")}
          />
        </Pressable>
        <ShowingField
          label="TÊN KHÁCH HÀNG"
          onChangeText={setCustomerName}
          placeholder="Nhập tên khách hàng"
          value={customerName}
        />
      </View>
      <MeetClientProjectPicker
        options={projectOptions}
        selectedProjectId={selectedProjectId}
        visible={projectPickerVisible}
        onClose={() => setProjectPickerVisible(false)}
        onSelect={(projectId) => {
          setSelectedProjectId(projectId);
          setProjectPickerVisible(false);
        }}
      />
      <Modal animationType="fade" transparent visible={lotPickerVisible} onRequestClose={() => setLotPickerVisible(false)}>
        <Pressable style={styles.meetProjectModalBackdrop} onPress={() => setLotPickerVisible(false)}>
          <Pressable style={styles.meetProjectModal} onPress={(event) => event.stopPropagation()}>
            <View style={styles.meetProjectModalHeader}>
              <Text style={styles.meetProjectModalTitle}>Chọn lô/căn hộ</Text>
              <Pressable accessibilityRole="button" onPress={() => setLotPickerVisible(false)} style={styles.meetProjectModalClose}>
                <Ionicons color={employeePalette.text} name="close" size={20} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.meetProjectModalList}>
              {lotOptions.length === 0 && (
                <Text style={{ color: employeePalette.muted, textAlign: "center", paddingVertical: 16 }}>
                  {lotsLoading ? "Đang tải..." : "Không có lô/căn hộ nào."}
                </Text>
              )}
              {lotOptions.map((lot) => {
                const active = lot.id === selectedLotId;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={lot.id}
                    onPress={() => {
                      setSelectedLotId(lot.id);
                      setLotPickerVisible(false);
                    }}
                    style={[styles.meetProjectModalOption, active && styles.meetProjectModalOptionActive]}
                  >
                    <Text style={[styles.meetProjectModalOptionText, active && styles.meetProjectModalOptionTextActive]}>
                      {lot.code}
                    </Text>
                    {active ? <Ionicons color={employeePalette.goldDark} name="checkmark" size={20} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <View style={styles.showingPhotoHeader}>
        <EmployeeSectionTitle title="Minh chứng Check-in" />
        <EmployeeBadge label="BẮT BUỘC" />
      </View>
      <CheckInPhotoProof
        buttonTitle={c.proof}
        helper={photo?.fileName ?? c.helper}
        photoUri={photo?.uri}
        status={photo ? "Đã chụp minh chứng" : "Chạm để chụp ảnh"}
        onPress={captureSiteTourPhoto}
      />
      <ShowingPrimaryButton disabled={submitting} title={submitting ? "Đang gửi..." : c.action} onPress={submitSiteTour} />
      <View style={styles.rowBetween}>
        <EmployeeSectionTitle title={c.history} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/employee/site-tour-activities")}
          style={({ pressed }) => [styles.meetSeeAll, pressed && styles.pressed]}
        >
          <Text style={styles.meetSeeAllText}>Xem tất cả</Text>
          <Image source={meetClientImages.historyForward} style={styles.meetForwardIcon} />
        </Pressable>
      </View>
      <ShowingHistoryTimeline
        failed={timelineFailed}
        items={historyItems.slice(0, 3)}
        loading={timelineLoading}
      />
    </EmployeePage>
  );
}

function ShowingField({
  label,
  onChangeText,
  placeholder,
  value,
  dropdown,
  muted
}: {
  label: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  value: string;
  dropdown?: boolean;
  muted?: boolean;
}) {
  const inputStyle = [styles.showingFieldValue, muted && styles.showingFieldValueMuted];

  return (
    <View style={styles.showingField}>
      <Text style={styles.showingFieldLabel}>{label}</Text>
      <View style={styles.showingFieldInput}>
        {onChangeText ? (
          <TextInput
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#6b7280"
            style={[inputStyle, styles.showingFieldTextInput]}
            value={value}
          />
        ) : (
          <Text style={inputStyle}>{value || placeholder}</Text>
        )}
        {dropdown ? <Image source={showingImages.chevronDown} style={styles.showingChevronIcon} /> : null}
      </View>
    </View>
  );
}

function ShowingPrimaryButton({
  disabled,
  onPress,
  title
}: {
  disabled?: boolean;
  onPress?: () => void;
  title: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.showingPrimaryButton, (pressed || disabled) && styles.pressed]}
    >
      <Image source={showingImages.play} style={styles.showingPlayIcon} />
      <Text style={styles.showingPrimaryButtonText}>{title}</Text>
    </Pressable>
  );
}

function ProfileRankIcon() {
  return (
    <Svg height={16} viewBox="0 0 12 15.75" width={12}>
      <Path
        d="M4.25625 8.775L4.9125 6.6375L3.1875 5.25H5.325L6 3.15L6.675 5.25H8.8125L7.06875 6.6375L7.725 8.775L6 7.44375L4.25625 8.775V8.775M1.5 15.75V9.95625C1.025 9.43125 0.65625 8.83125 0.39375 8.15625C0.13125 7.48125 0 6.7625 0 6C0 4.325 0.58125 2.90625 1.74375 1.74375C2.90625 0.58125 4.325 0 6 0C7.675 0 9.09375 0.58125 10.2563 1.74375C11.4188 2.90625 12 4.325 12 6C12 6.7625 11.8687 7.48125 11.6062 8.15625C11.3437 8.83125 10.975 9.43125 10.5 9.95625V15.75L6 14.25L1.5 15.75V15.75M6 10.5C7.25 10.5 8.3125 10.0625 9.1875 9.1875C10.0625 8.3125 10.5 7.25 10.5 6C10.5 4.75 10.0625 3.6875 9.1875 2.8125C8.3125 1.9375 7.25 1.5 6 1.5C4.75 1.5 3.6875 1.9375 2.8125 2.8125C1.9375 3.6875 1.5 4.75 1.5 6C1.5 7.25 1.9375 8.3125 2.8125 9.1875C3.6875 10.0625 4.75 10.5 6 10.5V10.5"
        fill="#EEC05B"
      />
    </Svg>
  );
}

function ShowingHistoryTimeline({
  failed,
  items,
  loading
}: {
  failed: boolean;
  items: SiteTourHistoryItem[];
  loading: boolean;
}) {
  if (loading) {
    return <Text style={styles.meetRecentStateText}>Đang tải lịch sử dẫn khách...</Text>;
  }

  if (failed) {
    return <Text style={styles.meetRecentStateText}>Không thể tải lịch sử dẫn khách. Vui lòng thử lại.</Text>;
  }

  if (items.length === 0) {
    return <Text style={styles.meetRecentStateText}>Chưa có lịch sử dẫn khách.</Text>;
  }

  return (
    <View style={styles.showingTimeline}>
      <View style={styles.showingTimelineLine} />
      {items.map((item, index) => (
        <View key={`${item.id}-${index}`} style={styles.showingTimelineItem}>
          <View style={[styles.showingTimelineIcon, item.completed && styles.showingTimelineIconActive]}>
            <Image
              source={item.completed ? showingImages.timelineCheck : showingImages.timelineHistory}
              style={item.completed ? styles.showingTimelineCheckAsset : styles.showingTimelineHistoryAsset}
            />
          </View>
          <View style={styles.showingTimelineCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.showingTimelineTime}>{item.time}</Text>
              <View style={styles.showingTimelineBadge}>
                <Text style={styles.showingTimelineBadgeText}>{item.statusLabel}</Text>
              </View>
            </View>
            <Text style={styles.showingTimelineTitle}>{item.title}</Text>
            <Text style={styles.showingTimelineCustomer}>{item.customer}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function PointHistoryScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const { session } = useAuth();
  const hidePersonalAchievementSections = isExecutiveAdminRole(session?.user.role);
  const skipPersonalAchievementApi = !session?.user.role || hidePersonalAchievementSections;
  const { data: overviewData } = useEmployeeApiData(
    () => skipPersonalAchievementApi ? Promise.resolve({ data: {} }) : employeeApi.rewardPointOverview(),
    [skipPersonalAchievementApi]
  );
  const { data: historyData, failed: historyFailed } = useEmployeeApiData(
    () => skipPersonalAchievementApi ? Promise.resolve({ data: {} }) : employeeApi.rewardPointHistory(),
    [skipPersonalAchievementApi]
  );
  const overview = isApiObject(overviewData) ? overviewData : {};
  const history = apiList(historyData);
  const totalPoints = apiText(overview.total_points ?? overview.points ?? overview.balance, "0");
  const rankLabel = normalizeRewardRank(overview.rank ?? overview.rank_label ?? overview.tier);
  const monthPoints = formatSignedPoints(
    overview.current_month_points ?? overview.month_points ?? overview.monthly_points ?? overview.this_month_points,
    "0"
  );
  const monthGrowth = formatPercentChange(
    overview.month_growth_percent ?? overview.growth_percent ?? overview.month_change_percent,
    "0%"
  );
  const quarterCurrent = apiNumber(
    overview.quarter_points ?? overview.current_quarter_points ?? overview.quarter_current,
    0
  );
  const quarterTarget = apiNumber(
    overview.quarter_target_points ?? overview.quarter_target ?? overview.target_points,
    0
  );
  const quarterProgressValue = apiNumber(
    overview.quarter_progress ?? overview.quarter_progress_percent ?? overview.progress,
    quarterTarget > 0 ? quarterCurrent / quarterTarget : 0
  );
  const quarterProgress = Math.min(
    1,
    Math.max(0, quarterProgressValue > 1 ? quarterProgressValue / 100 : quarterProgressValue)
  );
  const rows = history.map((item) => ({
    title: apiText(item.reason ?? item.title ?? item.description, "Hoạt động tích điểm"),
    points: formatSignedPoints(item.points_changed ?? item.pointsChanged ?? item.points ?? item.point, "0"),
    time: formatApiDateTime(item.created_at ?? item.createdAt ?? item.time ?? item.date),
    dimmed: Boolean(item.disabled ?? item.is_inactive)
  }));

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.pointHistorySafe}>
      <View style={styles.pointHistoryHeader}>
        <Pressable
          accessibilityRole="button"
          onPress={handleBack}
          style={({ pressed }) => [styles.pointHistoryBackButton, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={24} color={employeePalette.text} />
        </Pressable>
        <Text style={styles.pointHistoryHeaderTitle} numberOfLines={1}>Lịch sử điểm thưởng</Text>
        <View style={styles.pointHistoryHeaderSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pointHistoryContent}
      >
        <View style={styles.pointHistoryHero}>
          <View style={styles.pointHistoryHeroGlowTop} />
          <View style={styles.pointHistoryHeroGlowBottom} />
          <Text style={styles.pointHistoryHeroEyebrow}>THÀNH TÍCH TÍCH LŨY</Text>
          <Text style={styles.pointHistoryHeroValue}>{totalPoints}</Text>
          <View style={styles.pointHistoryRankPill}>
            <ProfileRankIcon />
            <Text style={styles.pointHistoryRankText}>{rankLabel}</Text>
          </View>
        </View>

        <View style={styles.pointHistoryStatsGrid}>
          <View style={styles.pointHistoryStatCard}>
            <Text style={styles.pointHistoryStatLabel}>THÁNG NÀY</Text>
            <View style={styles.pointHistoryMonthRow}>
              <Text style={styles.pointHistoryMonthValue}>{monthPoints}</Text>
              <Text style={styles.pointHistoryMonthGrowth}>{monthGrowth}</Text>
            </View>
          </View>
          <View style={styles.pointHistoryStatCard}>
            <Text style={styles.pointHistoryStatLabel}>MỤC TIÊU QUÝ</Text>
            <View style={styles.pointHistoryProgressTrack}>
              <View style={[styles.pointHistoryProgressFill, { width: `${quarterProgress * 100}%` }]} />
            </View>
            <Text style={styles.pointHistoryTargetText}>{quarterCurrent}/{quarterTarget} điểm</Text>
          </View>
        </View>

        <Text style={styles.pointHistorySectionTitle}>Lịch sử điểm</Text>
        <View style={styles.pointHistoryList}>
          {rows.length > 0 ? (
            rows.map((item) => (
              <View key={`${item.title}-${item.time}`} style={[styles.pointHistoryItem, item.dimmed && styles.pointHistoryItemDimmed]}>
                <View style={styles.flex}>
                  <Text style={styles.pointHistoryItemTitle}>{item.title}</Text>
                  <Text style={styles.pointHistoryItemTime}>{item.time}</Text>
                </View>
                <View style={styles.pointHistoryPoints}>
                  <Text style={styles.pointHistoryPointsValue}>{item.points}</Text>
                  <Text style={styles.pointHistoryPointsUnit}>PTS</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.pointHistoryEmpty}>
              <Text style={styles.pointHistoryEmptyTitle}>
                {historyFailed ? "Không thể tải lịch sử điểm." : "Chưa có dữ liệu điểm thưởng."}
              </Text>
              <Text style={styles.pointHistoryEmptyText}>
                {historyFailed ? "Vui lòng thử lại sau." : "Khi có giao dịch hoặc hoạt động được ghi nhận, lịch sử điểm sẽ xuất hiện tại đây."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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

export function PersonalInfoScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const { refreshMe, session } = useAuth();
  const { data: profileData, failed, loading } = useEmployeeApiData(() => employeeApi.employeeProfile(), []);
  const [form, setForm] = useState<PersonalProfileForm>(emptyPersonalProfileForm);
  const [attachments, setAttachments] = useState<ApiObject[]>([]);
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("Bằng cấp");
  const [docTypeDropdownOpen, setDocTypeDropdownOpen] = useState(false);
  const user = session?.user;
  const fullName = form.name || user?.fullName || "Nhân viên";
  const jobTitle = (form.employee_title || user?.jobPosition || "Chưa có chức danh").toUpperCase();
  const avatarUri = mediaUrl(form.avatar || user?.avatar);
  const personalInitial = avatarInitial(fullName);

  useEffect(() => {
    if (!isApiObject(profileData)) return;

    setForm(personalFormFromProfile(profileData, user));
    setAttachments(personalAttachments(profileData));
  }, [profileData, user]);

  function updateForm(key: keyof PersonalProfileForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notifyError("Vui lòng cấp quyền truy cập thư viện ảnh để cập nhật ảnh đại diện.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > employeeAvatarMaxBytes) {
      notifyError("Dung lượng ảnh đại diện không được vượt quá 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", {
      name: asset.fileName || `avatar-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
      uri: asset.uri
    } as unknown as Blob);

    setUploadingAvatar(true);
    try {
      const response = await employeeApi.uploadEmployeeAvatar(formData);
      const data = isApiObject(response.data) ? response.data : {};
      const nextAvatar = apiText(data.avatar, "");

      if (nextAvatar) {
        setForm((current) => ({ ...current, avatar: nextAvatar }));
      }

      await refreshMe();
      notifySuccess({ message: response.message || "Cập nhật ảnh đại diện thành công." });
    } catch (error) {
      notifyError(error, "Không thể cập nhật ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const response = await employeeApi.updateEmployeeProfile({
        address: form.address,
        avatar: form.avatar || null,
        bank_account_name: form.bank_account_name || null,
        bank_account_number: form.bank_account_number || null,
        bank_name: form.bank_name || null,
        cccd: form.cccd || null,
        dob: form.dob || null,
        education: form.education || null,
        email: form.email,
        employee_title: form.employee_title || null,
        experience: form.experience || null,
        major: form.major || null,
        name: form.name,
        phone: form.phone
      });
      const updatedProfile = isApiObject(response.data) ? response.data : null;

      if (updatedProfile) {
        setForm(personalFormFromProfile(updatedProfile, user));
        setAttachments(personalAttachments(updatedProfile));
      }

      notifySuccess({ message: response.message || "Cập nhật hồ sơ thành công." });
    } catch (error) {
      notifyError(error, "Không thể cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadDocument(type: string) {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: employeeDocumentMimeTypes
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.size && asset.size > employeeDocumentMaxBytes) {
      notifyError("Dung lượng tài liệu không được vượt quá 10MB.");
      return;
    }

    const fileName = asset.name || `employee-document-${Date.now()}`;
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", {
      name: fileName,
      type: employeeDocumentMimeType(fileName, asset.mimeType),
      uri: asset.uri
    } as unknown as Blob);

    setUploading(true);
    try {
      const response = await employeeApi.uploadEmployeeDocument(formData);
      const data = isApiObject(response.data) ? response.data : {};
      setAttachments(apiList(data.list));
      notifySuccess({ message: response.message || "Tải tài liệu thành công." });
    } catch (error) {
      notifyError(error, "Không thể tải tài liệu.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.personalSafe}>
      <View style={styles.personalHeader}>
        <Pressable accessibilityRole="button" onPress={handleBack} style={styles.personalHeaderButton}>
          <Ionicons name="arrow-back" size={22} color="#191c1d" />
        </Pressable>
        <Text style={styles.personalHeaderTitle}>Thông tin cá nhân</Text>
        <EmployeeNotificationButton returnTo="/employee/personal-info" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.personalScroll} style={styles.personalRoot}>
        <View style={styles.personalIdentity}>
          <Pressable
            accessibilityRole="button"
            disabled={uploadingAvatar}
            onPress={uploadAvatar}
            style={({ pressed }) => [styles.personalAvatarWrap, pressed && styles.pressed]}
          >
            <View style={styles.personalAvatarFrame}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.personalAvatarImage} />
              ) : (
                <View style={styles.personalAvatarFallback}>
                  <Text style={styles.personalAvatarInitial}>{personalInitial}</Text>
                </View>
              )}
            </View>
            <View style={styles.personalEditAvatar}>
              {uploadingAvatar ? <Ionicons name="hourglass-outline" size={11} color="#ffffff" /> : <AvatarEditPencilIcon />}
            </View>
          </Pressable>
          <Text style={styles.personalName}>{fullName}</Text>
          <Text style={styles.personalRole}>{jobTitle}</Text>
          <View style={styles.personalAwardPill}>
            <Text style={styles.personalAwardText}>{jobTitle || "NHÂN VIÊN"}</Text>
          </View>
        </View>

        <View style={[styles.personalSectionGrid, { zIndex: docTypeDropdownOpen ? 10 : 1 }]}>
          {loading ? <Text style={styles.personalStatusText}>Đang tải hồ sơ nhân viên...</Text> : null}
          {failed ? <Text style={styles.personalStatusText}>Không thể tải hồ sơ, vui lòng thử lại sau.</Text> : null}
          <PersonalSection title="Thông tin cá nhân" icon="id-card-outline">
            <PersonalField
              keyboardType="number-pad"
              label="SỐ CCCD"
              maxLength={20}
              value={form.cccd}
              onChangeText={(value) => updateForm("cccd", value.replace(/\D/g, "").slice(0, 20))}
            />
            <PersonalField label="HỌ VÀ TÊN" value={form.name} onChangeText={(value) => updateForm("name", value)} />
            <PersonalDateField label="NGÀY SINH" value={form.dob} onPress={() => setDobPickerVisible(true)} />
            <PersonalField label="ĐỊA CHỈ THƯỜNG TRÚ" value={form.address} multiline onChangeText={(value) => updateForm("address", value)} />
            <PersonalField label="SỐ ĐIỆN THOẠI" value={form.phone} keyboardType="phone-pad" onChangeText={(value) => updateForm("phone", value)} />
            <PersonalField label="EMAIL CÔNG VIỆC" value={form.email} keyboardType="email-address" onChangeText={(value) => updateForm("email", value)} />
          </PersonalSection>

          <PersonalSection title="Thông tin Ngân hàng" icon="business-outline">
            <PersonalField label="CHỦ TÀI KHOẢN" value={form.bank_account_name} onChangeText={(value) => updateForm("bank_account_name", value.toUpperCase())} />
            <PersonalField label="SỐ TÀI KHOẢN" value={form.bank_account_number} keyboardType="number-pad" onChangeText={(value) => updateForm("bank_account_number", value)} />
            <PersonalField label="NGÂN HÀNG" value={form.bank_name} onChangeText={(value) => updateForm("bank_name", value)} />
          </PersonalSection>

          <PersonalSection title="Trình độ & Kinh nghiệm" icon="school-outline">
            <PersonalEducationExperience form={form} />
          </PersonalSection>

          <PersonalSection title="Tài liệu đính kèm" icon="folder-open-outline">
            <View style={{ marginBottom: 16, zIndex: 999, position: "relative" }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDocTypeDropdownOpen(!docTypeDropdownOpen)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#ffffff",
                  borderColor: "rgba(227, 190, 184, 0.6)",
                  borderWidth: 1,
                  borderRadius: 12,
                  height: 52,
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ fontFamily: appFonts.regular, fontSize: 16, color: "#191c1d" }}>
                  {selectedDocType}
                </Text>
                <Ionicons
                  name={docTypeDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#5b403c"
                />
              </Pressable>

              {docTypeDropdownOpen && (
                <View
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "rgba(227, 190, 184, 0.6)",
                    borderWidth: 1,
                    borderRadius: 12,
                    marginTop: 4,
                    overflow: "hidden",
                    position: "absolute",
                    top: 54,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {['Bằng cấp', 'Chứng chỉ', 'CCCD/CMND', 'Hợp đồng lao động', 'Tài liệu khác'].map((type) => {
                    const isSelected = selectedDocType === type;
                    return (
                      <Pressable
                        key={type}
                        accessibilityRole="button"
                        onPress={() => {
                          setSelectedDocType(type);
                          setDocTypeDropdownOpen(false);
                        }}
                        style={({ pressed }) => [
                          {
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            backgroundColor: isSelected ? "#fdf2f0" : pressed ? "#fcf7f6" : "#ffffff",
                            borderBottomWidth: 1,
                            borderBottomColor: "#fdf2f0",
                          }
                        ]}
                      >
                        <Text
                          style={{
                            fontFamily: isSelected ? appFonts.bold : appFonts.regular,
                            fontSize: 15,
                            color: isSelected ? "#950100" : "#191c1d",
                          }}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {attachments.filter(item => apiText(item.type, "").trim() === selectedDocType).length > 0 ? (
              attachments
                .filter(item => apiText(item.type, "").trim() === selectedDocType)
                .map((item, index) => {
                  const docName = apiText(item.name, "Tài liệu nhân sự");
                  return (
                    <PersonalDocument
                      key={`${apiText(item.name ?? item.url, "document")}-${index}`}
                      title={docName}
                      icon="document-text-outline"
                      url={apiText(item.url ?? item.file_url ?? item.fileUrl ?? item.path ?? item.uri, "")}
                    />
                  );
                })
            ) : (
              <Text style={styles.personalStatusText}>Chưa có tài liệu đính kèm thuộc loại này.</Text>
            )}
            
            <Pressable
              accessibilityRole="button"
              onPress={() => uploadDocument(selectedDocType)}
              disabled={uploading}
              style={({ pressed }) => [styles.personalUploadButton, pressed && styles.pressed]}
            >
              <Ionicons name="share-outline" size={16} color="#5b403c" />
              <Text style={styles.personalUploadText}>{uploading ? "Đang tải lên..." : "Tải lên tài liệu mới"}</Text>
            </Pressable>
          </PersonalSection>
        </View>

        <View style={[styles.personalSaveWrap, { zIndex: docTypeDropdownOpen ? 1 : 2 }]}>
          <Pressable accessibilityRole="button" onPress={saveProfile} disabled={saving} style={({ pressed }) => [styles.personalSaveButton, pressed && styles.pressed]}>
            <Ionicons name="save-outline" size={18} color="#ffffff" />
            <Text style={styles.personalSaveText}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Text>
          </Pressable>
        </View>
      </ScrollView>
      <PersonalDatePickerModal
        value={form.dob}
        visible={dobPickerVisible}
        onClose={() => setDobPickerVisible(false)}
        onSelect={(value) => {
          updateForm("dob", value);
          setDobPickerVisible(false);
        }}
      />

    </SafeAreaView>
  );
}

function PersonalSection({
  children,
  icon,
  title
}: {
  children: ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.personalSection}>
      <View style={styles.personalSectionHeader}>
        <Ionicons name={icon} size={20} color="#6a0100" />
        <Text style={styles.personalSectionTitle}>{title}</Text>
      </View>
      <View style={styles.personalSectionBody}>{children}</View>
    </View>
  );
}

function PersonalField({
  editable = true,
  keyboardType,
  label,
  maxLength,
  multiline,
  onChangeText,
  placeholder,
  value
}: {
  editable?: boolean;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  label: string;
  maxLength?: number;
  multiline?: boolean;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={styles.personalField}>
      <Text style={styles.personalFieldLabel}>{label}</Text>
      <View style={styles.personalInputBox}>
        <TextInput
          editable={editable}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder || "Chưa cập nhật"}
          placeholderTextColor="#8f706b"
          style={[styles.personalInputText, multiline && styles.personalTextArea, !editable && styles.personalInputDisabled]}
          value={value}
        />
      </View>
    </View>
  );
}

function PersonalDateField({
  label,
  onPress,
  value
}: {
  label: string;
  onPress: () => void;
  value: string;
}) {
  const displayValue = formatPersonalDateDisplay(value);

  return (
    <View style={styles.personalField}>
      <Text style={styles.personalFieldLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.personalInputBox, styles.personalDateInputBox, pressed && styles.pressed]}
      >
        <View>
          <Text style={[styles.personalDateText, !displayValue && styles.personalDatePlaceholder]}>
            {displayValue || "Chọn ngày sinh"}
          </Text>
          <Text style={styles.personalDateHint}>Định dạng lưu: YYYY-MM-DD</Text>
        </View>
        <View style={styles.personalDateIconButton}>
          <Ionicons name="calendar-outline" size={20} color="#950100" />
        </View>
      </Pressable>
    </View>
  );
}

function PersonalDatePickerModal({
  onClose,
  onSelect,
  title = "Chọn ngày sinh",
  value,
  visible
}: {
  onClose: () => void;
  onSelect: (value: string) => void;
  title?: string;
  value: string;
  visible: boolean;
}) {
  const initialDate = parsePersonalDate(value) ?? new Date(2000, 0, 1);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [displayMonth, setDisplayMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const cells = personalCalendarCells(displayMonth);
  const todayValue = formatPersonalDateValue(new Date());
  const selectedValue = formatPersonalDateValue(selectedDate);

  useEffect(() => {
    if (!visible) return;

    const nextDate = parsePersonalDate(value) ?? new Date(2000, 0, 1);
    setSelectedDate(nextDate);
    setDisplayMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }, [value, visible]);

  function shiftMonth(offset: number) {
    setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function shiftYear(offset: number) {
    setDisplayMonth((current) => new Date(current.getFullYear() + offset, current.getMonth(), 1));
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.personalDateOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.personalDateModal}>
          <View style={styles.personalDateModalHeader}>
            <View>
              <Text style={styles.personalDateModalTitle}>{title}</Text>
              <Text style={styles.personalDateModalSubtitle}>{formatPersonalDateDisplay(selectedValue)}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>

          <View style={styles.personalCalendarYearRow}>
            <Pressable accessibilityRole="button" onPress={() => shiftYear(-1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="play-back" size={16} color="#950100" />
            </Pressable>
            <Text style={styles.personalCalendarYearText}>Năm {displayMonth.getFullYear()}</Text>
            <Pressable accessibilityRole="button" onPress={() => shiftYear(1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="play-forward" size={16} color="#950100" />
            </Pressable>
          </View>

          <View style={styles.personalCalendarHeader}>
            <Pressable accessibilityRole="button" onPress={() => shiftMonth(-1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="chevron-back" size={20} color="#950100" />
            </Pressable>
            <Text style={styles.personalCalendarTitle}>Tháng {displayMonth.getMonth() + 1}</Text>
            <Pressable accessibilityRole="button" onPress={() => shiftMonth(1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="chevron-forward" size={20} color="#950100" />
            </Pressable>
          </View>

          <View style={styles.personalCalendarWeekdays}>
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <Text key={day} style={styles.personalCalendarWeekday}>{day}</Text>
            ))}
          </View>

          <View style={styles.personalCalendarGrid}>
            {cells.map((day, index) => {
              const date = day ? new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day) : null;
              const dateValue = date ? formatPersonalDateValue(date) : "";
              const selected = dateValue === selectedValue;
              const today = dateValue === todayValue;

              return (
                <View key={`${dateValue || "empty"}-${index}`} style={styles.personalCalendarDayCell}>
                  {day ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSelectedDate(date as Date)}
                      style={[
                        styles.personalCalendarDay,
                        today && styles.personalCalendarDayToday,
                        selected && styles.personalCalendarDaySelected
                      ]}
                    >
                      <Text style={[styles.personalCalendarDayText, selected && styles.personalCalendarDayTextSelected]}>
                        {day}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={styles.personalDateActions}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCancelButton}>
              <Text style={styles.personalDateCancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(formatPersonalDateValue(selectedDate))}
              style={styles.personalDateConfirmButton}
            >
              <Text style={styles.personalDateConfirmText}>Chọn ngày</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}


function personalExperienceRows(value: string) {
  const text = profileValue(value);
  const lines = text
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [
      {
        color: "#eec05b",
        company: "Luxury Real Estate Ltd.",
        meta: "2020 - Hiện tại | Senior Sales Manager"
      },
      {
        color: "#c8c6c5",
        company: "Savills Vietnam",
        meta: "2017 - 2020 | Property Consultant"
      }
    ];
  }

  return lines.map((line, index) => {
    const [company, meta] = line.split(/\s+\|\s+/, 2);
    return {
      color: index === 0 ? "#eec05b" : "#c8c6c5",
      company: meta ? company : index === 0 ? "Kinh nghiệm hiện tại" : "Kinh nghiệm trước đây",
      meta: meta || line
    };
  });
}

function PersonalEducationExperience({ form }: { form: PersonalProfileForm }) {
  const education = profileValue(form.education, "Đại học Kinh tế TP.HCM");
  const major = profileValue(form.major, "Quản trị Kinh doanh Bất động sản");
  const rows = personalExperienceRows(form.experience);

  return (
    <View style={styles.personalEducationBlock}>
      <View style={styles.personalEducation}>
        <Text style={styles.personalMiniLabel}>HỌC VẤN</Text>
        <Text style={styles.personalEducationTitle}>{education}</Text>
        <Text style={styles.personalEducationText}>Chuyên ngành: {major}</Text>
      </View>
      <View style={styles.personalExperience}>
        <Text style={styles.personalMiniLabel}>KINH NGHIỆM LÀM VIỆC</Text>
        <View style={styles.personalExperienceList}>
          {rows.map((row) => (
            <PersonalExperienceRow
              key={`${row.company}-${row.meta}`}
              color={row.color}
              company={row.company}
              meta={row.meta}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function PersonalExperienceRow({
  color,
  company,
  meta
}: {
  color: string;
  company: string;
  meta: string;
}) {
  return (
    <View style={styles.personalExperienceItem}>
      <View style={[styles.personalExperienceDot, { backgroundColor: color }]} />
      <View style={styles.personalExperienceCopy}>
        <Text style={styles.personalExperienceCompany}>{company}</Text>
        <Text style={styles.personalExperienceMeta}>{meta}</Text>
      </View>
    </View>
  );
}

function PersonalDocument({
  icon,
  title,
  url
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  url?: string;
}) {
  const documentUrl = mediaUrl(url);
  const [downloading, setDownloading] = useState(false);

  function viewDocument() {
    if (!documentUrl) {
      notifyError("Tài liệu này chưa có đường dẫn để mở.");
      return;
    }

    router.push({
      pathname: "/employee/document-viewer",
      params: { title, url: documentUrl }
    });
  }

  async function downloadDocument() {
    if (!documentUrl) {
      notifyError("Tài liệu này chưa có đường dẫn để tải về.");
      return;
    }

    setDownloading(true);
    try {
      const fileName = await saveEmployeeDocumentToDevice(documentUrl, title);
      notifySuccess({ message: `Đã chuẩn bị tài liệu: ${fileName}. Chọn "Lưu vào Tệp" để lưu về máy.` });
    } catch (error) {
      appLogger.warn("employee.profile.document.download", "Không thể tải tài liệu nhân sự.", { title, url: documentUrl, error });
      notifyError(error, "Không thể tải tài liệu này.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={styles.personalDocRow}>
      <View style={styles.personalDocTitleRow}>
        <Ionicons name={icon} size={21} color="#950100" />
        <Text numberOfLines={2} style={styles.personalDocTitle}>{title}</Text>
      </View>
      <View style={styles.personalDocActions}>
        <Pressable
          accessibilityLabel={`Xem tài liệu ${title}`}
          accessibilityRole="button"
          disabled={!documentUrl}
          onPress={viewDocument}
          style={({ pressed }) => [styles.personalDocActionButton, pressed && styles.pressed]}
        >
          <Ionicons name="eye-outline" size={18} color={documentUrl ? "#5b403c" : "#b8aaa8"} />
        </Pressable>
        <Pressable
          accessibilityLabel={`Tải tài liệu ${title}`}
          accessibilityRole="button"
          disabled={!documentUrl || downloading}
          onPress={downloadDocument}
          style={({ pressed }) => [styles.personalDocActionButton, pressed && styles.pressed]}
        >
          <Ionicons name={downloading ? "hourglass-outline" : "download-outline"} size={17} color={documentUrl ? "#5b403c" : "#b8aaa8"} />
        </Pressable>
      </View>
    </View>
  );
}

export function ReferralQrScreen() {
  const c = useCopy().qr;
  const { session } = useAuth();
  const userPhone = session?.user?.phone || "";
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  
  const { data: customerQrData } = useEmployeeApiData(() => employeeApi.customerReferralQr(), []);
  const customerQr = referralQrValue(customerQrData);
  const activeQrValue = customerQr;
  const activeReferralCode = isApiObject(customerQrData)
    ? apiText(customerQrData.referral_code ?? customerQrData.referralCode ?? customerQrData.code, "")
    : "";

  async function shareQr() {
    try {
      await Share.share({
        message: referralQrShareText(
          customerQrData,
          activeQrValue || c.customerSubtitle
        )
      });
    } catch (error) {
      appLogger.warn("employee.referral_qr.share", "Không thể chia sẻ mã giới thiệu.", { error });
      notifyError("Không thể chia sẻ mã lúc này.");
    }
  }

  return (
    <EmployeePage back={handleBack} contentStyle={styles.referralQrContent}>
      <Text style={styles.referralQrTitle}>{c.title}</Text>
      
      <ReferralQrPanel 
        copy={c} 
        mode="customer" 
        qrValue={activeQrValue} 
        referralCode={activeReferralCode} 
        onShare={shareQr} 
      />
    </EmployeePage>
  );
}

function ReferralQrSegmentButton({
  active,
  label,
  onPress,
  size
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  size: "narrow" | "wide";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.referralQrSegmentButton,
        size === "wide" ? styles.referralQrSegmentButtonWide : styles.referralQrSegmentButtonNarrow,
        active ? styles.referralQrSegmentButtonGreen : styles.referralQrSegmentButtonMuted,
        pressed && styles.pressed
      ]}
    >
      <Text style={styles.referralQrSegmentText}>{label}</Text>
    </Pressable>
  );
}

function referralQrValue(data: unknown) {
  if (!isApiObject(data)) {
    return "";
  }

  const value = apiText(
    data.qr_url ??
      data.qrUrl ??
      data.qr_image ??
      data.qrImage ??
      data.image_url ??
      data.imageUrl ??
      data.qr_value ??
      data.qrValue ??
      data.qr_data ??
      data.qrData ??
      data.share_url ??
      data.shareUrl ??
      data.url ??
      data.referral_code ??
      data.referralCode ??
      data.code,
    ""
  );

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return value;
}

function referralQrShareText(data: unknown, fallback: string) {
  if (!isApiObject(data)) {
    return fallback;
  }

  return apiText(
    data.share_text ??
      data.shareText ??
      data.description ??
      data.referral_code ??
      data.referralCode,
    fallback
  );
}

function isRemoteImage(value: string) {
  return /^(data:image\/|https?:\/\/.*\.(?:png|jpe?g|webp|gif|svg)(?:$|[?#]))/i.test(value);
}

function isRemoteSvg(value: string) {
  return /\.svg($|\?)/i.test(value);
}

function ReferralQrPanel({
  copy,
  mode = "customer",
  onShare,
  qrValue = "",
  referralCode = ""
}: {
  copy: typeof vi.qr;
  mode?: "recruitment" | "customer";
  onShare?: () => void;
  qrValue?: string;
  referralCode?: string;
}) {
  const helper = mode === "customer" ? copy.customerSubtitle : copy.recruitmentSubtitle;
  const remoteImage = isRemoteImage(qrValue);
  const remoteSvg = remoteImage && isRemoteSvg(qrValue);

  const copyToClipboard = () => {
    if (referralCode) {
      Clipboard.setString(referralCode);
      notifySuccess({ message: "Đã sao chép mã giới thiệu vào bộ nhớ tạm." });
    }
  };

  return (
    <View style={styles.qrCard}>
      <Text style={styles.referralQrHelper}>{helper}</Text>
      <View style={styles.qrImageFrame}>
        {remoteSvg ? (
          <SvgUri height={160} uri={qrValue} width={160} />
        ) : remoteImage ? (
          <Image source={{ uri: qrValue }} style={styles.qrImage} />
        ) : qrValue ? (
          <QRCode backgroundColor="#ffffff" color="#191C1D" size={160} value={qrValue} />
        ) : (
          <ReferralQrCode />
        )}
      </View>

      {referralCode ? (
        <Pressable 
          accessibilityRole="button"
          onPress={copyToClipboard}
          style={({ pressed }) => [styles.referralCodeContainer, pressed && styles.pressed]}
        >
          <Text style={styles.referralCodeLabel}>MÃ GIỚI THIỆU CỦA BẠN</Text>
          <View style={styles.referralCodeRow}>
            <Text style={styles.referralCodeText}>{referralCode}</Text>
            <Ionicons name="copy-outline" size={16} color={employeePalette.red} />
          </View>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onShare}
        style={({ pressed }) => [styles.qrShareButton, pressed && styles.pressed]}
      >
        <Ionicons name="share-social-outline" size={17} color="#ffffff" />
        <Text style={styles.qrShareText}>{copy.share}</Text>
      </Pressable>
    </View>
  );
}

function ReferralQrCode() {
  return (
    <Svg height="100%" viewBox="0 0 160 160" width="100%">
      <Path d="M0 0H70V70H0V0V0M10 10V60H60V10H10V10" fill="#191C1D" />
      <Path d="M20 20H50V50H20V20V20" fill="#191C1D" />
      <Path d="M90 0H160V70H90V0V0M100 10V60H150V10H100V10" fill="#191C1D" />
      <Path d="M110 20H140V50H110V20V20" fill="#191C1D" />
      <Path d="M0 90H70V160H0V90V90M10 100V150H60V100H10V100" fill="#191C1D" />
      <Path d="M20 110H50V140H20V110V110" fill="#191C1D" />
      <Path d="M90 90H110V110H90V90V90" fill="#191C1D" />
      <Path d="M120 90H140V110H120V90V90" fill="#191C1D" />
      <Path d="M140 110H160V130H140V110V110" fill="#191C1D" />
      <Path d="M110 120H130V140H110V120V120" fill="#191C1D" />
      <Path d="M90 140H110V160H90V140V140" fill="#191C1D" />
      <Path d="M130 140H160V160H130V140V140" fill="#191C1D" />
    </Svg>
  );
}

export function LeaveRequestsScreen() {
  const { session } = useAuth();

  if (!isManagerAccessRole(session?.user.role)) {
    return <EmployeeLeaveSelfServiceScreen />;
  }

  return <LeaveApprovalRequestsScreen />;
}

function LeaveApprovalRequestsScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.leaveRequests(), [refreshKey]);
  const [filter, setFilter] = useState<LeaveStatusFilter>("all");
  const rows = leaveRowsFromApi(data);
  const filteredRows = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.leaveSafe}>
      <View style={styles.leaveHeader}>
        <Pressable accessibilityRole="button" onPress={handleBack} style={styles.leaveHeaderButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </Pressable>
        <Text style={styles.leaveHeaderTitle}>Xin nghỉ phép</Text>
        <EmployeeNotificationButton returnTo="/employee/leave-requests" />
      </View>

      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.leaveScrollContent}
        style={styles.leaveRoot}
      >
        <View style={styles.leaveIntro}>
          <Text style={styles.leaveTitle}>Danh sách Xin nghỉ phép</Text>
          <Text style={styles.leaveSubtitle}>Quản lý và phê duyệt yêu cầu nghỉ phép của nhân viên.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leaveFilterContent}
          style={styles.leaveFilterScroll}
        >
          {leaveFilterTabs.map((tab) => (
            <Pressable
              key={tab.value}
              accessibilityRole="button"
              onPress={() => setFilter(tab.value)}
              style={[styles.leaveFilterChip, filter === tab.value && styles.leaveFilterChipActive]}
            >
              <Text style={[styles.leaveFilterText, filter === tab.value && styles.leaveFilterTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {failed ? (
          <Text style={styles.leaveStateText}>Không thể tải dữ liệu nghỉ phép. Vui lòng thử lại.</Text>
        ) : null}
        {loading ? <Text style={styles.leaveStateText}>Đang tải danh sách nghỉ phép...</Text> : null}
        {!loading && !failed && filteredRows.length === 0 ? (
          <Text style={styles.leaveStateText}>Chưa có yêu cầu nghỉ phép nào.</Text>
        ) : null}

        <View style={styles.leaveList}>
          {filteredRows.map((row) => (
            <LeaveRequestCard
              key={row.id}
              onChanged={() => setRefreshKey((value) => value + 1)}
              request={row}
              collapsibleDetails={true}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type EmployeeLeaveForm = {
  end_date: string;
  leave_type: string;
  reason: string;
  start_date: string;
};

type EmployeeLeaveHistoryRow = {
  dateRange: string;
  id: string;
  leaveType: string;
  reason: string;
  rejectionReason: string;
  status: LeaveRequestCardData["status"] | "cancelled";
};

const leaveTypeOptions = [
  { label: "Nghỉ phép năm", value: "1" },
  { label: "Nghỉ không lương", value: "2" },
  { label: "Nghỉ cá nhân", value: "3" },
  { label: "Nghỉ thai sản", value: "4" },
  { label: "Nghỉ công tác", value: "5" },
  { label: "Nghỉ bù", value: "6" }
];

function defaultLeaveForm(): EmployeeLeaveForm {
  const today = formatPersonalDateValue(new Date());

  return {
    end_date: today,
    leave_type: leaveTypeOptions[0].value,
    reason: "",
    start_date: today
  };
}

function leaveTypeLabel(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const aliases: Record<string, string> = {
    annual: "1",
    unpaid: "2",
    personal: "3",
    maternity: "4",
    business: "5",
    compensatory: "6"
  };
  const optionValue = aliases[normalized] ?? normalized;
  return leaveTypeOptions.find((option) => option.value === optionValue)?.label || apiText(value, "Nghỉ phép");
}

function normalizeLeaveHistoryStatus(status: unknown): EmployeeLeaveHistoryRow["status"] {
  const value = String(status ?? "").trim().toLowerCase();
  if (["4", "cancelled"].includes(value) || value.includes("hủy")) return "cancelled";
  return normalizeLeaveStatus(status);
}

function leaveHistoryRowsFromApi(data: unknown): EmployeeLeaveHistoryRow[] {
  return apiList(data).map((item, index) => ({
    dateRange: formatLeaveDateRange(item),
    id: apiText(item.id, `leave-history-${index}`),
    leaveType: leaveTypeLabel(item.leave_type ?? item.leaveType ?? item.type),
    reason: apiText(item.reason ?? item.detail ?? item.note, "Chưa cập nhật lý do nghỉ."),
    rejectionReason: apiText(item.rejection_reason ?? item.rejectionReason, ""),
    status: normalizeLeaveHistoryStatus(item.status ?? item.status_label)
  }));
}

function EmployeeLeaveSelfServiceScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const [form, setForm] = useState<EmployeeLeaveForm>(() => defaultLeaveForm());
  const [dateField, setDateField] = useState<"start_date" | "end_date" | null>(null);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.leaveHistory(), [refreshKey]);
  const historyRows = leaveHistoryRowsFromApi(data);
  const selectedLeaveType = leaveTypeLabel(form.leave_type);

  function updateForm(key: keyof EmployeeLeaveForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitLeaveRequest() {
    const normalizedReason = form.reason.trim();

    if (!form.leave_type || !form.start_date || !form.end_date || !normalizedReason) {
      notifyError("Vui lòng nhập đầy đủ thông tin nghỉ phép.");
      return;
    }

    if (normalizedReason.length < 5) {
      notifyError("Lý do nghỉ phép phải có ít nhất 5 ký tự.");
      return;
    }

    if (form.end_date < form.start_date) {
      notifyError("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await employeeApi.createLeaveRequest({
        end_date: form.end_date,
        leave_type: form.leave_type,
        reason: normalizedReason,
        start_date: form.start_date
      });

      notifySuccess({ message: response.message || "Gửi yêu cầu nghỉ phép thành công." });
      setForm((current) => ({ ...current, reason: "" }));
      setRefreshKey((current) => current + 1);
    } catch (error) {
      notifyError(error, "Không thể gửi yêu cầu nghỉ phép. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.leaveSafe}>
      <View style={styles.leaveHeader}>
        <Pressable accessibilityRole="button" onPress={handleBack} style={styles.leaveHeaderButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </Pressable>
        <Text style={styles.leaveHeaderTitle}>Xin nghỉ phép</Text>
        <EmployeeNotificationButton returnTo="/employee/leave-requests" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.leaveScrollContent}
        style={styles.leaveRoot}
      >
        <View style={styles.leaveIntroCompact}>
          <Text style={styles.leaveTitle}>Tạo đơn nghỉ phép</Text>
          <Text style={styles.leaveSubtitle}>Gửi yêu cầu để quản lý xét duyệt theo quy trình nhân sự.</Text>
        </View>

        <View style={styles.leaveFormCard}>
          <Text style={styles.leaveFormTitle}>Thông tin nghỉ phép</Text>
          <View style={styles.personalField}>
            <Text style={styles.personalFieldLabel}>Loại nghỉ phép</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setTypeModalVisible(true)}
              style={({ pressed }) => [styles.leaveTypeButton, pressed && styles.pressed]}
            >
              <Text style={styles.leaveTypeButtonText}>{selectedLeaveType}</Text>
              <Ionicons name="chevron-down" size={18} color="#950100" />
            </Pressable>
          </View>

          <PersonalDateField label="Ngày bắt đầu" value={form.start_date} onPress={() => setDateField("start_date")} />
          <PersonalDateField label="Ngày kết thúc" value={form.end_date} onPress={() => setDateField("end_date")} />
          <PersonalField
            label="Lý do nghỉ"
            multiline
            onChangeText={(value: string) => updateForm("reason", value)}
            placeholder="Nhập lý do nghỉ phép"
            value={form.reason}
          />

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={submitLeaveRequest}
            style={({ pressed }) => [styles.leaveSubmitButton, (pressed || submitting) && styles.pressed]}
          >
            <Ionicons name="send" size={18} color="#ffffff" />
            <Text style={styles.leaveSubmitText}>{submitting ? "Đang gửi yêu cầu" : "Gửi yêu cầu"}</Text>
          </Pressable>
        </View>

        <View style={styles.leaveHistoryHeader}>
          <Text style={styles.leaveHistoryTitle}>Lịch sử nghỉ phép</Text>
          {loading ? <Text style={styles.leaveHistoryMeta}>Đang tải...</Text> : <Text style={styles.leaveHistoryMeta}>{historyRows.length} đơn</Text>}
        </View>

        {failed ? <Text style={styles.leaveStateText}>Không thể tải lịch sử nghỉ phép. Vui lòng thử lại.</Text> : null}
        {!loading && historyRows.length === 0 ? <Text style={styles.leaveStateText}>Chưa có lịch sử nghỉ phép.</Text> : null}

        <View style={styles.leaveList}>
          {historyRows.map((row) => (
            <EmployeeLeaveHistoryCard key={row.id} request={row} onChanged={() => setRefreshKey((current) => current + 1)} />
          ))}
        </View>
      </ScrollView>

      <LeaveTypePickerModal
        onClose={() => setTypeModalVisible(false)}
        onSelect={(value) => {
          updateForm("leave_type", value);
          setTypeModalVisible(false);
        }}
        value={form.leave_type}
        visible={typeModalVisible}
      />
      <PersonalDatePickerModal
        title={dateField === "end_date" ? "Chọn ngày kết thúc" : "Chọn ngày bắt đầu"}
        value={dateField ? form[dateField] : form.start_date}
        visible={dateField !== null}
        onClose={() => setDateField(null)}
        onSelect={(value) => {
          if (dateField) updateForm(dateField, value);
          setDateField(null);
        }}
      />
    </SafeAreaView>
  );
}

function leaveHistoryStatusLabel(status: EmployeeLeaveHistoryRow["status"]) {
  if (status === "approved") return "Đã duyệt";
  if (status === "rejected") return "Từ chối";
  if (status === "cancelled") return "Đã hủy";
  return "Chờ duyệt";
}

function EmployeeLeaveHistoryCard({
  onChanged,
  request
}: {
  onChanged: () => void;
  request: EmployeeLeaveHistoryRow;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const isPending = request.status === "pending";
  const isRejected = request.status === "rejected";
  const isCancelled = request.status === "cancelled";
  const badgeStyle =
    request.status === "approved"
      ? styles.leaveBadgeApproved
      : isRejected || isCancelled
        ? styles.leaveBadgeRejected
        : styles.leaveBadgePending;
  const badgeTextStyle =
    request.status === "approved"
      ? styles.leaveBadgeApprovedText
      : isRejected || isCancelled
        ? styles.leaveBadgeRejectedText
        : styles.leaveBadgePendingText;

  async function cancelRequest() {
    setSubmitting(true);
    try {
      const response = await employeeApi.cancelLeaveRequest(request.id);
      notifySuccess({ message: response.message || "Hủy yêu cầu nghỉ phép thành công." });
      onChanged();
    } catch (error) {
      notifyError(error, "Không thể hủy yêu cầu nghỉ phép. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.leaveCard, (isRejected || isCancelled) && styles.leaveCardRejected]}>
      <View style={styles.leaveHistoryCardTop}>
        <View style={styles.leaveHistoryCardTitleRow}>
          <Ionicons name="calendar-outline" size={18} color="#950100" />
          <Text style={styles.leaveHistoryCardTitle}>{request.leaveType}</Text>
        </View>
        <View style={[styles.leaveBadge, badgeStyle]}>
          <Text style={[styles.leaveBadgeText, badgeTextStyle]}>{leaveHistoryStatusLabel(request.status)}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setDetailsExpanded((value) => !value)}
        style={({ pressed }) => [styles.leaveDetailBox, styles.leaveDetailBoxPressable, pressed && styles.pressed]}
      >
        <View style={styles.leaveDetailRow}>
          <Ionicons name="time-outline" size={16} color="#950100" />
          <Text numberOfLines={detailsExpanded ? undefined : 1} style={styles.leaveDateText}>{request.dateRange}</Text>
          <Ionicons name={detailsExpanded ? "chevron-up" : "chevron-down"} size={16} color="#8f706b" />
        </View>
        <View style={styles.leaveDetailRow}>
          <Ionicons name="menu-outline" size={16} color="#5b403c" />
          <Text numberOfLines={detailsExpanded ? undefined : 2} style={styles.leaveReasonText}>{request.reason}</Text>
        </View>
        {request.rejectionReason ? (
          <View style={styles.leaveDetailRow}>
            <Ionicons name="alert-circle-outline" size={16} color="#93000a" />
            <Text numberOfLines={detailsExpanded ? undefined : 2} style={styles.leaveReasonText}>{request.rejectionReason}</Text>
          </View>
        ) : null}
      </Pressable>

      {isPending ? (
        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={cancelRequest}
          style={({ pressed }) => [styles.leaveCancelButton, (pressed || submitting) && styles.pressed]}
        >
          <Text style={styles.leaveCancelText}>{submitting ? "Đang hủy" : "Hủy yêu cầu"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function LeaveTypePickerModal({
  onClose,
  onSelect,
  value,
  visible
}: {
  onClose: () => void;
  onSelect: (value: string) => void;
  value: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.transferRejectOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.leaveTypeModal}>
          <View style={styles.leaveTypeModalHeader}>
            <Text style={styles.leaveTypeModalTitle}>Chọn loại nghỉ phép</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>
          <View style={styles.leaveTypeModalList}>
            {leaveTypeOptions.map((option) => {
              const active = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => onSelect(option.value)}
                  style={({ pressed }) => [styles.leaveTypeOption, active && styles.leaveTypeOptionActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.leaveTypeOptionText, active && styles.leaveTypeOptionTextActive]}>{option.label}</Text>
                  {active ? <Ionicons name="checkmark" size={18} color="#950100" /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

type LeaveStatusFilter = "all" | "pending" | "approved" | "rejected";

type LeaveRequestCardData = {
  id: string;
  name: string;
  department: string;
  dateRange: string;
  reason: string;
  status: Exclude<LeaveStatusFilter, "all">;
  avatar: ImageSourcePropType;
};

const leaveFilterTabs: { label: string; value: LeaveStatusFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đã duyệt", value: "approved" },
  { label: "Từ chối", value: "rejected" }
];

type DepartmentOption = {
  label: string;
  value: string;
};

const fallbackDepartmentOptions: DepartmentOption[] = [
  { label: "Phòng Kinh doanh", value: "Phòng Kinh doanh" },
  { label: "Phòng Marketing", value: "Phòng Marketing" },
  { label: "Phòng Chăm sóc khách hàng", value: "Phòng Chăm sóc khách hàng" },
  { label: "Phòng Vận hành khu đất", value: "Phòng Vận hành khu đất" },
  { label: "Phòng Tài chính", value: "Phòng Tài chính" },
  { label: "Phòng Nhân sự", value: "Phòng Nhân sự" },
  { label: "Phòng IT", value: "Phòng IT" }
];

const hiddenTransferDepartmentNames = [
  "all",
  "tất cả",
  "tat ca",
  "system",
  "hệ thống",
  "he thong",
  "khách hàng",
  "khach hang",
  "phòng khách hàng",
  "phong khach hang"
];

function normalizeDepartmentName(value: unknown) {
  return apiText(value, "").trim().toLocaleLowerCase("vi-VN");
}

function departmentOptionsFromApi(data: unknown, currentDepartment: string): DepartmentOption[] {
  const rows = apiList(data);
  const apiOptions = rows
    .map((item) => {
      const value = apiText(item.value ?? item.name ?? item.department ?? item.label, "").trim();
      const label = apiText(item.label ?? item.name ?? item.department ?? item.value, value).trim();

      return value ? { label: label || value, value } : null;
    })
    .filter((item): item is DepartmentOption => item !== null);
  const source = apiOptions.length > 0 ? apiOptions : fallbackDepartmentOptions;
  const current = normalizeDepartmentName(currentDepartment);
  const unique = new Map<string, DepartmentOption>();

  source.forEach((option) => {
    const key = normalizeDepartmentName(option.value);

    if (
      !key ||
      key === current ||
      key === normalizeDepartmentName("Chưa cập nhật") ||
      hiddenTransferDepartmentNames.includes(key)
    ) {
      return;
    }

    unique.set(key, option);
  });

  return Array.from(unique.values());
}

function normalizeLeaveStatus(status: unknown): LeaveRequestCardData["status"] {
  const value = String(status ?? "").trim().toLowerCase();
  if (["1", "pending"].includes(value) || value.includes("pending") || value.includes("chờ")) return "pending";
  if (["2", "approved"].includes(value) || value.includes("approve") || value.includes("đã duyệt")) return "approved";
  if (["3", "rejected"].includes(value) || value.includes("reject") || value.includes("từ chối")) return "rejected";
  return "pending";
}

function formatLeaveDateRange(item: ApiObject) {
  const from = apiText(item.start_date ?? item.from_date ?? item.startDate, "");
  const to = apiText(item.end_date ?? item.to_date ?? item.endDate, "");
  const days = apiNumber(item.number_of_days ?? item.total_days ?? item.days ?? item.duration_days, 0);
  if (!from && !to) return "";
  if (!to) return `${formatDisplayDate(from)} (${days} ngày)`;
  return `${formatDisplayDate(from)} - ${formatDisplayDate(to)} (${days} ngày)`;
}

function formatDisplayDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function defaultTransferDateValue() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return formatPersonalDateValue(date);
}

function formatTransferRequestDate(item: ApiObject) {
  const desiredDate = apiText(item.desired_transfer_date ?? item.transfer_date ?? item.requested_date, "");
  if (desiredDate) {
    return `Ngày mong muốn: ${formatDisplayDate(desiredDate)}`;
  }

  return formatLeaveDateRange(item);
}

function leaveRowsFromApi(data: unknown): LeaveRequestCardData[] {
  const rows = apiList(data);
  if (rows.length === 0) return [];

  return rows.map((item, index) => {
    const status = normalizeLeaveStatus(item.status ?? item.status_label);
    return {
      id: apiText(item.id, `leave-${index}`),
      name: apiText(item.employee_name ?? item.user_name ?? item.name ?? item.requester_name, ""),
      department: apiText(item.department_name ?? item.department ?? item.employee_department, ""),
      dateRange: formatLeaveDateRange(item),
      reason: apiText(item.reason ?? item.detail ?? item.note, ""),
      status,
      avatar: { uri: "" }
    };
  });
}

function transferRowsFromApi(data: unknown): LeaveRequestCardData[] {
  const rows = apiList(data);
  if (rows.length === 0) return [];

  return rows.map((item, index) => {
    const status = normalizeLeaveStatus(item.status ?? item.status_label);
    const fromDepartment = apiText(item.from_department ?? item.current_department ?? item.old_department, "");
    const toDepartment = apiText(item.to_department ?? item.target_department ?? item.new_department, "");
    const routeText = fromDepartment && toDepartment
      ? `${fromDepartment} → ${toDepartment}`
      : apiText(item.target_department ?? item.to_department ?? item.new_department, "");
    const detailText = apiText(item.reason ?? item.detail ?? item.note, "");

    return {
      id: apiText(item.id, `transfer-${index}`),
      name: apiText(item.employee_name ?? item.user_name ?? item.name ?? item.requester_name, ""),
      department: apiText(item.department_name ?? item.department ?? item.current_department ?? item.from_department, ""),
      dateRange: formatTransferRequestDate(item),
      reason: detailText ? `${routeText} · ${detailText}` : routeText,
      status,
      avatar: { uri: "" }
    };
  });
}

function LeaveRequestCard({
  collapsibleDetails = false,
  onChanged,
  request,
  requestType = "leave",
  showActions = true
}: {
  collapsibleDetails?: boolean;
  onChanged?: () => void;
  request: LeaveRequestCardData;
  requestType?: "leave" | "transfer";
  showActions?: boolean;
}) {
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const isPending = request.status === "pending";
  const isRejected = request.status === "rejected";
  const badgeStyle =
    request.status === "approved"
      ? styles.leaveBadgeApproved
      : request.status === "rejected"
        ? styles.leaveBadgeRejected
        : styles.leaveBadgePending;
  const badgeTextStyle =
    request.status === "approved"
      ? styles.leaveBadgeApprovedText
      : request.status === "rejected"
        ? styles.leaveBadgeRejectedText
        : styles.leaveBadgePendingText;
  const badgeLabel = request.status === "approved" ? "Đã duyệt" : request.status === "rejected" ? "Từ chối" : "Chờ duyệt";

  async function approve() {
    setSubmitting("approve");
    try {
      if (requestType === "transfer") {
        await employeeApi.approveDepartmentTransfer(request.id);
      } else {
        await employeeApi.approveLeaveRequest(request.id);
      }
      notifySuccess({ message: requestType === "transfer" ? "Đã duyệt yêu cầu chuyển phòng ban." : "Đã duyệt đơn nghỉ phép." });
      onChanged?.();
    } catch (error) {
      notifyError(error);
      onChanged?.();
    } finally {
      setSubmitting(null);
    }
  }

  async function reject(reason?: string) {
    const normalizedReason = reason?.trim();

    if (!normalizedReason) {
      notifyError(new Error("Vui lòng nhập lý do từ chối."));
      return;
    }

    setSubmitting("reject");
    try {
      if (requestType === "transfer") {
        await employeeApi.rejectDepartmentTransfer(request.id, normalizedReason);
      } else {
        await employeeApi.rejectLeaveRequest(request.id, normalizedReason);
      }
      notifySuccess({ message: requestType === "transfer" ? "Đã từ chối yêu cầu chuyển phòng ban." : "Đã từ chối đơn nghỉ phép." });
      setRejectModalVisible(false);
      setRejectReason("");
      onChanged?.();
    } catch (error) {
      notifyError(error);
      onChanged?.();
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <View style={[styles.leaveCard, isRejected && styles.leaveCardRejected]}>
      <View style={styles.leaveCardTop}>
        <View style={styles.leavePerson}>
          <Image source={request.avatar} style={styles.leaveAvatar} />
          <View style={styles.leavePersonText}>
            <Text numberOfLines={1} style={styles.leaveName}>{request.name}</Text>
            <Text numberOfLines={1} style={styles.leaveDepartment}>{request.department}</Text>
          </View>
        </View>
        <View style={[styles.leaveBadge, badgeStyle]}>
          <Text style={[styles.leaveBadgeText, badgeTextStyle]}>{badgeLabel}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole={collapsibleDetails ? "button" : undefined}
        disabled={!collapsibleDetails}
        onPress={() => setDetailsExpanded((value) => !value)}
        style={({ pressed }) => [styles.leaveDetailBox, collapsibleDetails && styles.leaveDetailBoxPressable, pressed && styles.pressed]}
      >
        <View style={styles.leaveDetailRow}>
          <Ionicons name="calendar-outline" size={16} color="#950100" />
          <Text numberOfLines={detailsExpanded ? undefined : 1} style={styles.leaveDateText}>{request.dateRange}</Text>
          {collapsibleDetails ? (
            <Ionicons name={detailsExpanded ? "chevron-up" : "chevron-down"} size={16} color="#8f706b" />
          ) : null}
        </View>
        <View style={styles.leaveDetailRow}>
          <Ionicons name="menu-outline" size={16} color="#5b403c" />
          <Text numberOfLines={detailsExpanded ? undefined : 1} style={styles.leaveReasonText}>{request.reason}</Text>
        </View>
      </Pressable>

      {isPending && showActions ? (
        <View style={styles.leaveActions}>
          <Pressable
            accessibilityRole="button"
            disabled={submitting !== null}
            onPress={approve}
            style={({ pressed }) => [styles.leaveApproveButton, pressed && styles.pressed]}
          >
            <Text style={styles.leaveApproveText}>{submitting === "approve" ? "Đang duyệt" : "Duyệt"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={submitting !== null}
            onPress={() => {
              setRejectModalVisible(true);
            }}
            style={({ pressed }) => [styles.leaveRejectButton, pressed && styles.pressed]}
          >
            <Text style={styles.leaveRejectText}>{submitting === "reject" ? "Đang từ chối" : "Từ chối"}</Text>
          </Pressable>
        </View>
      ) : null}
      {showActions ? (
        <Modal animationType="fade" transparent visible={rejectModalVisible} onRequestClose={() => setRejectModalVisible(false)}>
          <View style={styles.transferRejectOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setRejectModalVisible(false)} />
            <View style={styles.transferRejectModal}>
              <Text style={styles.transferRejectTitle}>Lý do từ chối</Text>
              <Text style={styles.transferRejectSubtitle}>
                {requestType === "transfer"
                  ? "Ghi rõ lý do để nhân viên có đủ thông tin điều chỉnh yêu cầu."
                  : "Ghi rõ lý do để nhân viên nắm được quyết định duyệt nghỉ phép."}
              </Text>
              <TextInput
                multiline
                onChangeText={setRejectReason}
                placeholder="Nhập lý do từ chối..."
                placeholderTextColor="#9ca3af"
                style={styles.transferRejectInput}
                value={rejectReason}
              />
              <View style={styles.transferRejectActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setRejectModalVisible(false)}
                  style={styles.transferRejectCancel}
                >
                  <Text style={styles.transferRejectCancelText}>Hủy</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={submitting === "reject"}
                  onPress={() => reject(rejectReason)}
                  style={({ pressed }) => [styles.transferRejectConfirm, pressed && styles.pressed]}
                >
                  <Text style={styles.transferRejectConfirmText}>{submitting === "reject" ? "Đang gửi" : "Từ chối"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

export function TransferRequestsScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const { session } = useAuth();
  const canApproveDepartmentTransfers = isDepartmentTransferApproverRole(session?.user.role);

  if (!canApproveDepartmentTransfers) {
    return <DepartmentTransferCreateScreen onBack={handleBack} />;
  }

  return <DepartmentTransferReviewScreen onBack={handleBack} />;
}

function DepartmentTransferReviewScreen({ onBack }: { onBack: () => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.departmentTransfers({ per_page: 50 }), [refreshKey]);
  const [filter, setFilter] = useState<LeaveStatusFilter>("all");
  const rows = transferRowsFromApi(data);
  const filteredRows = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.leaveSafe}>
      <View style={styles.leaveHeader}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.leaveHeaderButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </Pressable>
        <Text style={styles.leaveHeaderTitle}>Xin chuyển phòng ban</Text>
        <EmployeeNotificationButton returnTo="/employee/transfer-requests" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.leaveScrollContent}
        style={styles.leaveRoot}
      >
        <View style={styles.leaveIntro}>
          <Text style={styles.leaveTitle}>Danh sách xin chuyển phòng ban</Text>
          <Text style={styles.leaveSubtitle}>Quản lý, duyệt hoặc từ chối yêu cầu chuyển phòng ban của nhân viên.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leaveFilterContent}
          style={styles.leaveFilterScroll}
        >
          {leaveFilterTabs.map((tab) => (
            <Pressable
              key={tab.value}
              accessibilityRole="button"
              onPress={() => setFilter(tab.value)}
              style={[styles.leaveFilterChip, filter === tab.value && styles.leaveFilterChipActive]}
            >
              <Text style={[styles.leaveFilterText, filter === tab.value && styles.leaveFilterTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {failed ? (
          <Text style={styles.leaveStateText}>Không thể tải dữ liệu chuyển phòng ban. Vui lòng thử lại.</Text>
        ) : null}
        {loading ? <Text style={styles.leaveStateText}>Đang tải danh sách chuyển phòng ban...</Text> : null}
        {!loading && filteredRows.length === 0 ? (
          <Text style={styles.leaveStateText}>Chưa có yêu cầu chuyển phòng ban phù hợp.</Text>
        ) : null}

        <View style={styles.leaveList}>
          {filteredRows.map((row) => (
            <LeaveRequestCard
              key={row.id}
              onChanged={() => setRefreshKey((value) => value + 1)}
              request={row}
              requestType="transfer"
              collapsibleDetails={true}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DepartmentTransferCreateScreen({ onBack }: { onBack: () => void }) {
  const { session } = useAuth();
  const currentDepartment = apiText(session?.user.department, "Chưa cập nhật");

  const [branches, setBranches] = useState<{ id: number | string; name: string }[]>([]);
  const [targetBranch, setTargetBranch] = useState("");
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);

  const [departmentsData, setDepartmentsData] = useState<unknown>(null);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsFailed, setDepartmentsFailed] = useState(false);

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const {
    data: historyData,
    failed: historyFailed,
    loading: historyLoading
  } = useEmployeeApiData(() => employeeApi.departmentTransferHistory({ per_page: 50 }), [historyRefreshKey]);
  const [targetDepartment, setTargetDepartment] = useState("");
  const [desiredTransferDate, setDesiredTransferDate] = useState(defaultTransferDateValue);
  const [reason, setReason] = useState("");
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [departmentPickerVisible, setDepartmentPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const departmentOptions = departmentOptionsFromApi(departmentsData, currentDepartment);
  const selectedTargetDepartment = departmentOptions.find((option) => option.value === targetDepartment);
  const historyRows = transferRowsFromApi(historyData);

  useEffect(() => {
    employeeApi.recruitmentBranches()
      .then((res) => {
        if (res && Array.isArray(res.data)) {
          setBranches(res.data);
        }
      })
      .catch((err) => console.log("Failed to fetch branches in transfer", err));
  }, []);

  useEffect(() => {
    if (!targetBranch) {
      setDepartmentsData(null);
      return;
    }
    setDepartmentsLoading(true);
    setDepartmentsFailed(false);
    employeeApi.departments({ branch_id: String(targetBranch) })
      .then((res) => {
        if (res && res.data) {
          setDepartmentsData(res.data);
        } else {
          setDepartmentsFailed(true);
        }
      })
      .catch(() => {
        setDepartmentsFailed(true);
      })
      .finally(() => {
        setDepartmentsLoading(false);
      });
  }, [targetBranch]);

  useEffect(() => {
    setTargetDepartment("");
  }, [targetBranch]);

  useEffect(() => {
    if (!targetDepartment) return;
    if (departmentOptions.some((option) => option.value === targetDepartment)) return;

    setTargetDepartment("");
  }, [departmentOptions, targetDepartment]);

  async function submitTransferRequest() {
    const normalizedTarget = targetDepartment.trim();
    const normalizedReason = reason.trim();

    if (!normalizedTarget || !desiredTransferDate || !normalizedReason) {
      notifyError(new Error("Vui lòng nhập phòng ban muốn chuyển, ngày mong muốn và lý do."));
      return;
    }

    if (normalizeDepartmentName(normalizedTarget) === normalizeDepartmentName(currentDepartment)) {
      notifyError(new Error("Phòng ban muốn chuyển không được trùng với phòng ban hiện tại."));
      return;
    }

    const selectedDate = parsePersonalDate(desiredTransferDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!selectedDate || selectedDate < today) {
      notifyError(new Error("Ngày mong muốn chuyển phải từ hôm nay trở đi."));
      return;
    }

    setSubmitting(true);
    try {
      const response = await employeeApi.createDepartmentTransfer({
        desired_transfer_date: desiredTransferDate,
        reason: normalizedReason,
        target_department: normalizedTarget
      });

      notifySuccess({ message: response.message || "Gửi yêu cầu chuyển phòng ban thành công." });
      setTargetDepartment("");
      setReason("");
      setHistoryRefreshKey((current) => current + 1);
    } catch (error) {
      notifyError(error, "Không thể gửi yêu cầu chuyển phòng ban.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.leaveSafe}>
      <View style={styles.leaveHeader}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.leaveHeaderButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </Pressable>
        <Text style={styles.leaveHeaderTitle}>Xin chuyển phòng ban</Text>
        <EmployeeNotificationButton returnTo="/employee/transfer-requests" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.transferCreateContent}
        style={styles.leaveRoot}
      >
        <View style={styles.leaveIntro}>
          <Text style={styles.leaveTitle}>Yêu cầu chuyển phòng ban</Text>
          <Text style={styles.leaveSubtitle}>Gửi yêu cầu đến bộ phận phê duyệt theo đúng quy trình nhân sự.</Text>
        </View>

        <View style={styles.transferCreateCard}>
          <View style={styles.transferCurrentDepartmentBox}>
            <Ionicons name="business-outline" size={18} color="#950100" />
            <View style={styles.flex}>
              <Text style={styles.transferCurrentDepartmentLabel}>PHÒNG BAN HIỆN TẠI</Text>
              <Text style={styles.transferCurrentDepartmentText}>{currentDepartment}</Text>
            </View>
          </View>

          <View style={styles.transferField}>
            <Text style={styles.transferLabel}>CHI NHÁNH MUỐN CHUYỂN</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setBranchPickerVisible(true)}
              style={({ pressed }) => [
                styles.transferDepartmentSelect,
                pressed && styles.pressed
              ]}
            >
              <Text style={[styles.transferDepartmentSelectText, !targetBranch && styles.transferDepartmentPlaceholder]}>
                {branches.find(b => String(b.id) === targetBranch)?.name || "Chọn chi nhánh muốn chuyển"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#950100" />
            </Pressable>
          </View>

          <View style={styles.transferField}>
            <Text style={styles.transferLabel}>PHÒNG BAN MUỐN CHUYỂN</Text>
            <Pressable
              accessibilityRole="button"
              disabled={!targetBranch || departmentsLoading || departmentOptions.length === 0}
              onPress={() => setDepartmentPickerVisible(true)}
              style={({ pressed }) => [
                styles.transferDepartmentSelect,
                (!targetBranch || departmentsLoading || departmentOptions.length === 0) && styles.transferDepartmentSelectDisabled,
                pressed && styles.pressed
              ]}
            >
              <Text style={[styles.transferDepartmentSelectText, !selectedTargetDepartment && styles.transferDepartmentPlaceholder]}>
                {!targetBranch
                  ? "Vui lòng chọn chi nhánh trước"
                  : selectedTargetDepartment?.label || (departmentsLoading ? "Đang tải phòng ban..." : "Chọn phòng ban muốn chuyển")}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#950100" />
            </Pressable>
            {departmentsFailed ? (
              <Text style={styles.transferHelperText}>Không tải được danh sách phòng ban.</Text>
            ) : null}
          </View>

          <View style={styles.transferField}>
            <Text style={styles.transferLabel}>NGÀY MONG MUỐN CHUYỂN</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDatePickerVisible(true)}
              style={({ pressed }) => [styles.transferDateInput, pressed && styles.pressed]}
            >
              <Text style={styles.transferDateText}>{formatPersonalDateDisplay(desiredTransferDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#950100" />
            </Pressable>
          </View>

          <View style={styles.transferField}>
            <Text style={styles.transferLabel}>LÝ DO CHUYỂN PHÒNG BAN</Text>
            <TextInput
              multiline
              onChangeText={setReason}
              placeholder="Nhập lý do và bối cảnh chuyển phòng ban..."
              placeholderTextColor="#9ca3af"
              style={[styles.transferInput, styles.transferTextArea]}
              textAlignVertical="top"
              value={reason}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={submitTransferRequest}
            style={({ pressed }) => [styles.transferSubmitButton, (pressed || submitting) && styles.pressed]}
          >
            <Ionicons name="send" size={18} color="#ffffff" />
            <Text style={styles.transferSubmitText}>{submitting ? "Đang gửi yêu cầu" : "Gửi yêu cầu"}</Text>
          </Pressable>
        </View>

        <View style={[styles.leaveHistoryHeader, styles.transferHistoryHeader]}>
          <Text style={styles.leaveHistoryTitle}>Lịch sử xin phép chuyển phòng ban</Text>
        </View>

        {historyLoading ? <Text style={styles.leaveStateText}>Đang tải lịch sử xin phép chuyển phòng ban...</Text> : null}
        {historyFailed ? <Text style={styles.leaveStateText}>Không thể tải lịch sử xin phép chuyển phòng ban. Vui lòng thử lại.</Text> : null}
        {!historyLoading && historyRows.length === 0 ? <Text style={styles.leaveStateText}>Chưa có lịch sử xin phép chuyển phòng ban.</Text> : null}

        <View style={styles.leaveList}>
          {historyRows.map((row) => (
            <LeaveRequestCard key={row.id} collapsibleDetails request={row} requestType="transfer" showActions={false} />
          ))}
        </View>
      </ScrollView>

      <PersonalDatePickerModal
        title="Chọn ngày chuyển"
        value={desiredTransferDate}
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(value) => {
          setDesiredTransferDate(value);
          setDatePickerVisible(false);
        }}
      />
      <BranchPickerModal
        options={branches}
        value={targetBranch}
        visible={branchPickerVisible}
        onClose={() => setBranchPickerVisible(false)}
        onSelect={(value) => {
          setTargetBranch(value);
          setBranchPickerVisible(false);
        }}
      />
      <DepartmentPickerModal
        currentDepartment={currentDepartment}
        options={departmentOptions}
        value={targetDepartment}
        visible={departmentPickerVisible}
        onClose={() => setDepartmentPickerVisible(false)}
        onSelect={(value) => {
          setTargetDepartment(value);
          setDepartmentPickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

function BranchPickerModal({
  onClose,
  onSelect,
  options,
  value,
  visible
}: {
  onClose: () => void;
  onSelect: (value: string) => void;
  options: { id: string | number; name: string }[];
  value: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.transferRejectOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.departmentPickerModal}>
          <View style={styles.departmentPickerHeader}>
            <View style={styles.flex}>
              <Text style={styles.departmentPickerTitle}>Chọn chi nhánh muốn chuyển</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.departmentPickerList}>
            {options.length === 0 ? (
              <Text style={styles.leaveStateText}>Đang tải danh sách chi nhánh...</Text>
            ) : null}
            {options.map((option) => {
              const active = String(option.id) === value;

              return (
                <Pressable
                  key={String(option.id)}
                  accessibilityRole="button"
                  onPress={() => onSelect(String(option.id))}
                  style={({ pressed }) => [
                    styles.departmentPickerOption,
                    active && styles.departmentPickerOptionActive,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.departmentPickerOptionText, active && styles.departmentPickerOptionTextActive]}>
                    {option.name}
                  </Text>
                  {active ? <Ionicons name="checkmark-circle" size={20} color="#950100" /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DepartmentPickerModal({
  currentDepartment,
  onClose,
  onSelect,
  options,
  value,
  visible
}: {
  currentDepartment: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: DepartmentOption[];
  value: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.transferRejectOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.departmentPickerModal}>
          <View style={styles.departmentPickerHeader}>
            <View style={styles.flex}>
              <Text style={styles.departmentPickerTitle}>Chọn phòng ban muốn chuyển</Text>
              <Text style={styles.departmentPickerSubtitle}>Hiện tại: {currentDepartment}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.departmentPickerList}>
            {options.length === 0 ? (
              <Text style={styles.leaveStateText}>Chưa có phòng ban phù hợp để chọn.</Text>
            ) : null}
            {options.map((option) => {
              const active = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => onSelect(option.value)}
                  style={({ pressed }) => [styles.departmentPickerOption, active && styles.departmentPickerOptionActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.departmentPickerOptionText, active && styles.departmentPickerOptionTextActive]}>{option.label}</Text>
                  {active ? <Ionicons name="checkmark-circle" size={20} color="#950100" /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PositionPickerModal({
  onClose,
  onSelect,
  options,
  value,
  visible
}: {
  onClose: () => void;
  onSelect: (value: string) => void;
  options: string[];
  value: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.transferRejectOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.departmentPickerModal}>
          <View style={styles.departmentPickerHeader}>
            <View style={styles.flex}>
              <Text style={styles.departmentPickerTitle}>Lọc theo vị trí công việc</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.departmentPickerList}>
            {options.map((option) => {
              const active = option === value;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => onSelect(option)}
                  style={({ pressed }) => [
                    styles.departmentPickerOption,
                    active && styles.departmentPickerOptionActive,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.departmentPickerOptionText, active && styles.departmentPickerOptionTextActive]}>
                    {option}
                  </Text>
                  {active ? <Ionicons name="checkmark-circle" size={20} color="#950100" /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function DepartmentStaffScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const { data: overviewData } = useEmployeeApiData(() => employeeApi.teamOverview(), []);
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.teamMembers({ per_page: 100 }), []);
  const [query, setQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("Tất cả vị trí");
  const [positionPickerVisible, setPositionPickerVisible] = useState(false);

  const overview = overviewData || {
    team_name: "Kinh Doanh Dự Án Cao Cấp",
    description: "Chuyên trách phân phối các sản phẩm biệt thự nghỉ dưỡng và penthouse hạng sang. Đội ngũ nòng cốt gồm những chuyên gia tư vấn bất động sản hàng đầu khu vực.",
    member_count: 24,
    manager_name: "Trần Anh Quân"
  };

  const members = apiList(data);
  const staffRows = members.map((member, index) => ({
    id: apiText(member.id, `staff-${index}`),
    name: apiText(member.full_name ?? member.name, "Nhân viên"),
    role: apiText(member.job_position ?? member.position ?? member.kpi_label, "Chuyên viên tư vấn"),
    phone: apiText(member.phone, ""),
    zalo: apiText(member.zalo ?? member.phone, "")
  }));

  const positions = useMemo(() => {
    const unique = Array.from(new Set(staffRows.map((s) => s.role).filter(Boolean)));
    return ["Tất cả vị trí", ...unique];
  }, [staffRows]);

  const visibleRows = staffRows.filter((staff) => {
    const normalized = query.trim().toLowerCase();
    if (normalized) {
      const matchQuery = `${staff.name} ${staff.role}`.toLowerCase().includes(normalized);
      if (!matchQuery) return false;
    }

    if (selectedPosition !== "Tất cả vị trí") {
      if (staff.role !== selectedPosition) return false;
    }

    return true;
  });

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.staffSafe}>
      <View style={styles.staffHeader}>
        <Pressable accessibilityRole="button" onPress={handleBack} style={styles.staffHeaderButton}>
          <Ionicons name="arrow-back" size={22} color="#191c1d" />
        </Pressable>
        <Text style={styles.staffHeaderTitle}>Danh sách nhân viên</Text>
        <View style={styles.staffHeaderButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.staffScrollContent}
        style={styles.staffRoot}
      >
        <View style={styles.staffDepartmentCard}>
          <View style={styles.staffDepartmentGlow} />
          <View style={styles.staffDepartmentLabelRow}>
            <Ionicons name="business-outline" size={18} color="#ffb4a8" />
            <Text style={styles.staffDepartmentLabel}>PHÒNG BAN HIỆN TẠI</Text>
          </View>
          <Text style={styles.staffDepartmentTitle}>{apiText(overview.team_name, "Kinh Doanh Dự Án Cao Cấp")}</Text>
          <Text style={styles.staffDepartmentDescription}>
            {apiText(overview.description, "Chuyên trách phân phối các sản phẩm biệt thự nghỉ dưỡng và penthouse hạng sang. Đội ngũ nòng cốt gồm những chuyên gia tư vấn bất động sản hàng đầu khu vực.")}
          </Text>
          <View style={styles.staffDepartmentMetaGroup}>
            <View style={styles.staffDepartmentMeta}>
              <Ionicons name="people-outline" size={13} color="#ffffff" />
              <Text style={styles.staffDepartmentMetaText}>{apiText(overview.member_count, "24")} Nhân viên</Text>
            </View>
            <View style={styles.staffDepartmentMeta}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#ffffff" />
              <Text style={styles.staffDepartmentMetaText}>Trưởng phòng: {apiText(overview.manager_name, "Trần Anh Quân")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.staffFilterSection}>
          <Text style={styles.staffFilterLabel}>TÌM KIẾM ĐỒNG NGHIỆP</Text>
          <View style={styles.staffInputFrame}>
            <Ionicons name="search-outline" size={18} color="#8f706b" />
            <TextInput
              autoCapitalize="none"
              value={query}
              onChangeText={setQuery}
              placeholder="Nhập tên hoặc mã nhân viên..."
              placeholderTextColor="#6b7280"
              style={styles.staffInput}
            />
          </View>

          <Text style={styles.staffFilterLabel}>LỌC THEO VỊ TRÍ</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPositionPickerVisible(true)}
            style={({ pressed }) => [styles.staffSelectFrame, pressed && styles.pressed]}
          >
            <Ionicons name="filter-outline" size={18} color="#8f706b" />
            <Text style={styles.staffSelectText}>{selectedPosition}</Text>
            <Ionicons name="chevron-down" size={18} color="#6b7280" />
          </Pressable>
        </View>

        {failed ? (
          <Text style={styles.staffStateText}>Không thể tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.</Text>
        ) : null}
        {loading ? <Text style={styles.staffStateText}>Đang tải danh sách nhân viên...</Text> : null}

        <View style={styles.staffList}>
          {!loading && !failed && visibleRows.length === 0 ? (
            <View style={styles.staffEmptyState}>
              <Ionicons name="people-outline" size={48} color="#d4a09a" />
              <Text style={styles.staffEmptyTitle}>Không có nhân viên nào</Text>
              <Text style={styles.staffEmptyDescription}>
                {query || selectedPosition !== "Tất cả vị trí"
                  ? "Không tìm thấy nhân viên phù hợp với bộ lọc hiện tại."
                  : "Hiện tại chưa có nhân viên trong phạm vi quản lý của bạn."}
              </Text>
            </View>
          ) : (
            visibleRows.map((staff) => (
              <StaffMemberCard key={staff.id} staff={staff} />
            ))
          )}
        </View>
      </ScrollView>

      <PositionPickerModal
        options={positions}
        value={selectedPosition}
        visible={positionPickerVisible}
        onClose={() => setPositionPickerVisible(false)}
        onSelect={(value) => {
          setSelectedPosition(value);
          setPositionPickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

function StaffMemberCard({
  staff
}: {
  staff: {
    id: string;
    name: string;
    role: string;
    phone: string;
    zalo: string;
  };
}) {
  const callStaff = () => {
    if (staff.phone) {
      Linking.openURL(`tel:${staff.phone}`);
    }
  };

  const openZalo = () => {
    if (staff.zalo) {
      Linking.openURL(`https://zalo.me/${staff.zalo.replace(/\D/g, "")}`);
    }
  };

  return (
    <View style={styles.staffCard}>
      <Text style={styles.staffName}>{staff.name}</Text>
      <Text style={styles.staffRole}>{staff.role}</Text>
      <View style={styles.staffActions}>
        <Pressable accessibilityRole="button" onPress={callStaff} style={({ pressed }) => [styles.staffCallButton, pressed && styles.pressed]}>
          <Ionicons name="call-outline" size={14} color="#6a0100" />
          <Text style={styles.staffCallText}>Gọi biên</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={openZalo} style={({ pressed }) => [styles.staffZaloButton, pressed && styles.pressed]}>
          <Ionicons name="chatbox-outline" size={15} color="#ffffff" />
          <Text style={styles.staffZaloText}>Zalo</Text>
        </Pressable>
      </View>
    </View>
  );
}

function htmlToPlainText(content: string) {
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

function formatWatchTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function attachmentTitle(attachment: LearningLessonAttachment) {
  return attachment.title || attachment.name || attachment.file_name || attachment.fileName || "Tài liệu bài học";
}

function attachmentSize(attachment: LearningLessonAttachment) {
  return attachment.size || attachment.file_size || attachment.fileSize || "Tài liệu đính kèm";
}

function attachmentType(attachment: LearningLessonAttachment): "pdf" | "doc" {
  const value = `${attachmentTitle(attachment)} ${attachment.mime_type || attachment.mimeType || attachment.type || ""}`;
  return value.toLowerCase().includes("pdf") ? "pdf" : "doc";
}

function LessonVideoPlayer({
  lessonId,
  progressSyncDisabled = false,
  videoUrl,
  initialWatchSeconds = 0,
  onProgressUpdate
}: {
  lessonId: string;
  progressSyncDisabled?: boolean;
  videoUrl: string;
  initialWatchSeconds?: number;
  onProgressUpdate?: (progress: LearningLessonProgressUpdate) => void;
}) {
  const normalizedInitialWatchSeconds = Math.max(0, Math.floor(initialWatchSeconds));
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(normalizedInitialWatchSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [nativeControlsEnabled, setNativeControlsEnabled] = useState(false);
  const [seekWidth, setSeekWidth] = useState(0);
  const canSeekVideo = progressSyncDisabled;
  const currentSecondsRef = useRef(normalizedInitialWatchSeconds);
  const lastSyncedSecondsRef = useRef(normalizedInitialWatchSeconds > 0 ? normalizedInitialWatchSeconds : -1);
  const lastSyncedAtRef = useRef(0);
  const syncingRef = useRef(false);
  const finalSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestInitialWatchSecondsRef = useRef(normalizedInitialWatchSeconds);
  const restoredInitialWatchRef = useRef(false);
  const videoViewRef = useRef<VideoView>(null);
  latestInitialWatchSecondsRef.current = normalizedInitialWatchSeconds;

  const player = useVideoPlayer({ uri: videoUrl, contentType: "progressive" }, (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.volume = 1;
    instance.timeUpdateEventInterval = 1;
  });

  const callVideoAction = useCallback((action: () => void, actionName: string) => {
    try {
      action();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (actionName === "tạm dừng" && message.includes("NativeSharedObjectNotFoundException")) {
        return;
      }

      appLogger.warn("learning.video", `Không thể ${actionName} video.`, { error });
    }
  }, []);

  const pauseVideo = useCallback(() => {
    callVideoAction(() => player.pause(), "tạm dừng");
  }, [callVideoAction, player]);

  const setVideoTime = useCallback((seconds: number) => {
    callVideoAction(() => {
      player.currentTime = seconds;
    }, "tua");
  }, [callVideoAction, player]);

  useEffect(() => {
    const sourceLoadSubscription = player.addListener("sourceLoad", (event) => {
      if (event.duration > 0) {
        setDurationSeconds(event.duration);
      }
      const resumeSeconds = latestInitialWatchSecondsRef.current;
      if (!canSeekVideo && event.duration > 0) {
        setVideoTime(0);
        setCurrentSeconds(0);
        currentSecondsRef.current = 0;
        setIsEnded(false);
        restoredInitialWatchRef.current = true;
      } else if (!restoredInitialWatchRef.current && resumeSeconds > 0) {
        const resumeAt = event.duration > 0 ? Math.min(resumeSeconds, event.duration) : resumeSeconds;
        setVideoTime(resumeAt);
        setCurrentSeconds(resumeAt);
        currentSecondsRef.current = resumeAt;
        setIsEnded(event.duration > 0 && resumeAt >= event.duration - 0.5);
        restoredInitialWatchRef.current = true;
      }
      setHasError(false);
    });
    const statusSubscription = player.addListener("statusChange", (event) => {
      setHasError(event.status === "error");
    });
    const playingSubscription = player.addListener("playingChange", (event) => {
      setIsPlaying(event.isPlaying);
    });
    const timeSubscription = player.addListener("timeUpdate", (event) => {
      setCurrentSeconds(event.currentTime);
      currentSecondsRef.current = event.currentTime;
      if (durationSeconds > 0 && event.currentTime < durationSeconds - 0.5) {
        setIsEnded(false);
      }
    });
    const endSubscription = player.addListener("playToEnd", () => {
      setIsPlaying(false);
      setIsEnded(true);
      if (player.duration > 0) {
        setCurrentSeconds(player.duration);
      }
    });

    return () => {
      sourceLoadSubscription.remove();
      statusSubscription.remove();
      playingSubscription.remove();
      timeSubscription.remove();
      endSubscription.remove();
    };
  }, [canSeekVideo, durationSeconds, player, setVideoTime]);

  useEffect(() => {
    const resumeSeconds = latestInitialWatchSecondsRef.current;
    restoredInitialWatchRef.current = false;
    setCurrentSeconds(resumeSeconds);
    currentSecondsRef.current = resumeSeconds;
    lastSyncedSecondsRef.current = resumeSeconds > 0 ? resumeSeconds : -1;
    lastSyncedAtRef.current = 0;
    setIsEnded(false);
  }, [lessonId, videoUrl]);

  const openExternalVideo = () => {
    Linking.openURL(videoUrl);
  };

  const clearFinalProgressSync = useCallback(() => {
    if (finalSyncTimerRef.current) {
      clearTimeout(finalSyncTimerRef.current);
      finalSyncTimerRef.current = null;
    }
  }, []);

  const syncProgress = useCallback(async (watchSeconds = currentSecondsRef.current, force = false) => {
    if (progressSyncDisabled) {
      return;
    }

    const nextSeconds = Math.max(0, Math.floor(watchSeconds));
    if (syncingRef.current || nextSeconds <= 0 || (!force && nextSeconds === lastSyncedSecondsRef.current)) {
      return;
    }

    syncingRef.current = true;
    try {
      const response = await employeeApi.updateLessonProgress(lessonId, nextSeconds);
      lastSyncedSecondsRef.current = nextSeconds;
      lastSyncedAtRef.current = Date.now();
      onProgressUpdate?.(response.data);
    } catch (error) {
      appLogger.warn("learning.progress", "Không thể cập nhật tiến độ bài học.", {
        lessonId,
        watchSeconds: nextSeconds,
        error
      });
    } finally {
      syncingRef.current = false;
    }
  }, [lessonId, onProgressUpdate, progressSyncDisabled]);

  useEffect(() => {
    if (!isEnded) {
      return;
    }

    const endSeconds = durationSeconds || player.duration || currentSecondsRef.current;
    syncProgress(endSeconds, true);
  }, [durationSeconds, isEnded, player, syncProgress]);

  const scheduleFinalProgressSync = useCallback(() => {
    const watchSeconds = currentSecondsRef.current;
    const now = Date.now();
    const elapsed = lastSyncedAtRef.current ? now - lastSyncedAtRef.current : 0;
    const delayMs = lastSyncedAtRef.current && elapsed < 2000 ? 2000 - elapsed : 0;

    clearFinalProgressSync();
    finalSyncTimerRef.current = setTimeout(() => {
      finalSyncTimerRef.current = null;
      syncProgress(watchSeconds, true);
    }, delayMs);
  }, [clearFinalProgressSync, syncProgress]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const interval = setInterval(() => {
      syncProgress();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, syncProgress]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        pauseVideo();
        scheduleFinalProgressSync();
      };
    }, [pauseVideo, scheduleFinalProgressSync])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        pauseVideo();
        scheduleFinalProgressSync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [pauseVideo, scheduleFinalProgressSync]);

  useEffect(() => {
    return () => {
      clearFinalProgressSync();
    };
  }, [clearFinalProgressSync]);

  const toggleVideo = () => {
    if (hasError) {
      openExternalVideo();
      return;
    }

    setHasError(false);
    if (isPlaying) {
      pauseVideo();
      syncProgress();
      return;
    }
    clearFinalProgressSync();
    if (isEnded) {
      callVideoAction(() => player.replay(), "phát lại");
      setIsEnded(false);
      return;
    }
    callVideoAction(() => player.play(), "phát");
  };

  const seekBy = (seconds: number) => {
    if (hasError) {
      return;
    }
    if (!canSeekVideo) {
      return;
    }
    const target = Math.max(0, Math.min(durationSeconds || player.duration || 0, player.currentTime + seconds));
    setVideoTime(target);
    setCurrentSeconds(target);
    currentSecondsRef.current = target;
    setIsEnded(false);
  };

  const seekFromPress = (event: GestureResponderEvent) => {
    if (!canSeekVideo || !durationSeconds || !seekWidth) {
      return;
    }
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / seekWidth));
    const target = durationSeconds * ratio;
    setVideoTime(target);
    setCurrentSeconds(target);
    currentSecondsRef.current = target;
    setIsEnded(false);
  };

  const onSeekLayout = (event: LayoutChangeEvent) => {
    setSeekWidth(event.nativeEvent.layout.width);
  };

  const openFullscreen = () => {
    if (!canSeekVideo) {
      return;
    }
    setNativeControlsEnabled(true);
    setTimeout(() => {
      callVideoAction(() => videoViewRef.current?.enterFullscreen(), "mở toàn màn hình");
    }, 0);
  };

  const watchedPercent = durationSeconds > 0 ? Math.min(100, (currentSeconds / durationSeconds) * 100) : 0;
  const durationLabel = durationSeconds > 0 ? formatWatchTime(durationSeconds) : "--:--";

  return (
    <>
      <VideoView
        ref={videoViewRef}
        allowsPictureInPicture
        fullscreenOptions={{ enable: true, orientation: "landscape", autoExitOnRotate: false }}
        nativeControls={nativeControlsEnabled}
        onFullscreenEnter={() => setNativeControlsEnabled(true)}
        onFullscreenExit={() => setNativeControlsEnabled(false)}
        player={player}
        style={styles.lessonVideoPlayer}
      />
      <View style={styles.lessonNativeControls}>
        <View style={styles.lessonVideoMeta}>
          <Text style={styles.lessonVideoTime}>{formatWatchTime(currentSeconds)}</Text>
          <Text style={styles.lessonVideoTime}>{durationLabel}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!canSeekVideo || !durationSeconds}
          onLayout={onSeekLayout}
          onPress={seekFromPress}
          style={({ pressed }) => [
            styles.lessonNativeSeekTrack,
            !canSeekVideo && styles.lessonNativeSeekTrackLocked,
            pressed && canSeekVideo && styles.lessonNativeSeekTrackPressed
          ]}
        >
          <View style={[styles.lessonSeekFill, { width: `${watchedPercent}%` }]} />
        </Pressable>
        <View style={styles.lessonVideoControlRow}>
          <View style={styles.lessonVideoSideSlot} />
          <View style={styles.lessonVideoButtonRow}>
            <Pressable
              accessibilityRole="button"
              disabled={!canSeekVideo}
              onPress={() => seekBy(-10)}
              style={({ pressed }) => [styles.lessonVideoControlButton, !canSeekVideo && styles.lessonVideoControlButtonDisabled, pressed && canSeekVideo && styles.pressed]}
            >
              <Ionicons name="play-back" size={18} color="#ffffff" />
              <Text style={styles.lessonVideoSmallText}>10s</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={toggleVideo}
              style={({ pressed }) => [styles.lessonVideoPrimaryButton, pressed && styles.pressed]}
            >
              <Ionicons
                name={hasError ? "open-outline" : isEnded ? "refresh" : isPlaying ? "pause" : "play"}
                size={26}
                color="#ffffff"
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canSeekVideo}
              onPress={() => seekBy(10)}
              style={({ pressed }) => [styles.lessonVideoControlButton, !canSeekVideo && styles.lessonVideoControlButtonDisabled, pressed && canSeekVideo && styles.pressed]}
            >
              <Text style={styles.lessonVideoSmallText}>10s</Text>
              <Ionicons name="play-forward" size={18} color="#ffffff" />
            </Pressable>
          </View>
          <View style={styles.lessonVideoSideSlot}>
            <Pressable
              accessibilityRole="button"
              disabled={!canSeekVideo}
              onPress={openFullscreen}
              style={({ pressed }) => [styles.lessonVideoFullscreenButton, !canSeekVideo && styles.lessonVideoControlButtonDisabled, pressed && canSeekVideo && styles.pressed]}
            >
              <Ionicons name="scan-outline" size={20} color="#ffffff" />
            </Pressable>
          </View>
        </View>
        {hasError ? (
          <Pressable accessibilityRole="button" onPress={openExternalVideo} style={styles.lessonVideoExternalButton}>
            <Ionicons name="open-outline" size={16} color="#ffffff" />
            <Text style={styles.lessonVideoExternalText}>Mở video</Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );
}

export function LessonDetailScreen({
  lesson,
  onProgressUpdate
}: {
  lesson: LearningLessonDetail;
  onProgressUpdate?: (progress: LearningLessonProgressUpdate) => void;
}) {
  const [courseQuizStatus, setCourseQuizStatus] = useState<LessonCourseQuizStatus>("unknown");
  const [courseQuizStatusKey, setCourseQuizStatusKey] = useState("");
  const [courseQuizResultLoading, setCourseQuizResultLoading] = useState(false);
  const description = htmlToPlainText(lesson.content);
  const durationSeconds = lesson.duration_seconds ?? (lesson.duration_minutes ?? 0) * 60;
  const watchedPercent = durationSeconds > 0 ? Math.min(100, (lesson.current_watch_seconds / durationSeconds) * 100) : 0;
  const durationLabel = formatWatchTime(durationSeconds);
  const watchLabel = formatWatchTime(lesson.current_watch_seconds);
  const isCompleted = lesson.status === "completed";
  const hasNextLesson = Boolean(lesson.next_lesson_id);
  const lessonLabelQuizStatus = !hasNextLesson && isCompleted ? lessonCourseQuizStatusFromLabel(lesson.status_label) : null;
  const expectedCourseQuizStatusKey = `${lesson.id}:${lesson.course_id}:${lesson.next_lesson_id ?? ""}`;
  const effectiveCourseQuizStatus = courseQuizStatusKey === expectedCourseQuizStatusKey
    ? courseQuizStatus
    : hasNextLesson
      ? "none"
      : lessonLabelQuizStatus ?? "unknown";
  const courseQuizPending = !hasNextLesson && effectiveCourseQuizStatus === "unknown";
  const hasCourseQuiz = !hasNextLesson && effectiveCourseQuizStatus !== "unknown" && effectiveCourseQuizStatus !== "none";
  const courseQuizHasResult = effectiveCourseQuizStatus === "passed" || effectiveCourseQuizStatus === "failed" || effectiveCourseQuizStatus === "completed";
  const courseQuizIsGrading = effectiveCourseQuizStatus === "grading";
  const courseQuizActionDisabled =
    !hasNextLesson && (courseQuizPending || courseQuizIsGrading || effectiveCourseQuizStatus === "locked" || courseQuizResultLoading);
  const nextActionLabel = (() => {
    if (hasNextLesson) return "Bài tiếp theo";
    if (courseQuizPending) return "Đang kiểm tra bài thi...";
    if (courseQuizResultLoading) return "Đang tải...";
    if (courseQuizIsGrading) return "Đang chấm";
    if (courseQuizHasResult) return "Xem lại bài kiểm tra";
    if (effectiveCourseQuizStatus === "locked") return "Bài kiểm tra chưa mở";
    if (hasCourseQuiz) return effectiveCourseQuizStatus === "in_progress" ? "Tiếp tục bài kiểm tra" : "Làm bài kiểm tra";
    return "Về trang Học viện Đào tạo";
  })();
  const completedNotice = (() => {
    if (hasNextLesson) {
      return lesson.unlock_condition?.replace("Hoàn thành bài học này để mở khóa bài tiếp theo:", "Bài tiếp theo đã được mở khóa:") ||
        "Bài học đã hoàn thành. Bạn có thể chuyển sang bài học tiếp theo trong lộ trình.";
    }

    if (courseQuizIsGrading) return "Bài kiểm tra đang được chấm. Bạn sẽ xem lại kết quả khi có điểm.";
    if (courseQuizHasResult) return "Bạn đã nộp bài kiểm tra. Có thể xem lại kết quả bài làm.";
    if (hasCourseQuiz) return "Bạn đã hoàn thành toàn bộ bài học. Vui lòng làm bài kiểm tra để hoàn thành khóa học.";
    return "Bạn đã hoàn thành khóa học bắt buộc. Học viện Đào tạo đã được mở khóa.";
  })();

  useEffect(() => {
    let mounted = true;

    if (!lesson.course_id || lesson.next_lesson_id) {
      setCourseQuizStatus("none");
      setCourseQuizStatusKey(expectedCourseQuizStatusKey);
      return () => {
        mounted = false;
      };
    }

    setCourseQuizStatus(lessonLabelQuizStatus ?? "unknown");
    setCourseQuizStatusKey(expectedCourseQuizStatusKey);

    const setLoadedCourseQuizStatus = (status: LessonCourseQuizStatus) => {
      setCourseQuizStatus(status);
      setCourseQuizStatusKey(expectedCourseQuizStatusKey);
    };

    async function loadCourseQuizStatus() {
      const resultResponse = await employeeApi.courseQuizResult(lesson.course_id).catch(() => null);
      if (!mounted) return;

      if (resultResponse) {
        const result = isApiObject(resultResponse.data) ? resultResponse.data : {};
        const resultStatus = quizResultStatus(result);

        if (["passed", "failed", "completed", "grading"].includes(resultStatus)) {
          setLoadedCourseQuizStatus(resultStatus);
          return;
        }
      }

      const availabilityResponse = await employeeApi.courseQuizAvailability(lesson.course_id).catch(() => null);
      if (!mounted) return;

      if (!availabilityResponse) {
        setLoadedCourseQuizStatus("none");
        return;
      }

      if (availabilityResponse.status === 404) {
        setLoadedCourseQuizStatus("none");
        return;
      }

      if (availabilityResponse.status === 403) {
        setLoadedCourseQuizStatus("locked");
        return;
      }

      const responseData = isApiObject(availabilityResponse.data) ? availabilityResponse.data : {};
      const attempt = isApiObject(responseData.attempt) ? responseData.attempt : {};
      const attemptStatus = normalizeLessonCourseQuizStatus(attempt.status ?? responseData.status);

      setLoadedCourseQuizStatus(attemptStatus === "available" ? "available" : attemptStatus);
    }

    void loadCourseQuizStatus();

    return () => {
      mounted = false;
    };
  }, [expectedCourseQuizStatusKey, lesson.course_id, lesson.next_lesson_id, lessonLabelQuizStatus]);

  const openNextLesson = useCallback(async () => {
    if (lesson.next_lesson_id) {
      router.replace({
        pathname: "/employee/lesson-detail",
        params: { lessonId: lesson.next_lesson_id }
      });
      return;
    }

    if (courseQuizPending) {
      return;
    }

    if (courseQuizIsGrading || effectiveCourseQuizStatus === "locked") {
      return;
    }

    if (courseQuizHasResult) {
      setCourseQuizResultLoading(true);
      try {
        const response = await employeeApi.courseQuizResult(lesson.course_id);
        const result = isApiObject(response.data) ? response.data : {};
        const resultStatus = quizResultStatus(result);

        if (resultStatus === "grading") {
          setCourseQuizStatus("grading");
          return;
        }

        openQuizResultScreen(lesson.course_id, result);
      } catch (error) {
        appLogger.warn("employee.lesson.quiz_result", "Không thể tải kết quả bài kiểm tra.", {
          courseId: lesson.course_id,
          error
        });
        notifyError(error, "Không thể tải kết quả bài kiểm tra.");
      } finally {
        setCourseQuizResultLoading(false);
      }
      return;
    }

    if (hasCourseQuiz) {
      router.replace({
        pathname: "/employee/quiz",
        params: { courseId: lesson.course_id }
      });
      return;
    }

    router.replace("/employee/learning");
  }, [
    courseQuizHasResult,
    courseQuizIsGrading,
    courseQuizPending,
    effectiveCourseQuizStatus,
    hasCourseQuiz,
    lesson.course_id,
    lesson.next_lesson_id
  ]);

  return (
    <EmployeePage
      headerTitle="Khóa học Bất động sản Cao cấp"
      back={backToRequiredLearning}
      backType="previous"
      right={<View style={styles.lessonHeaderRight} />}
      contentStyle={styles.lessonDetailContent}
    >
      <View style={styles.lessonVideo}>
        {lesson.video_url ? (
          <LessonVideoPlayer
            initialWatchSeconds={lesson.current_watch_seconds}
            lessonId={lesson.id}
            onProgressUpdate={onProgressUpdate}
            progressSyncDisabled={isCompleted}
            videoUrl={mediaUrl(lesson.video_url) || ""}
          />
        ) : (
          <>
            <Image source={learningImages.lessonVideo} style={styles.lessonVideoImage} />
            <View style={styles.lessonVideoOverlay} />
            <View style={styles.lessonPlayButton}>
              <Ionicons name="play" size={28} color="#ffffff" />
            </View>
            <View style={styles.lessonVideoControls}>
              <View style={styles.rowBetween}>
                <Text style={styles.lessonVideoTime}>{watchLabel}</Text>
                <Text style={styles.lessonVideoTime}>{durationLabel}</Text>
              </View>
              <View style={styles.lessonSeekTrack}>
                <View style={[styles.lessonSeekFill, { width: `${watchedPercent}%` }]} />
              </View>
              <View style={styles.lessonControlRow}>
                <View style={styles.lessonControlLeft}>
                  <Ionicons name="volume-high-outline" size={22} color="#ffffff" />
                  <Ionicons name="reader-outline" size={22} color="#ffffff" />
                </View>
                <Ionicons name="scan-outline" size={22} color="#ffffff" />
              </View>
            </View>
          </>
        )}
      </View>

      <View style={styles.lessonDetailBody}>
        <View style={styles.lessonBadge}>
          <Text style={styles.lessonBadgeText}>{lesson.status_label.toUpperCase()}</Text>
        </View>
        <Text style={styles.lessonDetailTitle}>Bài {lesson.order}: {lesson.title}</Text>
        <Text style={styles.lessonDetailDescription}>{description || "Bài học chưa có nội dung mô tả."}</Text>

        <View style={[styles.lessonNotice, isCompleted && styles.lessonNoticeCompleted]}>
          <View style={styles.lessonNoticeRow}>
            <Ionicons name={isCompleted ? "checkmark-circle-outline" : "information-circle-outline"} size={24} color={isCompleted ? "#138a43" : "#c91f1f"} />
            <Text style={styles.lessonNoticeText}>
              {isCompleted ? completedNotice : lesson.unlock_condition || "Vui lòng xem hết video để mở khóa bài học tiếp theo."}
            </Text>
          </View>
          {isCompleted ? (
            <Pressable
              accessibilityRole="button"
              disabled={courseQuizActionDisabled}
              onPress={openNextLesson}
              style={({ pressed }) => [
                styles.lessonNextButtonActive,
                courseQuizActionDisabled && styles.lessonNextButtonPending,
                pressed && styles.pressed
              ]}
            >
              <Ionicons name={courseQuizHasResult ? "eye-outline" : courseQuizIsGrading ? "time-outline" : "play-forward-outline"} size={18} color="#ffffff" />
              <Text style={styles.lessonNextButtonText}>{nextActionLabel}</Text>
            </Pressable>
          ) : (
            <View style={styles.lessonNextButtonDisabled}>
              <Ionicons name="lock-closed-outline" size={18} color="#ffffff" />
              <Text style={styles.lessonNextButtonText}>Bài tiếp theo</Text>
            </View>
          )}
        </View>

        <Text style={styles.lessonAttachmentsTitle}>Tài liệu đính kèm</Text>
        <View style={styles.lessonAttachmentList}>
          {lesson.attachments.length > 0 ? (
            lesson.attachments.map((attachment, index) => (
              <LessonAttachment
                key={`${attachmentTitle(attachment)}-${index}`}
                size={attachmentSize(attachment)}
                title={attachmentTitle(attachment)}
                type={attachmentType(attachment)}
                url={mediaUrl(attachment.url ?? attachment.file_url ?? attachment.fileUrl)}
              />
            ))
          ) : (
            <Text style={styles.lessonEmptyAttachments}>Chưa có tài liệu đính kèm.</Text>
          )}
        </View>
      </View>
    </EmployeePage>
  );
}

function LessonAttachment({ title, size, type, url }: { title: string; size: string; type: "pdf" | "doc"; url?: string }) {
  const isPdf = type === "pdf";
  const openAttachment = () => {
    if (!url) {
      notifyError("Tài liệu chưa có đường dẫn tải xuống.");
      return;
    }

    Linking.openURL(url).catch((error) => {
      appLogger.warn("learning.attachment", "Không thể mở tài liệu đính kèm.", { error, url });
      notifyError(error, "Không thể mở tài liệu đính kèm.");
    });
  };

  return (
    <Pressable accessibilityRole="button" onPress={openAttachment} style={({ pressed }) => [styles.lessonAttachmentRow, pressed && styles.pressed]}>
      <View style={[styles.lessonAttachmentIcon, isPdf ? styles.lessonAttachmentIconPdf : styles.lessonAttachmentIconDoc]}>
        <Ionicons name={isPdf ? "document-text-outline" : "document-outline"} size={22} color={isPdf ? employeePalette.redDark : "#3f3000"} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.lessonAttachmentTitle}>{title}</Text>
        <Text style={styles.lessonAttachmentSize}>{size}</Text>
      </View>
      <Ionicons name="download-outline" size={22} color={url ? employeePalette.redDark : "#e3beb8"} />
    </Pressable>
  );
}

function normalizeQuizOptions(value: unknown) {
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

export function QuizScreen() {
  const params = useLocalSearchParams<{ courseId?: string; lessonId?: string }>();
  const rawCourseId = params.courseId;
  const rawLessonId = params.lessonId;
  const courseId =
    (Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId) ||
    (Array.isArray(rawLessonId) ? rawLessonId[0] : rawLessonId) ||
    "019e640c-8acd-71f8-82e4-e40aa5caad2e";
  const { data } = useEmployeeApiData(() => employeeApi.courseQuiz(courseId), [courseId]);
  const questions = useMemo(() => apiList(isApiObject(data) ? (data.questions ?? data) : data), [data]);
  const attempt = useMemo(() => (isApiObject(data) && isApiObject(data.attempt) ? data.attempt : {}), [data]);
  const multipleChoiceQuestions = useMemo(
    () => questions.filter((question) => apiText(question.type, "multiple_choice") !== "essay"),
    [questions]
  );
  const essayQuestions = useMemo(
    () => questions.filter((question) => apiText(question.type, "") === "essay"),
    [questions]
  );
  const fallbackOptions = normalizeQuizOptions([
    "Đất thương mại dịch vụ",
    "Đất ở đô thị hỗn hợp",
    "Đất cây xanh cảnh quan",
    "Đất công trình công cộng"
  ]);
  const rawTimeLimitMinutes = isApiObject(data) ? data.time_limit_minutes : undefined;
  const rawTimeLimitSeconds = isApiObject(data) ? data.time_limit_seconds : undefined;
  const timeLimitMinutes = Math.max(1, apiNumber(rawTimeLimitMinutes, 45));
  const timeLimitSeconds = Math.max(1, apiNumber(rawTimeLimitSeconds, timeLimitMinutes * 60));
  const attemptId = apiText(attempt.id, "");
  const attemptRemainingSeconds = apiNumber(attempt.remaining_seconds, timeLimitSeconds);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number | null>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(attemptRemainingSeconds);
  const [savingDraft, setSavingDraft] = useState(false);
  const submittingQuizRef = useRef(false);
  const answeredCount = questions.reduce((count, question) => {
    const questionId = apiText(question.id, "");
    const type = apiText(question.type, "multiple_choice");
    if (type === "essay") {
      return apiText(essayAnswers[questionId], "").trim() ? count + 1 : count;
    }

    return selectedOptions[questionId] !== null && selectedOptions[questionId] !== undefined ? count + 1 : count;
  }, 0);
  const progressCount = questions.length > 0 ? `${answeredCount}/${questions.length} câu` : "0/0 câu";
  const progressWidth = (questions.length > 0 ? `${Math.max(10, Math.round((answeredCount / questions.length) * 100))}%` : "0%") as `${number}%`;

  const buildQuizAnswers = useCallback(() => {
    const answers: { quiz_id: string; selected_option?: number | null; essay_answer?: string | null }[] = [];
    multipleChoiceQuestions.forEach((question) => {
      const questionId = apiText(question.id, "");
      if (questionId) {
        answers.push({ quiz_id: questionId, selected_option: selectedOptions[questionId] ?? null });
      }
    });
    essayQuestions.forEach((question) => {
      const questionId = apiText(question.id, "");
      if (questionId) {
        answers.push({ quiz_id: questionId, essay_answer: essayAnswers[questionId] ?? "" });
      }
    });

    return answers;
  }, [essayAnswers, essayQuestions, multipleChoiceQuestions, selectedOptions]);

  useEffect(() => {
    const nextSelectedOptions: Record<string, number | null> = {};
    multipleChoiceQuestions.forEach((question) => {
      const questionId = apiText(question.id, "");
      if (!questionId) return;

      const draftSelectedOption = question.draft_selected_option;
      const numericDraft = Number(draftSelectedOption);
      nextSelectedOptions[questionId] = draftSelectedOption === null || draftSelectedOption === undefined || !Number.isFinite(numericDraft)
        ? null
        : numericDraft;
    });
    setSelectedOptions(nextSelectedOptions);
  }, [courseId, multipleChoiceQuestions]);

  useEffect(() => {
    const nextEssayAnswers: Record<string, string> = {};
    essayQuestions.forEach((question) => {
      const questionId = apiText(question.id, "");
      if (questionId) {
        nextEssayAnswers[questionId] = apiText(question.draft_essay_answer, "");
      }
    });
    setEssayAnswers(nextEssayAnswers);
  }, [courseId, essayQuestions]);

  useEffect(() => {
    setRemainingSeconds(Math.max(0, Math.floor(attemptRemainingSeconds)));
  }, [attemptId, attemptRemainingSeconds, courseId]);

  const saveDraft = useCallback(async () => {
    if (savingDraft) return false;
    const answers = buildQuizAnswers();
    if (answers.length === 0) return false;
    if (!attemptId) {
      notifyError("Không tìm thấy mã lượt làm bài để lưu nháp.");
      return false;
    }

    setSavingDraft(true);
    try {
      const response = await employeeApi.saveCourseQuizDraft(courseId, {
        attempt_id: attemptId,
        remaining_seconds: Math.max(0, Math.floor(remainingSeconds)),
        answers
      });
      const result = isApiObject(response.data) ? response.data : {};
      const syncedRemainingSeconds = result.remaining_seconds;
      if (syncedRemainingSeconds !== null && syncedRemainingSeconds !== undefined) {
        setRemainingSeconds(Math.max(0, Math.floor(apiNumber(syncedRemainingSeconds, remainingSeconds))));
      }
      notifySuccess({ message: response.message || "Lưu bản nháp thành công." });
      return true;
    } catch (error) {
      notifyError(error, "Không thể lưu bản nháp.");
      return false;
    } finally {
      setSavingDraft(false);
    }
  }, [attemptId, buildQuizAnswers, courseId, remainingSeconds, savingDraft]);

  const leaveQuiz = useCallback(() => {
    back();
  }, []);

  const requestLeaveQuiz = useCallback(() => {
    if (submittingQuizRef.current) return;

    Alert.alert("Rời bài kiểm tra?", "Bạn có muốn lưu bản nháp trước khi quay lại không?", [
      {
        text: "Ở lại",
        style: "cancel"
      },
      {
        text: "Thoát không lưu",
        style: "destructive",
        onPress: leaveQuiz
      },
      {
        text: "Lưu và thoát",
        onPress: () => {
          void saveDraft().then((saved) => {
            if (saved) leaveQuiz();
          });
        }
      }
    ]);
  }, [leaveQuiz, saveDraft]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        requestLeaveQuiz();
        return true;
      });

      return () => subscription.remove();
    }, [requestLeaveQuiz])
  );

  const submitQuiz = useCallback(async (isTimeout = false) => {
    if (submittingQuizRef.current) return;
    submittingQuizRef.current = true;

    const answers = buildQuizAnswers();
    if (answers.length === 0) {
      submittingQuizRef.current = false;
      return;
    }
    if (!isTimeout && answeredCount !== questions.length) {
      notifyError("Vui lòng hoàn thành tất cả câu hỏi.");
      submittingQuizRef.current = false;
      return;
    }

    try {
      const response = await employeeApi.submitCourseQuiz(courseId, {
        answers,
        is_timeout: isTimeout
      });
      const result = isApiObject(response.data) ? response.data : {};
      const details = apiList(result.details);
      const needsManualReview = details.some((item) => {
        return item.is_correct === null || item.is_correct === undefined;
      });
      const passed = apiBoolean(result.is_passed, false);

      if (passed && !needsManualReview) {
        await employeeApi.completeCourse(courseId).catch((error) => {
          appLogger.warn("employee.quiz.complete_course", "Không thể ghi nhận hoàn thành khóa học sau quiz.", { error });
        });
      }

      router.replace({
        pathname: "/employee/quiz-result",
        params: {
          score: formatScoreParam(result.score, "0"),
          maxScore: formatScoreParam(result.max_score ?? result.maxScore, "10"),
          totalQuestions: apiText(result.total_questions, "0"),
          correct: apiText(result.correct_count, "0"),
          courseId,
          passed: String(passed),
          pendingReview: String(needsManualReview),
          details: JSON.stringify(details)
        }
      });
    } catch (error) {
      appLogger.warn("employee.quiz.submit", "Không thể nộp bài kiểm tra.", { error });
      submittingQuizRef.current = false;
    }
  }, [buildQuizAnswers, courseId]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      void submitQuiz(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, submitQuiz]);

  return (
    <SafeAreaView style={styles.quizSafe}>
      <View style={styles.quizHeader}>
        <Pressable accessibilityRole="button" onPress={requestLeaveQuiz} style={styles.quizBackButton}>
          <Ionicons name="arrow-back" size={24} color="#111111" />
        </Pressable>
        <Text style={styles.quizHeaderTitle} numberOfLines={1}>
          {apiText(isApiObject(data) ? data.quiz_title : undefined, "Bài kiểm tra kiến thức")}
        </Text>
        <View style={styles.quizTimerPill}>
          <Ionicons name="timer" size={18} color={employeePalette.red} />
          <Text style={styles.quizTimerText}>{formatWatchTime(remainingSeconds)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.quizScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quizProgressBlock}>
          <View style={styles.quizProgressHeader}>
            <Text style={styles.quizProgressLabel}>TIẾN ĐỘ HOÀN THÀNH</Text>
            <Text style={styles.quizProgressCount}>{progressCount}</Text>
          </View>
          <View style={styles.quizProgressTrack}>
            <View style={[styles.quizProgressFill, { width: progressWidth }]} />
          </View>
        </View>

        {multipleChoiceQuestions.map((question, questionIndex) => {
          const questionId = apiText(question.id, `question-${questionIndex}`);
          const options = normalizeQuizOptions(question.options);
          const visibleOptions = options.length > 0 ? options : fallbackOptions;
          const questionImageUri = mediaUrl(question.image_url ?? question.imageUrl);
          const questionOrder = apiNumber(question.order, questionIndex + 1);
          const questionTitle = apiText(question.title, "").trim();
          const displayQuestionTitle =
            questionTitle && !/^câu(?:\s+hỏi)?\s+0$/i.test(questionTitle)
              ? questionTitle
              : `Câu ${questionOrder > 0 ? questionOrder : questionIndex + 1}`;

          return (
            <View key={questionId} style={styles.quizQuestionCard}>
              <Text style={styles.quizQuestionTitle}>{displayQuestionTitle}</Text>
              <Text style={styles.quizQuestionBody}>
                {apiText(question.question, "Nội dung câu hỏi đang được cập nhật.")}
              </Text>
              {questionImageUri ? (
                <View style={styles.quizMapFrame}>
                  <Image source={{ uri: questionImageUri }} style={styles.quizMapImage} />
                </View>
              ) : null}

              <View style={styles.quizOptionsList}>
                {visibleOptions.map((option, index) => {
                  const selected = option.value === selectedOptions[questionId];
                  const label = `${String.fromCharCode(65 + index)}. ${option.label}`;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      key={`${questionId}-${option.value}-${option.label}`}
                      onPress={() => setSelectedOptions((current) => ({ ...current, [questionId]: option.value }))}
                      style={[styles.quizOption, selected && styles.quizOptionSelected]}
                    >
                      <View style={[styles.quizRadio, selected && styles.quizRadioSelected]}>
                        {selected ? <View style={styles.quizRadioDot} /> : null}
                      </View>
                      <Text style={[styles.quizOptionText, selected && styles.quizOptionTextSelected]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        {essayQuestions.map((question, questionIndex) => {
          const questionId = apiText(question.id, `essay-${questionIndex}`);
          const questionOrder = apiNumber(question.order, multipleChoiceQuestions.length + questionIndex + 1);
          const questionTitle = apiText(question.title, "").trim();
          const displayQuestionTitle =
            questionTitle && !/^câu(?:\s+hỏi)?\s+0$/i.test(questionTitle)
              ? questionTitle
              : `Câu ${questionOrder > 0 ? questionOrder : multipleChoiceQuestions.length + questionIndex + 1}`;

          return (
            <View key={questionId} style={styles.quizEssaySection}>
              <Text style={styles.quizEssayTitle}>{displayQuestionTitle}</Text>
              <View style={styles.quizEssayCard}>
                <Text style={styles.quizEssayPrompt}>
                  {apiText(question.question, "Nội dung câu hỏi tự luận đang được cập nhật.")}
                </Text>
                <View style={styles.quizTextareaWrap}>
                  <TextInput
                    multiline
                    onChangeText={(value) => setEssayAnswers((current) => ({ ...current, [questionId]: value }))}
                    placeholder={apiText(question.placeholder, "Nhập câu trả lời của bạn tại đây...")}
                    placeholderTextColor="#8f706b"
                    style={styles.quizTextarea}
                    textAlignVertical="top"
                    value={essayAnswers[questionId] ?? ""}
                  />
                  <Ionicons name="document-text-outline" size={22} color="#8f706b" style={styles.quizTextareaIcon} />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.quizBottomActions}>
        <Pressable accessibilityRole="button" onPress={() => void saveDraft()} style={[styles.quizFooterButton, styles.quizDraftButton]}>
          <Ionicons name="save-outline" size={19} color={employeePalette.red} />
          <Text style={styles.quizDraftButtonText}>{savingDraft ? "Đang lưu..." : "Lưu bản nháp"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => submitQuiz(false)} style={[styles.quizFooterButton, styles.quizSubmitButton]}>
          <Ionicons name="send" size={18} color="#ffffff" />
          <Text style={styles.quizSubmitButtonText}>Nộp bài</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function QuizResultScreen() {
  const params = useLocalSearchParams<{ correct?: string; courseId?: string; details?: string; maxScore?: string; passed?: string; pendingReview?: string; score?: string; total?: string; totalQuestions?: string }>();
  const courseId = apiText(params.courseId, "");
  const score = apiNumber(params.score, 0);
  const maxScore = apiNumber(params.maxScore ?? params.total, 10) || 10;
  const totalQuestions = apiNumber(params.totalQuestions ?? params.total, 0);
  const passed = params.passed ? params.passed === "true" : score >= 8;
  const parsedDetails = useMemo(() => {
    if (!params.details) return [];

    try {
      return apiList(JSON.parse(params.details));
    } catch {
      return [];
    }
  }, [params.details]);
  const questions = parsedDetails.map((item, index) => {
    const type = apiText(item.type, "multiple_choice");
    const options = normalizeQuizOptions(item.options);
    const selectedOption = item.selected_option === null || item.selected_option === undefined ? null : apiNumber(item.selected_option, -1);
    const correctOption = item.correct_option === null || item.correct_option === undefined ? null : apiNumber(item.correct_option, -1);
    const selectedLabel = selectedOption === null ? "" : apiText(options.find((option) => option.value === selectedOption)?.label, `Đáp án ${selectedOption + 1}`);
    const correctLabel = correctOption === null ? "" : apiText(options.find((option) => option.value === correctOption)?.label, `Đáp án ${correctOption + 1}`);
    const isPending = item.is_correct === null || item.is_correct === undefined;
    const isCorrect = !isPending && apiBoolean(item.is_correct, false);
    const order = apiNumber(item.order, index + 1);

    return {
      answer: type === "essay" ? apiText(item.essay_answer, "Chưa nhập câu trả lời.") : selectedLabel,
      correct: isCorrect,
      correctAnswer: type === "essay" || isCorrect ? undefined : correctLabel,
      expanded: isPending,
      index: order > 0 ? order : index + 1,
      pending: isPending,
      title: apiText(item.question ?? item.title, "Nội dung câu hỏi đang được cập nhật.")
    };
  });
  const hasPendingReview = params.pendingReview === "true" || questions.some((question) => question.pending);
  const questionTotal = questions.length > 0 ? questions.length : totalQuestions;
  const backToRequiredCourse = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/employee/required-learning",
      params: courseId ? { courseId } : undefined
    });
  }, [courseId]);
  const dashboardAction = useCallback(() => {
    if (passed && !hasPendingReview) {
      router.replace("/employee/learning");
      return;
    }

    router.replace({
      pathname: "/employee/required-learning",
      params: courseId ? { courseId } : undefined
    });
  }, [courseId, hasPendingReview, passed]);

  return (
    <SafeAreaView style={styles.resultSafe}>
      <View style={styles.resultHeader}>
        <Pressable accessibilityRole="button" onPress={backToRequiredCourse} style={styles.resultCloseButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </Pressable>
        <Text style={styles.resultHeaderTitle}>Kết quả</Text>
        <View style={styles.resultHeaderSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.resultScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHero}>
          <View style={styles.resultGoldGlow} />
          <View style={styles.resultRedGlow} />
          <View style={styles.resultScoreBlock}>
            <Text style={styles.resultScoreLabel}>{hasPendingReview ? "TRẠNG THÁI BÀI LÀM" : "ĐIỂM SỐ CỦA BẠN"}</Text>
            {hasPendingReview ? (
              <Text style={styles.resultPendingTitle}>Đang chấm bài</Text>
            ) : (
              <View style={styles.resultScoreRow}>
                <Text style={styles.resultScoreBig}>{formatScoreValue(score)}</Text>
                <Text style={styles.resultScoreTotal}>/{formatScoreValue(maxScore)}</Text>
              </View>
            )}
          </View>

          <View style={styles.resultAchievementCard}>
            <View style={styles.resultMedalCircle}>
              <Ionicons name={hasPendingReview ? "time-outline" : "ribbon-outline"} size={22} color={employeePalette.gold} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.resultAchievementTitle}>{hasPendingReview ? "Chờ chấm tự luận" : passed ? "Xuất sắc!" : "Cần ôn tập thêm"}</Text>
              <Text style={styles.resultAchievementText}>
                {hasPendingReview
                  ? "Bài làm có câu tự luận nên cần quản trị viên chấm trước khi hiển thị điểm cuối cùng."
                  : "Bạn đã hoàn thành bài kiểm tra kiến thức."}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.resultReviewSection}>
          <View style={styles.resultReviewHeader}>
            <Text style={styles.resultReviewTitle}>Chi tiết câu hỏi</Text>
            <View style={styles.resultCountPill}>
              <Text style={styles.resultCountText}>{questionTotal} CÂU</Text>
            </View>
          </View>

          <View style={styles.resultQuestionList}>
            {questions.length > 0 ? questions.map((question) => (
              <ResultQuestionCard key={`${question.index}-${question.title}`} {...question} />
            )) : (
              <Text style={styles.resultExplanationText}>Chưa có dữ liệu chi tiết câu hỏi.</Text>
            )}
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={dashboardAction} style={styles.resultDashboardButton}>
          <Text style={styles.resultDashboardText}>{passed && !hasPendingReview ? "Tiếp tục học tập" : "Trở về khóa học"}</Text>
          <Ionicons name="arrow-forward" size={18} color="#ffffff" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultQuestionCard({
  answer,
  correct,
  correctAnswer,
  expanded,
  image,
  index,
  note,
  pending,
  title
}: {
  answer: string;
  correct: boolean;
  correctAnswer?: string;
  expanded?: boolean;
  image?: number;
  index: number;
  note?: string;
  pending?: boolean;
  title: string;
}) {
  return (
    <View style={[styles.resultQuestionCard, !correct && !pending && styles.resultQuestionCardWrong]}>
      <View style={[styles.resultQuestionTop, expanded && styles.resultQuestionTopExpanded]}>
        <View style={[styles.resultStatusIcon, pending ? styles.resultStatusPending : correct ? styles.resultStatusCorrect : styles.resultStatusWrong]}>
          <Ionicons
            name={pending ? "time-outline" : correct ? "checkmark" : "close"}
            size={18}
            color={pending ? employeePalette.goldDark : correct ? employeePalette.green : "#d93025"}
          />
        </View>
        <View style={styles.flex}>
          <Text style={styles.resultQuestionKicker}>CÂU {index}</Text>
          <Text style={styles.resultQuestionTitle}>{title}</Text>
          <View style={[styles.resultAnswerLine, pending ? styles.resultAnswerPending : correct ? styles.resultAnswerCorrect : styles.resultAnswerWrong]}>
            <Text style={[styles.resultAnswerText, !correct && !pending && styles.resultAnswerTextWrong]}>{answer}</Text>
          </View>
          {correctAnswer ? (
            <View style={[styles.resultAnswerLine, styles.resultAnswerCorrect]}>
              <Text style={[styles.resultAnswerText, styles.resultAnswerTextDark]}>{correctAnswer}</Text>
            </View>
          ) : null}
        </View>
        {!expanded ? <Ionicons name="chevron-down" size={20} color={employeePalette.muted} /> : null}
      </View>

      {expanded ? (
        <View style={styles.resultExplanation}>
          <View style={styles.resultExplanationHeader}>
            <Ionicons name="bulb-outline" size={13} color={employeePalette.goldDark} />
            <Text style={styles.resultExplanationTitle}>GIẢI THÍCH CHI TIẾT</Text>
          </View>
          {note ? <Text style={styles.resultExplanationText}>{note}</Text> : null}
          {image ? <Image source={image} style={styles.resultExplanationImage} /> : null}
        </View>
      ) : null}
    </View>
  );
}

export function CertificatesScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const { data, failed, loading } = useEmployeeApiData(loadLearningCertificateData, []);
  const [certificateFilter, setCertificateFilter] = useState<CertificateFilterValue>("all");
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const certificates = data?.certificates ?? [];
  const normalizedSearch = searchText.trim().toLocaleLowerCase("vi-VN");
  const visibleCertificates = certificates.filter((certificate) => {
    const matchesFilter = certificateFilter === "all" || certificate.status === certificateFilter;
    const matchesSearch = !normalizedSearch ||
      certificate.title.toLocaleLowerCase("vi-VN").includes(normalizedSearch) ||
      certificate.provider.toLocaleLowerCase("vi-VN").includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });
  const totalCount = certificates.length;
  const pendingCount = certificates.filter((item) => item.status === "pending").length;
  const activeFilterLabel = certificateFilterOptions.find((item) => item.value === certificateFilter)?.label ?? "Lọc";

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.certificatesSafe}>
      <View style={styles.certificatesHeader}>
        <Pressable
          accessibilityRole="button"
          onPress={handleBack}
          style={({ pressed }) => [styles.certificatesHeaderButton, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </Pressable>
        <Text style={styles.certificatesHeaderTitle}>Chứng Chỉ Của Tôi</Text>
        <View style={styles.certificatesHeaderSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.certificatesContent}
      >
        <View style={styles.certificatesHero}>
          <Text style={styles.certificatesHeroTitle}>Thành tích chuyên môn</Text>
          <Text style={styles.certificatesHeroText}>
            {totalCount > 0
              ? "Các chứng chỉ được ghi nhận sau khi bạn hoàn thành khóa học bắt buộc."
              : "Hoàn thành khóa học bắt buộc để nhận chứng chỉ chuyên môn."}
          </Text>
          <View style={styles.certificatesHeroStats}>
            <View style={styles.certificatesHeroBadge}>
              <Text style={styles.certificatesHeroBadgeValue}>{formatTwoDigits(totalCount)}</Text>
              <Text style={styles.certificatesHeroBadgeLabel}>TỔNG CỘNG</Text>
            </View>
            <View style={styles.certificatesHeroBadge}>
              <Text style={styles.certificatesHeroBadgeValue}>{formatTwoDigits(pendingCount)}</Text>
              <Text style={styles.certificatesHeroBadgeLabel}>CHỜ DUYỆT</Text>
            </View>
          </View>
        </View>

        <View style={styles.certificatesLevelCard}>
          <View style={styles.certificatesLevelIcon}>
            <Ionicons name="ribbon" size={22} color="#795900" />
          </View>
          <Text style={styles.certificatesLevelLabel}>CẤP ĐỘ HIỆN TẠI</Text>
          <Text style={styles.certificatesLevelTitle}>CHUYÊN GIA BĐS</Text>
        </View>

        <View style={styles.certificatesSearchBox}>
          <Ionicons name="search-outline" size={20} color="#a1a1aa" />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            onChangeText={setSearchText}
            placeholder="Tìm kiếm chứng chỉ..."
            placeholderTextColor="#a1a1aa"
            style={styles.certificatesSearchText}
            value={searchText}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setFilterVisible(true)}
          style={({ pressed }) => [styles.certificatesFilterButton, certificateFilter !== "all" && styles.certificatesFilterButtonActive, pressed && styles.pressed]}
        >
          <Ionicons name="filter" size={19} color={certificateFilter !== "all" ? employeePalette.redDark : "#191c1d"} />
          <Text style={[styles.certificatesFilterText, certificateFilter !== "all" && styles.certificatesFilterTextActive]}>{activeFilterLabel}</Text>
        </Pressable>

        <View style={styles.certificatesList}>
          {loading ? <Text style={styles.bodyText}>Đang tải chứng chỉ...</Text> : null}
          {failed ? <Text style={styles.bodyText}>Không thể tải chứng chỉ.</Text> : null}
          {!loading && !failed && certificates.length === 0 ? (
            <Text style={styles.bodyText}>Chưa có chứng chỉ hoàn thành khóa học.</Text>
          ) : null}
          {!loading && !failed && certificates.length > 0 && visibleCertificates.length === 0 ? (
            <Text style={styles.bodyText}>Không tìm thấy chứng chỉ phù hợp.</Text>
          ) : null}
          {visibleCertificates.map((item) => (
            <CertificateListCard key={item.id} certificate={item} />
          ))}
        </View>
      </ScrollView>

      <CertificateFilterModal
        onClose={() => setFilterVisible(false)}
        onSelect={(value) => {
          setCertificateFilter(value);
          setFilterVisible(false);
        }}
        selected={certificateFilter}
        visible={filterVisible}
      />
    </SafeAreaView>
  );
}

function CertificateFilterModal({
  onClose,
  onSelect,
  selected,
  visible
}: {
  onClose: () => void;
  onSelect: (value: CertificateFilterValue) => void;
  selected: CertificateFilterValue;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.certificatesFilterBackdrop} onPress={onClose}>
        <Pressable style={styles.certificatesFilterModal} onPress={(event) => event.stopPropagation()}>
          <View style={styles.certificatesFilterModalHeader}>
            <Text style={styles.certificatesFilterModalTitle}>Lọc chứng chỉ</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.certificatesFilterCloseButton}>
              <Ionicons name="close" size={20} color={employeePalette.text} />
            </Pressable>
          </View>
          <View style={styles.certificatesFilterModalList}>
            {certificateFilterOptions.map((option) => {
              const active = option.value === selected;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={[styles.certificatesFilterOption, active && styles.certificatesFilterOptionActive]}
                >
                  <Text style={[styles.certificatesFilterOptionText, active && styles.certificatesFilterOptionTextActive]}>{option.label}</Text>
                  {active ? <Ionicons name="checkmark" size={20} color={employeePalette.goldDark} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CertificateListCard({ certificate }: { certificate: CertificateCardItem }) {
  return (
    <View style={styles.certificatesCard}>
      <View style={styles.certificatesImageWrap}>
        <Image source={certificate.image} style={styles.certificatesImage} />
        {certificate.status === "verified" ? (
          <View style={styles.certificatesVerifiedPill}>
            <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
            <Text style={styles.certificatesVerifiedText}>ĐÃ XÁC THỰC</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.certificatesCardBody}>
        <View style={styles.certificatesCardTitleRow}>
          <Text style={styles.certificatesCardTitle}>{certificate.title}</Text>
          {certificate.status === "new" ? (
            <View style={styles.certificatesNewBadge}>
              <Text style={styles.certificatesNewBadgeText}>MỚI</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.certificatesProvider}>{certificate.provider}</Text>
        <View style={styles.certificatesDivider} />
        <Text style={styles.certificatesDateLabel}>NGÀY CẤP</Text>
        <Text style={styles.certificatesDate}>{certificate.issuedAt}</Text>
      </View>
    </View>
  );
}

type InventoryAreaFilterValue = "all" | "available" | "soldOut" | "featured";

type InventoryAreaCardItem = {
  available: string;
  hot?: boolean;
  id?: string;
  image: ImageSourcePropType;
  lotId?: string;
  name: string;
  total: string;
};

const inventoryAreaFilterOptions: { label: string; value: InventoryAreaFilterValue }[] = [
  { label: "Tất cả khu đất", value: "all" },
  { label: "Còn hàng", value: "available" },
  { label: "Hết hàng", value: "soldOut" },
  { label: "Khu nổi bật", value: "featured" }
];

type InventoryInfoTabKey = "location" | "legal" | "floor_plan" | "documents";

type InventoryInfoTab = {
  actionLabel?: string;
  actionUrl?: string;
  content: string;
  imageUrl?: string;
  key: InventoryInfoTabKey;
  label: string;
  title: string;
};

const defaultInventoryInfoTabs: InventoryInfoTab[] = [
  {
    content: "Vị trí khu đất đang được cập nhật. Nhân sự có thể dùng chỉ đường khi khu đất có Google Maps.",
    key: "location",
    label: "Vị trí",
    title: "Vị trí khu đất"
  },
  {
    content: "Thông tin pháp lý đang được chuẩn hóa theo từng khu đất và từng phân khu.",
    key: "legal",
    label: "Pháp lý",
    title: "Thông tin pháp lý"
  },
  {
    content: "Mặt bằng bảng hàng hiển thị trạng thái từng lô để đội kinh doanh theo dõi và tư vấn nhanh.",
    key: "floor_plan",
    label: "Mặt bằng",
    title: "Sơ đồ mặt bằng"
  },
  {
    content: "Tài liệu bán hàng, hồ sơ quy hoạch và hình ảnh khu đất sẽ được cập nhật trong mục này.",
    key: "documents",
    label: "Tài liệu",
    title: "Tài liệu bán hàng"
  }
];

const inventoryInfoTabs: { icon: ComponentProps<typeof Ionicons>["name"]; key: InventoryInfoTabKey; label: string }[] = [
  { icon: "location-outline", key: "location", label: "Vị trí" },
  { icon: "shield-checkmark-outline", key: "legal", label: "Pháp lý" },
  { icon: "map-outline", key: "floor_plan", label: "Mặt bằng" },
  { icon: "folder-open-outline", key: "documents", label: "Tài liệu" }
];

function inventoryAreaLotCount(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.trunc(count) : null;
}

function inventoryAreaAvailability(area: ApiObject) {
  const remainingLots = inventoryAreaLotCount(area.remaining_lots ?? area.remainingLots);
  const totalLots = inventoryAreaLotCount(area.total_lots ?? area.totalLots);

  if (remainingLots !== null && totalLots !== null) {
    return `Còn ${remainingLots}/${totalLots} lô`;
  }

  return apiText(area.available_label ?? area.available ?? area.available_count, "Còn hàng");
}

function inventoryAreaTotal(area: ApiObject) {
  const totalLots = inventoryAreaLotCount(area.total_lots ?? area.totalLots);
  return totalLots !== null ? `Tổng: ${totalLots} lô` : apiText(area.total, "Tổng: --");
}

function inventoryAreaHasStock(area: ApiObject) {
  const remainingLots = inventoryAreaLotCount(area.remaining_lots ?? area.remainingLots);
  if (remainingLots !== null) return remainingLots > 0;

  const status = apiText(area.status ?? area.label_status ?? area.lable_status, "").toLowerCase();
  return !status.includes("hết");
}

function inventoryAreaMatchesFilter(area: ApiObject, filter: InventoryAreaFilterValue) {
  if (filter === "all") return true;
  if (filter === "featured") return apiBoolean(area.is_featured ?? area.isFeatured ?? area.is_hot ?? area.hot, false);
  if (filter === "available") return inventoryAreaHasStock(area);
  return !inventoryAreaHasStock(area);
}

function inventoryInfoTabsFromRecord(value: unknown): InventoryInfoTab[] {
  const rows = apiList(value);
  if (rows.length === 0) return defaultInventoryInfoTabs;

  const tabs = rows
    .map((row): InventoryInfoTab | null => {
      const key = apiText(row.key, "") as InventoryInfoTabKey;
      if (!["location", "legal", "floor_plan", "documents"].includes(key)) return null;

      return {
        actionLabel: apiText(row.action_label ?? row.actionLabel, ""),
        actionUrl: apiText(row.action_url ?? row.actionUrl, ""),
        content: apiText(row.content, defaultInventoryInfoTabs.find((tab) => tab.key === key)?.content ?? "Đang cập nhật."),
        imageUrl: apiText(row.image_url ?? row.imageUrl, ""),
        key,
        label: apiText(row.label, defaultInventoryInfoTabs.find((tab) => tab.key === key)?.label ?? "Thông tin"),
        title: apiText(row.title, defaultInventoryInfoTabs.find((tab) => tab.key === key)?.title ?? "Thông tin")
      };
    })
    .filter((tab): tab is InventoryInfoTab => Boolean(tab));

  return tabs.length > 0 ? tabs : defaultInventoryInfoTabs;
}

function inventoryIntroArticleFromRecord(value: unknown, areaName: string) {
  const article = isApiObject(value) ? value : {};

  return {
    body: apiText(article.body, "Chưa thiết lập."),
    summary: apiText(article.summary, "Chưa thiết lập."),
    title: apiText(article.title, areaName || "Giới thiệu khu đất")
  };
}

function inventoryAreaCardFromRecord(area: ApiObject, index: number): InventoryAreaCardItem {
  const recordType = apiText(
    area.record_type ?? area.recordType ?? area.entity_type ?? area.entityType ?? area.item_type ?? area.itemType ?? area.kind,
    "area"
  ).toLowerCase();
  const isLotResult = recordType === "lot" || Boolean(area.lot_id ?? area.lotId ?? area.lot_code ?? area.lotCode);
  const lotCode = apiText(area.code ?? area.lot_code ?? area.lotCode, "").trim();
  const areaId = apiText(
    area.area_id ??
      area.areaId ??
      area.target_id ??
      area.targetId ??
      (!isLotResult ? area.id : undefined),
    ""
  );
  const lotId = isLotResult ? apiText(area.lot_id ?? area.lotId ?? area.id, "") : "";
  const areaName = apiText(area.name ?? area.title, "Khu đất");

  return {
    available: inventoryAreaAvailability(area),
    hot: apiBoolean(area.is_featured ?? area.isFeatured ?? area.is_hot ?? area.hot, index === 0),
    id: areaId,
    image: mediaSource(
      area.sales_board_image ?? area.salesBoardImage,
      index % 2 === 0 ? inventoryImages.zoneA : inventoryImages.zoneB
    ),
    lotId,
    name: lotCode ? `Lô ${lotCode} - ${areaName}` : areaName,
    total: inventoryAreaTotal(area)
  };
}

export function InventoryListScreen() {
  const [areaRows, setAreaRows] = useState<ApiObject[]>([]);
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Không thể tải danh sách khu đất.");
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<InventoryAreaFilterValue>("all");
  const filteredRows = useMemo(
    () => areaRows.filter((area) => inventoryAreaMatchesFilter(area, selectedFilter)),
    [areaRows, selectedFilter]
  );
  const zones = useMemo(
    () => filteredRows.map((area, index) => inventoryAreaCardFromRecord(area, index)),
    [filteredRows]
  );
  const hasSearchText = Boolean(debouncedSearchText);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
    }, 350);

    return () => clearTimeout(handle);
  }, [searchText]);

  useEffect(() => {
    let mounted = true;
    const params = selectedFilter === "featured" && !debouncedSearchText
      ? { filters: { is_featured: "true" } }
      : undefined;
    const request = debouncedSearchText
      ? employeeApi.searchAreas(debouncedSearchText)
      : employeeApi.areas(params);

    setLoading(true);
    setFailed(false);
    setErrorMessage("Không thể tải danh sách khu đất.");

    request
      .then((response) => {
        if (!mounted) return;
        setAreaRows(apiList(response.data));
      })
      .catch((error) => {
        if (!mounted) return;

        if (error instanceof ApiRequestError && error.status === 404) {
          setAreaRows([]);
          return;
        }

        setAreaRows([]);
        setFailed(true);
        const msg = error instanceof Error ? error.message : "Không thể tải danh sách khu đất.";
        setErrorMessage(msg);
        appLogger.warn("employee.inventory", msg, { error });
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [debouncedSearchText, selectedFilter]);

  return (
    <SafeAreaView style={styles.inventoryAreaSafe}>
      <View style={styles.inventoryAreaHeader}>
        <View style={styles.inventoryAreaHeaderLeft}>
          <Pressable accessibilityRole="button" onPress={() => back()} style={styles.inventoryAreaIconButton}>
            <Ionicons name="arrow-back" size={24} color="#111111" />
          </Pressable>
          <Text style={styles.inventoryAreaTitle}>Danh sách Khu đất</Text>
        </View>
        <EmployeeNotificationButton returnTo="/employee/inventory" />
      </View>

      <ScrollView
        contentContainerStyle={styles.inventoryAreaScroll}
        showsVerticalScrollIndicator={false}
        style={styles.inventoryAreaRoot}
      >
        <View style={styles.inventoryAreaSearchRow}>
          <View style={styles.inventoryAreaSearchInput}>
            <Ionicons name="search" size={22} color="#8f706b" />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={setSearchText}
              placeholder="Tìm khu đất, mã lô..."
              placeholderTextColor="#8f706b"
              returnKeyType="search"
              style={styles.inventoryAreaSearchText}
              value={searchText}
            />
            {searchText ? (
              <Pressable accessibilityRole="button" onPress={() => setSearchText("")} style={styles.inventoryAreaClearButton}>
                <Ionicons name="close" size={18} color={employeePalette.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFilterPickerVisible(true)}
            style={[styles.inventoryAreaFilterButton, selectedFilter !== "all" && styles.inventoryAreaFilterButtonActive]}
          >
            <Ionicons name="filter" size={22} color={selectedFilter !== "all" ? employeePalette.redDark : employeePalette.muted} />
          </Pressable>
        </View>

        {loading ? <Text style={styles.bodyText}>Đang tải khu đất...</Text> : null}
        {failed ? <Text style={styles.bodyText}>{errorMessage}</Text> : null}
        {!loading && !failed && zones.length === 0 ? (
          <Text style={styles.bodyText}>{hasSearchText ? "Không tìm thấy khu đất phù hợp." : "Chưa có dữ liệu khu đất."}</Text>
        ) : null}
        <View style={styles.inventoryAreaGrid}>
          {zones.map((zone) => (
            <InventoryZoneCard key={`${zone.id || zone.name}-${zone.lotId || "area"}`} {...zone} />
          ))}
        </View>
      </ScrollView>

      <InventoryAreaFilterPicker
        onClose={() => setFilterPickerVisible(false)}
        onSelect={(value) => {
          setSelectedFilter(value);
          setFilterPickerVisible(false);
        }}
        selectedFilter={selectedFilter}
        visible={filterPickerVisible}
      />

    </SafeAreaView>
  );
}

function InventoryAreaFilterPicker({
  onClose,
  onSelect,
  selectedFilter,
  visible
}: {
  onClose: () => void;
  onSelect: (value: InventoryAreaFilterValue) => void;
  selectedFilter: InventoryAreaFilterValue;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.inventoryAreaFilterBackdrop} onPress={onClose}>
        <Pressable style={styles.inventoryAreaFilterModal} onPress={(event) => event.stopPropagation()}>
          <View style={styles.inventoryAreaFilterModalHeader}>
            <Text style={styles.inventoryAreaFilterModalTitle}>Lọc khu đất</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.inventoryAreaFilterCloseButton}>
              <Ionicons color={employeePalette.text} name="close" size={20} />
            </Pressable>
          </View>
          <View style={styles.inventoryAreaFilterModalList}>
            {inventoryAreaFilterOptions.map((option) => {
              const active = option.value === selectedFilter;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={[styles.inventoryAreaFilterOption, active && styles.inventoryAreaFilterOptionActive]}
                >
                  <Text style={[styles.inventoryAreaFilterOptionText, active && styles.inventoryAreaFilterOptionTextActive]}>
                    {option.label}
                  </Text>
                  {active ? <Ionicons color={employeePalette.goldDark} name="checkmark" size={20} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function InventoryZoneCard({
  available,
  hot,
  id,
  image,
  lotId,
  name,
  total
}: {
  available: string;
  hot?: boolean;
  id?: string;
  image: ImageSourcePropType;
  lotId?: string;
  name: string;
  total: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/employee/inventory-map",
          params: id ? { areaId: id, ...(lotId ? { lotId } : {}) } : undefined
        })
      }
      style={({ pressed }) => [styles.inventoryAreaCard, pressed && styles.pressed]}
    >
      <View style={styles.inventoryAreaCardImageWrap}>
        <Image source={image} style={styles.inventoryAreaCardImage} />
        {hot ? (
          <View style={styles.inventoryAreaHotPill}>
            <Text style={styles.inventoryAreaHotText}>HOT</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.inventoryAreaCardBody}>
        <View style={styles.inventoryAreaCardCopy}>
          <Text style={styles.inventoryAreaCardTitle}>{name}</Text>
          <View style={styles.inventoryAreaCardMeta}>
            <Ionicons name="grid-outline" size={12} color={employeePalette.muted} />
            <Text style={styles.inventoryAreaCardMetaText}>{total}</Text>
          </View>
        </View>
        <View style={styles.inventoryAreaCardFooter}>
          <Text style={styles.inventoryAreaCardAvailable}>{available}</Text>
          <Ionicons name="arrow-forward" size={18} color="#6a0100" />
        </View>
      </View>
    </Pressable>
  );
}

export function InventoryMapScreen() {
  const commentsPerPage = 10;
  const mapZoomMin = 1;
  const mapZoomMax = 2.5;
  const mapZoomStep = 0.25;
  const { width: viewportWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ areaId?: string; lotId?: string }>();
  const rawAreaId = params.areaId;
  const rawLotId = params.lotId;
  const areaId = Array.isArray(rawAreaId) ? rawAreaId[0] : rawAreaId;
  const routeLotId = Array.isArray(rawLotId) ? rawLotId[0] : rawLotId;
  const [selectedLotId, setSelectedLotId] = useState(routeLotId ?? "");
  const [mapCommentDraft, setMapCommentDraft] = useState("");
  const [mapCommentSubmitting, setMapCommentSubmitting] = useState(false);
  const [pagedAreaComments, setPagedAreaComments] = useState<ApiObject[]>([]);
  const [commentsPagination, setCommentsPagination] = useState<ApiObject>({});
  const [commentsLoadingPage, setCommentsLoadingPage] = useState<number | null>(null);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [selectedInfoTab, setSelectedInfoTab] = useState<InventoryInfoTabKey>("location");
  const [lotGridWidth, setLotGridWidth] = useState(viewportWidth);
  const [mapZoom, setMapZoom] = useState(mapZoomMin);
  const inventoryFocusedAreaIdRef = useRef<string | undefined>(undefined);
  const { data, failed, loading } = useEmployeeApiData(
    () => areaId ? employeeApi.inventoryMap(areaId, { comments_per_page: commentsPerPage, page: 1 }) : Promise.resolve({ data: {} }),
    [areaId, inventoryRefreshKey]
  );
  const inventoryMapData = isApiObject(data) ? data : {};
  const apiLots = useMemo(() => apiList(inventoryMapData.lots ?? inventoryMapData.lot_list ?? inventoryMapData.lotList ?? data), [data, inventoryMapData.lotList, inventoryMapData.lot_list, inventoryMapData.lots]);
  const salesBoardImageUri = mediaUrl(
    inventoryMapData.sales_board_image ??
      inventoryMapData.salesBoardImage ??
      inventoryMapData.map_image ??
      inventoryMapData.mapImage ??
      inventoryMapData.image_url ??
      inventoryMapData.imageUrl
  );
  const salesBoardEmbed = apiText(
    inventoryMapData.sales_board_iframe ??
      inventoryMapData.salesBoardIframe ??
      inventoryMapData.iframe ??
      inventoryMapData.iframe_url ??
      inventoryMapData.iframeUrl ??
      inventoryMapData.embed_url ??
      inventoryMapData.embedUrl,
    ""
  ).trim();
  const salesBoardEmbedSource = salesBoardEmbed
    ? salesBoardEmbed.startsWith("<")
      ? { html: `<meta name="viewport" content="width=device-width, initial-scale=1" /><style>html,body,iframe{height:100%;margin:0;width:100%;} iframe{border:0;}</style>${salesBoardEmbed}` }
      : { uri: salesBoardEmbed }
    : null;
  const lotItems = useMemo(
    () =>
      sortInventoryLots(apiLots).map((lot, index) => ({
        code: inventoryLotCode(lot, `L${index + 1}`),
        id: apiText(lot.id ?? lot.lot_id ?? lot.lotId, ""),
        status: inventoryLotStatus(lot)
      })),
    [apiLots]
  );
  const activeLotId = selectedLotId || lotItems.find((lot) => lot.id)?.id || "";
  const { data: activeLotData } = useEmployeeApiData(
    () => activeLotId ? employeeApi.lotDetail(activeLotId) : Promise.resolve({ data: {} }),
    [activeLotId, inventoryRefreshKey]
  );
  const activeLot = isApiObject(activeLotData) ? activeLotData : {};
  const fetchedAreaComments = useMemo(() => apiList(inventoryMapData.comments), [inventoryMapData.comments]);
  const fetchedCommentsPagination = useMemo(
    () => isApiObject(inventoryMapData.comments) ? inventoryMapData.comments : {},
    [inventoryMapData.comments]
  );
  const { appendComment: appendAreaComment, comments: areaComments } = useRealtimeAreaComments(areaId ?? "", pagedAreaComments);
  const commentsCurrentPage = apiNumber(commentsPagination.current_page, 1);
  const commentsLastPage = apiNumber(commentsPagination.last_page, 1);
  const commentsTotal = Math.max(apiNumber(commentsPagination.total, areaComments.length), areaComments.length);
  const activeLotAreaObject = isApiObject(activeLot.area) ? activeLot.area : null;
  const activeLotArea = apiText(
    activeLot.area_name ?? activeLotAreaObject?.name ?? activeLot.location ?? inventoryMapData.area_name,
    ""
  );
  const activeLotStatus = inventoryLotStatus(activeLot, lotItems.find((lot) => lot.id === activeLotId)?.status);
  const backendInfoTabs = useMemo(() => inventoryInfoTabsFromRecord(inventoryMapData.info_tabs ?? inventoryMapData.infoTabs), [inventoryMapData.infoTabs, inventoryMapData.info_tabs]);
  const activeInfoTab = backendInfoTabs.find((tab) => tab.key === selectedInfoTab) ?? backendInfoTabs[0] ?? defaultInventoryInfoTabs[0];
  const introArticle = useMemo(
    () => inventoryIntroArticleFromRecord(inventoryMapData.intro_article ?? inventoryMapData.introArticle, activeLotArea),
    [activeLotArea, inventoryMapData.introArticle, inventoryMapData.intro_article]
  );
  const directionUrl = directionUrlFromRecord(activeLot) || directionUrlFromRecord(inventoryMapData);
  const mapZoomStyle = useMemo(() => ({ transform: [{ scale: mapZoom }] }), [mapZoom]);
  const lotGridColumnGap = useMemo(() => {
    const contentWidth = lotGridWidth - inventoryLotGridHorizontalPadding * 2;
    const gapSlots = inventoryLotGridColumns - 1;

    if (contentWidth <= 0 || gapSlots <= 0) {
      return 0;
    }

    return Math.max(0, (contentWidth - inventoryLotGridColumns * inventoryLotCellSize) / gapSlots);
  }, [lotGridWidth]);

  const handleLotGridLayout = useCallback((event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    setLotGridWidth((current) => current === width ? current : width);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!areaId) {
        return undefined;
      }

      if (inventoryFocusedAreaIdRef.current !== areaId) {
        inventoryFocusedAreaIdRef.current = areaId;
        return undefined;
      }

      setInventoryRefreshKey((value) => value + 1);

      return undefined;
    }, [areaId])
  );

  useEffect(() => {
    if (routeLotId) {
      setSelectedLotId(routeLotId);
    }
  }, [routeLotId]);

  useEffect(() => {
    if (!selectedLotId) return;
    if (lotItems.some((lot) => lot.id === selectedLotId)) return;
    setSelectedLotId("");
  }, [lotItems, selectedLotId]);

  useEffect(() => {
    setPagedAreaComments(fetchedAreaComments);
    setCommentsPagination(fetchedCommentsPagination);
  }, [areaId, fetchedAreaComments, fetchedCommentsPagination]);

  useEffect(() => {
    setMapZoom(mapZoomMin);
  }, [areaId, salesBoardEmbed, salesBoardImageUri]);

  useEffect(() => {
    if (backendInfoTabs.some((tab) => tab.key === selectedInfoTab)) return;
    setSelectedInfoTab(backendInfoTabs[0]?.key ?? "location");
  }, [backendInfoTabs, selectedInfoTab]);

  function changeMapZoom(direction: 1 | -1) {
    setMapZoom((current) => {
      const nextZoom = current + direction * mapZoomStep;
      return Math.min(mapZoomMax, Math.max(mapZoomMin, Number(nextZoom.toFixed(2))));
    });
  }

  async function loadAreaCommentsPage(page: number) {
    if (!areaId || commentsLoadingPage || page === commentsCurrentPage) return;

    setCommentsLoadingPage(page);
    try {
      const response = await employeeApi.inventoryMap(areaId, {
        comments_per_page: apiNumber(commentsPagination.per_page, commentsPerPage),
        page
      });
      const nextData = isApiObject(response.data) ? response.data : {};
      const nextCommentsPayload = isApiObject(nextData.comments) ? nextData.comments : {};
      const nextComments = apiList(nextData.comments);

      setPagedAreaComments(nextComments);
      setCommentsPagination(nextCommentsPayload);
    } catch (error) {
      appLogger.warn("employee.inventory-map.comments", "Không thể tải trang bình luận khu đất.", { areaId, page, error });
      notifyError(error, "Không thể tải trang bình luận.");
    } finally {
      setCommentsLoadingPage(null);
    }
  }

  async function submitMapLotComment() {
    const content = mapCommentDraft.trim();
    if (!areaId || !content) return;

    setMapCommentSubmitting(true);
    try {
      const response = await employeeApi.addAreaComment(areaId, content);
      const createdComment = normalizeAreaComment(response.data, areaId);
      if (createdComment) {
        appendAreaComment(createdComment.comment);
        setCommentsPagination((current) => ({
          ...current,
          total: apiNumber(current.total, areaComments.length) + 1
        }));
      }
      setMapCommentDraft("");
    } catch (error) {
      appLogger.warn("employee.inventory-map.comment", "Không thể gửi bình luận khu đất.", { areaId, error });
      notifyError(error, "Không thể gửi bình luận.");
    } finally {
      setMapCommentSubmitting(false);
    }
  }

  async function openInventoryDirections() {
    if (!directionUrl) {
      Alert.alert("Chưa có chỉ đường", "Khu đất này chưa có link Google Maps hoặc tọa độ điều hướng.");
      return;
    }

    try {
      await Linking.openURL(directionUrl);
    } catch (error) {
      appLogger.warn("employee.inventory-map.direction", "Không thể mở chỉ đường Google Maps.", {
        areaId,
        directionUrl,
        error
      });
      Alert.alert("Không thể mở chỉ đường", "Vui lòng thử lại sau.");
    }
  }

  return (
    <SafeAreaView style={styles.inventoryMapSafe}>
      <View style={styles.inventoryMapHeader}>
        <Pressable accessibilityRole="button" onPress={() => back()} style={styles.inventoryMapBackButton}>
          <Ionicons name="arrow-back" size={24} color={employeePalette.text} />
        </Pressable>
        <EmployeeNotificationButton color={employeePalette.text} returnTo="/employee/inventory-map" />
      </View>

      <ScrollView
        contentContainerStyle={styles.inventoryMapScroll}
        refreshControl={
          <RefreshControl
            colors={[employeePalette.red]}
            onRefresh={() => setInventoryRefreshKey((value) => value + 1)}
            refreshing={loading && Boolean(data)}
            tintColor={employeePalette.red}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.inventoryMapRoot}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inventoryMapLegendWrap}>
          <View style={styles.inventoryMapLegend}>
            <LegendItem color="#eec05b" label="Còn hàng" />
            <LegendItem color={employeePalette.red} label="Đã bán" />
            <LegendItem color="#2e7d32" label="Đang giữ chỗ" />
            <LegendItem color="#c8c6c5" label="Không bán" />
          </View>
        </ScrollView>

        <View style={styles.inventoryMapCanvas}>
          {salesBoardEmbedSource ? (
            <WebView
              originWhitelist={["*"]}
              source={salesBoardEmbedSource}
              style={[styles.inventoryMapWebView, mapZoomStyle]}
            />
          ) : (
            <Image
              source={salesBoardImageUri ? { uri: salesBoardImageUri } : inventoryImages.mapOverview}
              style={[styles.inventoryMapOverview, mapZoomStyle]}
            />
          )}
          <View style={styles.inventoryMapControls}>
            <MapControl
              disabled={mapZoom >= mapZoomMax}
              icon="add"
              onPress={() => changeMapZoom(1)}
            />
            <MapControl
              disabled={mapZoom <= mapZoomMin}
              icon="remove"
              onPress={() => changeMapZoom(-1)}
            />
            <MapControl
              disabled={!directionUrl}
              highlight
              icon="locate-outline"
              onPress={openInventoryDirections}
            />
          </View>
        </View>

        <View onLayout={handleLotGridLayout} style={[styles.inventoryLotGrid, { columnGap: lotGridColumnGap }]}>
          {loading && areaId && lotItems.length === 0 ? <Text style={styles.bodyText}>Đang tải lô đất...</Text> : null}
          {failed ? <Text style={styles.bodyText}>Không thể tải danh sách lô đất.</Text> : null}
          {!loading && areaId && lotItems.length === 0 ? <Text style={styles.bodyText}>Khu vực này chưa có lô đất.</Text> : null}
          {lotItems.map((lot, index) => (
            <Pressable
              key={lot.id || `${lot.code}-${index}`}
              accessibilityRole="button"
              onPress={() => {
                if (!lot.id) return;
                router.push({ pathname: "/employee/lot-detail", params: { lotId: lot.id } });
              }}
              style={[
                styles.inventoryLotCell,
                lot.id === activeLotId && styles.inventoryLotSelected,
                lot.status === "held" && styles.inventoryLotHeld,
                lot.status === "sold" && styles.inventoryLotSold,
                lot.status === "unavailable" && styles.inventoryLotUnavailable
              ]}
            >
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                numberOfLines={1}
                style={[styles.inventoryLotText, lot.status !== "available" && styles.inventoryLotTextLight]}
              >
                {lot.code}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inventoryMapSheet}>
          <View style={styles.inventorySaleBadge}>
            <Text style={styles.inventorySaleBadgeText}>{inventoryLotStatusLabel(activeLotStatus, activeLot.is_locked)}</Text>
          </View>
          <Text style={styles.inventorySheetTitle}>{activeLotArea}</Text>

          <View style={styles.inventoryInfoTabs}>
            {inventoryInfoTabs.map((tab) => {
              const active = selectedInfoTab === tab.key;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={tab.key}
                  onPress={() => setSelectedInfoTab(tab.key)}
                  style={[styles.inventoryInfoTab, active && styles.inventoryInfoTabActive]}
                >
                  <Ionicons name={tab.icon} size={18} color={active ? "#ffffff" : employeePalette.text} />
                  <Text style={[styles.inventoryInfoTabText, active && styles.inventoryInfoTabTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.inventoryInfoArticle}>
            <Text style={styles.inventoryInfoArticleEyebrow}>{activeInfoTab.label.toUpperCase()}</Text>
            <Text style={styles.inventoryInfoArticleTitle}>{activeInfoTab.title}</Text>
            <Text style={styles.inventoryInfoArticleBody}>{activeInfoTab.content}</Text>
            {activeInfoTab.actionLabel && activeInfoTab.actionUrl ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL(activeInfoTab.actionUrl || "").catch((error) => {
                  appLogger.warn("employee.inventory-map.info-tab", "Không thể mở liên kết thông tin bảng hàng.", {
                    error,
                    tab: activeInfoTab.key,
                    url: activeInfoTab.actionUrl
                  });
                  notifyError("Không thể mở liên kết. Vui lòng thử lại.");
                })}
                style={styles.inventoryInfoArticleAction}
              >
                <Text style={styles.inventoryInfoArticleActionText}>{activeInfoTab.actionLabel}</Text>
                <Ionicons name="open-outline" size={16} color={employeePalette.red} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.inventoryInfoArticle}>
            <Text style={styles.inventoryInfoArticleEyebrow}>GIỚI THIỆU</Text>
            <Text style={styles.inventoryInfoArticleTitle}>{introArticle.title}</Text>
            <Text style={styles.inventoryInfoArticleBody}>{introArticle.summary}</Text>
            <Text style={styles.inventoryInfoArticleBody}>{introArticle.body}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!directionUrl}
            onPress={openInventoryDirections}
            style={({ pressed }) => [
              styles.inventoryRouteButton,
              (pressed || !directionUrl) && styles.pressed
            ]}
          >
            <Text style={styles.inventoryActionText}>Xem chỉ đường</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/employee/planning-check",
                params: { url: apiText(inventoryMapData.planning_check_url ?? inventoryMapData.planningCheckUrl, "https://quyhoach24h.vn?ref=C5WA63ND") }
              })
            }
            style={styles.inventoryPlanningButton}
          >
            <Text style={styles.inventoryActionText}>Kiểm tra quy hoạch</Text>
          </Pressable>

          <Image source={inventoryImages.planningArea} style={styles.inventoryPlanningMap} />
          <AreaCommentsSection
            comments={areaComments}
            currentPage={commentsCurrentPage}
            disabled={!areaId}
            draft={mapCommentDraft}
            emptyText={areaId ? "Chưa có bình luận nào." : "Chọn một khu đất để trao đổi."}
            loadingPage={commentsLoadingPage}
            onChangeDraft={setMapCommentDraft}
            onSelectPage={loadAreaCommentsPage}
            onSubmit={submitMapLotComment}
            pageCount={commentsLastPage}
            submitting={mapCommentSubmitting}
            totalCount={commentsTotal}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function PlanningCheckScreen() {
  const params = useLocalSearchParams<{ url?: string }>();
  const rawUrl = Array.isArray(params.url) ? params.url[0] : params.url;
  const planningUrl = rawUrl || "https://quyhoach24h.vn?ref=C5WA63ND";

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.planningCheckSafe}>
      <View style={styles.planningCheckHeader}>
        <Pressable accessibilityRole="button" onPress={() => back()} style={styles.planningCheckBackButton}>
          <Ionicons name="arrow-back" size={24} color={employeePalette.text} />
        </Pressable>
        <Text numberOfLines={1} style={styles.planningCheckTitle}>Kiểm tra quy hoạch</Text>
        <View style={styles.planningCheckHeaderSpacer} />
      </View>

      <WebView
        source={{ uri: planningUrl }}
        style={styles.planningCheckWebView}
        containerStyle={styles.planningCheckWebContainer}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </SafeAreaView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.inventoryLegendItem}>
      <View style={[styles.inventoryLegendDot, { backgroundColor: color }]} />
      <Text style={styles.inventoryLegendText}>{label}</Text>
    </View>
  );
}

function MapControl({
  disabled,
  highlight,
  icon,
  onPress
}: {
  disabled?: boolean;
  highlight?: boolean;
  icon: ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.inventoryMapControl, (pressed || disabled) && styles.pressed]}
    >
      <Ionicons name={icon} size={highlight ? 22 : 24} color={highlight ? employeePalette.red : "#111111"} />
    </Pressable>
  );
}

function CommentRow({
  initials,
  name,
  text,
  time,
  tone
}: {
  initials: string;
  name: string;
  text: string;
  time: string;
  tone: "red" | "gold";
}) {
  return (
    <View style={styles.inventoryCommentRow}>
      <View style={[styles.inventoryCommentAvatar, tone === "gold" && styles.inventoryCommentAvatarGold]}>
        <Text style={[styles.inventoryCommentInitials, tone === "gold" && styles.inventoryCommentInitialsGold]}>{initials}</Text>
      </View>
      <View style={styles.flex}>
        <View style={styles.inventoryCommentMeta}>
          <Text style={styles.inventoryCommentName}>{name}</Text>
          <Text style={styles.inventoryCommentTime}>{time}</Text>
        </View>
        <Text style={styles.inventoryCommentText}>{text}</Text>
      </View>
    </View>
  );
}

function AreaCommentsSection({
  comments,
  currentPage,
  disabled,
  draft,
  emptyText,
  loadingPage,
  onChangeDraft,
  onSelectPage,
  onSubmit,
  pageCount,
  submitting,
  totalCount
}: {
  comments: ApiObject[];
  currentPage?: number;
  disabled?: boolean;
  draft: string;
  emptyText: string;
  loadingPage?: number | null;
  onChangeDraft: (value: string) => void;
  onSelectPage?: (page: number) => void;
  onSubmit: () => void;
  pageCount?: number;
  submitting?: boolean;
  totalCount?: number;
}) {
  const displayCount = totalCount ?? comments.length;
  const safeCurrentPage = Math.max(1, currentPage ?? 1);
  const safePageCount = Math.max(1, pageCount ?? 1);
  const pageNumbers = Array.from({ length: safePageCount }, (_, index) => index + 1);

  return (
    <View style={styles.inventoryComments}>
      <View style={styles.inventoryCommentsHeader}>
        <Text style={styles.inventoryCommentsTitle}>BÌNH LUẬN & THẢO LUẬN</Text>
        <View style={styles.inventoryCommentsCount}>
          <Text style={styles.inventoryCommentsCountText}>{displayCount}</Text>
        </View>
      </View>
      {comments.length > 0 ? (
        comments.map((comment, index) => {
          const commentUser = isApiObject(comment.user) ? comment.user : {};
          const name = apiText(comment.user_name ?? comment.userName ?? commentUser.name, "Nhân viên hệ thống");

          return (
            <CommentRow
              key={apiText(comment.id, `${name}-${index}`)}
              initials={commentInitials(name)}
              name={name}
              text={apiText(comment.content ?? comment.text, "")}
              time={formatApiDateTime(comment.created_at ?? comment.createdAt, "Vừa xong")}
              tone={index % 2 === 0 ? "red" : "gold"}
            />
          );
        })
      ) : (
        <Text style={styles.inventoryCommentText}>{emptyText}</Text>
      )}
      {safePageCount > 1 ? (
        <View style={styles.inventoryCommentsPagination}>
          {pageNumbers.map((page) => {
            const active = page === safeCurrentPage;

            return (
              <Pressable
                accessibilityRole="button"
                disabled={Boolean(loadingPage) || active}
                key={page}
                onPress={() => onSelectPage?.(page)}
                style={({ pressed }) => [
                  styles.inventoryCommentsPageButton,
                  active && styles.inventoryCommentsPageButtonActive,
                  pressed && styles.pressed
                ]}
              >
                <Text style={[styles.inventoryCommentsPageText, active && styles.inventoryCommentsPageTextActive]}>
                  {page}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={styles.inventoryCommentInput}>
        <TextInput
          editable={!disabled && !submitting}
          onChangeText={onChangeDraft}
          placeholder="Nhập nội dung trao đổi..."
          placeholderTextColor="#8f706b"
          style={styles.inventoryCommentTextInput}
          value={draft}
        />
        <Pressable
          accessibilityRole="button"
          disabled={disabled || submitting || !draft.trim()}
          onPress={onSubmit}
          style={({ pressed }) => [styles.inventoryCommentSendButton, (pressed || submitting) && styles.pressed]}
        >
          <Ionicons name="send" size={22} color="#990100" />
        </Pressable>
      </View>
    </View>
  );
}

type LessonCourseQuizStatus = "unknown" | "available" | "locked" | "none" | "grading" | "passed" | "failed" | "completed" | "in_progress";

function lessonCourseQuizStatusFromLabel(value: unknown): LessonCourseQuizStatus | null {
  const label = apiText(value, "").trim().toLocaleLowerCase("vi-VN");

  if (!label) return null;
  if (label.includes("xem lại")) return "completed";
  if (label.includes("chưa đạt")) return "failed";
  if (label.includes("đang chấm")) return "grading";
  if (label.includes("làm bài kiểm tra")) return "available";

  return null;
}

function normalizeLessonCourseQuizStatus(value: unknown): LessonCourseQuizStatus {
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

function quizResultStatus(result: ApiObject): LessonCourseQuizStatus {
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

export function LotDetailScreen() {
  const params = useLocalSearchParams<{ lotId?: string }>();
  const rawLotId = params.lotId;
  const lotId = Array.isArray(rawLotId) ? rawLotId[0] : rawLotId;
  const [lotRefreshKey, setLotRefreshKey] = useState(0);
  const [lockSubmitting, setLockSubmitting] = useState(false);
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [lotHeroWidth, setLotHeroWidth] = useState(0);
  const [lotImageIndex, setLotImageIndex] = useState(0);
  const { data } = useEmployeeApiData(
    () => lotId ? employeeApi.lotDetail(lotId) : Promise.resolve({ data: {} }),
    [lotId, lotRefreshKey]
  );
  const lot = isApiObject(data) ? data : {};
  const lotName = apiText(lot.code ?? lot.name ?? lot.title, "Chưa thiết lập");
  const lotAreaObj = isApiObject(lot.area) ? lot.area : null;
  const lotArea = apiText(lot.area_name ?? lotAreaObj?.name ?? lot.location, "");
  const totalPrice = formatVietnamRealEstatePrice(lot.total_price ?? lot.price ?? lot.sale_price);
  const lotStatus = normalizeInventoryLotStatus(lot.status);
  const lotUnitPrice = formatUnitPricePerSquareMeter(lot.unit_price ?? lot.unitPrice, "Chưa thiết lập");
  const lotAreaSize = formatSquareMeters(lot.area_size ?? lot.areaSize ?? lot.square_meters, "Chưa thiết lập");
  const rawFrontage = lot.frontage !== null && lot.frontage !== undefined && lot.frontage !== "" ? `${lot.frontage}m` : "";
  const lotFrontage = (lot.is_corner === true || lot.is_corner === 1 || lot.is_corner === "1")
    ? (rawFrontage ? `${rawFrontage} (Lô góc)` : "Lô góc")
    : (rawFrontage || "Chưa có");
  const lotLegal = apiText(lot.legal, "Chưa có");
  const lotIsLockedByOther = apiBoolean(lot.is_locked_by_other ?? lot.isLockedByOther);
  const lotIsDepositedByOther = apiBoolean(lot.is_deposit_by_other ?? lot.isDepositByOther);
  const lotCanLock = apiBoolean(lot.can_lock ?? lot.canLock, false);
  const lotCanDeposit = apiBoolean(lot.can_deposit ?? lot.canDeposit, !lotIsLockedByOther && !lotIsDepositedByOther);
  const lotIsLocked = apiBoolean(lot.is_locked) || lotStatus === "held";
  const lotDetailStatusText = lotIsLocked ? "ĐÃ LOCK" : inventoryLotStatusLabel(lotStatus, lot.is_locked);
  const lotLockButtonText = lockSubmitting ? "ĐANG GỬI" : lotIsLocked ? "ĐÃ LOCK" : "LOCK";
  const lotDepositButtonText = depositSubmitting ? "ĐANG GỬI" : lotIsDepositedByOther ? "ĐÃ CỌC" : "CỌC";
  const lotImages = lotImageUris(lot);
  const lotImageSlides: ImageSourcePropType[] = lotImages.length > 0
    ? lotImages.map((uri) => ({ uri }))
    : [inventoryImages.lotHero];
  const firstLotImage = lotImages[0] ?? "";
  const visibleLotImageIndex = Math.min(lotImageIndex, Math.max(lotImageSlides.length - 1, 0));
  const lotGalleryCountText = lotImages.length > 0 ? `${visibleLotImageIndex + 1}/${lotImages.length}` : "0/0";
  const lotDescription = apiText(
    lot.description,
    "Chưa thiết lập."
  );
  const nestedArea = isApiObject(lot.area) ? lot.area : {};
  const nestedProject = isApiObject(nestedArea.project) ? nestedArea.project : {};
  const lotLocationQuery = apiText(
    nestedArea.location ?? nestedProject.location ?? nestedArea.project_name ?? nestedProject.name ?? lotArea,
    lotArea
  );
  const lotDirectionUrl = directionUrlFromRecord(lot) || directionUrlFromRecord(nestedArea) || directionUrlFromRecord(nestedProject) ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lotLocationQuery)}`;
  const lotShareUrl = apiText(
    lot.share_url ?? lot.shareUrl ?? lot.url ?? lot.public_url ?? lot.publicUrl,
    lotDirectionUrl
  );
  const lotShareMessage = [
    `${lotName} - ${lotArea}`,
    `Giá bán: ${totalPrice}`,
    `Diện tích: ${lotAreaSize}`,
    `Hướng: ${apiText(lot.direction, "Chưa có")}`,
    `Pháp lý: ${lotLegal}`,
    lotShareUrl ? `Xem vị trí: ${lotShareUrl}` : ""
  ].filter(Boolean).join("\n");

  useEffect(() => {
    setLotImageIndex(0);
  }, [firstLotImage, lotId, lotImages.length]);

  function handleLotHeroLayout(event: LayoutChangeEvent) {
    setLotHeroWidth(event.nativeEvent.layout.width);
  }

  function handleLotHeroScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const width = event.nativeEvent.layoutMeasurement.width;
    if (!width) return;

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setLotImageIndex(Math.min(Math.max(nextIndex, 0), lotImageSlides.length - 1));
  }

  async function requestLock() {
    if (!lotId) return;
    setLockSubmitting(true);
    try {
      const response = await employeeApi.requestLotLock(lotId, { reason: "Khách hẹn cọc ngày mai." });
      notifySuccess({ message: response.message || "Yêu cầu lock lô thành công." });
      setLotRefreshKey((value) => value + 1);
    } catch (error) {
      appLogger.warn("employee.lot.lock", "Không thể gửi yêu cầu lock lô.", { lotId, error });
      notifyError(error, "Không thể gửi yêu cầu lock lô.");
    } finally {
      setLockSubmitting(false);
    }
  }

  async function requestDeposit() {
    if (!lotId) return;
    setDepositSubmitting(true);
    try {
      const response = await employeeApi.requestLotDeposit(lotId, { reason: "Khách gửi yêu cầu đặt cọc." });
      notifySuccess({ message: response.message || "Yêu cầu đặt cọc đã được gửi thành công." });
      setLotRefreshKey((value) => value + 1);
    } catch (error) {
      appLogger.warn("employee.lot.deposit", "Không thể gửi yêu cầu cọc lô.", { lotId, error });
      notifyError(error, "Không thể gửi yêu cầu đặt cọc.");
    } finally {
      setDepositSubmitting(false);
    }
  }

  async function openLotDirections() {
    try {
      await Linking.openURL(lotDirectionUrl);
    } catch (error) {
      appLogger.warn("employee.lot.direction", "Không thể mở Google Maps cho lô đất.", { lotId, lotDirectionUrl, error });
      notifyError(error, "Không thể mở Google Maps cho lô đất.");
    }
  }

  async function shareLot() {
    try {
      await Share.share({
        message: lotShareMessage,
        title: `${lotName} - ${lotArea}`
      });
    } catch (error) {
      appLogger.warn("employee.lot.share", "Không thể chia sẻ lô đất.", { lotId, error });
      notifyError(error, "Không thể chia sẻ lô đất.");
    }
  }

  return (
    <SafeAreaView style={styles.lotDetailSafe}>
      <ScrollView contentContainerStyle={styles.lotDetailScroll} showsVerticalScrollIndicator={false}>
        <View onLayout={handleLotHeroLayout} style={styles.lotDetailHero}>
          <ScrollView
            bounces={false}
            decelerationRate="fast"
            horizontal
            onMomentumScrollEnd={handleLotHeroScrollEnd}
            pagingEnabled
            scrollEnabled={lotImageSlides.length > 1}
            showsHorizontalScrollIndicator={false}
            style={styles.lotDetailHeroCarousel}
          >
            {lotImageSlides.map((source, index) => (
              <Image
                key={lotImages[index] ?? `fallback-${index}`}
                source={source}
                style={[styles.lotDetailHeroImage, { width: lotHeroWidth || "100%" }]}
              />
            ))}
          </ScrollView>
          <View style={styles.lotDetailHeroActions}>
            <Pressable accessibilityRole="button" onPress={() => back()} style={styles.lotDetailHeroButton}>
              <Ionicons name="arrow-back" size={28} color={employeePalette.text} />
            </Pressable>
            <View style={styles.lotDetailHeroRightActions}>
              <Pressable accessibilityRole="button" onPress={openLotDirections} style={styles.lotDetailHeroButton}>
                <Ionicons name="map-outline" size={27} color={employeePalette.text} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={shareLot} style={styles.lotDetailHeroButton}>
                <Ionicons name="share-social-outline" size={27} color={employeePalette.text} />
              </Pressable>
            </View>
          </View>
          <View style={styles.lotDetailGalleryPill}>
            <Ionicons name="image" size={14} color={employeePalette.red} />
            <Text style={styles.lotDetailGalleryText}>{lotGalleryCountText}</Text>
          </View>
        </View>

        <View style={styles.lotDetailBody}>
          <View style={styles.lotDetailTitleRow}>
            <View style={styles.flex}>
              <Text style={styles.lotDetailTitle}>{lotName}</Text>
              <View style={styles.lotDetailLocationRow}>
                <Ionicons name="location-outline" size={18} color={employeePalette.muted} />
                <Text style={styles.lotDetailLocationText}>{lotArea}</Text>
              </View>
            </View>
            <View style={styles.lotDetailStatusPill}>
              <Text style={styles.lotDetailStatusText}>{lotDetailStatusText}</Text>
            </View>
          </View>

          <View style={styles.lotDetailPriceCard}>
            <Text style={styles.lotDetailPriceLabel}>TỔNG GIÁ BÁN</Text>
            <View style={styles.lotDetailTotalRow}>
              <Text style={styles.lotDetailTotalPrice}>{totalPrice}</Text>
            </View>
            <View style={styles.lotDetailDivider} />
            <View style={styles.lotDetailUnitRow}>
              <Text style={styles.lotDetailUnitLabel}>Đơn giá</Text>
              <Text style={styles.lotDetailUnitValue}>{lotUnitPrice}</Text>
            </View>
          </View>

          <View style={styles.lotDetailStatsGrid}>
            <LotStat icon="resize-outline" label="DIỆN TÍCH" value={lotAreaSize} />
            <LotStat icon="analytics-outline" label="MẶT TIỀN" value={lotFrontage} />
            <LotStat icon="compass-outline" label="HƯỚNG" value={apiText(lot.direction, "Đông Nam")} />
            <LotStat icon="document-text-outline" label="PHÁP LÝ" value={lotLegal} />
          </View>

          <View style={styles.lotDetailDescriptionSection}>
            <Text style={styles.lotDetailSectionTitle}>Mô tả chi tiết</Text>
            <Text style={styles.lotDetailDescription}>{lotDescription}</Text>
          </View>

          <Text style={styles.lotDetailNote}>
            Note: Nếu khách hàng cọc thì vui lòng đợi xác nhận từ Admin hoặc liên hệ với admin xác nhận
          </Text>
        </View>
      </ScrollView>

      <View style={styles.lotDetailBottomActions}>
        <Pressable
          accessibilityRole="button"
          disabled={lockSubmitting || lotIsLocked || !lotCanLock}
          onPress={requestLock}
          style={[
            styles.lotDetailActionButton,
            styles.lotDetailLockButton,
            lotIsLocked && styles.lotDetailLockButtonLocked,
            (!lotCanLock && !lotIsLocked) && styles.lotDetailLockButtonDisabled,
            lockSubmitting && styles.pressed
          ]}
        >
          <Ionicons name={lotIsLocked ? "lock-closed-outline" : "save-outline"} size={20} color={lotIsLocked ? "#1e8e3e" : (!lotCanLock && !lotIsLocked ? "#a1a1aa" : "#1e8e3e")} />
          <Text style={[styles.lotDetailLockText, lotIsLocked && styles.lotDetailLockTextLocked, (!lotCanLock && !lotIsLocked) && styles.lotDetailLockTextDisabled]}>{lotLockButtonText}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={depositSubmitting || !lotCanDeposit}
          onPress={requestDeposit}
          style={[
            styles.lotDetailActionButton,
            styles.lotDetailDepositButton,
            !lotCanDeposit && styles.lotDetailDepositButtonDisabled,
            depositSubmitting && styles.pressed
          ]}
        >
          <Ionicons name="send" size={20} color="#ffffff" />
          <Text style={styles.lotDetailDepositText}>{lotDepositButtonText}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function LotStat({ icon, label, value }: { icon: ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  return (
    <View style={styles.lotDetailStatCard}>
      <Ionicons name={icon} size={22} color="#8f706b" />
      <Text style={styles.lotDetailStatLabel}>{label}</Text>
      <Text style={styles.lotDetailStatValue}>{value}</Text>
    </View>
  );
}

export function NotificationsScreen() {
  const [tab, setTab] = useState<"all" | "internal">("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const params = useLocalSearchParams<{ audience?: string; returnTo?: string }>();
  const { setUnreadCount } = useNotificationState();
  const { data, failed, loading } = useEmployeeApiData(
    () => employeeApi.notifications({ per_page: 50 }),
    [refreshKey]
  );
  const notificationBack = () => backFromNotifications(
    params.returnTo,
    params.audience === "customer" ? "/(app)/(tabs)" : "/employee"
  );
  const rows = mapNotificationRows(data).filter((row) => tab === "all" || row.scope === "internal");

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((value) => value + 1);
    }, [])
  );

  useEffect(() => {
    const root = isApiObject(data) ? data : {};
    if (root.unread_count !== undefined) {
      setUnreadCount(apiNumber(root.unread_count, 0));
    }
  }, [data, setUnreadCount]);

  const openNotification = async (item: NotificationRow) => {
    try {
      if (!item.read) {
        await employeeApi.markNotificationRead(item.id);
        setUnreadCount((value) => Math.max(0, value - 1));
      } else {
        await employeeApi.notificationDetail(item.id).catch(() => null);
      }

      const href = notificationHref(item);
      if (href) {
        router.push(href);
      }

      setRefreshKey((value) => value + 1);
    } catch (error) {
      appLogger.warn("employee.notifications", "Không thể xử lý thông báo.", { id: item.id, error });
      notifyError({ message: "Không thể mở thông báo. Vui lòng thử lại." });
    }
  };

  const markAllRead = async () => {
    try {
      await employeeApi.markAllNotificationsRead();
      setUnreadCount(0);
      notifySuccess({ message: "Đã đánh dấu tất cả thông báo là đã đọc." });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      appLogger.warn("employee.notifications", "Không thể đánh dấu đã đọc tất cả thông báo.", { error });
      notifyError({ message: "Không thể đánh dấu thông báo. Vui lòng thử lại." });
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.notificationSafe}>
      <View style={styles.notificationHeader}>
        <Pressable accessibilityRole="button" onPress={notificationBack} style={styles.notificationBackButton}>
          <Ionicons name="arrow-back" size={26} color="#000000" />
        </Pressable>
        <Text style={styles.notificationHeaderTitle}>Thông báo</Text>
        <Pressable accessibilityRole="button" onPress={markAllRead} style={styles.notificationReadAllButton}>
          <Ionicons name="checkmark-done" size={20} color="#950100" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.notificationScroll} style={styles.notificationRoot}>
        <View style={styles.notificationTabs}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab("all")}
            style={[styles.notificationTab, tab === "all" && styles.notificationTabActive]}
          >
            <Text style={[styles.notificationTabText, tab === "all" && styles.notificationTabTextActive]}>Tất cả</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab("internal")}
            style={[styles.notificationTab, tab === "internal" && styles.notificationTabActive]}
          >
            <Text style={[styles.notificationTabText, tab === "internal" && styles.notificationTabTextActive]}>Nội bộ</Text>
          </Pressable>
        </View>

        <View style={styles.notificationList}>
          {loading ? <Text style={styles.notificationStateText}>Đang tải thông báo...</Text> : null}
          {failed ? <Text style={styles.notificationStateText}>Không thể tải thông báo. Vui lòng thử lại.</Text> : null}
          {!loading && !failed && rows.length === 0 ? (
            <Text style={styles.notificationStateText}>
              {tab === "internal" ? "Chưa có thông báo nội bộ." : "Chưa có thông báo."}
            </Text>
          ) : null}
          {rows.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => openNotification(item)}
              style={({ pressed }) => [
                styles.notificationCard,
                item.read && styles.notificationCardRead,
                pressed && styles.pressed
              ]}
            >
              <View style={styles.notificationCardTitleRow}>
                <Text numberOfLines={2} style={[styles.notificationTitle, item.read && styles.notificationTitleRead]}>
                  {item.title}
                </Text>
                {!item.read ? <View style={styles.notificationUnreadDot} /> : null}
              </View>
              <Text numberOfLines={2} style={styles.notificationBody}>{item.body}</Text>
              <View style={styles.notificationMetaRow}>
                <Text style={styles.notificationTime}>{item.time}</Text>
                <View style={styles.notificationMetaDot} />
                <Text style={[styles.notificationCategory, item.categoryTone === "gold" ? styles.notificationCategoryGold : item.read ? styles.notificationCategoryRead : styles.notificationCategoryRed]}>
                  {item.category}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  time: string;
  category: string;
  categoryTone: "gold" | "gray" | "red";
  read: boolean;
  scope: "internal" | "system";
  actionType: string;
  actionId: string;
};

function mapNotificationRows(data: unknown): NotificationRow[] {
  const root = isApiObject(data) ? data : {};
  const notifications = isApiObject(root.notifications) ? root.notifications : {};
  const source = Array.isArray(notifications.data)
    ? notifications.data
    : Array.isArray(root.notifications)
      ? root.notifications
      : [];

  return source
    .filter(isApiObject)
    .map((item) => {
      const payload = isApiObject(item.data) ? item.data : {};
      const actionType = apiText(payload.action_type ?? payload.actionType ?? item.type, "system").toLowerCase();
      const title = apiText(payload.title ?? item.title, "Thông báo");
      const body = apiText(payload.body ?? payload.message ?? item.message, "Bạn có thông báo mới.");
      const isRead = Boolean(item.is_read ?? item.read_at);
      const scope: NotificationRow["scope"] = isInternalNewsNotification(actionType, title, body) ? "internal" : "system";

      return {
        id: apiText(item.id, ""),
        title,
        body,
        time: formatNotificationTime(item.created_at),
        category: notificationCategory(actionType),
        categoryTone: notificationTone(actionType, isRead),
        read: isRead,
        scope,
        actionType,
        actionId: apiText(payload.action_id ?? payload.actionId ?? item.action_id, "")
      };
    })
    .filter((item) => item.id);
}

function isInternalNewsNotification(actionType: string, title: string, body: string) {
  const action = actionType.toLowerCase();
  if (action.includes("recruitment")) return false;
  if (action.includes("internal") && (action.includes("news") || action.includes("post"))) return true;
  if (action.includes("internal_post") || action.includes("internal_news")) return true;

  const content = `${title} ${body}`.toLowerCase();
  if ((action.includes("news") || action.includes("post")) && content.includes("nội bộ")) return true;
  if ((action.includes("comment") || action.includes("like")) && content.includes("bài viết nội bộ")) return true;

  return false;
}

function formatNotificationTime(value: unknown) {
  const timestamp = Date.parse(apiText(value, ""));
  if (Number.isNaN(timestamp)) {
    return "VỪA XONG";
  }

  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return "VỪA XONG";
  if (diffMinutes < 60) return `${diffMinutes} PHÚT TRƯỚC`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} GIỜ TRƯỚC`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "HÔM QUA";
  return `${diffDays} NGÀY TRƯỚC`;
}

function notificationCategory(actionType: string) {
  if (actionType.includes("leave")) return "NGHỈ PHÉP";
  if (actionType.includes("transfer")) return "CHUYỂN PHÒNG BAN";
  if (actionType.includes("deposit")) return "ĐẶT CỌC";
  if (actionType.includes("lot") || actionType.includes("inventory")) return "BẢNG HÀNG";
  if (actionType.includes("news") || actionType.includes("post")) return "TIN NỘI BỘ";
  if (actionType.includes("learning") || actionType.includes("quiz")) return "ĐÀO TẠO";
  return "HỆ THỐNG";
}

function notificationTone(actionType: string, read: boolean): NotificationRow["categoryTone"] {
  if (read) return "gray";
  if (actionType.includes("learning") || actionType.includes("news")) return "gold";
  return "red";
}

function notificationHref(item: NotificationRow): Href | null {
  if (item.actionType.includes("leave")) return "/employee/leave-requests";
  if (item.actionType.includes("department_transfer") || item.actionType.includes("transfer")) return "/employee/transfer-requests";
  if (item.actionType.includes("lot") && item.actionId) {
    return { pathname: "/employee/lot-detail", params: { lotId: item.actionId } };
  }
  if (item.actionType.includes("deposit") || item.actionType.includes("inventory")) return "/employee/inventory-map";
  if (item.actionType.includes("news") || item.actionType.includes("post")) return "/(app)/employee/(tabs)/news";
  if (item.actionType.includes("learning") || item.actionType.includes("quiz")) return "/employee/required-learning";
  return null;
}

function newsCommentKey(comment: ApiObject) {
  const id = apiText(comment.id, "").trim();
  if (id) return id;

  return [
    apiText(comment.news_id ?? comment.newsId, ""),
    apiText(comment.user_id ?? comment.userId, ""),
    apiText(comment.content ?? comment.text, ""),
    apiText(comment.created_at ?? comment.createdAt, "")
  ].filter(Boolean).join("|");
}

function prependNewsComment(comments: ApiObject[], comment: ApiObject) {
  const nextKey = newsCommentKey(comment);

  if (nextKey && comments.some((item) => newsCommentKey(item) === nextKey)) {
    return comments;
  }

  return [comment, ...comments];
}

function normalizeRealtimeNewsComment(payload: unknown, fallbackNewsId: string) {
  const root = isApiObject(payload) ? payload : {};
  const data = isApiObject(root.data) ? root.data : {};
  const source = Object.keys(data).length > 0 ? data : root;
  const comment = isApiObject(source.comment) ? source.comment : source;
  const newsId = apiText(source.news_id ?? source.newsId ?? comment.news_id ?? comment.newsId, fallbackNewsId).trim();
  const content = apiText(comment.content ?? comment.text, "").trim();

  if (!newsId || !content) {
    return null;
  }

  return {
    newsId,
    comment: {
      ...comment,
      news_id: newsId
    }
  };
}

export function CommentsScreen() {
  const c = useCopy().notifications;
  const params = useLocalSearchParams<{ postId?: string; title?: string }>();
  const postId = paramValue(params.postId) ?? "";
  const routeTitle = paramValue(params.title) ?? "";
  const [commentDraft, setCommentDraft] = useState("");
  const [comments, setComments] = useState<ApiObject[]>([]);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const { data, failed, loading } = useEmployeeApiData(
    () => postId ? employeeApi.internalNewsDetail(postId) : Promise.resolve({ data: {} }),
    [postId]
  );
  const detailPayload = isApiObject(data) ? data : {};
  const detail = isApiObject(detailPayload.detail) ? detailPayload.detail : detailPayload;
  const fetchedComments = useMemo(() => apiList(detailPayload.comments), [detailPayload.comments]);
  const postTitle = apiText(detail.title ?? routeTitle, "Bình luận bài viết");
  const postSummary = htmlToPlainText(apiText(detail.summary ?? detail.content, ""));

  useEffect(() => {
    setComments(fetchedComments);
  }, [fetchedComments]);

  const handleRealtimeNewsComment = useCallback((payload: unknown) => {
    const realtimeComment = normalizeRealtimeNewsComment(payload, postId);
    if (!realtimeComment || realtimeComment.newsId !== postId) {
      return;
    }

    setComments((current) => prependNewsComment(current, realtimeComment.comment));
  }, [postId]);

  useRealtimeEvent("news.comment.created", handleRealtimeNewsComment);
  useRealtimeRoom(postId ? `news:${postId}` : "");

  async function submitComment() {
    const content = commentDraft.trim();

    if (!postId || !content || commentSubmitting) {
      return;
    }

    setCommentSubmitting(true);
    try {
      const response = await employeeApi.addInternalNewsComment(postId, content);
      const createdComment = isApiObject(response.data) ? response.data : {};
      setComments((current) => prependNewsComment(current, createdComment));
      setCommentDraft("");
      notifySuccess({ message: response.message || "Đã gửi bình luận." });
    } catch (error) {
      appLogger.warn("employee.news.comment", "Không thể gửi bình luận bài viết nội bộ.", { postId, error });
      notifyError(error, "Không thể gửi bình luận.");
    } finally {
      setCommentSubmitting(false);
    }
  }

  return (
    <EmployeePage title={c.comments} subtitle="Bảng tin nội bộ" back={back}>
      {!postId ? (
        <EmployeeCard>
          <Text style={styles.listTitle}>Chưa chọn bài viết</Text>
          <Text style={styles.bodyText}>Vui lòng mở bình luận từ một bài viết trong tab Tin tức.</Text>
        </EmployeeCard>
      ) : (
        <>
          <EmployeeCard>
            <Text style={styles.listTitle}>{postTitle}</Text>
            {postSummary ? <Text numberOfLines={3} style={styles.bodyText}>{postSummary}</Text> : null}
          </EmployeeCard>

          {loading ? <Text style={styles.bodyText}>Đang tải bình luận...</Text> : null}
          {failed ? <Text style={styles.bodyText}>Không thể tải bình luận. Vui lòng thử lại.</Text> : null}
          {!loading && !failed && comments.length === 0 ? <Text style={styles.bodyText}>Chưa có bình luận nào.</Text> : null}

          {comments.map((comment, index) => {
            const commentUser = isApiObject(comment.user) ? comment.user : {};
            const name = apiText(comment.user_name ?? comment.userName ?? commentUser.name, "Người dùng hệ thống");

            return (
              <EmployeeCard key={newsCommentKey(comment) || `${name}-${index}`}>
                <Text style={styles.listTitle}>{name}</Text>
                <Text style={styles.bodyText}>{apiText(comment.content ?? comment.text, "")}</Text>
                <Text style={styles.commentTimeText}>{formatApiDateTime(comment.created_at ?? comment.createdAt, "Vừa xong")}</Text>
              </EmployeeCard>
            );
          })}

          <View style={styles.commentsComposer}>
            <TextInput
              editable={!commentSubmitting}
              multiline
              onChangeText={setCommentDraft}
              placeholder="Nhập nội dung trao đổi..."
              placeholderTextColor="#8f706b"
              style={styles.commentsInput}
              textAlignVertical="top"
              value={commentDraft}
            />
            <Pressable
              accessibilityRole="button"
              disabled={commentSubmitting || !commentDraft.trim()}
              onPress={submitComment}
              style={({ pressed }) => [
                styles.commentsSendButton,
                (pressed || commentSubmitting || !commentDraft.trim()) && styles.pressed
              ]}
            >
              <Ionicons name="send-outline" size={18} color="#ffffff" />
              <Text style={styles.commentsSendText}>{commentSubmitting ? "Đang gửi" : c.send}</Text>
            </Pressable>
          </View>
        </>
      )}
    </EmployeePage>
  );
}

function getPositionLabel(posValue: number | string) {
  const val = Number(posValue);
  if (val === 1) return "Nhân viên";
  if (val === 2) return "Trưởng phòng";
  if (val === 3) return "Giám đốc";
  return "Không xác định";
}

export type RecruitmentApplicationData = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  applied_position: number;
  applied_branch_id: number;
  education: string;
  experience: string;
  profile_url: string;
  introduction: string;
  cv_url: string;
  status: "pending" | "approved" | "rejected";
  rejected_reason?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  user?: {
    fullName?: string;
    phone?: string;
  };
  branch?: {
    name?: string;
  };
};

export function RecruitmentApprovalsScreen() {
  const [applications, setApplications] = useState<RecruitmentApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  async function fetchApplications() {
    try {
      const res = await employeeApi.recruitmentApplications();
      if (res && Array.isArray(res.data)) {
        setApplications(res.data);
      }
    } catch (err) {
      console.log("Failed to fetch recruitment applications", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    fetchApplications();
  }

  const filtered = applications.filter((app) => {
    if (filter === "all") return true;
    return app.status === filter;
  });

  return (
    <EmployeePage edges={["top", "left", "right"]} contentStyle={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={employeePalette.redDark} />
        </Pressable>
        <Text style={styles.screenTitle}>Duyệt đơn ứng tuyển</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        {(["pending", "approved", "rejected", "all"] as const).map((tab) => {
          const active = filter === tab;
          const label =
            tab === "pending"
              ? "Chờ duyệt"
              : tab === "approved"
                ? "Đã duyệt"
                : tab === "rejected"
                  ? "Từ chối"
                  : "Tất cả";
          return (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.tabButton, active && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={employeePalette.redDark} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[employeePalette.redDark]} />}
        >
          {filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="document-text-outline" size={48} color="#b0b0b0" />
              <Text style={{ marginTop: 8, color: "#808080", fontFamily: appFonts.regular, fontSize: 16 }}>
                Không có đơn ứng tuyển nào.
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
              <RecruitmentApplicationCard key={item.id} application={item} onChanged={fetchApplications} />
            ))
          )}
        </ScrollView>
      )}
    </EmployeePage>
  );
}

function RecruitmentApplicationCard({
  application,
  onChanged
}: {
  application: RecruitmentApplicationData;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState<"approve" | "reject" | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [reason, setReason] = useState("");

  const statusLabel =
    application.status === "approved"
      ? "Đã duyệt"
      : application.status === "rejected"
        ? "Từ chối"
        : "Chờ duyệt";

  const statusColor =
    application.status === "approved"
      ? "#2e7d32"
      : application.status === "rejected"
        ? "#c62828"
        : "#ef6c00";

  const statusBg =
    application.status === "approved"
      ? "#e8f5e9"
      : application.status === "rejected"
        ? "#ffebee"
        : "#fff3e0";

  async function handleApprove() {
    Alert.alert("Phê duyệt", `Xác nhận phê duyệt hồ sơ của ứng viên ${application.name || application.user?.fullName}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xác nhận",
        onPress: async () => {
          setProcessing("approve");
          try {
            await employeeApi.processRecruitmentApplication(application.id, "approved");
            notifySuccess({ message: "Phê duyệt hồ sơ thành công." });
            onChanged();
          } catch (err: any) {
            notifyError(err);
          } finally {
            setProcessing(null);
          }
        }
      }
    ]);
  }

  async function handleReject() {
    if (!reason.trim()) {
      notifyError("Vui lòng nhập lý do từ chối.");
      return;
    }
    setProcessing("reject");
    try {
      await employeeApi.processRecruitmentApplication(application.id, "rejected", reason.trim());
      notifySuccess({ message: "Đã từ chối hồ sơ ứng tuyển." });
      setRejectModalVisible(false);
      setReason("");
      onChanged();
    } catch (err: any) {
      notifyError(err);
    } finally {
      setProcessing(null);
    }
  }

  function handleOpenCv() {
    if (!application.cv_url) return;
    const url = application.cv_url.startsWith("http")
      ? application.cv_url
      : `${API_URL}/storage/${application.cv_url}`;
    Linking.openURL(url).catch((err) => {
      console.log("Failed to open URL", err);
      notifyError("Không thể mở CV lúc này.");
    });
  }

  return (
    <View style={styles.recruitmentCard}>
      <View style={styles.recruitmentCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recruitmentName}>
            {application.name || application.user?.fullName || "Ứng viên"}
          </Text>
          <Text style={styles.recruitmentPhone}>
            SĐT: {application.phone || application.user?.phone || "Chưa cập nhật"}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.recruitmentInfoRow}>
        <Text style={styles.recruitmentInfoLabel}>Vị trí:</Text>
        <Text style={styles.recruitmentInfoValue}>
          {getPositionLabel(application.applied_position)}
        </Text>
      </View>
      <View style={styles.recruitmentInfoRow}>
        <Text style={styles.recruitmentInfoLabel}>Chi nhánh:</Text>
        <Text style={styles.recruitmentInfoValue}>
          {application.branch?.name || "Chưa cập nhật"}
        </Text>
      </View>

      {expanded && (
        <View style={styles.recruitmentDetails}>
          <View style={styles.detailDivider} />
          {application.education && (
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>Học vấn:</Text>
              <Text style={styles.detailValue}>{application.education}</Text>
            </View>
          )}
          {application.experience && (
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>Kinh nghiệm:</Text>
              <Text style={styles.detailValue}>{application.experience}</Text>
            </View>
          )}
          {application.introduction && (
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>Giới thiệu:</Text>
              <Text style={styles.detailValue}>{application.introduction}</Text>
            </View>
          )}
          {application.profile_url && (
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>Profile link:</Text>
              <Pressable onPress={() => Linking.openURL(application.profile_url)}>
                <Text style={[styles.detailValue, { color: "#0066cc", textDecorationLine: "underline" }]}>
                  {application.profile_url}
                </Text>
              </Pressable>
            </View>
          )}
          {application.cv_url && (
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>CV file:</Text>
              <Pressable onPress={handleOpenCv} style={styles.cvButton}>
                <Ionicons name="document-attach-outline" size={16} color="#6a0100" />
                <Text style={styles.cvButtonText}>Xem CV đính kèm</Text>
              </Pressable>
            </View>
          )}
          {application.rejected_reason && (
            <View style={[styles.detailField, { backgroundColor: "#ffebee", padding: 8, borderRadius: 6 }]}>
              <Text style={[styles.detailLabel, { color: "#c62828" }]}>Lý do từ chối:</Text>
              <Text style={[styles.detailValue, { color: "#c62828" }]}>{application.rejected_reason}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.recruitmentCardActions}>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.toggleExpandButton}>
          <Text style={styles.toggleExpandText}>{expanded ? "Thu gọn" : "Xem chi tiết"}</Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
        </Pressable>

        {application.status === "pending" && (
          <View style={styles.actionButtonContainer}>
            <Pressable
              disabled={processing !== null}
              onPress={() => setRejectModalVisible(true)}
              style={[styles.actionBtn, styles.rejectBtn]}
            >
              <Text style={styles.actionBtnTextReject}>Từ chối</Text>
            </Pressable>
            <Pressable
              disabled={processing !== null}
              onPress={handleApprove}
              style={[styles.actionBtn, styles.approveBtn]}
            >
              {processing === "approve" ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.actionBtnTextApprove}>Duyệt</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <Modal animationType="fade" onRequestClose={() => setRejectModalVisible(false)} transparent visible={rejectModalVisible}>
        <Pressable onPress={() => setRejectModalVisible(false)} style={styles.modalBackdrop}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Từ chối hồ sơ</Text>
            <Text style={styles.modalSubtitle}>Nhập lý do từ chối hồ sơ của ứng viên {application.name}:</Text>
            <TextInput
              multiline
              onChangeText={setReason}
              placeholder="Nhập lý do từ chối tại đây..."
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={reason}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setRejectModalVisible(false)} style={[styles.modalBtn, styles.modalCancelBtn]}>
                <Text style={styles.modalBtnTextCancel}>Hủy</Text>
              </Pressable>
              <Pressable disabled={processing !== null} onPress={handleReject} style={[styles.modalBtn, styles.modalConfirmBtn]}>
                {processing === "reject" ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalBtnTextConfirm}>Từ chối</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  commentTimeText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8
  },
  commentsComposer: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 12
  },
  commentsInput: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 88,
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  commentsSendButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: employeePalette.redDark,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 16
  },
  commentsSendText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 20
  },
  notificationSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  notificationHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingHorizontal: 20
  },
  notificationBackButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  notificationHeaderTitle: {
    color: "#000000",
    fontFamily: appFonts.bold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.45,
    lineHeight: 28,
    marginLeft: 8
  },
  notificationHeaderSpacer: {
    flex: 1
  },
  notificationRoot: {
    backgroundColor: "#f9f9fc",
    flex: 1
  },
  notificationScroll: {
    paddingBottom: 96
  },
  notificationTabs: {
    backgroundColor: "#f3f3f6",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 4
  },
  notificationTab: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  notificationTabActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  notificationTabText: {
    color: "#434653",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20
  },
  notificationTabTextActive: {
    color: "#950100",
    fontWeight: "600"
  },
  notificationList: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 24
  },
  notificationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16
  },
  notificationCardRead: {
    backgroundColor: "#f3f3f6",
    opacity: 0.8
  },
  notificationCardTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  notificationTitle: {
    color: "#1a1c1e",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
    paddingRight: 10
  },
  notificationTitleRead: {
    fontFamily: appFonts.semiBold,
    fontWeight: "600"
  },
  notificationUnreadDot: {
    backgroundColor: "#950100",
    borderRadius: 999,
    height: 10,
    marginTop: 4,
    width: 10
  },
  notificationReadAllButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  notificationStateText: {
    color: "#737784",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  notificationBody: {
    color: "#434653",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 4
  },
  notificationMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingTop: 12
  },
  notificationTime: {
    color: "#737784",
    fontFamily: appFonts.bold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.55,
    lineHeight: 16.5
  },
  notificationMetaDot: {
    backgroundColor: "#c3c6d5",
    borderRadius: 999,
    height: 4,
    width: 4
  },
  notificationCategory: {
    fontFamily: appFonts.bold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.55,
    lineHeight: 16.5
  },
  notificationCategoryGold: {
    color: "#805600"
  },
  notificationCategoryRed: {
    color: "#950100"
  },
  notificationCategoryRead: {
    color: "#737784"
  },
  pointHistorySafe: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  pointHistoryHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 2,
    zIndex: 2
  },
  pointHistoryBackButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  pointHistoryHeaderTitle: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 28,
    marginLeft: 8
  },
  pointHistoryHeaderSpacer: {
    height: 36,
    width: 36
  },
  pointHistoryContent: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  pointHistoryHero: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderColor: "rgba(106, 1, 0, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 190,
    overflow: "hidden",
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  pointHistoryHeroGlowTop: {
    backgroundColor: "rgba(238, 192, 91, 0.1)",
    borderRadius: 999,
    height: 128,
    position: "absolute",
    right: -64,
    top: -64,
    width: 128
  },
  pointHistoryHeroGlowBottom: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 999,
    bottom: -48,
    height: 96,
    left: -48,
    position: "absolute",
    width: 96
  },
  pointHistoryHeroEyebrow: {
    color: "#ffdf9f",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    paddingBottom: 8,
    textAlign: "center"
  },
  pointHistoryHeroValue: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 56,
    letterSpacing: -2.8,
    lineHeight: 56,
    paddingBottom: 8,
    textAlign: "center"
  },
  pointHistoryRankPill: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 17,
    paddingVertical: 9
  },
  pointHistoryRankText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    letterSpacing: 0.8,
    lineHeight: 22
  },
  pointHistoryStatsGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16
  },
  pointHistoryStatCard: {
    backgroundColor: "#ffffff",
    borderColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "space-between",
    minHeight: 86,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2
  },
  pointHistoryStatLabel: {
    color: "#a3a3a3",
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  pointHistoryMonthRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8
  },
  pointHistoryMonthValue: {
    color: "#6a0100",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  pointHistoryMonthGrowth: {
    color: "#16a34a",
    fontFamily: appFonts.bold,
    fontSize: 10,
    lineHeight: 15
  },
  pointHistoryProgressTrack: {
    backgroundColor: "#f5f5f5",
    borderRadius: 999,
    height: 6,
    marginTop: 13,
    overflow: "hidden",
    width: "100%"
  },
  pointHistoryProgressFill: {
    backgroundColor: "#eec05b",
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  pointHistoryTargetText: {
    color: "#525252",
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4
  },
  pointHistorySectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    marginTop: 18
  },
  pointHistoryList: {
    gap: 12,
    marginTop: 16
  },
  pointHistoryEmpty: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#f0e7e4",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 120,
    paddingHorizontal: 18,
    paddingVertical: 24
  },
  pointHistoryEmptyTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center"
  },
  pointHistoryEmptyText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center"
  },
  pointHistoryItem: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 74,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2
  },
  pointHistoryItemDimmed: {
    opacity: 0.7
  },
  pointHistoryItemTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 20
  },
  pointHistoryItemTime: {
    color: "#a3a3a3",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4
  },
  pointHistoryPoints: {
    alignItems: "flex-end"
  },
  pointHistoryPointsValue: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "right"
  },
  pointHistoryPointsUnit: {
    color: "#a3a3a3",
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "right"
  },
  certificatesSafe: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  certificatesHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f4f4f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 2
  },
  certificatesHeaderButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  certificatesHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    includeFontPadding: true,
    letterSpacing: -0.45,
    lineHeight: 28,
    marginLeft: 8
  },
  certificatesHeaderSpacer: {
    height: 36,
    width: 36
  },
  certificatesContent: {
    gap: 16,
    paddingBottom: 96,
    paddingHorizontal: 20,
    paddingTop: 24
  },
  certificatesHero: {
    backgroundColor: "#6a0100",
    borderRadius: 12,
    minHeight: 204,
    padding: 24
  },
  certificatesHeroTitle: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: true,
    lineHeight: 34
  },
  certificatesHeroText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 26,
    marginTop: 8,
    maxWidth: 272
  },
  certificatesHeroStats: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24
  },
  certificatesHeroBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    minWidth: 104,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  certificatesHeroBadgeValue: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 24,
    includeFontPadding: true,
    lineHeight: 34
  },
  certificatesHeroBadgeLabel: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18,
    marginTop: 2
  },
  certificatesLevelCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#f4f4f5",
    borderRadius: 12,
    borderWidth: 1,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  certificatesLevelIcon: {
    alignItems: "center",
    backgroundColor: "#ffdf9f",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    marginBottom: 15,
    width: 64
  },
  certificatesLevelLabel: {
    color: "#795900",
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18,
    textAlign: "center"
  },
  certificatesLevelTitle: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 34,
    marginTop: 4,
    textAlign: "center"
  },
  certificatesSearchBox: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 44,
    paddingHorizontal: 13
  },
  certificatesSearchText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 24,
    paddingVertical: 0
  },
  certificatesFilterButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 17
  },
  certificatesFilterButtonActive: {
    backgroundColor: "#fff7f6",
    borderColor: employeePalette.redDark
  },
  certificatesFilterText: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 24
  },
  certificatesFilterTextActive: {
    color: employeePalette.redDark
  },
  certificatesFilterBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  certificatesFilterModal: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    width: "100%"
  },
  certificatesFilterModalHeader: {
    alignItems: "center",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  certificatesFilterModalTitle: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 22
  },
  certificatesFilterCloseButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  certificatesFilterModalList: {
    padding: 12
  },
  certificatesFilterOption: {
    alignItems: "center",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  certificatesFilterOptionActive: {
    backgroundColor: "#fff7df",
    borderColor: "#f5c14b"
  },
  certificatesFilterOptionText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 10
  },
  certificatesFilterOptionTextActive: {
    color: employeePalette.goldDark
  },
  certificatesList: {
    gap: 20,
    marginTop: 4
  },
  certificatesCard: {
    backgroundColor: "#ffffff",
    borderColor: "#f4f4f5",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  certificatesImageWrap: {
    height: 192,
    overflow: "hidden",
    width: "100%"
  },
  certificatesImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  certificatesVerifiedPill: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#f4f4f5",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    position: "absolute",
    right: 16,
    top: 16
  },
  certificatesVerifiedText: {
    color: "#15803d",
    fontFamily: appFonts.bold,
    fontSize: 10,
    includeFontPadding: true,
    lineHeight: 16
  },
  certificatesCardBody: {
    padding: 24
  },
  certificatesCardTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  certificatesCardTitle: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 18,
    includeFontPadding: true,
    lineHeight: 28
  },
  certificatesNewBadge: {
    backgroundColor: "#fffbeb",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  certificatesNewBadgeText: {
    color: "#b45309",
    fontFamily: appFonts.regular,
    fontSize: 10,
    includeFontPadding: true,
    lineHeight: 15
  },
  certificatesProvider: {
    color: "#71717a",
    fontFamily: appFonts.regular,
    fontSize: 14,
    includeFontPadding: true,
    lineHeight: 22,
    marginTop: 4
  },
  certificatesDivider: {
    backgroundColor: "#f4f4f5",
    height: 1,
    marginVertical: 24
  },
  certificatesDateLabel: {
    color: "#a1a1aa",
    fontFamily: appFonts.regular,
    fontSize: 10,
    includeFontPadding: true,
    lineHeight: 15
  },
  certificatesDate: {
    color: "#000000",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    includeFontPadding: true,
    lineHeight: 22
  },
  certificatesFab: {
    alignItems: "center",
    backgroundColor: "#7f1d1d",
    borderRadius: 999,
    bottom: 46,
    height: 56,
    justifyContent: "center",
    position: "absolute",
    right: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    width: 56,
    elevation: 4
  },
  leaveSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  leaveHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 2,
    zIndex: 2
  },
  leaveHeaderButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  leaveHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.45,
    lineHeight: 28,
    marginLeft: 8
  },
  leaveRoot: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  leaveScrollContent: {
    paddingBottom: 48,
    paddingHorizontal: 17,
    paddingTop: 20
  },
  leaveIntro: {
    gap: 7,
    marginBottom: 56
  },
  leaveIntroCompact: {
    gap: 7,
    marginBottom: 20
  },
  leaveTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  leaveSubtitle: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  leaveFormCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    marginBottom: 24,
    padding: 17,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20
  },
  leaveFormTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 24
  },
  leaveTypeButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    height: 50,
    justifyContent: "space-between",
    paddingHorizontal: 17
  },
  leaveTypeButtonText: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  leaveSubmitButton: {
    alignItems: "center",
    backgroundColor: "#950100",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    height: 50,
    justifyContent: "center",
    shadowColor: "#950100",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 3
  },
  leaveSubmitText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  leaveHistoryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  transferHistoryHeader: {
    marginTop: 28
  },
  leaveHistoryTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 26
  },
  leaveHistoryMeta: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 18
  },
  leaveFilterScroll: {
    marginBottom: 31,
    marginHorizontal: -17
  },
  leaveFilterContent: {
    gap: 8,
    paddingHorizontal: 17
  },
  leaveFilterChip: {
    alignItems: "center",
    backgroundColor: "#e7e8e9",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  leaveFilterChipActive: {
    backgroundColor: "#950100"
  },
  leaveFilterText: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.32,
    lineHeight: 22
  },
  leaveFilterTextActive: {
    color: "#ffffff"
  },
  leaveStateText: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12
  },
  leaveList: {
    gap: 16
  },
  leaveCard: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 17,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20
  },
  leaveCardRejected: {
    opacity: 0.7
  },
  leaveCardTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  leaveHistoryCardTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  leaveHistoryCardTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minWidth: 0
  },
  leaveHistoryCardTitle: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 24
  },
  leavePerson: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0
  },
  leaveAvatar: {
    borderColor: "#e1e3e4",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    width: 48
  },
  leavePersonText: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 16
  },
  leaveName: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  leaveDepartment: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  leaveBadge: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  leaveBadgePending: {
    backgroundColor: "#e7e8e9"
  },
  leaveBadgeApproved: {
    backgroundColor: "#fdce67"
  },
  leaveBadgeRejected: {
    backgroundColor: "#ffdad6"
  },
  leaveBadgeText: {
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    lineHeight: 18
  },
  leaveBadgePendingText: {
    color: "#5b403c"
  },
  leaveBadgeApprovedText: {
    color: "#755700"
  },
  leaveBadgeRejectedText: {
    color: "#93000a"
  },
  leaveDetailBox: {
    backgroundColor: "#ffffff",
    borderColor: "#edeeef",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  leaveDetailBoxPressable: {
    minHeight: 88
  },
  leaveDetailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  leaveDateText: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.32,
    lineHeight: 16
  },
  leaveReasonText: {
    color: "#5b403c",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 20
  },
  leaveActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  leaveApproveButton: {
    alignItems: "center",
    backgroundColor: "#1e8e3e",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    width: 108
  },
  leaveApproveText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.32,
    lineHeight: 22
  },
  leaveRejectButton: {
    alignItems: "center",
    borderColor: "#8f706b",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48
  },
  leaveRejectText: {
    color: "#8f706b",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.32,
    lineHeight: 22
  },
  leaveCancelButton: {
    alignItems: "center",
    borderColor: "#8f706b",
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center"
  },
  leaveCancelText: {
    color: "#8f706b",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 18
  },
  leaveTypeModal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    gap: 12,
    padding: 20,
    width: "100%"
  },
  leaveTypeModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  leaveTypeModalTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 26
  },
  leaveTypeModalList: {
    gap: 8
  },
  leaveTypeOption: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  leaveTypeOptionActive: {
    backgroundColor: "#ffdad4",
    borderColor: "#950100"
  },
  leaveTypeOptionText: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 20
  },
  leaveTypeOptionTextActive: {
    color: "#6a0100",
    fontFamily: appFonts.semiBold
  },
  transferCreateContent: {
    paddingBottom: 48,
    paddingHorizontal: 17,
    paddingTop: 20
  },
  transferCreateCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e1e3e4",
    borderRadius: 12,
    borderWidth: 1,
    gap: 18,
    padding: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  transferCurrentDepartmentBox: {
    alignItems: "center",
    backgroundColor: "#fff7f6",
    borderColor: "#ffdad6",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14
  },
  transferCurrentDepartmentLabel: {
    color: "#8f706b",
    fontFamily: appFonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    lineHeight: 14
  },
  transferCurrentDepartmentText: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 2
  },
  transferField: {
    gap: 8
  },
  transferLabel: {
    color: "#5b403c",
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.8,
    lineHeight: 16
  },
  transferInput: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  transferDepartmentSelect: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14
  },
  transferDepartmentSelectDisabled: {
    opacity: 0.65
  },
  transferDepartmentSelectText: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 21
  },
  transferDepartmentPlaceholder: {
    color: "#9ca3af"
  },
  transferHelperText: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18
  },
  transferTextArea: {
    minHeight: 112
  },
  transferDateInput: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14
  },
  transferDateText: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 21
  },
  transferSubmitButton: {
    alignItems: "center",
    backgroundColor: "#950100",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 50,
    justifyContent: "center",
    shadowColor: "#950100",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 3
  },
  transferSubmitText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  transferRejectOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(25,28,29,0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  transferRejectModal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    gap: 12,
    padding: 20,
    width: "100%"
  },
  departmentPickerModal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    maxHeight: "78%",
    padding: 20,
    width: "100%"
  },
  departmentPickerHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 14
  },
  departmentPickerTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 26
  },
  departmentPickerSubtitle: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4
  },
  departmentPickerList: {
    gap: 8
  },
  departmentPickerOption: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  departmentPickerOptionActive: {
    backgroundColor: "#ffdad4",
    borderColor: "#950100"
  },
  departmentPickerOptionText: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 20
  },
  departmentPickerOptionTextActive: {
    color: "#6a0100",
    fontFamily: appFonts.semiBold
  },
  transferRejectTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 26
  },
  transferRejectSubtitle: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  transferRejectInput: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top"
  },
  transferRejectActions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 4
  },
  transferRejectCancel: {
    alignItems: "center",
    borderColor: "#8f706b",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: "center"
  },
  transferRejectCancelText: {
    color: "#5b403c",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 18
  },
  transferRejectConfirm: {
    alignItems: "center",
    backgroundColor: "#950100",
    borderRadius: 10,
    flex: 1,
    height: 46,
    justifyContent: "center"
  },
  transferRejectConfirmText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 18
  },
  staffSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  staffHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f4f4f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 2
  },
  staffHeaderButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  staffHeaderTitle: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.45,
    lineHeight: 28,
    textAlign: "center"
  },
  staffRoot: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  staffScrollContent: {
    gap: 32,
    paddingBottom: 176,
    paddingHorizontal: 20,
    paddingTop: 26
  },
  staffDepartmentCard: {
    backgroundColor: "#950100",
    borderRadius: 12,
    overflow: "hidden",
    padding: 32,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8
  },
  staffDepartmentGlow: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 128,
    height: 256,
    position: "absolute",
    right: -32,
    top: -32,
    width: 256
  },
  staffDepartmentLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8
  },
  staffDepartmentLabel: {
    color: "#ffb4a8",
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    lineHeight: 16
  },
  staffDepartmentTitle: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.96,
    lineHeight: 38.4,
    marginBottom: 8
  },
  staffDepartmentDescription: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6,
    opacity: 0.9
  },
  staffDepartmentMetaGroup: {
    gap: 16,
    paddingTop: 17
  },
  staffDepartmentMeta: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    height: 36,
    paddingHorizontal: 16
  },
  staffDepartmentMetaText: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  staffFilterSection: {
    gap: 8,
    paddingTop: 8
  },
  staffFilterLabel: {
    color: "#5b403c",
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    lineHeight: 16
  },
  staffInputFrame: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 16
  },
  staffInput: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 0
  },
  staffSelectFrame: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 16
  },
  staffSelectText: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  staffStateText: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20
  },
  staffList: {
    gap: 26
  },
  staffEmptyState: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 48
  },
  staffEmptyTitle: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    textAlign: "center"
  },
  staffEmptyDescription: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center"
  },
  staffCard: {
    backgroundColor: "#ffffff",
    borderColor: "#f4f4f5",
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20
  },
  staffName: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 20,
    lineHeight: 28
  },
  staffRole: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4
  },
  staffActions: {
    flexDirection: "row",
    gap: 14,
    paddingTop: 24
  },
  staffCallButton: {
    alignItems: "center",
    borderColor: "#6a0100",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 40
  },
  staffCallText: {
    color: "#6a0100",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  staffZaloButton: {
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 40
  },
  staffZaloText: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  documentViewerSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  documentViewerHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f5f5f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  documentViewerHeaderButton: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38
  },
  documentViewerTitle: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center"
  },
  documentViewerBody: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  documentViewerImage: {
    height: "100%",
    width: "100%"
  },
  documentViewerWebView: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  documentViewerMessage: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    padding: 20,
    textAlign: "center"
  },
  personalSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  personalHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f5f5f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 2
  },
  personalHeaderButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  personalHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.45,
    lineHeight: 28
  },
  personalRoot: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  personalScroll: {
    paddingBottom: 128,
    paddingHorizontal: 20,
    paddingTop: 32
  },
  personalIdentity: {
    alignItems: "center",
    gap: 4,
    marginBottom: 48
  },
  personalAvatarWrap: {
    alignItems: "center",
    height: 128,
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
    width: 128
  },
  personalAvatarFrame: {
    alignItems: "center",
    backgroundColor: "#1f2933",
    borderColor: "#ffffff",
    borderRadius: 64,
    borderWidth: 4,
    height: 128,
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    width: 128
  },
  personalAvatarImage: {
    borderRadius: 60,
    height: "100%",
    width: "100%"
  },
  personalAvatarFallback: {
    alignItems: "center",
    borderRadius: 60,
    height: "100%",
    justifyContent: "center",
    width: "100%"
  },
  personalAvatarInitial: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 40,
    lineHeight: 48
  },
  personalEditAvatar: {
    alignItems: "center",
    backgroundColor: "#950100",
    borderRadius: 999,
    bottom: 4,
    elevation: 6,
    height: 26.5,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    width: 26.5,
    zIndex: 2
  },
  personalName: {
    color: "#6a0100",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center"
  },
  personalRole: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 16,
    letterSpacing: 1,
    lineHeight: 24,
    textAlign: "center"
  },
  personalAwardPill: {
    backgroundColor: "#ffdad4",
    borderRadius: 999,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  personalAwardText: {
    color: "#6a0100",
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    lineHeight: 16
  },
  personalSectionGrid: {
    gap: 16
  },
  personalSection: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(227,190,184,0.3)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 25,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15
  },
  personalSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  personalSectionTitle: {
    color: "#6a0100",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  personalSectionBody: {
    gap: 16
  },
  personalField: {
    gap: 4
  },
  personalFieldLabel: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  personalInputBox: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e3beb8",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 17,
    paddingVertical: 13
  },
  personalInputText: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    padding: 0
  },
  personalDateInputBox: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingVertical: 9
  },
  personalDateText: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 24
  },
  personalDatePlaceholder: {
    color: "#8f706b",
    fontFamily: appFonts.regular
  },
  personalDateHint: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    paddingTop: 2
  },
  personalDateIconButton: {
    alignItems: "center",
    backgroundColor: "#ffdad4",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  personalDateOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(25, 28, 29, 0.42)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  personalDateModal: {
    backgroundColor: "#ffffff",
    borderColor: "#e3beb8",
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 360,
    padding: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: "100%",
    elevation: 8
  },
  personalDateModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  personalDateModalTitle: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 20,
    lineHeight: 28
  },
  personalDateModalSubtitle: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 2
  },
  personalDateCloseButton: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  personalCalendarYearRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 18
  },
  personalCalendarYearText: {
    color: "#950100",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 24
  },
  personalCalendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8
  },
  personalCalendarTitle: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 26
  },
  personalCalendarNavButton: {
    alignItems: "center",
    backgroundColor: "#fff4f2",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  personalCalendarWeekdays: {
    flexDirection: "row",
    paddingTop: 14
  },
  personalCalendarWeekday: {
    color: "#8f706b",
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    width: "14.2857%"
  },
  personalCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 8
  },
  personalCalendarDayCell: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: "14.2857%"
  },
  personalCalendarDay: {
    alignItems: "center",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  personalCalendarDayToday: {
    borderColor: "#eec05b",
    borderWidth: 1
  },
  personalCalendarDaySelected: {
    backgroundColor: "#950100"
  },
  personalCalendarDayText: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  personalCalendarDayTextSelected: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold
  },
  personalDateActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 18
  },
  personalDateCancelButton: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: "center"
  },
  personalDateCancelText: {
    color: "#5b403c",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 20
  },
  personalDateConfirmButton: {
    alignItems: "center",
    backgroundColor: "#950100",
    borderRadius: 12,
    flex: 1,
    height: 46,
    justifyContent: "center",
    shadowColor: "#950100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3
  },
  personalDateConfirmText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 20
  },
  personalInputDisabled: {
    color: "#8f706b"
  },
  personalInlineInput: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e3beb8",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  personalStatusText: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  personalTextArea: {
    minHeight: 72,
    textAlignVertical: "top"
  },
  personalEducationBlock: {
    gap: 16
  },
  personalEducation: {
    gap: 2
  },
  personalMiniLabel: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textTransform: "uppercase"
  },
  personalEducationTitle: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 2
  },
  personalEducationText: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    maxWidth: 220
  },
  personalExperience: {
    borderTopColor: "rgba(227,190,184,0.2)",
    borderTopWidth: 1,
    gap: 7,
    paddingTop: 14
  },
  personalExperienceList: {
    gap: 8
  },
  personalExperienceItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  personalExperienceDot: {
    borderRadius: 999,
    height: 6,
    marginTop: 7,
    width: 6
  },
  personalExperienceCopy: {
    flex: 1
  },
  personalExperienceCompany: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    lineHeight: 16
  },
  personalExperienceMeta: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  personalDocRow: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "rgba(227,190,184,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 13
  },
  personalDocTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minWidth: 0
  },
  personalDocTitle: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20
  },
  personalDocActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingLeft: 10
  },
  personalDocActionButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 34
  },
  personalUploadButton: {
    alignItems: "center",
    borderColor: "#e3beb8",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 2,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: 14
  },
  personalUploadText: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  personalSaveWrap: {
    alignItems: "center",
    paddingTop: 48
  },
  personalSaveButton: {
    alignItems: "center",
    backgroundColor: "#6a0100",
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    minHeight: 51,
    paddingHorizontal: 64,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15
  },
  personalSaveText: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  metricRow: {
    flexDirection: "row",
    gap: 12
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  twoButtons: {
    flexDirection: "row",
    gap: 12
  },
  learningContent: {
    gap: 24,
    paddingTop: 24
  },
  learningSection: {
    gap: 16,
    paddingVertical: 24
  },
  learningSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  learningSectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 20,
    lineHeight: 30
  },
  learningDetailLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    minHeight: 32
  },
  learningDetailText: {
    color: employeePalette.goldDark,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  learningPathList: {
    gap: 16
  },
  learningPathCard: {
    alignItems: "flex-start",
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 92,
    overflow: "hidden",
    padding: 16
  },
  learningPathGlow: {
    backgroundColor: "#ffdf9f",
    borderRadius: 999,
    height: 96,
    position: "absolute",
    right: -24,
    top: -24,
    width: 96
  },
  learningPathGlowDefault: {
    opacity: 0.2
  },
  learningPathGlowActive: {
    opacity: 0.4
  },
  learningPathCardActive: {
    borderColor: employeePalette.gold
  },
  learningPathCardLocked: {
    opacity: 0.7
  },
  learningPathIcon: {
    alignItems: "center",
    backgroundColor: "#edeeef",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  learningPathIconActive: {
    backgroundColor: "#ffdf9f"
  },
  learningPathTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22.5
  },
  learningPathDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 19.5,
    paddingBottom: 8
  },
  learningProgressTrack: {
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
    width: "100%"
  },
  learningProgressFill: {
    backgroundColor: employeePalette.gold,
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  learningProgressFillActive: {
    backgroundColor: employeePalette.goldDark
  },
  learningTabs: {
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 24,
    minHeight: 33
  },
  learningTabActive: {
    borderBottomColor: employeePalette.redDark,
    borderBottomWidth: 2,
    color: employeePalette.redDark,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22.5,
    paddingBottom: 8
  },
  learningTab: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22.5,
    paddingBottom: 8
  },
  learningCourseList: {
    gap: 24
  },
  learningEmptyText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  learningCourseCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden"
  },
  learningCourseImageWrap: {
    backgroundColor: "#edeeef",
    height: 180,
    overflow: "hidden",
    width: "100%"
  },
  learningCourseImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  learningRequiredPill: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#e3beb8",
    borderRadius: 999,
    borderWidth: 1,
    left: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: "absolute",
    top: 8
  },
  learningRequiredText: {
    color: employeePalette.redDark,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  learningCourseBody: {
    gap: 8,
    padding: 16
  },
  learningCourseTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 27
  },
  learningCourseDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  learningCourseProgressHeader: {
    alignItems: "center",
    borderTopColor: employeePalette.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 17
  },
  learningProgressLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  learningProgressPercent: {
    color: employeePalette.goldDark,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  requiredLearningContent: {
    gap: 15,
    paddingTop: 24
  },
  requiredHero: {
    backgroundColor: "#e7e8e9",
    borderRadius: 12,
    height: 192,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    width: "100%",
    elevation: 1
  },
  requiredHeroImage: {
    height: "145.2%",
    resizeMode: "cover",
    top: "-22.6%",
    width: "100%"
  },
  requiredHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(25, 28, 29, 0.38)"
  },
  requiredHeroCopy: {
    bottom: 16,
    left: 16,
    position: "absolute",
    right: 16
  },
  requiredHeroKicker: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(25, 28, 29, 0.5)",
    borderColor: "rgba(255, 223, 159, 0.3)",
    borderWidth: 1,
    borderRadius: 999,
    color: "#fbe6a4",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    marginBottom: 6,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  requiredHeroTitle: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    maxWidth: 318
  },
  requiredIntro: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  requiredAlert: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 218, 214, 0.3)",
    borderColor: "#ffdad6",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 10
  },
  requiredAlertIcon: {
    alignItems: "center",
    backgroundColor: "#d42121",
    borderRadius: 999,
    height: 20,
    justifyContent: "center",
    marginTop: 2,
    width: 20
  },
  requiredAlertText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 21.13
  },
  requiredTimeline: {
    gap: 18,
    paddingBottom: 72,
    position: "relative"
  },
  requiredTimelineLine: {
    backgroundColor: "#e2e3e4",
    bottom: 0,
    left: 15,
    position: "absolute",
    top: 18,
    width: 2
  },
  requiredTimelineRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16
  },
  requiredTimelineNode: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    marginTop: 13,
    width: 28,
    zIndex: 2
  },
  requiredTimelineNodeActive: {
    backgroundColor: employeePalette.redDark,
    shadowColor: employeePalette.redDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3
  },
  requiredTimelineNodeLocked: {
    backgroundColor: "#ededed"
  },
  requiredLessonCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minHeight: 152,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2
  },
  requiredLessonCardLocked: {
    minHeight: 128,
    opacity: 0.65
  },
  requiredLessonHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  requiredLessonStep: {
    color: employeePalette.redDark,
    fontFamily: appFonts.bold,
    fontSize: 14,
    letterSpacing: 1.2,
    lineHeight: 20
  },
  requiredLessonStatus: {
    backgroundColor: "#f1efef",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 6
  },
  requiredLessonStatusText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18
  },
  requiredLessonTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 22
  },
  requiredLessonTitleLocked: {
    color: "#707477"
  },
  requiredLessonMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  requiredLessonDuration: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  requiredProgressTrack: {
    backgroundColor: "#e3e4e4",
    borderRadius: 999,
    height: 6,
    marginTop: 6,
    overflow: "hidden"
  },
  requiredProgressFill: {
    backgroundColor: employeePalette.redDark,
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  requiredProgressFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  requiredProgressText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 19.5
  },
  requiredContinueText: {
    color: employeePalette.redDark,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 19.5
  },
  requiredQuizCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 14,
    minHeight: 147,
    paddingHorizontal: 16,
    paddingVertical: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2
  },
  requiredQuizCardLocked: {
    opacity: 0.72
  },
  requiredQuizKicker: {
    color: employeePalette.redDark,
    fontFamily: appFonts.bold,
    fontSize: 13,
    letterSpacing: 1.4,
    lineHeight: 18
  },
  requiredQuizTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 22
  },
  requiredQuizButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 16
  },
  requiredQuizButtonLocked: {
    backgroundColor: "#d8a1a2"
  },
  requiredQuizButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 24
  },
  requiredLessonMuted: {
    color: "#9d8d8a"
  },
  lessonHeaderRight: {
    width: 20
  },
  lessonDetailContent: {
    gap: 0,
    paddingHorizontal: 0,
    paddingTop: 0
  },
  lessonVideo: {
    backgroundColor: "#000000",
    height: 280,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%"
  },
  lessonVideoImage: {
    height: "127.08%",
    opacity: 0.8,
    resizeMode: "cover",
    top: "-13.54%",
    width: "100%"
  },
  lessonVideoPlayer: {
    height: "100%",
    width: "100%"
  },
  lessonVideoMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%"
  },
  lessonNativeControls: {
    bottom: 10,
    gap: 8,
    left: 16,
    position: "absolute",
    right: 16
  },
  lessonNativeSeekTrack: {
    backgroundColor: "rgba(255, 255, 255, 0.32)",
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
    paddingVertical: 3,
    width: "100%"
  },
  lessonNativeSeekTrackPressed: {
    opacity: 0.82
  },
  lessonNativeSeekTrackLocked: {
    opacity: 0.72
  },
  lessonVideoControlRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 2
  },
  lessonVideoSideSlot: {
    alignItems: "flex-end",
    minWidth: 48
  },
  lessonVideoButtonRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center"
  },
  lessonVideoControlButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.48)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    height: 38,
    justifyContent: "center",
    minWidth: 68,
    paddingHorizontal: 12
  },
  lessonVideoControlButtonDisabled: {
    opacity: 0.42
  },
  lessonVideoPrimaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(149, 1, 0, 0.92)",
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: 999,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    width: 54
  },
  lessonVideoFullscreenButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.48)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 42
  },
  lessonVideoSmallText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    lineHeight: 16
  },
  lessonVideoExternalButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  lessonVideoExternalText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 18
  },
  lessonVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.18)"
  },
  lessonCastButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 16,
    top: 16,
    width: 36
  },
  lessonPlayButton: {
    alignItems: "center",
    backgroundColor: "rgba(106, 1, 0, 0.86)",
    borderRadius: 999,
    height: 72,
    justifyContent: "center",
    left: "50%",
    marginLeft: -36,
    marginTop: -36,
    position: "absolute",
    top: "50%",
    width: 72
  },
  lessonVideoControls: {
    bottom: 16,
    gap: 8,
    left: 16,
    position: "absolute",
    right: 16
  },
  lessonVideoTime: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16
  },
  lessonSeekTrack: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 999,
    height: 4,
    overflow: "hidden"
  },
  lessonSeekFill: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: "100%",
    opacity: 0.9
  },
  lessonControlRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8
  },
  lessonControlLeft: {
    flexDirection: "row",
    gap: 16
  },
  lessonDetailBody: {
    gap: 14,
    paddingBottom: 64,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  lessonBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ffdad6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  lessonBadgeText: {
    color: "#410000",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  lessonDetailTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  lessonDetailDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lessonNotice: {
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    marginTop: 24,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  lessonNoticeCompleted: {
    backgroundColor: "#f7fbf8",
    borderColor: "rgba(19, 138, 67, 0.28)"
  },
  lessonNoticeRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12
  },
  lessonNoticeText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 25.6
  },
  lessonNextButtonDisabled: {
    alignItems: "center",
    backgroundColor: "rgba(149, 1, 0, 0.4)",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    opacity: 0.7
  },
  lessonNextButtonActive: {
    alignItems: "center",
    backgroundColor: employeePalette.redDark,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    shadowColor: employeePalette.redDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3
  },
  lessonNextButtonPending: {
    opacity: 0.72
  },
  lessonNextButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 24,
    paddingTop: 1
  },
  lessonAttachmentsTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    marginTop: 56
  },
  lessonAttachmentList: {
    gap: 8
  },
  lessonEmptyAttachments: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22
  },
  lessonAttachmentRow: {
    alignItems: "center",
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 82,
    padding: 17
  },
  lessonAttachmentIcon: {
    alignItems: "center",
    borderRadius: 4,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  lessonAttachmentIconPdf: {
    backgroundColor: "#ffdad6"
  },
  lessonAttachmentIconDoc: {
    backgroundColor: "#ffdf9f"
  },
  lessonAttachmentTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 25.6
  },
  lessonAttachmentSize: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  divider: {
    backgroundColor: employeePalette.border,
    height: 1,
    marginVertical: 12
  },
  upperTitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 13,
    letterSpacing: 0.9,
    lineHeight: 18,
    textTransform: "uppercase"
  },
  meetSectionLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 18,
    textTransform: "uppercase"
  },
  meetField: {
    gap: 8
  },
  meetFieldLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  meetFieldInput: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 13,
    paddingVertical: 13
  },
  meetFieldValue: {
    color: employeePalette.muted,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  meetFieldTextInput: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 30,
    padding: 0
  },
  meetPersonIcon: {
    height: 13,
    resizeMode: "contain",
    width: 13
  },
  meetPhoneIcon: {
    height: 15,
    resizeMode: "contain",
    width: 15
  },
  meetProjectIcon: {
    height: 15,
    resizeMode: "contain",
    width: 15
  },
  meetDropdownIcon: {
    height: 5,
    resizeMode: "contain",
    width: 17
  },
  meetProjectModalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  meetProjectModal: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    maxHeight: "70%",
    overflow: "hidden",
    width: "100%"
  },
  meetProjectModalHeader: {
    alignItems: "center",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  meetProjectModalTitle: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 22
  },
  meetProjectModalClose: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  meetProjectModalList: {
    padding: 12
  },
  meetProjectModalOption: {
    alignItems: "center",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  meetProjectModalOptionActive: {
    backgroundColor: "#fff7df",
    borderColor: "#f5c14b"
  },
  meetProjectModalOptionText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 10
  },
  meetProjectModalOptionTextActive: {
    color: employeePalette.goldDark
  },
  projectChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  projectChip: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  projectChipActive: {
    backgroundColor: "#fff7df",
    borderColor: "#f5c14b"
  },
  projectChipText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 13,
    letterSpacing: 0.8,
    lineHeight: 18,
    paddingTop: 1
  },
  projectChipTextActive: {
    color: employeePalette.goldDark
  },
  meetPhotoBox: {
    alignItems: "center",
    backgroundColor: "#eff0f1",
    borderColor: "#dfe3e6",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 8,
    minHeight: 210,
    justifyContent: "center",
    padding: 20
  },
  roundCamera: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: 64,
    elevation: 2
  },
  meetCameraEmptyIcon: {
    height: 22,
    resizeMode: "contain",
    width: 24
  },
  meetPhotoPreviewFrame: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    height: 220,
    overflow: "hidden",
    width: "100%"
  },
  meetPhotoPreview: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  photoTapText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  meetPhotoButton: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.red,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 51,
    paddingVertical: 17
  },
  meetCameraButtonIcon: {
    height: 17,
    resizeMode: "contain",
    width: 19
  },
  meetPhotoButtonText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  meetConfirmButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 56,
    shadowColor: employeePalette.red,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5
  },
  meetConfirmButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 17,
    letterSpacing: 0.2,
    lineHeight: 25
  },
  meetSeeAll: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  meetSeeAllText: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  meetForwardIcon: {
    height: 8,
    resizeMode: "contain",
    width: 5
  },
  meetRecentList: {
    gap: 8
  },
  meetingActivitiesHeader: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 16
  },
  meetingActivitiesTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 26
  },
  meetingActivitiesSubtitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22
  },
  meetRecentStateText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22,
    paddingVertical: 8
  },
  meetRecentCard: {
    alignItems: "flex-start",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 88,
    padding: 17
  },
  meetRecentAvatar: {
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    resizeMode: "cover",
    width: 48
  },
  meetRecentCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  meetRecentName: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  meetRecentMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  meetRecentTimeIcon: {
    height: 12,
    resizeMode: "contain",
    width: 12
  },
  meetRecentLocationIcon: {
    height: 12,
    resizeMode: "contain",
    width: 9
  },
  meetRecentMetaText: {
    color: employeePalette.muted,
    flexShrink: 1,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 16
  },
  meetRecentStatus: {
    backgroundColor: "#e7e8e9",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  meetRecentStatusText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 16
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  inlineStrong: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold
  },
  showingGpsCard: {
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 17,
    paddingVertical: 13
  },
  showingGpsIcon: {
    height: 22,
    resizeMode: "contain",
    width: 22
  },
  showingGpsCopy: {
    flex: 1
  },
  showingGpsText: {
    includeFontPadding: true,
    lineHeight: 22
  },
  showingForm: {
    gap: 16
  },
  showingField: {
    gap: 4
  },
  showingFieldLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  showingFieldInput: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: 17,
    paddingVertical: 10
  },
  showingFieldValue: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 25.6
  },
  showingFieldTextInput: {
    flex: 1,
    includeFontPadding: true,
    minHeight: 34,
    padding: 0,
    paddingVertical: 2
  },
  showingFieldValueMuted: {
    color: "#6b7280"
  },
  showingChevronIcon: {
    height: 8,
    resizeMode: "contain",
    width: 12
  },
  showingPhotoHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  showingCameraIcon: {
    height: 23,
    resizeMode: "contain",
    width: 25
  },
  showingPhotoPreview: {
    borderRadius: 6,
    height: 72,
    resizeMode: "cover",
    width: 96
  },
  showingPrimaryButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingVertical: 12,
    shadowColor: employeePalette.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2
  },
  showingPlayIcon: {
    height: 14,
    resizeMode: "contain",
    width: 11
  },
  showingPrimaryButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  showingTimeline: {
    borderTopColor: employeePalette.border,
    borderTopWidth: 1,
    gap: 0,
    paddingTop: 16,
    position: "relative"
  },
  showingTimelineLine: {
    backgroundColor: employeePalette.border,
    bottom: 16,
    left: 19,
    position: "absolute",
    top: 32,
    width: 2
  },
  showingTimelineItem: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 8
  },
  showingTimelineIcon: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  showingTimelineIconActive: {
    borderColor: employeePalette.red
  },
  showingTimelineCheckAsset: {
    height: 17,
    resizeMode: "contain",
    width: 17
  },
  showingTimelineHistoryAsset: {
    height: 15,
    resizeMode: "contain",
    width: 15
  },
  showingTimelineCard: {
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 78,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1
  },
  showingTimelineTime: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    includeFontPadding: true,
    lineHeight: 15
  },
  showingTimelineBadge: {
    backgroundColor: "#ffdf9f",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  showingTimelineBadgeText: {
    color: "#261a00",
    fontFamily: appFonts.regular,
    fontSize: 10,
    includeFontPadding: true,
    lineHeight: 15
  },
  showingTimelineTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 14,
    includeFontPadding: true,
    lineHeight: 21,
    paddingTop: 4
  },
  showingTimelineCustomer: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    includeFontPadding: true,
    lineHeight: 19.5
  },
  newsMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  linkText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 20
  },
  profileFigmaContent: {
    gap: 16,
    paddingBottom: 108,
    paddingTop: 24
  },
  profileHeroCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 272,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 27,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  profileHeroDecoration: {
    backgroundColor: "rgba(149, 1, 0, 0.05)",
    borderBottomLeftRadius: 100,
    height: 128,
    position: "absolute",
    right: -32,
    top: -32,
    width: 128
  },
  profileHeroAvatar: {
    borderColor: "#ffffff",
    borderRadius: 48,
    borderWidth: 4,
    height: 96,
    resizeMode: "cover",
    width: 96
  },
  profileHeroAvatarButton: {
    borderRadius: 48
  },
  profileHeroAvatarFallback: {
    alignItems: "center",
    backgroundColor: "#1f2933",
    borderColor: "#ffffff",
    borderRadius: 48,
    borderWidth: 4,
    height: 96,
    justifyContent: "center",
    width: 96
  },
  profileHeroAvatarInitial: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 30,
    lineHeight: 36
  },
  profileVerifyBadge: {
    alignItems: "center",
    backgroundColor: "#e7f5f7",
    borderColor: employeePalette.text,
    borderRadius: 999,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    position: "absolute",
    right: 25,
    top: 24,
    width: 50
  },
  profileVerifyBadgeImage: {
    height: 50,
    position: "absolute",
    resizeMode: "contain",
    right: 25,
    top: 24,
    width: 50
  },
  profileHeroName: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: true,
    letterSpacing: -0.48,
    lineHeight: 34,
    paddingTop: 16,
    textAlign: "center"
  },
  profileHeroRole: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 25.6,
    textAlign: "center"
  },
  profileRankPill: {
    alignItems: "center",
    backgroundColor: "rgba(238, 192, 91, 0.2)",
    borderColor: "#eec05b",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 17,
    paddingVertical: 9
  },
  profileRankIcon: {
    height: 16,
    resizeMode: "contain",
    width: 12
  },
  profileRankPillText: {
    color: "#755700",
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18,
    textAlignVertical: "center"
  },
  profileRewardHistoryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2
  },
  profileRewardHistoryIcon: {
    alignItems: "center",
    backgroundColor: "rgba(238, 192, 91, 0.16)",
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  profileRewardHistoryTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 24
  },
  profileRewardHistorySubtitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 12,
    includeFontPadding: true,
    lineHeight: 18,
    marginTop: 4
  },
  profileSectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: true,
    letterSpacing: -0.48,
    lineHeight: 34,
    marginTop: 16
  },
  profileSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16
  },
  profileSeeAllButton: {
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  profileSeeAll: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  profileRankingCard: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 120,
    overflow: "hidden",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  profileRankingGlow: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    height: 160,
    position: "absolute",
    right: -40,
    top: -40,
    width: 160
  },
  profileRankingLabel: {
    color: "#ffdad4",
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  profileRankingValueRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
    paddingTop: 4
  },
  profileRankingValue: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 40,
    includeFontPadding: true,
    letterSpacing: -1.6,
    lineHeight: 48
  },
  profileRankingSuffix: {
    color: "#ffdad4",
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 25.6,
    paddingBottom: 2
  },
  profileRankingTrack: {
    backgroundColor: "rgba(106, 1, 0, 0.4)",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
    width: "100%"
  },
  profileRankingFill: {
    backgroundColor: "#eec05b",
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  profileRankingIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 999,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    marginLeft: 20,
    width: 64
  },
  profileCertList: {
    gap: 16,
    paddingRight: 20
  },
  profileCertificateCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 160,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: 17,
    width: 260
  },
  profileCertificateCardCompact: {
    width: 180
  },
  profileCertificateBg: {
    ...StyleSheet.absoluteFillObject,
    height: "135%",
    opacity: 0.1,
    resizeMode: "cover",
    width: "100%"
  },
  profileCertificateTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  profileCertificateDate: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  profileScoreList: {
    gap: 8
  },
  profileScoreRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 74,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  profileScoreTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  profileScoreMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingTop: 8
  },
  profileScoreBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  profileScoreBadgeRed: {
    backgroundColor: "rgba(149, 1, 0, 0.1)"
  },
  profileScoreBadgeGold: {
    backgroundColor: "rgba(238, 192, 91, 0.2)"
  },
  profileScoreBadgeText: {
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  profileScoreBadgeTextRed: {
    color: employeePalette.red
  },
  profileScoreBadgeTextGold: {
    color: "#755700"
  },
  profileScoreDate: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  profileScoreDivider: {
    backgroundColor: employeePalette.border,
    height: 48,
    marginHorizontal: 16,
    width: 1
  },
  profileScoreValueRow: {
    alignItems: "flex-end",
    flexDirection: "row"
  },
  profileScoreValue: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 32,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  profileScoreValueRed: {
    color: employeePalette.red
  },
  profileScoreMax: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 19.2,
    paddingBottom: 5
  },
  profileActionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    gap: 12,
    marginTop: 30,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  profileLeaveButton: {
    alignItems: "center",
    borderColor: "#c08400",
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    justifyContent: "center"
  },
  profileLeaveButtonText: {
    color: "#c08400",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16,
    paddingTop: 1
  },
  profileTransferButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center"
  },
  profileReceiveTransferButton: {
    alignItems: "center",
    backgroundColor: employeePalette.green,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center"
  },
  profileTransferButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 24,
    paddingTop: 1
  },
  profileQrSection: {
    alignSelf: "center",
    gap: 16,
    maxWidth: 350,
    width: "100%"
  },
  profileQrTitle: {
    marginTop: 16,
    textAlign: "center"
  },
  profileQrSegment: {
    flexDirection: "row",
    gap: 10,
    width: "100%"
  },
  profileQrSegmentActive: {
    alignItems: "center",
    backgroundColor: employeePalette.green,
    borderRadius: 12,
    flex: 1,
    height: 42,
    justifyContent: "center"
  },
  profileQrSegmentInactive: {
    alignItems: "center",
    backgroundColor: "#a1a1aa",
    borderRadius: 12,
    flex: 1.2,
    height: 42,
    justifyContent: "center"
  },
  profileQrSegmentActiveText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 22
  },
  profileQrSegmentInactiveText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 22
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  profileAvatar: {
    alignItems: "center",
    backgroundColor: "#1f2933",
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  profileAvatarText: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 24
  },
  bodyText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  listTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 24
  },
  heroTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  photoProof: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 15,
    justifyContent: "center",
    minHeight: 160,
    overflow: "hidden",
    padding: 17
  },
  photoProofTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(238, 192, 91, 0.08)",
    opacity: 0.35
  },
  photoButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#eec05b",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 25,
    paddingVertical: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 1
  },
  photoTitle: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 24
  },
  photoHelper: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    includeFontPadding: true,
    lineHeight: 22,
    paddingTop: 12,
    textAlign: "center"
  },
  segment: {
    flexDirection: "row",
    gap: 12
  },
  segmentButton: {
    flex: 1
  },
  referralQrContent: {
    alignItems: "center",
    gap: 16
  },
  referralQrTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: true,
    letterSpacing: 0,
    lineHeight: 34,
    maxWidth: 350,
    width: "100%"
  },
  referralQrSegment: {
    flexDirection: "row",
    gap: 14,
    maxWidth: 350,
    width: "100%"
  },
  referralQrSegmentButton: {
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 46,
    paddingVertical: 8,
    shadowColor: "#950100",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5
  },
  referralQrSegmentButtonNarrow: {
    width: 154
  },
  referralQrSegmentButtonWide: {
    width: 182
  },
  referralQrSegmentButtonMuted: {
    backgroundColor: "#a1a1aa"
  },
  referralQrSegmentButtonGreen: {
    backgroundColor: employeePalette.green
  },
  referralQrSegmentText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 22,
    textAlign: "center"
  },
  qrCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 350,
    paddingBottom: 24.01,
    paddingHorizontal: 24,
    paddingTop: 22.8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    width: "100%",
    elevation: 2
  },
  referralQrHelper: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 25.6,
    maxWidth: 265,
    textAlign: "center",
    width: 265
  },
  qrBox: {
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    height: 194,
    padding: 18,
    width: 194
  },
  qrCell: {
    backgroundColor: "#ffffff",
    height: 22,
    width: 22
  },
  qrCellDark: {
    backgroundColor: employeePalette.text
  },
  qrImage: {
    height: 160,
    resizeMode: "contain",
    width: 160
  },
  qrImageFrame: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 192,
    justifyContent: "center",
    marginTop: 16,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    width: 192,
    elevation: 1
  },
  qrShareButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 49,
    justifyContent: "center",
    marginTop: 16,
    shadowColor: "#950100",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    width: "100%",
    elevation: 4
  },
  qrShareText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  referralCodeContainer: {
    alignItems: "center",
    backgroundColor: "#fcf8f7",
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 4,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%"
  },
  referralCodeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  referralCodeLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  referralCodeText: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 22,
    letterSpacing: 1
  },
  logoutButton: {
    borderColor: "#e3beb8",
    marginTop: 4
  },
  quizSafe: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  quizHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f4f4f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 1
  },
  quizBackButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  quizHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 28,
    marginLeft: 2
  },
  quizTimerPill: {
    alignItems: "center",
    backgroundColor: employeePalette.subtle,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  quizTimerText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  quizScrollContent: {
    gap: 24,
    paddingBottom: 124,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  quizProgressBlock: {
    gap: 8
  },
  quizProgressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  quizProgressLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  quizProgressCount: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  quizProgressTrack: {
    backgroundColor: employeePalette.subtle,
    borderRadius: 999,
    height: 8,
    overflow: "hidden"
  },
  quizProgressFill: {
    backgroundColor: employeePalette.red,
    borderRadius: 999,
    height: 8,
    width: "30%"
  },
  quizQuestionCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  quizQuestionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 20,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  quizQuestionBody: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  quizMapFrame: {
    backgroundColor: employeePalette.subtle,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    height: 356,
    justifyContent: "center",
    marginTop: 6,
    overflow: "hidden"
  },
  quizMapImage: {
    height: 349,
    resizeMode: "cover",
    width: 543
  },
  quizOptionsList: {
    gap: 8,
    paddingTop: 9
  },
  quizOption: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 66,
    padding: 17
  },
  quizOptionSelected: {
    backgroundColor: "rgba(255, 218, 214, 0.2)",
    borderColor: employeePalette.red,
    borderWidth: 2,
    padding: 16
  },
  quizRadio: {
    alignItems: "center",
    borderColor: "#8f706b",
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    marginRight: 20,
    width: 20
  },
  quizRadioSelected: {
    backgroundColor: employeePalette.red,
    borderColor: employeePalette.red
  },
  quizRadioDot: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 8,
    width: 8
  },
  quizOptionText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  quizOptionTextSelected: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold
  },
  quizEssaySection: {
    gap: 8,
    paddingTop: 24
  },
  quizEssayTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  quizEssayCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    paddingBottom: 17,
    paddingHorizontal: 17,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  quizEssayPrompt: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  quizTextareaWrap: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 260,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  quizTextarea: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6,
    minHeight: 260,
    paddingHorizontal: 17,
    paddingTop: 16
  },
  quizTextareaIcon: {
    bottom: 16,
    position: "absolute",
    right: 16
  },
  quizBottomActions: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopColor: "#e4e4e7",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    left: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 21,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 12
  },
  quizFooterButton: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48
  },
  quizDraftButton: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.red,
    borderWidth: 1,
    flex: 1.05,
    paddingHorizontal: 12
  },
  quizSubmitButton: {
    backgroundColor: employeePalette.red,
    flex: 1,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  quizDraftButtonText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  quizSubmitButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  resultSafe: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  resultHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f4f4f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 1
  },
  resultCloseButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  resultHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 28,
    textAlign: "center"
  },
  resultHeaderSpacer: {
    width: 36
  },
  resultScrollContent: {
    paddingBottom: 72
  },
  resultHero: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    overflow: "hidden",
    paddingBottom: 49,
    paddingHorizontal: 20,
    paddingTop: 24
  },
  resultGoldGlow: {
    backgroundColor: "#fdce67",
    borderRadius: 999,
    height: 128,
    opacity: 0.2,
    position: "absolute",
    right: -40,
    top: -40,
    width: 128
  },
  resultRedGlow: {
    backgroundColor: employeePalette.red,
    borderRadius: 999,
    bottom: -19,
    height: 96,
    left: -20,
    opacity: 0.1,
    position: "absolute",
    width: 96
  },
  resultScoreBlock: {
    alignItems: "center",
    paddingBottom: 16
  },
  resultScoreLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    textAlign: "center"
  },
  resultScoreRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 4,
    justifyContent: "center"
  },
  resultScoreBig: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 64,
    letterSpacing: 0,
    lineHeight: 64
  },
  resultPendingTitle: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 34,
    letterSpacing: 0,
    lineHeight: 42,
    marginTop: 8,
    textAlign: "center"
  },
  resultScoreTotal: {
    color: "#8f706b",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: 0,
    lineHeight: 28.8
  },
  resultAchievementCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(238, 192, 91, 0.3)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    width: "100%",
    elevation: 1
  },
  resultMedalCircle: {
    alignItems: "center",
    backgroundColor: "rgba(238, 192, 91, 0.2)",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  resultAchievementTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  },
  resultAchievementText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 19.25,
    marginTop: 3
  },
  resultReviewSection: {
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 48
  },
  resultReviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  resultReviewTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 20,
    lineHeight: 30
  },
  resultCountPill: {
    backgroundColor: employeePalette.subtle,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  resultCountText: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  resultQuestionList: {
    gap: 16
  },
  resultQuestionCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 1
  },
  resultQuestionCardWrong: {
    borderColor: "#ffdad6"
  },
  resultQuestionTop: {
    flexDirection: "row",
    gap: 16,
    padding: 16
  },
  resultQuestionTopExpanded: {
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    paddingBottom: 17
  },
  resultStatusIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    marginTop: 4,
    width: 32
  },
  resultStatusCorrect: {
    backgroundColor: "#e6f4ea"
  },
  resultStatusWrong: {
    backgroundColor: "#fce8e6"
  },
  resultStatusPending: {
    backgroundColor: "rgba(238, 192, 91, 0.2)"
  },
  resultQuestionKicker: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  resultQuestionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 25.6,
    marginBottom: 8,
    marginTop: 3
  },
  resultAnswerLine: {
    borderLeftWidth: 2,
    paddingLeft: 10
  },
  resultAnswerCorrect: {
    borderLeftColor: employeePalette.green
  },
  resultAnswerWrong: {
    borderLeftColor: "#d93025",
    marginBottom: 8
  },
  resultAnswerPending: {
    borderLeftColor: employeePalette.gold
  },
  resultAnswerText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  resultAnswerTextWrong: {
    textDecorationLine: "line-through"
  },
  resultAnswerTextDark: {
    color: employeePalette.text
  },
  resultExplanation: {
    backgroundColor: employeePalette.bg,
    gap: 8,
    padding: 16
  },
  resultExplanationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  resultExplanationTitle: {
    color: employeePalette.goldDark,
    fontFamily: appFonts.regular,
    fontSize: 11,
    letterSpacing: 1.1,
    lineHeight: 16.5
  },
  resultExplanationText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22.75
  },
  resultExplanationImage: {
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 128,
    resizeMode: "cover",
    width: "100%"
  },
  resultDashboardButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#6a0100",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 48,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },
  resultDashboardText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18,
    textAlign: "center"
  },
  inventoryAreaSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  inventoryAreaRoot: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  inventoryAreaHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 1
  },
  inventoryAreaHeaderLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  inventoryAreaIconButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  inventoryAreaTitle: {
    color: "#000000",
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 28
  },
  inventoryAreaScroll: {
    gap: 24,
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  inventoryAreaSearchRow: {
    flexDirection: "row",
    gap: 8
  },
  inventoryAreaSearchInput: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 14,
    height: 44,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  inventoryAreaSearchText: {
    color: "#6b7280",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    height: "100%",
    lineHeight: 22,
    paddingVertical: 0
  },
  inventoryAreaClearButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  inventoryAreaFilterButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    width: 44,
    elevation: 1
  },
  inventoryAreaFilterButtonActive: {
    backgroundColor: "#fff7f6",
    borderColor: employeePalette.redDark
  },
  inventoryAreaFilterBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  inventoryAreaFilterModal: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    width: "100%"
  },
  inventoryAreaFilterModalHeader: {
    alignItems: "center",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  inventoryAreaFilterModalTitle: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 22
  },
  inventoryAreaFilterCloseButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  inventoryAreaFilterModalList: {
    padding: 12
  },
  inventoryAreaFilterOption: {
    alignItems: "center",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  inventoryAreaFilterOptionActive: {
    backgroundColor: "#fff7df",
    borderColor: "#f5c14b"
  },
  inventoryAreaFilterOptionText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 10
  },
  inventoryAreaFilterOptionTextActive: {
    color: employeePalette.goldDark
  },
  inventoryAreaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  inventoryAreaCard: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "47.7%",
    flexGrow: 1,
    maxWidth: "47.8%",
    minHeight: 224,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  inventoryAreaCardImageWrap: {
    backgroundColor: employeePalette.subtle,
    height: 120,
    overflow: "hidden",
    width: "100%"
  },
  inventoryAreaCardImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  inventoryAreaHotPill: {
    backgroundColor: "#6a0100",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    top: 8,
    elevation: 1
  },
  inventoryAreaHotText: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  inventoryAreaCardBody: {
    flex: 1,
    justifyContent: "space-between",
    padding: 16
  },
  inventoryAreaCardCopy: {
    gap: 4
  },
  inventoryAreaCardTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  },
  inventoryAreaCardMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  inventoryAreaCardMetaText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20.8
  },
  inventoryAreaCardFooter: {
    alignItems: "center",
    borderTopColor: "#f3f4f5",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 9
  },
  inventoryAreaCardAvailable: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 20
  },
  inventoryMapSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  inventoryMapRoot: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  inventoryMapScroll: {
    paddingBottom: 0
  },
  inventoryMapHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  inventoryMapBackButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  inventoryMapLegendWrap: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    height: 37
  },
  inventoryMapLegend: {
    alignItems: "center",
    flexDirection: "row",
    gap: 25,
    height: 37,
    paddingHorizontal: 20
  },
  inventoryLegendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  inventoryLegendDot: {
    borderRadius: 999,
    height: 12,
    width: 12
  },
  inventoryLegendText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 20
  },
  inventoryMapCanvas: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    height: 292,
    justifyContent: "center",
    overflow: "hidden"
  },
  inventoryMapOverview: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  inventoryMapWebView: {
    backgroundColor: "#ffffff",
    height: "100%",
    width: "100%"
  },
  inventoryMapControls: {
    elevation: 8,
    gap: 8,
    position: "absolute",
    right: 15,
    top: 54,
    zIndex: 10
  },
  inventoryMapControl: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    width: 48,
    elevation: 2
  },
  inventoryLotGrid: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 55,
    paddingHorizontal: inventoryLotGridHorizontalPadding,
    paddingTop: 25,
    rowGap: 13
  },
  inventoryLotCell: {
    alignItems: "center",
    backgroundColor: "#eec05b",
    borderRadius: 10,
    height: inventoryLotCellSize,
    justifyContent: "center",
    width: inventoryLotCellSize
  },
  inventoryLotSelected: {
    borderWidth: 0
  },
  inventoryLotHeld: {
    backgroundColor: "#1e8e3e"
  },
  inventoryLotSold: {
    backgroundColor: employeePalette.red
  },
  inventoryLotUnavailable: {
    backgroundColor: "#c8c6c5"
  },
  inventoryLotText: {
    color: "#000000",
    fontFamily: appFonts.bold,
    fontSize: 13,
    lineHeight: 16,
    maxWidth: 34,
    textAlign: "center"
  },
  inventoryLotTextLight: {
    color: "#ffffff"
  },
  inventoryMapSheet: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    marginTop: -1,
    paddingBottom: 58,
    paddingHorizontal: 24,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  inventorySaleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    borderColor: "#c8e6c9",
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  inventorySaleBadgeText: {
    color: "#2e7d32",
    fontFamily: appFonts.regular,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 15
  },
  inventorySheetTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 38.4,
    marginTop: 10
  },
  inventoryInfoTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22
  },
  inventoryInfoTab: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 42,
    justifyContent: "center",
    paddingHorizontal: 12,
    width: "48%"
  },
  inventoryInfoTabActive: {
    backgroundColor: employeePalette.red,
    borderColor: employeePalette.red
  },
  inventoryInfoTabText: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 18
  },
  inventoryInfoTabTextActive: {
    color: "#ffffff"
  },
  inventoryInfoArticle: {
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 18,
    padding: 16
  },
  inventoryInfoArticleEyebrow: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    lineHeight: 16
  },
  inventoryInfoArticleTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 25
  },
  inventoryInfoArticleBody: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22
  },
  inventoryInfoArticleDivider: {
    backgroundColor: employeePalette.border,
    height: 1,
    marginVertical: 6,
    width: "100%"
  },
  inventoryInfoArticleAction: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: "#f0d3cf",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  inventoryInfoArticleActionText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 18
  },
  inventoryRouteButton: {
    alignItems: "center",
    backgroundColor: "#eec05b",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    marginTop: 22,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  inventoryPlanningButton: {
    alignItems: "center",
    backgroundColor: "#1e8e3e",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    marginTop: 24,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  inventoryActionText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  inventoryPlanningMap: {
    borderRadius: 10,
    height: 212,
    marginTop: 40,
    resizeMode: "cover",
    width: "100%"
  },
  inventoryComments: {
    borderTopColor: employeePalette.border,
    borderTopWidth: 1,
    gap: 16,
    marginTop: 44,
    paddingTop: 17
  },
  inventoryCommentsHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  inventoryCommentsTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 14
  },
  planningCheckSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  planningCheckHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  planningCheckBackButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  planningCheckTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 26,
    marginHorizontal: 10,
    textAlign: "center"
  },
  planningCheckHeaderSpacer: {
    width: 36
  },
  planningCheckWebContainer: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  planningCheckWebView: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  inventoryCommentsCount: {
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  inventoryCommentsCountText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  inventoryCommentsPagination: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingTop: 2
  },
  inventoryCommentsPageButton: {
    alignItems: "center",
    borderColor: "#f0d3cf",
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  inventoryCommentsPageButtonActive: {
    backgroundColor: "#990100",
    borderColor: "#990100"
  },
  inventoryCommentsPageText: {
    color: "#990100",
    fontFamily: appFonts.bold,
    fontSize: 12,
    lineHeight: 18
  },
  inventoryCommentsPageTextActive: {
    color: "#ffffff"
  },
  inventoryCommentRow: {
    flexDirection: "row",
    gap: 12
  },
  inventoryCommentAvatar: {
    alignItems: "center",
    backgroundColor: employeePalette.redSoft,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  inventoryCommentAvatarGold: {
    backgroundColor: employeePalette.goldSoft
  },
  inventoryCommentInitials: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 10,
    lineHeight: 15
  },
  inventoryCommentInitialsGold: {
    color: employeePalette.goldDark
  },
  inventoryCommentMeta: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8
  },
  inventoryCommentName: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 13,
    lineHeight: 19.5
  },
  inventoryCommentTime: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 11,
    lineHeight: 16.5
  },
  inventoryCommentText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 21.13
  },
  inventoryCommentInput: {
    alignItems: "center",
    backgroundColor: "#f3f4f5",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    minHeight: 50,
    paddingLeft: 16,
    paddingRight: 16
  },
  inventoryCommentPlaceholder: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 22
  },
  inventoryCommentTextInput: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 24,
    minHeight: 40,
    padding: 0,
    paddingRight: 12
  },
  inventoryCommentSendButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  lotDetailSafe: {
    backgroundColor: "#d9dadb",
    flex: 1
  },
  lotDetailScroll: {
    backgroundColor: employeePalette.bg,
    paddingBottom: 94
  },
  lotDetailHero: {
    height: 353,
    overflow: "hidden",
    width: "100%"
  },
  lotDetailHeroCarousel: {
    height: "100%",
    width: "100%"
  },
  lotDetailHeroImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  lotDetailHeroActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
    top: 0
  },
  lotDetailHeroRightActions: {
    flexDirection: "row",
    gap: 8
  },
  lotDetailHeroButton: {
    alignItems: "center",
    backgroundColor: "rgba(248, 249, 250, 0.8)",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    width: 48,
    elevation: 1
  },
  lotDetailGalleryPill: {
    alignItems: "center",
    backgroundColor: "rgba(248, 249, 250, 0.9)",
    borderRadius: 999,
    bottom: 41,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "absolute",
    right: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  lotDetailGalleryText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  lotDetailBody: {
    backgroundColor: employeePalette.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 24,
    marginTop: -24,
    paddingBottom: 22,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  lotDetailTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  lotDetailTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -1.6,
    lineHeight: 44
  },
  lotDetailLocationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  lotDetailLocationText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lotDetailStatusPill: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 17,
    paddingVertical: 9
  },
  lotDetailStatusText: {
    color: "#15803d",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  lotDetailPriceCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1
  },
  lotDetailPriceLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  lotDetailTotalRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12
  },
  lotDetailTotalPrice: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -1.6,
    lineHeight: 44
  },
  lotDetailCurrency: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lotDetailDivider: {
    backgroundColor: employeePalette.border,
    height: 1,
    width: "100%"
  },
  lotDetailUnitRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12
  },
  lotDetailUnitLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lotDetailUnitValue: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  lotDetailStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  lotDetailStatCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "47.5%",
    flexGrow: 1,
    gap: 4,
    minHeight: 107,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  lotDetailStatLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: false,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  lotDetailStatValue: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: false,
    letterSpacing: -0.48,
    lineHeight: 32
  },
  lotDetailDescriptionSection: {
    gap: 15,
    paddingTop: 16
  },
  lotDetailSectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  lotDetailDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 30.6
  },
  lotDetailNote: {
    color: "#b50000",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 20,
    marginTop: 0
  },
  lotDetailBottomActions: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopColor: "#e4e4e7",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    left: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 21,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 12
  },
  lotDetailActionButton: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center"
  },
  lotDetailLockButton: {
    backgroundColor: "#ffffff",
    borderColor: "#1e8e3e",
    borderWidth: 1,
    flex: 1.05
  },
  lotDetailLockButtonLocked: {
    backgroundColor: "#eef8f1"
  },
  lotDetailLockButtonDisabled: {
    borderColor: "#e1e3e4",
    backgroundColor: "#f8f9fa"
  },
  lotDetailDepositButton: {
    backgroundColor: employeePalette.red,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  lotDetailDepositButtonDisabled: {
    backgroundColor: "#d4a3a0"
  },
  lotDetailLockText: {
    color: "#1e8e3e",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  lotDetailLockTextLocked: {
    letterSpacing: 0,
    lineHeight: 24
  },
  lotDetailLockTextDisabled: {
    color: "#a1a1aa"
  },
  lotDetailDepositText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  newsFeedSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  newsFeedHeader: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  newsFeedAvatarImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  newsAvatarInitial: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 20
  },
  newsFeedScroll: {
    paddingBottom: 28,
    paddingHorizontal: 20
  },
  newsFeedPageHeader: {
    gap: 3,
    paddingVertical: 24
  },
  newsFeedTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 40
  },
  newsFeedSubtitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  newsCreateCard: {
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  newsCreateBody: {
    flexDirection: "row",
    gap: 16
  },
  newsCreateAvatar: {
    alignItems: "center",
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    overflow: "hidden",
    width: 40
  },
  newsCreatePlaceholder: {
    color: "rgba(91, 64, 60, 0.5)",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 30.6
  },
  newsCreatePromptButton: {
    flex: 1
  },
  newsCreateForm: {
    gap: 10
  },
  newsCreateTitleInput: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(227, 190, 184, 0.7)",
    borderRadius: 10,
    borderWidth: 1,
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  newsCreateContentInput: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(227, 190, 184, 0.7)",
    borderRadius: 10,
    borderWidth: 1,
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 112,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  newsRichPreviewButton: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(227, 190, 184, 0.7)",
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 112,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  richModalSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  richModalHeader: {
    alignItems: "center",
    borderBottomColor: "rgba(227,190,184,0.5)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  richModalClose: {
    padding: 4
  },
  richModalTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16
  },
  richModalDone: {
    padding: 4
  },
  richModalDoneText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 15
  },
  richToolbar: {
    backgroundColor: "#fdf5f4",
    borderBottomColor: "rgba(227,190,184,0.5)",
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  richEditorScroll: {
    flex: 1
  },
  richEditor: {
    flex: 1,
    minHeight: 400
  },

  newsCreateImagePreview: {
    borderRadius: 10,
    height: 150,
    overflow: "hidden",
    position: "relative"
  },
  newsCreateImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  newsCreateImageRemove: {
    alignItems: "center",
    backgroundColor: "rgba(25, 28, 29, 0.72)",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    top: 10,
    width: 28
  },
  newsCreateAttachmentsList: {
    gap: 8,
    marginTop: 8
  },
  newsCreateAttachmentPreview: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(227, 190, 184, 0.7)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 12
  },
  newsCreateAttachmentTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8
  },
  newsCreateAttachmentName: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 18
  },
  newsCreateAttachmentRemove: {
    alignItems: "center",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  newsCreateFooter: {
    alignItems: "center",
    borderTopColor: "rgba(227, 190, 184, 0.3)",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 9
  },
  newsCreateTools: {
    flexDirection: "row",
    gap: 16,
    paddingLeft: 8
  },
  newsCreateToolButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  newsCreateButton: {
    alignItems: "center",
    backgroundColor: "#6a0100",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 24,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  newsCreateButtonDisabled: {
    opacity: 0.58
  },
  newsCreateButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  newsCreateCancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 8
  },
  newsCreateCancelText: {
    color: employeePalette.muted,
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 18
  },
  newsFeedList: {
    gap: 24,
    paddingTop: 48
  },
  newsPostCard: {
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  newsPostHighlighted: {
    borderColor: "#eec05b",
    borderWidth: 2,
    gap: 15,
    overflow: "hidden",
    padding: 26
  },
  newsPostHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 4
  },
  newsPostAuthorRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 16
  },
  newsPostAvatarGold: {
    alignItems: "center",
    backgroundColor: employeePalette.border,
    borderColor: "#e3beb8",
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48
  },
  newsPostAvatar: {
    alignItems: "center",
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48
  },
  newsPostAuthor: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 28.8
  },
  newsPostMeta: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  newsStarPill: {
    alignItems: "center",
    backgroundColor: "rgba(255, 223, 159, 0.3)",
    borderColor: "rgba(238, 192, 91, 0.5)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 13,
    paddingVertical: 5
  },
  newsPostMenuWrap: {
    alignItems: "flex-end",
    minWidth: 36,
    position: "relative",
    zIndex: 6
  },
  newsPostMenuButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 36
  },
  newsPostMenu: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(227, 190, 184, 0.75)",
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
    minWidth: 190,
    padding: 6,
    position: "absolute",
    right: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    top: 36,
    zIndex: 20,
    elevation: 8
  },
  newsPostMenuItem: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    minHeight: 38,
    paddingHorizontal: 10
  },
  newsPostMenuItemText: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 16
  },
  newsPostMenuItemDanger: {
    color: employeePalette.red
  },
  newsEditPostButton: {
    alignItems: "center",
    borderColor: "rgba(149, 1, 0, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 11
  },
  newsEditPostText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 16
  },
  newsPostTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 30.6
  },
  newsPostBodyWrap: {
    position: "relative"
  },
  newsPostBody: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  newsPostBodyMeasure: {
    left: 0,
    opacity: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: -1
  },
  newsReadMoreButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    marginTop: 6,
    paddingRight: 8,
    paddingVertical: 4
  },
  newsReadMore: {
    color: employeePalette.red,
    fontFamily: appFonts.bold
  },
  newsStandardBody: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  newsPostImage: {
    backgroundColor: "#d9dadb",
    borderColor: "rgba(227, 190, 184, 0.3)",
    borderRadius: 8,
    borderWidth: 1,
    height: 224,
    resizeMode: "cover",
    width: "100%"
  },
  newsPostAttachmentList: {
    gap: 8,
    paddingTop: 2
  },
  newsPostAttachmentChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff7f6",
    borderColor: "rgba(149, 1, 0, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    maxWidth: "100%",
    minHeight: 38,
    paddingHorizontal: 10
  },
  newsPostAttachmentText: {
    color: employeePalette.text,
    flexShrink: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 17
  },
  newsEditForm: {
    gap: 10
  },
  newsEditActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  newsEditImageButton: {
    alignItems: "center",
    borderColor: "rgba(149, 1, 0, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12
  },
  newsEditImageText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 16
  },
  newsEditActionButtons: {
    flexDirection: "row",
    gap: 8
  },
  newsEditCancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 10
  },
  newsEditCancelText: {
    color: employeePalette.muted,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 16
  },
  newsEditSaveButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 16
  },
  newsEditSaveText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 16
  },
  newsPostActions: {
    alignItems: "center",
    borderTopColor: "rgba(227, 190, 184, 0.5)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 16,
    paddingTop: 10
  },
  newsPostAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  newsPostActionShare: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  newsPostActionText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22.4
  },
  newsGoldAccent: {
    backgroundColor: "rgba(238, 192, 91, 0.1)",
    height: 64,
    position: "absolute",
    right: 0,
    top: 0,
    width: 64
  },
  question: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 20,
    lineHeight: 28
  },
  option: {
    borderColor: employeePalette.border,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14
  },
  optionActive: {
    backgroundColor: "#fff7df",
    borderColor: "#eec05b"
  },
  optionText: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22
  },
  resultCard: {
    alignItems: "center"
  },
  resultScore: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 64,
    letterSpacing: -1.6,
    lineHeight: 72
  },
  inventoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  lotCell: {
    alignItems: "center",
    backgroundColor: "#dff7e9",
    borderColor: "rgba(30, 142, 62, 0.25)",
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: "17.5%"
  },
  lotReserved: {
    backgroundColor: "#fff7df",
    borderColor: "#ffd987"
  },
  lotSold: {
    backgroundColor: "#f2f2f2",
    borderColor: employeePalette.border
  },
  lotText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    lineHeight: 16
  },
  legend: {
    flexDirection: "row",
    gap: 8
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  backButton: {
    padding: 8
  },
  screenTitle: {
    fontSize: 20,
    fontFamily: appFonts.bold,
    color: employeePalette.redDark
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8
  },
  tabButtonActive: {
    backgroundColor: "#f7e8e5"
  },
  tabText: {
    fontSize: 14,
    fontFamily: appFonts.semiBold,
    color: "#6b7280"
  },
  tabTextActive: {
    color: employeePalette.redDark,
    fontFamily: appFonts.bold
  },
  recruitmentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  recruitmentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12
  },
  recruitmentName: {
    fontSize: 18,
    fontFamily: appFonts.bold,
    color: "#1f2937",
    marginBottom: 2
  },
  recruitmentPhone: {
    fontSize: 14,
    fontFamily: appFonts.regular,
    color: "#6b7280"
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusText: {
    fontSize: 12,
    fontFamily: appFonts.bold
  },
  recruitmentInfoRow: {
    flexDirection: "row",
    marginBottom: 6
  },
  recruitmentInfoLabel: {
    width: 90,
    fontSize: 14,
    fontFamily: appFonts.semiBold,
    color: "#6b7280"
  },
  recruitmentInfoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#374151"
  },
  recruitmentDetails: {
    marginTop: 8,
    paddingTop: 8
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 8
  },
  detailField: {
    marginBottom: 8
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: appFonts.semiBold,
    color: "#9ca3af",
    marginBottom: 2
  },
  detailValue: {
    fontSize: 14,
    fontFamily: appFonts.regular,
    color: "#1f2937"
  },
  cvButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f7e8e5",
    borderWidth: 1,
    borderColor: "#edc8c2",
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4
  },
  cvButtonText: {
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#6a0100"
  },
  recruitmentCardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6"
  },
  toggleExpandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  toggleExpandText: {
    fontSize: 14,
    fontFamily: appFonts.semiBold,
    color: "#6b7280"
  },
  actionButtonContainer: {
    flexDirection: "row",
    gap: 8
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  rejectBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db"
  },
  approveBtn: {
    backgroundColor: employeePalette.redDark
  },
  actionBtnTextReject: {
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#4b5563"
  },
  actionBtnTextApprove: {
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#ffffff"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: appFonts.bold,
    color: "#1f2937",
    marginBottom: 8
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: appFonts.regular,
    color: "#4b5563",
    marginBottom: 12
  },
  modalInput: {
    height: 100,
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
    color: "#1f2937",
    fontFamily: appFonts.regular,
    fontSize: 14,
    marginBottom: 16
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  modalCancelBtn: {
    backgroundColor: "#f3f4f6"
  },
  modalConfirmBtn: {
    backgroundColor: "#c62828"
  },
  modalBtnTextCancel: {
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#4b5563"
  },
  modalBtnTextConfirm: {
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#ffffff"
  },
  phoneNoteContainer: {
    backgroundColor: "#FDF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCD2D2",
    padding: 14,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    maxWidth: 350,
    width: "100%",
  },
  phoneNoteText: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: appFonts.regular,
    flex: 1,
  },
  phoneHighlight: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
  },
  pressed: {
    opacity: 0.84
  },
  mandatoryCourseList: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 16
  },
  mandatoryEmptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12
  },
  mandatoryEmptyTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center"
  },
  mandatoryEmptyDesc: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  mandatoryContinueBtn: {
    backgroundColor: employeePalette.green,
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 14
  },
  mandatoryContinueBtnText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center"
  },
  mandatoryCourseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e1e3e4",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },
  mandatoryCourseThumbWrap: {
    height: 120,
    position: "relative",
    backgroundColor: "#2a2f36"
  },
  mandatoryCourseThumb: {
    height: "100%",
    width: "100%",
    objectFit: "cover"
  },
  mandatoryCourseThumbPlaceholder: {
    alignItems: "center",
    backgroundColor: employeePalette.goldDark,
    flex: 1,
    justifyContent: "center"
  },
  mandatoryBadge: {
    backgroundColor: "#dc3545",
    borderRadius: 6,
    bottom: 8,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: "absolute"
  },
  mandatoryBadgeText: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1
  },
  mandatoryCourseBody: {
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  mandatoryCourseTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  mandatoryCourseDesc: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 19
  },
  mandatoryCourseMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingTop: 2
  },
  mandatoryCourseMetaText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16
  },
  mandatoryProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4
  },
  mandatoryProgressLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1
  },
  mandatoryProgressPercent: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "800"
  }
});
