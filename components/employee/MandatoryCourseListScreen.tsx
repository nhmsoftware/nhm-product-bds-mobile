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
import { apiBoolean, apiList, apiNumber, apiText, isApiObject } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { formatScoreParam } from "./utils/formatters";
import { backToCheckInHistory } from "./utils/navigation";
import { normalizeLessonCourseQuizStatus, quizResultStatus } from "./utils/sharedHelpers";
export function MandatoryCourseListScreen({ onBack, onComplete }: { onBack?: () => void; onComplete?: () => void }) {
  const { data, loading, failed } = useEmployeeApiData(() => employeeApi.courses(), []);
  const [thumbnailFailed, setThumbnailFailed] = useState<Record<string, boolean>>({});

  const courses = useMemo(() => {
    const payload: ApiObject = isApiObject(data) ? data : {};
    const apiCourses = apiList(payload.courses);
    const fallbackCourse = isApiObject(payload.course) ? payload.course : null;
    const allCourses = apiCourses.length > 0 ? apiCourses : fallbackCourse ? [fallbackCourse] : [];

    return allCourses.filter((course) => {
      const isMandatory = apiBoolean(course.isMandatory ?? course.is_mandatory, false);
      const courseProgress = isApiObject(course.progress) ? course.progress : {};
      const status = apiText(courseProgress.status, "").toLowerCase();
      const percent = apiNumber(courseProgress.percent, 0);
      const isCompleted = status === "completed";
      return isMandatory && !isCompleted;
    }).map((course) => {
      const courseProgress = isApiObject(course.progress) ? course.progress : {};
      const thumbnail = course.thumbnailUrl ?? course.thumbnail_url ?? course.image;

      return {
        id: apiText(course.id, ""),
        title: apiText(course.title, "Khóa học bắt buộc"),
        description: apiText(course.description, "Hoàn thành lộ trình bắt buộc để tiếp tục."),
        percent: apiNumber(courseProgress.percent, 0),
        totalLessons: apiNumber(courseProgress.totalLessons ?? courseProgress.total_lessons, 0),
        completedLessons: apiNumber(courseProgress.completedLessons ?? courseProgress.completed_lessons, 0),
        thumbnail: thumbnail ? String(thumbnail) : null,
        lessons: apiNumber(course.lessons_count ?? course.lessonCount, 0)
      };
    });
  }, [data]);

  function handleThumbnailError(id: string) {
    setThumbnailFailed((prev) => ({ ...prev, [id]: true }));
  }

  function openCourse(courseId: string) {
    if (!courseId) {
      notifyError(new Error("Khóa học chưa có dữ liệu lộ trình để mở."));
      return;
    }
    router.push({
      pathname: "/employee/required-learning",
      params: { courseId, returnTo: "/employee/mandatory-courses" }
    });
  }

  const handleBack = onBack ?? backToCheckInHistory;

  if (loading) {
    return (
      <EmployeePage headerTitle="Khóa học bắt buộc" back={handleBack} backType="previous">
        <View style={styles.meetingActivitiesHeader}>
          <ActivityIndicator color={employeePalette.goldDark} />
        </View>
      </EmployeePage>
    );
  }

  if (failed) {
    return (
      <EmployeePage headerTitle="Khóa học bắt buộc" back={handleBack} backType="previous">
        <View style={styles.meetingActivitiesHeader}>
          <Text style={styles.meetRecentStateText}>Không thể tải danh sách khóa học. Vui lòng thử lại.</Text>
        </View>
      </EmployeePage>
    );
  }

  return (
    <EmployeePage headerTitle="Khóa học bắt buộc" back={handleBack} backType="previous">
      <View style={styles.meetingActivitiesHeader}>
        <Text style={styles.meetingActivitiesTitle}>Lộ trình học bắt buộc</Text>
        <Text style={styles.meetingActivitiesSubtitle}>
          Hoàn thành tất cả khóa học bên dưới để sử dụng chức năng Gặp khách và Dẫn khách.
        </Text>
      </View>

      <View style={styles.mandatoryCourseList}>
        {courses.length === 0 ? (
          <View style={styles.mandatoryEmptyWrap}>
            <Ionicons name="checkmark-circle-outline" size={56} color="#1b8a5a" />
            <Text style={styles.mandatoryEmptyTitle}>Tất cả đã hoàn thành</Text>
            <Text style={styles.mandatoryEmptyDesc}>
              Bạn đã hoàn thành toàn bộ khóa học bắt buộc. Chức năng Gặp khách và Dẫn khách đã được mở khóa.
            </Text>
            <Pressable
              onPress={() => {
                if (onComplete) {
                  onComplete();
                } else {
                  router.replace("/employee/(tabs)/learning" as Href);
                }
              }}
              style={({ pressed }) => [styles.mandatoryContinueBtn, pressed && styles.pressed]}
            >
              <Text style={styles.mandatoryContinueBtnText}>Học tập & Phát triển</Text>
            </Pressable>
          </View>
        ) : (
          courses.map((course) => {
            const thumbFailed = Boolean(thumbnailFailed[course.id]);
            const hasThumb = Boolean(course.thumbnail) && !thumbFailed;

            return (
              <Pressable
                key={course.id}
                onPress={() => openCourse(course.id)}
                style={({ pressed }) => [styles.mandatoryCourseCard, pressed && styles.pressed]}
              >
                <View style={styles.mandatoryCourseThumbWrap}>
                  {hasThumb ? (
                    <Image
                      source={{ uri: course.thumbnail! }}
                      style={styles.mandatoryCourseThumb}
                      onError={() => handleThumbnailError(course.id)}
                    />
                  ) : (
                    <View style={styles.mandatoryCourseThumbPlaceholder}>
                      <Ionicons name="book-outline" size={28} color="#ffffff" />
                    </View>
                  )}
                  <View style={styles.mandatoryBadge}>
                    <Text style={styles.mandatoryBadgeText}>BẮT BUỘC</Text>
                  </View>
                </View>

                <View style={styles.mandatoryCourseBody}>
                  <Text style={styles.mandatoryCourseTitle} numberOfLines={2}>{course.title}</Text>
                  <Text style={styles.mandatoryCourseDesc} numberOfLines={2}>{course.description}</Text>

                  <View style={styles.mandatoryCourseMeta}>
                    <Ionicons name="layers-outline" size={14} color={employeePalette.muted} />
                    <Text style={styles.mandatoryCourseMetaText}>
                      {course.totalLessons > 0
                        ? `${course.completedLessons}/${course.totalLessons} bài học`
                        : course.lessons > 0 ? `${course.lessons} bài học` : "Chưa có bài học"}
                    </Text>
                  </View>

                  <View style={styles.mandatoryProgressHeader}>
                    <Text style={styles.mandatoryProgressLabel}>TIẾN ĐỘ</Text>
                    <Text style={styles.mandatoryProgressPercent}>{course.percent}%</Text>
                  </View>
                  <View style={styles.learningProgressTrack}>
                    <View style={[styles.learningProgressFill, { width: `${course.percent}%` }]} />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </EmployeePage>
  );
}

function formatLessonDuration(seconds: number) {
  return `${Math.ceil(seconds / 60)} Phút`;
}

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

function openQuizResultScreen(courseId: string, result: ApiObject) {
  const details = apiList(result.details);
  const status = apiText(result.status, "");
  const needsManualReview =
    status === "grading" ||
    details.some((item) => item.is_correct === null || item.is_correct === undefined);
  const passed = apiBoolean(result.is_passed, status === "passed");

  router.push({
    pathname: "/employee/quiz-result",
    params: {
      score: formatScoreParam(result.score, "0"),
      maxScore: formatScoreParam(result.max_score ?? result.maxScore, "10"),
      totalQuestions: apiText(result.total_questions, "0"),
      correct: apiText(result.correct_count, "0"),
      courseId,
      passed: String(passed),
      pendingReview: String(needsManualReview),
      details: JSON.stringify(details)
    }
  });
}

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

