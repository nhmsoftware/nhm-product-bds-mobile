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
import { apiBoolean, apiList, apiNumber, apiText } from "./utils/apiNormalizers";
import { formatScoreValue } from "./utils/formatters";
import { isApiObject } from "./utils/apiNormalizers";
export function QuizResultScreen() {
  const params = useLocalSearchParams<{ correct?: string; courseId?: string; details?: string; maxScore?: string; passed?: string; pendingReview?: string; score?: string; total?: string; totalQuestions?: string }>();
  const courseId = apiText(params.courseId, "");
  const score = apiNumber(params.score, 0);
  const maxScore = apiNumber(params.maxScore ?? params.total, 10) || 10;
  const totalQuestions = apiNumber(params.totalQuestions ?? params.total, 0);
  const passed = params.passed ? params.passed === "true" : score >= 8;
  const parsedDetails = useMemo(() => {
    if (!params.details) return [];

    try {
      return apiList(JSON.parse(params.details));
    } catch {
      return [];
    }
  }, [params.details]);
  const questions = parsedDetails.map((item, index) => {
    const type = apiText(item.type, "multiple_choice");
    const options = normalizeQuizOptions(item.options);
    const selectedOption = item.selected_option === null || item.selected_option === undefined ? null : apiNumber(item.selected_option, -1);
    const correctOption = item.correct_option === null || item.correct_option === undefined ? null : apiNumber(item.correct_option, -1);
    const selectedLabel = selectedOption === null ? "" : apiText(options.find((option) => option.value === selectedOption)?.label, `Đáp án ${selectedOption + 1}`);
    const correctLabel = correctOption === null ? "" : apiText(options.find((option) => option.value === correctOption)?.label, `Đáp án ${correctOption + 1}`);
    const isPending = item.is_correct === null || item.is_correct === undefined;
    const isCorrect = !isPending && apiBoolean(item.is_correct, false);
    const order = apiNumber(item.order, index + 1);

    return {
      answer: type === "essay" ? apiText(item.essay_answer, "Chưa nhập câu trả lời.") : selectedLabel,
      correct: isCorrect,
      correctAnswer: type === "essay" || isCorrect ? undefined : correctLabel,
      expanded: isPending,
      index: order > 0 ? order : index + 1,
      pending: isPending,
      title: apiText(item.question ?? item.title, "Nội dung câu hỏi đang được cập nhật.")
    };
  });
  const hasEssay = useMemo(() => {
    return parsedDetails.some((item) => apiText(item.type, "") === "essay");
  }, [parsedDetails]);

  const hasPendingReview = params.pendingReview === "true" || questions.some((question) => question.pending);
  const questionTotal = questions.length > 0 ? questions.length : totalQuestions;
  const backToRequiredCourse = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/employee/required-learning",
      params: courseId ? { courseId } : undefined
    });
  }, [courseId]);
  const dashboardAction = useCallback(() => {
    if (passed && !hasPendingReview) {
      router.replace("/employee/learning");
      return;
    }

    router.replace({
      pathname: "/employee/required-learning",
      params: courseId ? { courseId } : undefined
    });
  }, [courseId, hasPendingReview, passed]);

  const handleRetakeQuiz = useCallback(() => {
    router.replace({
      pathname: "/employee/quiz",
      params: courseId ? { courseId } : undefined
    });
  }, [courseId]);

  return (
    <SafeAreaView style={styles.resultSafe}>
      <View style={styles.resultHeader}>
        <Pressable accessibilityRole="button" onPress={backToRequiredCourse} style={styles.resultCloseButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </Pressable>
        <Text style={styles.resultHeaderTitle}>Kết quả</Text>
        <View style={styles.resultHeaderSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.resultScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHero}>
          <View style={styles.resultGoldGlow} />
          <View style={styles.resultRedGlow} />
          <View style={styles.resultScoreBlock}>
            <Text style={styles.resultScoreLabel}>{hasPendingReview ? "TRẠNG THÁI BÀI LÀM" : "ĐIỂM SỐ CỦA BẠN"}</Text>
            {hasPendingReview ? (
              <Text style={styles.resultPendingTitle}>Đang chấm bài</Text>
            ) : (
              <View style={styles.resultScoreRow}>
                <Text style={styles.resultScoreBig}>{formatScoreValue(score)}</Text>
                <Text style={styles.resultScoreTotal}>/{formatScoreValue(maxScore)}</Text>
              </View>
            )}
          </View>

          <View style={styles.resultAchievementCard}>
            <View style={styles.resultMedalCircle}>
              <Ionicons name={hasPendingReview ? "time-outline" : "ribbon-outline"} size={22} color={employeePalette.gold} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.resultAchievementTitle}>{hasPendingReview ? "Chờ chấm tự luận" : passed ? "Xuất sắc!" : "Cần ôn tập thêm"}</Text>
              <Text style={styles.resultAchievementText}>
                {hasPendingReview
                  ? "Bài làm có câu tự luận nên cần quản trị viên chấm trước khi hiển thị điểm cuối cùng."
                  : "Bạn đã hoàn thành bài kiểm tra kiến thức."}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.resultReviewSection}>
          <View style={styles.resultReviewHeader}>
            <Text style={styles.resultReviewTitle}>Chi tiết câu hỏi</Text>
            <View style={styles.resultCountPill}>
              <Text style={styles.resultCountText}>{questionTotal} CÂU</Text>
            </View>
          </View>

          <View style={styles.resultQuestionList}>
            {questions.length > 0 ? questions.map((question) => (
              <ResultQuestionCard key={`${question.index}-${question.title}`} {...question} />
            )) : (
              <Text style={styles.resultExplanationText}>Chưa có dữ liệu chi tiết câu hỏi.</Text>
            )}
          </View>
        </View>

        {!passed && !hasPendingReview && !hasEssay ? (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <Pressable
              accessibilityRole="button"
              onPress={backToRequiredCourse}
              style={[styles.resultDashboardButton, { flex: 1, marginTop: 0, backgroundColor: "#4b5563" }]}
            >
              <Ionicons name="arrow-back" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.resultDashboardText}>Quay lại</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleRetakeQuiz}
              style={[styles.resultDashboardButton, { flex: 1, marginTop: 0, backgroundColor: "#d97706" }]}
            >
              <Ionicons name="refresh" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.resultDashboardText}>Làm lại</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={dashboardAction} style={styles.resultDashboardButton}>
            <Text style={styles.resultDashboardText}>{passed && !hasPendingReview ? "Tiếp tục học tập" : "Trở về khóa học"}</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultQuestionCard({
  answer,
  correct,
  correctAnswer,
  expanded,
  image,
  index,
  note,
  pending,
  title
}: {
  answer: string;
  correct: boolean;
  correctAnswer?: string;
  expanded?: boolean;
  image?: number;
  index: number;
  note?: string;
  pending?: boolean;
  title: string;
}) {
  return (
    <View style={[styles.resultQuestionCard, !correct && !pending && styles.resultQuestionCardWrong]}>
      <View style={[styles.resultQuestionTop, expanded && styles.resultQuestionTopExpanded]}>
        <View style={[styles.resultStatusIcon, pending ? styles.resultStatusPending : correct ? styles.resultStatusCorrect : styles.resultStatusWrong]}>
          <Ionicons
            name={pending ? "time-outline" : correct ? "checkmark" : "close"}
            size={18}
            color={pending ? employeePalette.goldDark : correct ? employeePalette.green : "#d93025"}
          />
        </View>
        <View style={styles.flex}>
          <Text style={styles.resultQuestionKicker}>CÂU {index}</Text>
          <Text style={styles.resultQuestionTitle}>{title}</Text>
          <View style={[styles.resultAnswerLine, pending ? styles.resultAnswerPending : correct ? styles.resultAnswerCorrect : styles.resultAnswerWrong]}>
            <Text style={[styles.resultAnswerText, !correct && !pending && styles.resultAnswerTextWrong]}>{answer}</Text>
          </View>
          {correctAnswer ? (
            <View style={[styles.resultAnswerLine, styles.resultAnswerCorrect]}>
              <Text style={[styles.resultAnswerText, styles.resultAnswerTextDark]}>{correctAnswer}</Text>
            </View>
          ) : null}
        </View>
        {!expanded ? <Ionicons name="chevron-down" size={20} color={employeePalette.muted} /> : null}
      </View>

      {expanded ? (
        <View style={styles.resultExplanation}>
          <View style={styles.resultExplanationHeader}>
            <Ionicons name="bulb-outline" size={13} color={employeePalette.goldDark} />
            <Text style={styles.resultExplanationTitle}>GIẢI THÍCH CHI TIẾT</Text>
          </View>
          {note ? <Text style={styles.resultExplanationText}>{note}</Text> : null}
          {image ? <Image source={image} style={styles.resultExplanationImage} /> : null}
        </View>
      ) : null}
    </View>
  );
}



// ---- Local helpers extracted from original monolith ----

function normalizeQuizOptions(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((option, index) => {
      if (isApiObject(option)) {
        return {
          label: apiText(option.label ?? option.text ?? option.title ?? option.name, ""),
          value: apiNumber(option.value ?? option.id ?? index, index)
        };
      }

      return {
        label: apiText(option, ""),
        value: index
      };
    }).filter((option) => option.label);
  }

  if (isApiObject(value)) {
    return Object.entries(value)
      .map(([key, label], index) => ({
        label: apiText(label, ""),
        value: apiNumber(key, index)
      }))
      .filter((option) => option.label)
      .sort((a, b) => a.value - b.value);
  }

  return [];
}

