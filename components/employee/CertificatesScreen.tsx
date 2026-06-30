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
import { useEmployeeApiData } from "./hooks/useEmployeeApiData";
import { apiBoolean, apiList, apiText, isApiObject } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { certificateFilterOptions, inventoryImages } from "./utils/constants";
import type { CertificateFilterValue } from "./utils/constants";
import { formatTwoDigits } from "./utils/formatters";
import { backWithProfileSource } from "./utils/navigation";
import { loadLearningCertificateData } from "./utils/sharedHelpers";
import type { CertificateCardItem } from "./utils/sharedHelpers";
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

