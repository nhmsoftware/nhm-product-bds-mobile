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
import { apiDisplayText, apiList, apiText, isApiObject } from "./utils/apiNormalizers";
import { meetClientImages, showingImages } from "./utils/constants";
import { useCopy } from "./utils/i18n";
import { backToCheckInHistory } from "./utils/navigation";
import { logImageUploadAsset } from "./utils/sharedHelpers";
import { firstApiDisplayText } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { formatApiDateTime } from "./utils/formatters";

// ---- Local helpers ----

type SiteTourHistoryItem = {
  completed: boolean;
  customer: string;
  id: string;
  statusLabel: string;
  time: string;
  title: string;
};

function MeetClientPhotoButton({ onPress, title }: { onPress?: () => void; title: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.meetPhotoButton, pressed && styles.pressed]}
    >
      <Ionicons name="camera" size={18} color="#990100" />
      <Text style={styles.meetPhotoButtonText}>{title}</Text>
    </Pressable>
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



// ---- Local helpers extracted from original monolith ----

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


// ---- Local helpers extracted from original monolith ----

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


// ---- Local helpers extracted from original monolith ----

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

