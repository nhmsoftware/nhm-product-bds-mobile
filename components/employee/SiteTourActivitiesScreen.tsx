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
import { apiList } from "./utils/apiNormalizers";
import { meetClientImages } from "./utils/constants";
import { backToCheckInHistory } from "./utils/navigation";
import { apiDisplayText, apiText, firstApiDisplayText } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { showingImages } from "./utils/constants";
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

