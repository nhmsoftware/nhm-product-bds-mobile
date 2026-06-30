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
import { apiList, apiText, isApiObject } from "./utils/apiNormalizers";
import { meetClientImages } from "./utils/constants";
import { useCopy } from "./utils/i18n";
import { backToCheckInHistory } from "./utils/navigation";
import { logImageUploadAsset } from "./utils/sharedHelpers";

import { firstApiDisplayText } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { formatApiDateTime, meetClientStatusText } from "./utils/formatters";
type MeetClientRecentItem = {
  id: string;
  location: string;
  name: string;
  status?: string;
  time: string;
};
// ---- Local helpers ----

function MeetClientPhotoButton({ onPress, title }: { onPress?: () => void; title: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.meetPhotoButton, pressed && styles.pressed]}>
      <Image source={meetClientImages.cameraButton} style={styles.meetCameraButtonIcon} />
      <Text style={styles.meetPhotoButtonText}>{title}</Text>
    </Pressable>
  );
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



// ---- Local helpers extracted from original monolith ----

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


// ---- Local helpers extracted from original monolith ----

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

