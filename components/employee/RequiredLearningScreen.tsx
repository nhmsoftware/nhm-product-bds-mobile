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
import { learningImages } from "./utils/constants";
import { back } from "./utils/navigation";
import { isApiObject } from "./utils/apiNormalizers";
import { formatLessonDuration, openQuizResultScreen, normalizeLessonCourseQuizStatus, quizResultStatus } from "./utils/sharedHelpers";
export function RequiredLearningScreen({
  course,
  onBack,
  refreshing,
  onRefresh
}: {
  course?: MandatoryLearningCourse | null;
  onBack?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const handleBack = onBack ?? back;

  if (!course) {
    return (
      <EmployeePage headerTitle="Lộ trình Học" back={handleBack} contentStyle={styles.requiredLearningContent}>
        <Text style={styles.requiredIntro}>Chưa có dữ liệu lộ trình học.</Text>
      </EmployeePage>
    );
  }

  const heroImage =
    course.thumbnailUrl && !thumbnailFailed
      ? { uri: course.thumbnailUrl }
      : learningImages.requiredHero;
  const quiz = course.quiz?.hasQuiz && course.quiz.courseId ? course.quiz : null;
  const allLessonsCompleted =
    course.progress.totalLessons > 0 && course.progress.completedLessons >= course.progress.totalLessons;
  const quizStatus = quiz?.status ?? "none";
  const backendQuizCanStart = quiz && typeof quiz.canStart === "boolean" ? quiz.canStart : null;
  const statusAllowsQuizAction =
    quizStatus === "not_started" ||
    quizStatus === "failed" ||
    quizStatus === "passed" ||
    quizStatus === "available" ||
    quizStatus === "completed" ||
    Boolean(quiz?.isPassed);
  const quizCanStart = backendQuizCanStart ?? (allLessonsCompleted && statusAllowsQuizAction);
  const canStartQuiz = Boolean(
    quiz &&
      quiz.courseId &&
      quizStatus !== "locked" &&
      quizStatus !== "none" &&
      quizStatus !== "grading" &&
      quizCanStart
  );

  return (
    <EmployeePage
      headerTitle={course.isMandatory ? "Lộ trình Học bắt buộc" : "Lộ trình Học"}
      back={handleBack}
      contentStyle={styles.requiredLearningContent}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <View style={styles.requiredHero}>
        <Image source={heroImage} onError={() => setThumbnailFailed(true)} style={styles.requiredHeroImage} />
        <View style={styles.requiredHeroOverlay} />
        <View style={styles.requiredHeroCopy}>
          <Text style={styles.requiredHeroKicker}>{course.label}</Text>
          <Text style={styles.requiredHeroTitle}>{course.title}</Text>
        </View>
      </View>

      <Text style={styles.requiredIntro}>{course.description}</Text>

      {course.notice ? (
        <View style={styles.requiredAlert}>
          <View style={styles.requiredAlertIcon}>
            <Ionicons name="information" size={17} color="#ffffff" />
          </View>
          <Text style={styles.requiredAlertText}>{course.notice.message}</Text>
        </View>
      ) : null}

      <View style={styles.requiredTimeline}>
        <View style={styles.requiredTimelineLine} />
        {course.lessons.map((lesson) => (
          <RequiredLessonCard key={lesson.id} lesson={lesson} />
        ))}
        {quiz ? <RequiredQuizCard quiz={quiz} canStart={canStartQuiz} /> : null}
      </View>
    </EmployeePage>
  );
}



// ---- Local helpers extracted from original monolith ----

function RequiredLessonCard({ lesson }: { lesson: MandatoryLearningLesson }) {
  const locked = lesson.isLocked || lesson.status === "locked";
  const completed = lesson.status === "completed";
  const statusText = locked ? lesson.actionText : completed ? "Hoàn thành" : "Đang học";
  const showProgress = !locked && lesson.canContinue;

  return (
    <View style={styles.requiredTimelineRow}>
      <View style={[styles.requiredTimelineNode, locked ? styles.requiredTimelineNodeLocked : styles.requiredTimelineNodeActive]}>
        <Ionicons
          name={locked ? "lock-closed-outline" : completed ? "checkmark" : "play"}
          size={locked ? 15 : 20}
          color={locked ? "#9d8d8a" : "#ffffff"}
        />
      </View>

      <Pressable
        disabled={locked}
        onPress={() =>
          router.navigate({
            pathname: "/employee/lesson-detail",
            params: { lessonId: lesson.id }
          })
        }
        style={({ pressed }) => [
          styles.requiredLessonCard,
          locked && styles.requiredLessonCardLocked,
          pressed && styles.pressed
        ]}
      >
        <View style={styles.requiredLessonHeader}>
          <Text style={[styles.requiredLessonStep, locked && styles.requiredLessonMuted]}>BÀI {lesson.order}</Text>
          <View style={styles.requiredLessonStatus}>
            <Text style={[styles.requiredLessonStatusText, locked && styles.requiredLessonMuted]}>
              {statusText.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.requiredLessonTitle, locked && styles.requiredLessonTitleLocked]}>{lesson.title}</Text>
        <View style={styles.requiredLessonMeta}>
          <Ionicons name="time-outline" size={15} color={locked ? "#9d8d8a" : employeePalette.muted} />
          <Text style={[styles.requiredLessonDuration, locked && styles.requiredLessonMuted]}>
            {formatLessonDuration(lesson.durationSeconds)}
          </Text>
        </View>
        {showProgress ? (
          <>
            <View style={styles.requiredProgressTrack}>
              <View style={[styles.requiredProgressFill, { width: `${lesson.progressPercent}%` }]} />
            </View>
            <View style={styles.requiredProgressFooter}>
              <Text style={styles.requiredProgressText}>Đã xem {lesson.progressPercent}%</Text>
              <Text style={styles.requiredContinueText}>{lesson.actionText}</Text>
            </View>
          </>
        ) : null}
      </Pressable>
    </View>
  );
}


// ---- Local helpers extracted from original monolith ----

function RequiredQuizCard({ canStart, quiz }: { canStart: boolean; quiz: MandatoryLearningQuiz }) {
  const [loadingResult, setLoadingResult] = useState(false);
  const normalizedQuizStatus = normalizeLessonCourseQuizStatus(quiz.status);
  const isPassed = normalizedQuizStatus === "passed" || quiz.isPassed;
  const isGrading = normalizedQuizStatus === "grading";
  const isFailed = normalizedQuizStatus === "failed";
  const hasQuizResult = isPassed || isFailed || normalizedQuizStatus === "completed";
  const buttonText =
    loadingResult ? "Đang tải..." : isGrading ? "Đang chấm" : hasQuizResult ? "Xem lại bài kiểm tra" : quiz.actionText ||
    "Làm bài kiểm tra";
  const buttonIcon = hasQuizResult ? "eye-outline" : isGrading ? "time-outline" : "play";
  const statusText = isPassed ? "Hoàn thành" : isGrading ? "Đang chấm" : isFailed ? "Chưa đạt" : "Chưa làm";
  const canPressQuiz = canStart && !isGrading && !loadingResult;

  useFocusEffect(
    useCallback(() => {
      setLoadingResult(false);
    }, [])
  );

  const handlePress = async () => {
    const courseId = quiz.courseId ?? "";
    if (!courseId) {
      notifyError("Không tìm thấy khóa học của bài kiểm tra.");
      return;
    }

    if (hasQuizResult) {
      setLoadingResult(true);
      try {
        const response = await employeeApi.courseQuizResult(courseId);
        const result = isApiObject(response.data) ? response.data : {};
        const resultStatus = quizResultStatus(result);
        if (resultStatus === "grading") {
          setLoadingResult(false);
          return;
        }
        setLoadingResult(false);
        openQuizResultScreen(courseId, result);
      } catch (error) {
        appLogger.warn("employee.quiz.result", "Không thể tải kết quả bài kiểm tra.", { error });
        notifyError(error, "Không thể tải kết quả bài kiểm tra.");
        setLoadingResult(false);
      }
      return;
    }

    router.push({
      pathname: "/employee/quiz",
      params: { courseId }
    });
  };

  const handleRetakeQuiz = () => {
    const courseId = quiz.courseId ?? "";
    if (!courseId) {
      notifyError("Không tìm thấy khóa học của bài kiểm tra.");
      return;
    }
    router.push({
      pathname: "/employee/quiz",
      params: { courseId }
    });
  };

  return (
    <View style={styles.requiredTimelineRow}>
      <View style={[styles.requiredTimelineNode, canPressQuiz ? styles.requiredTimelineNodeActive : styles.requiredTimelineNodeLocked]}>
        <Ionicons
          name={canPressQuiz ? buttonIcon : isGrading ? "time-outline" : "lock-closed-outline"}
          size={canPressQuiz ? 20 : 15}
          color={canPressQuiz ? "#ffffff" : "#9d8d8a"}
        />
      </View>

      <View style={[styles.requiredQuizCard, !canStart && styles.requiredQuizCardLocked]}>
        <View style={styles.requiredLessonHeader}>
          <Text style={styles.requiredQuizKicker}>BÀI KIỂM TRA</Text>
          <View style={styles.requiredLessonStatus}>
            <Text style={[styles.requiredLessonStatusText, !canStart && styles.requiredLessonMuted]}>
              {statusText.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.requiredQuizTitle, !canStart && styles.requiredLessonTitleLocked]}>
          Làm bài kiểm tra để hoàn thành khóa học
        </Text>
        {isFailed && !quiz.hasEssay ? (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canPressQuiz }}
              disabled={!canPressQuiz}
              onPress={handlePress}
              style={({ pressed }) => [
                styles.requiredQuizButton,
                { flex: 1, marginTop: 0 },
                !canPressQuiz && styles.requiredQuizButtonLocked,
                pressed && styles.pressed
              ]}
            >
              <Ionicons name={loadingResult ? "reload" : "eye-outline"} size={19} color="#ffffff" />
              <Text style={styles.requiredQuizButtonText}>Xem lại</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canPressQuiz }}
              disabled={!canPressQuiz}
              onPress={handleRetakeQuiz}
              style={({ pressed }) => [
                styles.requiredQuizButton,
                { flex: 1, marginTop: 0, backgroundColor: "#d97706" },
                !canPressQuiz && styles.requiredQuizButtonLocked,
                pressed && styles.pressed
              ]}
            >
              <Ionicons name="refresh" size={19} color="#ffffff" />
              <Text style={styles.requiredQuizButtonText}>Làm lại</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canPressQuiz }}
            disabled={!canPressQuiz}
            onPress={handlePress}
            style={({ pressed }) => [
              styles.requiredQuizButton,
              !canPressQuiz && styles.requiredQuizButtonLocked,
              pressed && styles.pressed
            ]}
          >
            <Ionicons name={loadingResult ? "reload" : buttonIcon} size={19} color="#ffffff" />
            <Text style={styles.requiredQuizButtonText}>{buttonText}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

