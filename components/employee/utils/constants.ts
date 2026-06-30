export const imageNotFound = require("@/assets/images/placeholders/image_not_found.png");

export const learningImages = {
  legal: require("@/assets/images/learning/project-legal.png"),
  market: require("@/assets/images/learning/market-analysis.png"),
  negotiation: require("@/assets/images/learning/negotiation.png"),
  requiredHero: require("@/assets/images/learning/required-course-hero.png"),
  lessonVideo: require("@/assets/images/learning/lesson-video-thumbnail.png"),
  planningQuizMap: require("@/assets/images/learning/planning-quiz-map.png"),
  resultQuestion1: require("@/assets/images/learning/result-question-1.png"),
  resultQuestion2: require("@/assets/images/learning/result-question-2.png")
};

export const inventoryImages = {
  mapOverview: imageNotFound,
  lotHero: imageNotFound,
  planningArea: imageNotFound,
  staffProfile: require("@/assets/images/inventory/staff-profile.png"),
  zoneA: imageNotFound,
  zoneB: imageNotFound
};

export const inventoryLotGridColumns = 7;
export const inventoryLotGridHorizontalPadding = 18;
export const inventoryLotCellSize = 40;

export const profileImages = {
  headshot: require("@/assets/images/profile/employee-headshot.png"),
  certificateGold: require("@/assets/images/profile/certificate-bg-gold.png"),
  verifiedBadge: require("@/assets/images/profile/verified-badge.png"),
  personalAvatar: require("@/assets/images/employee/profile/personal-avatar.png")
};

export const certificateImages = {
  realEstate: require("@/assets/images/profile/certificates/certificate-real-estate.png"),
  operations: require("@/assets/images/profile/certificates/certificate-operations.png"),
  digitalMarketing: require("@/assets/images/profile/certificates/certificate-digital-marketing.png"),
  negotiation: require("@/assets/images/profile/certificates/certificate-negotiation.png")
};

export const showingImages = {
  gps: require("@/assets/images/showing/gps-icon.png"),
  chevronDown: require("@/assets/images/showing/chevron-down-icon.png"),
  camera: require("@/assets/images/showing/camera-icon.png"),
  play: require("@/assets/images/showing/play-icon.png"),
  timelineCheck: require("@/assets/images/showing/timeline-check-icon.png"),
  timelineHistory: require("@/assets/images/showing/timeline-history-icon.png")
};

export const meetClientImages = {
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

export const certificateFallbackImages = [
  certificateImages.realEstate,
  certificateImages.operations,
  certificateImages.digitalMarketing,
  certificateImages.negotiation
];

export const showProfileRewardHistoryShortcut = false;
export const newsPostPreviewLines = 5;

export const NEWS_IMAGE_EXTENSIONS: Record<string, string> = {
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

export const employeeDocumentMaxBytes = 10 * 1024 * 1024;
export const employeeAvatarMaxBytes = 5 * 1024 * 1024;
export const employeeDocumentMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png"
];

export function employeeDocumentMimeType(fileName: string, mimeType?: string | null) {
  if (mimeType) return mimeType;

  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";

  return "application/octet-stream";
}

export const leaveTypeOptions = [
  { label: "Nghỉ phép năm", value: "1" },
  { label: "Nghỉ không lương", value: "2" },
  { label: "Nghỉ cá nhân", value: "3" },
  { label: "Nghỉ thai sản", value: "4" },
  { label: "Nghỉ công tác", value: "5" },
  { label: "Nghỉ bù", value: "6" }
];

export type LeaveStatusFilter = "all" | "pending" | "approved" | "rejected";

export const leaveFilterTabs: { label: string; value: LeaveStatusFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đã duyệt", value: "approved" },
  { label: "Từ chối", value: "rejected" }
];

export type DepartmentOption = {
  label: string;
  value: string;
};

export const fallbackDepartmentOptions: DepartmentOption[] = [
  { label: "Phòng Kinh doanh", value: "Phòng Kinh doanh" },
  { label: "Phòng Marketing", value: "Phòng Marketing" },
  { label: "Phòng Chăm sóc khách hàng", value: "Phòng Chăm sóc khách hàng" },
  { label: "Phòng Vận hành khu đất", value: "Phòng Vận hành khu đất" },
  { label: "Phòng Tài chính", value: "Phòng Tài chính" },
  { label: "Phòng Nhân sự", value: "Phòng Nhân sự" },
  { label: "Phòng IT", value: "Phòng IT" }
];

export const hiddenTransferDepartmentNames = [
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

export const inventoryAreaFilterOptions: { label: string; value: InventoryAreaFilterValue }[] = [
  { label: "Tất cả khu đất", value: "all" },
  { label: "Còn hàng", value: "available" },
  { label: "Hết hàng", value: "soldOut" },
  { label: "Khu nổi bật", value: "featured" }
];

export type InventoryAreaFilterValue = "all" | "available" | "soldOut" | "featured";

export type InventoryInfoTabKey = "location" | "legal" | "floor_plan" | "documents";

export type InventoryInfoTab = {
  actionLabel?: string;
  actionUrl?: string;
  content: string;
  imageUrl?: string;
  key: InventoryInfoTabKey;
  label: string;
  title: string;
};

export const defaultInventoryInfoTabs: InventoryInfoTab[] = [
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

export const inventoryInfoTabConfig: { icon: string; key: InventoryInfoTabKey; label: string }[] = [
  { icon: "location-outline", key: "location", label: "Vị trí" },
  { icon: "shield-checkmark-outline", key: "legal", label: "Pháp lý" },
  { icon: "map-outline", key: "floor_plan", label: "Mặt bằng" },
  { icon: "folder-open-outline", key: "documents", label: "Tài liệu" }
];

export const certificateFilterOptions: Array<{ label: string; value: CertificateFilterValue }> = [
  { label: "Tất cả", value: "all" },
  { label: "Đã xác thực", value: "verified" },
  { label: "Chờ xác thực", value: "pending" },
  { label: "Mới", value: "new" }
];

export type CertificateFilterValue = "all" | "verified" | "pending" | "new";
