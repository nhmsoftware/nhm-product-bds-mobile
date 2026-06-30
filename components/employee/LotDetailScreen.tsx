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
import { apiBoolean, apiText, directionUrlFromRecord, isApiObject } from "./utils/apiNormalizers";
import { inventoryImages } from "./utils/constants";
import { formatSquareMeters, formatUnitPricePerSquareMeter, formatVietnamRealEstatePrice } from "./utils/formatters";
import { inventoryLotStatusLabel, lotImageUris, normalizeInventoryLotStatus } from "./utils/inventoryLotUtils";
import { back } from "./utils/navigation";
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

