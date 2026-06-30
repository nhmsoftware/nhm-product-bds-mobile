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

import { apiText, firstApiDisplayText } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { formatApiDateTime, meetClientStatusText } from "./utils/formatters";
type MeetClientRecentItem = {
  id: string;
  location: string;
  name: string;
  status?: string;
  time: string;
};

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

