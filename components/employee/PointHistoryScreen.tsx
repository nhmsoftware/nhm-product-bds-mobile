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
import { apiList, apiNumber, apiText, isApiObject } from "./utils/apiNormalizers";
import { formatApiDateTime, formatPercentChange, formatSignedPoints, normalizeRewardRank } from "./utils/formatters";
import { backWithProfileSource } from "./utils/navigation";
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



// ---- Local helpers extracted from original monolith ----

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

