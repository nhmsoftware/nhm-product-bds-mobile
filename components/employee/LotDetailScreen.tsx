import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";
import { employeePalette } from "@/libs/employee-theme";
import { appLogger } from "@/libs/logger";
import { notifyError, notifySuccess } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { employeeApi } from "@/services/employee/api";
import RenderHtml from "react-native-render-html";
import { styles } from "@/components/employee/utils/styles";
import { useEmployeeApiData } from "./hooks/useEmployeeApiData";
import { apiBoolean, apiText, directionUrlFromRecord, isApiObject, type ApiObject } from "./utils/apiNormalizers";
import { inventoryImages } from "./utils/constants";
import { formatSquareMeters, formatFullPriceVnd, formatFullUnitPriceVnd } from "./utils/formatters";
import { inventoryLotStatusLabel, lotImageUris, normalizeInventoryLotStatus, LotStatus, LotDepositRequestStatus, LotStatusLabel, LotActionButtonText } from "./utils/inventoryLotUtils";
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
  const [fullscreenImageVisible, setFullscreenImageVisible] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lockModalVisible, setLockModalVisible] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const { width: windowWidth } = useWindowDimensions();
  const { data } = useEmployeeApiData(
    () => lotId ? employeeApi.lotDetail(lotId) : Promise.resolve({ data: {} }),
    [lotId, lotRefreshKey]
  );
  const lot = isApiObject(data) ? data : {};

  const activeLockRequest = isApiObject(lot.active_lock_request) ? lot.active_lock_request : null;
  const expiresAtStr = activeLockRequest ? apiText(activeLockRequest.expires_at) : null;

  useEffect(() => {
    if (!expiresAtStr) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(expiresAtStr) - +new Date();
      return difference > 0 ? Math.floor(difference / 1000) : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const intervalId = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalId);
        setLotRefreshKey((value) => value + 1);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAtStr]);

  const formatDigitalTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    }
    return `${pad(minutes)}:${pad(secs)}`;
  };
  const lotName = apiText(lot.code ?? lot.name ?? lot.title, "Chưa thiết lập");
  const lotAreaObj = isApiObject(lot.area) ? lot.area : null;
  const lotArea = apiText(lot.area_name ?? lotAreaObj?.name ?? lot.location, "");
  const totalPrice = formatFullPriceVnd(lot.total_price ?? lot.price ?? lot.sale_price);
  const lotStatus = normalizeInventoryLotStatus(lot.status);
  const lotUnitPrice = formatFullUnitPriceVnd(lot.unit_price ?? lot.unitPrice, "Chưa thiết lập");
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
  const lotIsLocked = apiBoolean(lot.is_locked) || lotStatus === LotStatus.HELD;
  
  const activeDepositRequest = (lot.active_deposit_request || lot.activeDepositRequest) as ApiObject | null;
  const isMyDeposit = activeDepositRequest && (activeDepositRequest.is_mine || activeDepositRequest.isMine);

  let lotDetailStatusText: LotStatusLabel | string = "";
  if (lotStatus === LotStatus.SOLD) {
    lotDetailStatusText = LotStatusLabel.SOLD;
  } else if (activeDepositRequest) {
    const depStatus = Number(activeDepositRequest.status);
    if (depStatus === LotDepositRequestStatus.PENDING) {
      lotDetailStatusText = LotStatusLabel.DEPOSIT_PENDING;
    } else if (depStatus === LotDepositRequestStatus.APPROVED) {
      lotDetailStatusText = LotStatusLabel.DEPOSIT_APPROVED;
    } else if (depStatus === LotDepositRequestStatus.COMPLETED) {
      lotDetailStatusText = LotStatusLabel.DEPOSIT_COMPLETED;
    } else {
      lotDetailStatusText = LotStatusLabel.LOCKED;
    }
  } else {
    lotDetailStatusText = lotIsLocked ? LotStatusLabel.LOCKED : inventoryLotStatusLabel(lotStatus, lot.is_locked);
  }

  let statusBg = "#dcfce7";
  let statusBorder = "#bbf7d0";
  let statusText = "#15803d";

  if (lotStatus === LotStatus.SOLD || lotDetailStatusText === LotStatusLabel.SOLD || lotDetailStatusText === LotStatusLabel.DEPOSIT_COMPLETED) {
    statusBg = "#fee2e2";
    statusBorder = "#fecaca";
    statusText = "#b91c1c";
  } else if (lotDetailStatusText === LotStatusLabel.DEPOSIT_PENDING) {
    statusBg = "#e0f2fe";
    statusBorder = "#bae6fd";
    statusText = "#0369a1";
  } else if (lotDetailStatusText === LotStatusLabel.DEPOSIT_APPROVED) {
    statusBg = "#f3e8ff";
    statusBorder = "#e9d5ff";
    statusText = "#7e22ce";
  } else if (lotDetailStatusText === LotStatusLabel.LOCKED || lotDetailStatusText === LotStatusLabel.LOCKED_BY_ADMIN) {
    statusBg = "#fef3c7";
    statusBorder = "#fde68a";
    statusText = "#b45309";
  } else if (lotStatus === LotStatus.UNAVAILABLE || lotDetailStatusText === LotStatusLabel.UNAVAILABLE) {
    statusBg = "#f3f4f6";
    statusBorder = "#e5e7eb";
    statusText = "#374151";
  }

  const lotLockButtonText = lockSubmitting ? LotActionButtonText.LOCKING : lotIsLocked ? LotActionButtonText.LOCKED : LotActionButtonText.LOCK;

  let lotDepositButtonText = LotActionButtonText.DEPOSIT;
  if (depositSubmitting) {
    lotDepositButtonText = LotActionButtonText.DEPOSITING;
  } else if (activeDepositRequest) {
    const depStatus = Number(activeDepositRequest.status);
    if (isMyDeposit) {
      if (depStatus === LotDepositRequestStatus.PENDING) {
        lotDepositButtonText = LotActionButtonText.DEPOSIT_PENDING;
      } else if (depStatus === LotDepositRequestStatus.APPROVED) {
        lotDepositButtonText = LotActionButtonText.DEPOSIT_APPROVED;
      } else if (depStatus === LotDepositRequestStatus.COMPLETED) {
        lotDepositButtonText = LotActionButtonText.DEPOSIT_COMPLETED;
      } else {
        lotDepositButtonText = LotActionButtonText.DEPOSITED;
      }
    } else {
      lotDepositButtonText = LotActionButtonText.DEPOSITED;
    }
  } else if (lotIsDepositedByOther) {
    lotDepositButtonText = LotActionButtonText.DEPOSITED;
  }

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
    setLockModalVisible(false);
    try {
      const response = await employeeApi.requestLotLock(lotId, { reason: lockReason.trim() });
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
              <Pressable
                key={lotImages[index] ?? `fallback-${index}`}
                onPress={() => {
                  setFullscreenImageIndex(index);
                  setFullscreenImageVisible(true);
                }}
                style={{ width: lotHeroWidth || "100%" }}
              >
                <Image source={source} style={[styles.lotDetailHeroImage, { width: "100%" }]} />
              </Pressable>
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
            <View style={[styles.lotDetailStatusPill, { backgroundColor: statusBg, borderColor: statusBorder }]}>
              <Text style={[styles.lotDetailStatusText, { color: statusText }]}>{lotDetailStatusText}</Text>
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

          {activeLockRequest && timeLeft > 0 && (
            <View style={localStyles.lockTimerCard}>
              <View style={localStyles.lockTimerHeader}>
                <Ionicons 
                  name="time-outline" 
                  size={22} 
                  color={activeLockRequest.is_mine ? "#16a34a" : "#ca8a04"} 
                />
                <Text style={localStyles.lockTimerTitle}>
                  {activeLockRequest.is_mine ? "Bạn đang giữ chỗ lô này" : "Lô đất đang được giữ chỗ"}
                </Text>
              </View>
              <Text style={localStyles.lockTimerText}>
                {activeLockRequest.is_mine 
                  ? "Thời gian giữ chỗ còn lại của bạn:" 
                  : `Được giữ chỗ bởi: ${activeLockRequest.user_name || "Nhân viên khác"}`
                }
              </Text>
              <Text style={[
                localStyles.lockTimerCountdown,
                activeLockRequest.is_mine ? localStyles.lockTimerCountdownMine : localStyles.lockTimerCountdownOther
              ]}>
                {formatDigitalTime(timeLeft)}
              </Text>
            </View>
          )}

          <View style={styles.lotDetailStatsGrid}>
            <LotStat icon="resize-outline" label="DIỆN TÍCH" value={lotAreaSize} />
            <LotStat icon="analytics-outline" label="MẶT TIỀN" value={lotFrontage} />
            <LotStat icon="compass-outline" label="HƯỚNG" value={apiText(lot.direction, "Đông Nam")} />
            <LotStat icon="document-text-outline" label="PHÁP LÝ" value={lotLegal} />
          </View>

          <View style={styles.lotDetailDescriptionSection}>
            <Text style={styles.lotDetailSectionTitle}>Mô tả chi tiết</Text>
            {lotDescription && lotDescription.trim() ? (
              <RenderHtml
                contentWidth={windowWidth - 48}
                source={{ html: lotDescription }}
                tagsStyles={{
                  p: {
                    color: employeePalette.muted,
                    fontFamily: appFonts.regular,
                    fontSize: 18,
                    lineHeight: 30.6,
                    marginVertical: 4,
                  },
                  span: {
                    color: employeePalette.muted,
                    fontFamily: appFonts.regular,
                    fontSize: 18,
                    lineHeight: 30.6,
                  },
                  strong: {
                    fontFamily: appFonts.bold,
                  },
                  img: {
                    maxWidth: "100%",
                    borderRadius: 8,
                    marginVertical: 6,
                  }
                }}
              />
            ) : (
              <Text style={styles.lotDetailDescription}>Chưa thiết lập.</Text>
            )}
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
          onPress={() => {
            setLockReason("");
            setLockModalVisible(true);
          }}
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

      <Modal
        animationType="fade"
        onRequestClose={() => setLockModalVisible(false)}
        transparent
        visible={lockModalVisible}
      >
        <Pressable onPress={() => setLockModalVisible(false)} style={styles.modalBackdrop}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập lý do lock lô</Text>
            <Text style={styles.modalSubtitle}>Vui lòng nhập lý do giữ chỗ/lock lô đất này:</Text>
            <TextInput
              multiline
              onChangeText={setLockReason}
              placeholder="Nhập lý do lock (ví dụ: Khách đang cân nhắc, hẹn cọc ngày mai...)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={lockReason}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setLockModalVisible(false)} style={[styles.modalBtn, styles.modalCancelBtn]}>
                <Text style={styles.modalBtnTextCancel}>Hủy</Text>
              </Pressable>
              <Pressable
                disabled={lockSubmitting}
                onPress={requestLock}
                style={[styles.modalBtn, { backgroundColor: "#1e8e3e" }]}
              >
                {lockSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.modalBtnTextConfirm, { color: "#ffffff" }]}>Lock lô</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {fullscreenImageVisible && (
        <Modal
          animationType="fade"
          onRequestClose={() => setFullscreenImageVisible(false)}
          transparent
          visible={fullscreenImageVisible}
        >
          <View style={localStyles.fullscreenContainer}>
            <View style={localStyles.fullscreenHeader}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setFullscreenImageVisible(false)}
                style={localStyles.fullscreenCloseButton}
              >
                <Ionicons name="close" size={28} color="#ffffff" />
              </Pressable>
              <Text style={localStyles.fullscreenCounter}>
                {lotImages.length > 0 ? `${fullscreenImageIndex + 1}/${lotImages.length}` : ""}
              </Text>
            </View>
            <ScrollView
              bounces={false}
              contentOffset={{ x: fullscreenImageIndex * windowWidth, y: 0 }}
              decelerationRate="fast"
              horizontal
              onMomentumScrollEnd={(event) => {
                const width = event.nativeEvent.layoutMeasurement.width;
                if (!width) return;
                const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                setFullscreenImageIndex(Math.min(Math.max(nextIndex, 0), lotImageSlides.length - 1));
              }}
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={localStyles.fullscreenScrollView}
            >
              {lotImageSlides.map((source, index) => (
                <View key={`full-${index}`} style={{ width: windowWidth }}>
                  <Image
                    source={source}
                    style={localStyles.fullscreenImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
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

const localStyles = StyleSheet.create({
  lockTimerCard: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    alignItems: "center",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lockTimerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  lockTimerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#78350f",
    marginLeft: 6,
    fontFamily: appFonts.bold,
  },
  lockTimerText: {
    fontSize: 13,
    color: "#b45309",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: appFonts.regular,
  },
  lockTimerCountdown: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: appFonts.bold || "System",
    letterSpacing: 2,
  },
  lockTimerCountdownMine: {
    color: "#16a34a",
  },
  lockTimerCountdownOther: {
    color: "#ca8a04",
  },
  fullscreenContainer: {
    backgroundColor: "rgba(0,0,0,0.95)",
    flex: 1,
  },
  fullscreenHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  fullscreenCloseButton: {
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  fullscreenCounter: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: appFonts.semiBold,
    fontWeight: "600",
  },
  fullscreenScrollView: {
    flex: 1,
  },
  fullscreenImage: {
    height: "100%",
    resizeMode: "contain",
    width: "100%",
  },
});


