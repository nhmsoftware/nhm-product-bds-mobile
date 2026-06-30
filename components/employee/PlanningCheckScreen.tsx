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
import { apiBoolean, apiList, apiText, isApiObject } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { commentInitials, formatApiDateTime } from "./utils/formatters";
import { back } from "./utils/navigation";
export function PlanningCheckScreen() {
  const params = useLocalSearchParams<{ url?: string }>();
  const rawUrl = Array.isArray(params.url) ? params.url[0] : params.url;
  const planningUrl = rawUrl || "https://quyhoach24h.vn?ref=C5WA63ND";

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.planningCheckSafe}>
      <View style={styles.planningCheckHeader}>
        <Pressable accessibilityRole="button" onPress={() => back()} style={styles.planningCheckBackButton}>
          <Ionicons name="arrow-back" size={24} color={employeePalette.text} />
        </Pressable>
        <Text numberOfLines={1} style={styles.planningCheckTitle}>Kiểm tra quy hoạch</Text>
        <View style={styles.planningCheckHeaderSpacer} />
      </View>

      <WebView
        source={{ uri: planningUrl }}
        style={styles.planningCheckWebView}
        containerStyle={styles.planningCheckWebContainer}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </SafeAreaView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.inventoryLegendItem}>
      <View style={[styles.inventoryLegendDot, { backgroundColor: color }]} />
      <Text style={styles.inventoryLegendText}>{label}</Text>
    </View>
  );
}

function MapControl({
  disabled,
  highlight,
  icon,
  onPress
}: {
  disabled?: boolean;
  highlight?: boolean;
  icon: ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.inventoryMapControl, (pressed || disabled) && styles.pressed]}
    >
      <Ionicons name={icon} size={highlight ? 22 : 24} color={highlight ? employeePalette.red : "#111111"} />
    </Pressable>
  );
}

function CommentRow({
  initials,
  name,
  text,
  time,
  tone
}: {
  initials: string;
  name: string;
  text: string;
  time: string;
  tone: "red" | "gold";
}) {
  return (
    <View style={styles.inventoryCommentRow}>
      <View style={[styles.inventoryCommentAvatar, tone === "gold" && styles.inventoryCommentAvatarGold]}>
        <Text style={[styles.inventoryCommentInitials, tone === "gold" && styles.inventoryCommentInitialsGold]}>{initials}</Text>
      </View>
      <View style={styles.flex}>
        <View style={styles.inventoryCommentMeta}>
          <Text style={styles.inventoryCommentName}>{name}</Text>
          <Text style={styles.inventoryCommentTime}>{time}</Text>
        </View>
        <Text style={styles.inventoryCommentText}>{text}</Text>
      </View>
    </View>
  );
}

function AreaCommentsSection({
  comments,
  currentPage,
  disabled,
  draft,
  emptyText,
  loadingPage,
  onChangeDraft,
  onSelectPage,
  onSubmit,
  pageCount,
  submitting,
  totalCount
}: {
  comments: ApiObject[];
  currentPage?: number;
  disabled?: boolean;
  draft: string;
  emptyText: string;
  loadingPage?: number | null;
  onChangeDraft: (value: string) => void;
  onSelectPage?: (page: number) => void;
  onSubmit: () => void;
  pageCount?: number;
  submitting?: boolean;
  totalCount?: number;
}) {
  const displayCount = totalCount ?? comments.length;
  const safeCurrentPage = Math.max(1, currentPage ?? 1);
  const safePageCount = Math.max(1, pageCount ?? 1);
  const pageNumbers = Array.from({ length: safePageCount }, (_, index) => index + 1);

  return (
    <View style={styles.inventoryComments}>
      <View style={styles.inventoryCommentsHeader}>
        <Text style={styles.inventoryCommentsTitle}>BÌNH LUẬN & THẢO LUẬN</Text>
        <View style={styles.inventoryCommentsCount}>
          <Text style={styles.inventoryCommentsCountText}>{displayCount}</Text>
        </View>
      </View>
      {comments.length > 0 ? (
        comments.map((comment, index) => {
          const commentUser = isApiObject(comment.user) ? comment.user : {};
          const name = apiText(comment.user_name ?? comment.userName ?? commentUser.name, "Nhân viên hệ thống");

          return (
            <CommentRow
              key={apiText(comment.id, `${name}-${index}`)}
              initials={commentInitials(name)}
              name={name}
              text={apiText(comment.content ?? comment.text, "")}
              time={formatApiDateTime(comment.created_at ?? comment.createdAt, "Vừa xong")}
              tone={index % 2 === 0 ? "red" : "gold"}
            />
          );
        })
      ) : (
        <Text style={styles.inventoryCommentText}>{emptyText}</Text>
      )}
      {safePageCount > 1 ? (
        <View style={styles.inventoryCommentsPagination}>
          {pageNumbers.map((page) => {
            const active = page === safeCurrentPage;

            return (
              <Pressable
                accessibilityRole="button"
                disabled={Boolean(loadingPage) || active}
                key={page}
                onPress={() => onSelectPage?.(page)}
                style={({ pressed }) => [
                  styles.inventoryCommentsPageButton,
                  active && styles.inventoryCommentsPageButtonActive,
                  pressed && styles.pressed
                ]}
              >
                <Text style={[styles.inventoryCommentsPageText, active && styles.inventoryCommentsPageTextActive]}>
                  {page}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={styles.inventoryCommentInput}>
        <TextInput
          editable={!disabled && !submitting}
          onChangeText={onChangeDraft}
          placeholder="Nhập nội dung trao đổi..."
          placeholderTextColor="#8f706b"
          style={styles.inventoryCommentTextInput}
          value={draft}
        />
        <Pressable
          accessibilityRole="button"
          disabled={disabled || submitting || !draft.trim()}
          onPress={onSubmit}
          style={({ pressed }) => [styles.inventoryCommentSendButton, (pressed || submitting) && styles.pressed]}
        >
          <Ionicons name="send" size={22} color="#990100" />
        </Pressable>
      </View>
    </View>
  );
}

type LessonCourseQuizStatus = "unknown" | "available" | "locked" | "none" | "grading" | "passed" | "failed" | "completed" | "in_progress";

function lessonCourseQuizStatusFromLabel(value: unknown): LessonCourseQuizStatus | null {
  const label = apiText(value, "").trim().toLocaleLowerCase("vi-VN");

  if (!label) return null;
  if (label.includes("xem lại")) return "completed";
  if (label.includes("chưa đạt")) return "failed";
  if (label.includes("đang chấm")) return "grading";
  if (label.includes("làm bài kiểm tra")) return "available";

  return null;
}

function normalizeLessonCourseQuizStatus(value: unknown): LessonCourseQuizStatus {
  const status = apiText(value, "").trim().toLowerCase();

  if (!status) return "available";
  if (["passed", "pass", "success", "done", "completed", "complete"].includes(status)) return "passed";
  if (["failed", "fail", "not_passed", "not passed", "chua_dat", "chưa đạt"].includes(status)) return "failed";
  if (["grading", "pending", "pending_review", "manual_review", "reviewing", "submitted", "waiting_review"].includes(status)) {
    return "grading";
  }
  if (["in_progress", "draft", "started", "doing"].includes(status)) return "in_progress";
  if (["locked", "forbidden"].includes(status)) return "locked";
  if (["none", "not_available", "unavailable", "no_quiz"].includes(status)) return "none";

  return "available";
}

function quizResultStatus(result: ApiObject): LessonCourseQuizStatus {
  const details = apiList(result.details);
  const status = normalizeLessonCourseQuizStatus(result.status);

  if (status === "grading" || details.some((item) => item.is_correct === null || item.is_correct === undefined)) {
    return "grading";
  }

  if (status === "passed" || status === "failed") {
    return status;
  }

  if (result.is_passed !== undefined || result.isPassed !== undefined) {
    return apiBoolean(result.is_passed ?? result.isPassed) ? "passed" : "failed";
  }

  if (result.score !== undefined || details.length > 0) {
    return "completed";
  }

  return status;
}

