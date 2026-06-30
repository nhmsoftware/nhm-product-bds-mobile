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
import { apiNumber, apiText, isApiObject } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { backFromNotifications } from "./utils/navigation";
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

