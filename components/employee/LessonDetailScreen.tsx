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
import { apiNumber, apiText, isApiObject } from "./utils/apiNormalizers";
import { learningImages } from "./utils/constants";
import { backToRequiredLearning } from "./utils/navigation";
import { openQuizResultScreen, normalizeLessonCourseQuizStatus, quizResultStatus, type LessonCourseQuizStatus } from "./utils/sharedHelpers";
import { apiBoolean, apiList } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
export function LessonDetailScreen({
  lesson,
  onProgressUpdate
}: {
  lesson: LearningLessonDetail;
  onProgressUpdate?: (progress: LearningLessonProgressUpdate) => void;
}) {
  const [courseQuizStatus, setCourseQuizStatus] = useState<LessonCourseQuizStatus>("unknown");
  const [courseQuizStatusKey, setCourseQuizStatusKey] = useState("");
  const [courseQuizResultLoading, setCourseQuizResultLoading] = useState(false);
  const description = htmlToPlainText(lesson.content);
  const durationSeconds = lesson.duration_seconds ?? (lesson.duration_minutes ?? 0) * 60;
  const watchedPercent = durationSeconds > 0 ? Math.min(100, (lesson.current_watch_seconds / durationSeconds) * 100) : 0;
  const durationLabel = formatWatchTime(durationSeconds);
  const watchLabel = formatWatchTime(lesson.current_watch_seconds);
  const isCompleted = lesson.status === "completed";
  const hasNextLesson = Boolean(lesson.next_lesson_id);
  const lessonLabelQuizStatus = !hasNextLesson && isCompleted ? lessonCourseQuizStatusFromLabel(lesson.status_label) : null;
  const expectedCourseQuizStatusKey = `${lesson.id}:${lesson.course_id}:${lesson.next_lesson_id ?? ""}`;
  const effectiveCourseQuizStatus = courseQuizStatusKey === expectedCourseQuizStatusKey
    ? courseQuizStatus
    : hasNextLesson
      ? "none"
      : lessonLabelQuizStatus ?? "unknown";
  const courseQuizPending = !hasNextLesson && effectiveCourseQuizStatus === "unknown";
  const hasCourseQuiz = !hasNextLesson && effectiveCourseQuizStatus !== "unknown" && effectiveCourseQuizStatus !== "none";
  const courseQuizHasResult = effectiveCourseQuizStatus === "passed" || effectiveCourseQuizStatus === "failed" || effectiveCourseQuizStatus === "completed";
  const courseQuizIsGrading = effectiveCourseQuizStatus === "grading";
  const courseQuizActionDisabled =
    !hasNextLesson && (courseQuizPending || courseQuizIsGrading || effectiveCourseQuizStatus === "locked" || courseQuizResultLoading);
  const nextActionLabel = (() => {
    if (hasNextLesson) return "Bài tiếp theo";
    if (courseQuizPending) return "Đang kiểm tra bài thi...";
    if (courseQuizResultLoading) return "Đang tải...";
    if (courseQuizIsGrading) return "Đang chấm";
    if (courseQuizHasResult) return "Xem lại bài kiểm tra";
    if (effectiveCourseQuizStatus === "locked") return "Bài kiểm tra chưa mở";
    if (hasCourseQuiz) return effectiveCourseQuizStatus === "in_progress" ? "Tiếp tục bài kiểm tra" : "Làm bài kiểm tra";
    return "Về trang Học viện Đào tạo";
  })();
  const completedNotice = (() => {
    if (hasNextLesson) {
      return lesson.unlock_condition?.replace("Hoàn thành bài học này để mở khóa bài tiếp theo:", "Bài tiếp theo đã được mở khóa:") ||
        "Bài học đã hoàn thành. Bạn có thể chuyển sang bài học tiếp theo trong lộ trình.";
    }

    if (courseQuizIsGrading) return "Bài kiểm tra đang được chấm. Bạn sẽ xem lại kết quả khi có điểm.";
    if (courseQuizHasResult) return "Bạn đã nộp bài kiểm tra. Có thể xem lại kết quả bài làm.";
    if (hasCourseQuiz) return "Bạn đã hoàn thành toàn bộ bài học. Vui lòng làm bài kiểm tra để hoàn thành khóa học.";
    return "Bạn đã hoàn thành khóa học bắt buộc. Học viện Đào tạo đã được mở khóa.";
  })();

  useEffect(() => {
    let mounted = true;

    if (!lesson.course_id || lesson.next_lesson_id) {
      setCourseQuizStatus("none");
      setCourseQuizStatusKey(expectedCourseQuizStatusKey);
      return () => {
        mounted = false;
      };
    }

    setCourseQuizStatus(lessonLabelQuizStatus ?? "unknown");
    setCourseQuizStatusKey(expectedCourseQuizStatusKey);

    const setLoadedCourseQuizStatus = (status: LessonCourseQuizStatus) => {
      setCourseQuizStatus(status);
      setCourseQuizStatusKey(expectedCourseQuizStatusKey);
    };

    async function loadCourseQuizStatus() {
      const resultResponse = await employeeApi.courseQuizResult(lesson.course_id).catch(() => null);
      if (!mounted) return;

      if (resultResponse) {
        const result = isApiObject(resultResponse.data) ? resultResponse.data : {};
        const resultStatus = quizResultStatus(result);

        if (["passed", "failed", "completed", "grading"].includes(resultStatus)) {
          setLoadedCourseQuizStatus(resultStatus);
          return;
        }
      }

      const availabilityResponse = await employeeApi.courseQuizAvailability(lesson.course_id).catch(() => null);
      if (!mounted) return;

      if (!availabilityResponse) {
        setLoadedCourseQuizStatus("none");
        return;
      }

      if (availabilityResponse.status === 404) {
        setLoadedCourseQuizStatus("none");
        return;
      }

      if (availabilityResponse.status === 403) {
        setLoadedCourseQuizStatus("locked");
        return;
      }

      const responseData = isApiObject(availabilityResponse.data) ? availabilityResponse.data : {};
      const attempt = isApiObject(responseData.attempt) ? responseData.attempt : {};
      const attemptStatus = normalizeLessonCourseQuizStatus(attempt.status ?? responseData.status);

      setLoadedCourseQuizStatus(attemptStatus === "available" ? "available" : attemptStatus);
    }

    void loadCourseQuizStatus();

    return () => {
      mounted = false;
    };
  }, [expectedCourseQuizStatusKey, lesson.course_id, lesson.next_lesson_id, lessonLabelQuizStatus]);

  const openNextLesson = useCallback(async () => {
    if (lesson.next_lesson_id) {
      router.replace({
        pathname: "/employee/lesson-detail",
        params: { lessonId: lesson.next_lesson_id }
      });
      return;
    }

    if (courseQuizPending) {
      return;
    }

    if (courseQuizIsGrading || effectiveCourseQuizStatus === "locked") {
      return;
    }

    if (courseQuizHasResult) {
      setCourseQuizResultLoading(true);
      try {
        const response = await employeeApi.courseQuizResult(lesson.course_id);
        const result = isApiObject(response.data) ? response.data : {};
        const resultStatus = quizResultStatus(result);

        if (resultStatus === "grading") {
          setCourseQuizStatus("grading");
          return;
        }

        openQuizResultScreen(lesson.course_id, result);
      } catch (error) {
        appLogger.warn("employee.lesson.quiz_result", "Không thể tải kết quả bài kiểm tra.", {
          courseId: lesson.course_id,
          error
        });
        notifyError(error, "Không thể tải kết quả bài kiểm tra.");
      } finally {
        setCourseQuizResultLoading(false);
      }
      return;
    }

    if (hasCourseQuiz) {
      router.replace({
        pathname: "/employee/quiz",
        params: { courseId: lesson.course_id }
      });
      return;
    }

    router.replace("/employee/learning");
  }, [
    courseQuizHasResult,
    courseQuizIsGrading,
    courseQuizPending,
    effectiveCourseQuizStatus,
    hasCourseQuiz,
    lesson.course_id,
    lesson.next_lesson_id
  ]);

  return (
    <EmployeePage
      headerTitle="Khóa học Bất động sản Cao cấp"
      back={backToRequiredLearning}
      backType="previous"
      right={<View style={styles.lessonHeaderRight} />}
      contentStyle={styles.lessonDetailContent}
    >
      <View style={styles.lessonVideo}>
        {lesson.video_url ? (
          <LessonVideoPlayer
            initialWatchSeconds={lesson.current_watch_seconds}
            lessonId={lesson.id}
            onProgressUpdate={onProgressUpdate}
            progressSyncDisabled={isCompleted}
            videoUrl={mediaUrl(lesson.video_url) || ""}
          />
        ) : (
          <>
            <Image source={learningImages.lessonVideo} style={styles.lessonVideoImage} />
            <View style={styles.lessonVideoOverlay} />
            <View style={styles.lessonPlayButton}>
              <Ionicons name="play" size={28} color="#ffffff" />
            </View>
            <View style={styles.lessonVideoControls}>
              <View style={styles.rowBetween}>
                <Text style={styles.lessonVideoTime}>{watchLabel}</Text>
                <Text style={styles.lessonVideoTime}>{durationLabel}</Text>
              </View>
              <View style={styles.lessonSeekTrack}>
                <View style={[styles.lessonSeekFill, { width: `${watchedPercent}%` }]} />
              </View>
              <View style={styles.lessonControlRow}>
                <View style={styles.lessonControlLeft}>
                  <Ionicons name="volume-high-outline" size={22} color="#ffffff" />
                  <Ionicons name="reader-outline" size={22} color="#ffffff" />
                </View>
                <Ionicons name="scan-outline" size={22} color="#ffffff" />
              </View>
            </View>
          </>
        )}
      </View>

      <View style={styles.lessonDetailBody}>
        <View style={styles.lessonBadge}>
          <Text style={styles.lessonBadgeText}>{lesson.status_label.toUpperCase()}</Text>
        </View>
        <Text style={styles.lessonDetailTitle}>Bài {lesson.order}: {lesson.title}</Text>
        <Text style={styles.lessonDetailDescription}>{description || "Bài học chưa có nội dung mô tả."}</Text>

        <View style={[styles.lessonNotice, isCompleted && styles.lessonNoticeCompleted]}>
          <View style={styles.lessonNoticeRow}>
            <Ionicons name={isCompleted ? "checkmark-circle-outline" : "information-circle-outline"} size={24} color={isCompleted ? "#138a43" : "#c91f1f"} />
            <Text style={styles.lessonNoticeText}>
              {isCompleted ? completedNotice : lesson.unlock_condition || "Vui lòng xem hết video để mở khóa bài học tiếp theo."}
            </Text>
          </View>
          {isCompleted ? (
            <Pressable
              accessibilityRole="button"
              disabled={courseQuizActionDisabled}
              onPress={openNextLesson}
              style={({ pressed }) => [
                styles.lessonNextButtonActive,
                courseQuizActionDisabled && styles.lessonNextButtonPending,
                pressed && styles.pressed
              ]}
            >
              <Ionicons name={courseQuizHasResult ? "eye-outline" : courseQuizIsGrading ? "time-outline" : "play-forward-outline"} size={18} color="#ffffff" />
              <Text style={styles.lessonNextButtonText}>{nextActionLabel}</Text>
            </Pressable>
          ) : (
            <View style={styles.lessonNextButtonDisabled}>
              <Ionicons name="lock-closed-outline" size={18} color="#ffffff" />
              <Text style={styles.lessonNextButtonText}>Bài tiếp theo</Text>
            </View>
          )}
        </View>

        <Text style={styles.lessonAttachmentsTitle}>Tài liệu đính kèm</Text>
        <View style={styles.lessonAttachmentList}>
          {lesson.attachments.length > 0 ? (
            lesson.attachments.map((attachment, index) => (
              <LessonAttachment
                key={`${attachmentTitle(attachment)}-${index}`}
                size={attachmentSize(attachment)}
                title={attachmentTitle(attachment)}
                type={attachmentType(attachment)}
                url={mediaUrl(attachment.url ?? attachment.file_url ?? attachment.fileUrl)}
              />
            ))
          ) : (
            <Text style={styles.lessonEmptyAttachments}>Chưa có tài liệu đính kèm.</Text>
          )}
        </View>
      </View>
    </EmployeePage>
  );
}

function LessonAttachment({ title, size, type, url }: { title: string; size: string; type: "pdf" | "doc"; url?: string }) {
  const isPdf = type === "pdf";
  const openAttachment = () => {
    if (!url) {
      notifyError("Tài liệu chưa có đường dẫn tải xuống.");
      return;
    }

    Linking.openURL(url).catch((error) => {
      appLogger.warn("learning.attachment", "Không thể mở tài liệu đính kèm.", { error, url });
      notifyError(error, "Không thể mở tài liệu đính kèm.");
    });
  };

  return (
    <Pressable accessibilityRole="button" onPress={openAttachment} style={({ pressed }) => [styles.lessonAttachmentRow, pressed && styles.pressed]}>
      <View style={[styles.lessonAttachmentIcon, isPdf ? styles.lessonAttachmentIconPdf : styles.lessonAttachmentIconDoc]}>
        <Ionicons name={isPdf ? "document-text-outline" : "document-outline"} size={22} color={isPdf ? employeePalette.redDark : "#3f3000"} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.lessonAttachmentTitle}>{title}</Text>
        <Text style={styles.lessonAttachmentSize}>{size}</Text>
      </View>
      <Ionicons name="download-outline" size={22} color={url ? employeePalette.redDark : "#e3beb8"} />
    </Pressable>
  );
}

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



// ---- Local helpers extracted from original monolith ----

function htmlToPlainText(content: string) {
  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}


// ---- Local helpers extracted from original monolith ----

function formatWatchTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}


// ---- Local helpers extracted from original monolith ----

function lessonCourseQuizStatusFromLabel(value: unknown): LessonCourseQuizStatus | null {
  const label = apiText(value, "").trim().toLocaleLowerCase("vi-VN");

  if (!label) return null;
  if (label.includes("xem lại")) return "completed";
  if (label.includes("chưa đạt")) return "failed";
  if (label.includes("đang chấm")) return "grading";
  if (label.includes("làm bài kiểm tra")) return "available";

  return null;
}


// ---- Local helpers extracted from original monolith ----

function LessonVideoPlayer({
  lessonId,
  progressSyncDisabled = false,
  videoUrl,
  initialWatchSeconds = 0,
  onProgressUpdate
}: {
  lessonId: string;
  progressSyncDisabled?: boolean;
  videoUrl: string;
  initialWatchSeconds?: number;
  onProgressUpdate?: (progress: LearningLessonProgressUpdate) => void;
}) {
  const normalizedInitialWatchSeconds = Math.max(0, Math.floor(initialWatchSeconds));
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(normalizedInitialWatchSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [nativeControlsEnabled, setNativeControlsEnabled] = useState(false);
  const [seekWidth, setSeekWidth] = useState(0);
  const canSeekVideo = progressSyncDisabled;
  const currentSecondsRef = useRef(normalizedInitialWatchSeconds);
  const lastSyncedSecondsRef = useRef(normalizedInitialWatchSeconds > 0 ? normalizedInitialWatchSeconds : -1);
  const lastSyncedAtRef = useRef(0);
  const syncingRef = useRef(false);
  const finalSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestInitialWatchSecondsRef = useRef(normalizedInitialWatchSeconds);
  const restoredInitialWatchRef = useRef(false);
  const videoViewRef = useRef<VideoView>(null);
  latestInitialWatchSecondsRef.current = normalizedInitialWatchSeconds;

  const player = useVideoPlayer({ uri: videoUrl, contentType: "progressive" }, (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.volume = 1;
    instance.timeUpdateEventInterval = 1;
  });

  const callVideoAction = useCallback((action: () => void, actionName: string) => {
    try {
      action();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (actionName === "tạm dừng" && message.includes("NativeSharedObjectNotFoundException")) {
        return;
      }

      appLogger.warn("learning.video", `Không thể ${actionName} video.`, { error });
    }
  }, []);

  const pauseVideo = useCallback(() => {
    callVideoAction(() => player.pause(), "tạm dừng");
  }, [callVideoAction, player]);

  const setVideoTime = useCallback((seconds: number) => {
    callVideoAction(() => {
      player.currentTime = seconds;
    }, "tua");
  }, [callVideoAction, player]);

  useEffect(() => {
    const sourceLoadSubscription = player.addListener("sourceLoad", (event) => {
      if (event.duration > 0) {
        setDurationSeconds(event.duration);
      }
      const resumeSeconds = latestInitialWatchSecondsRef.current;
      if (!canSeekVideo && event.duration > 0) {
        setVideoTime(0);
        setCurrentSeconds(0);
        currentSecondsRef.current = 0;
        setIsEnded(false);
        restoredInitialWatchRef.current = true;
      } else if (!restoredInitialWatchRef.current && resumeSeconds > 0) {
        const resumeAt = event.duration > 0 ? Math.min(resumeSeconds, event.duration) : resumeSeconds;
        setVideoTime(resumeAt);
        setCurrentSeconds(resumeAt);
        currentSecondsRef.current = resumeAt;
        setIsEnded(event.duration > 0 && resumeAt >= event.duration - 0.5);
        restoredInitialWatchRef.current = true;
      }
      setHasError(false);
    });
    const statusSubscription = player.addListener("statusChange", (event) => {
      setHasError(event.status === "error");
    });
    const playingSubscription = player.addListener("playingChange", (event) => {
      setIsPlaying(event.isPlaying);
    });
    const timeSubscription = player.addListener("timeUpdate", (event) => {
      setCurrentSeconds(event.currentTime);
      currentSecondsRef.current = event.currentTime;
      if (durationSeconds > 0 && event.currentTime < durationSeconds - 0.5) {
        setIsEnded(false);
      }
    });
    const endSubscription = player.addListener("playToEnd", () => {
      setIsPlaying(false);
      setIsEnded(true);
      if (player.duration > 0) {
        setCurrentSeconds(player.duration);
      }
    });

    return () => {
      sourceLoadSubscription.remove();
      statusSubscription.remove();
      playingSubscription.remove();
      timeSubscription.remove();
      endSubscription.remove();
    };
  }, [canSeekVideo, durationSeconds, player, setVideoTime]);

  useEffect(() => {
    const resumeSeconds = latestInitialWatchSecondsRef.current;
    restoredInitialWatchRef.current = false;
    setCurrentSeconds(resumeSeconds);
    currentSecondsRef.current = resumeSeconds;
    lastSyncedSecondsRef.current = resumeSeconds > 0 ? resumeSeconds : -1;
    lastSyncedAtRef.current = 0;
    setIsEnded(false);
  }, [lessonId, videoUrl]);

  const openExternalVideo = () => {
    Linking.openURL(videoUrl);
  };

  const clearFinalProgressSync = useCallback(() => {
    if (finalSyncTimerRef.current) {
      clearTimeout(finalSyncTimerRef.current);
      finalSyncTimerRef.current = null;
    }
  }, []);

  const syncProgress = useCallback(async (watchSeconds = currentSecondsRef.current, force = false) => {
    if (progressSyncDisabled) {
      return;
    }

    const nextSeconds = Math.max(0, Math.floor(watchSeconds));
    if (syncingRef.current || nextSeconds <= 0 || (!force && nextSeconds === lastSyncedSecondsRef.current)) {
      return;
    }

    syncingRef.current = true;
    try {
      const response = await employeeApi.updateLessonProgress(lessonId, nextSeconds);
      lastSyncedSecondsRef.current = nextSeconds;
      lastSyncedAtRef.current = Date.now();
      onProgressUpdate?.(response.data);
    } catch (error) {
      appLogger.warn("learning.progress", "Không thể cập nhật tiến độ bài học.", {
        lessonId,
        watchSeconds: nextSeconds,
        error
      });
    } finally {
      syncingRef.current = false;
    }
  }, [lessonId, onProgressUpdate, progressSyncDisabled]);

  useEffect(() => {
    if (!isEnded) {
      return;
    }

    const endSeconds = durationSeconds || player.duration || currentSecondsRef.current;
    syncProgress(endSeconds, true);
  }, [durationSeconds, isEnded, player, syncProgress]);

  const scheduleFinalProgressSync = useCallback(() => {
    const watchSeconds = currentSecondsRef.current;
    const now = Date.now();
    const elapsed = lastSyncedAtRef.current ? now - lastSyncedAtRef.current : 0;
    const delayMs = lastSyncedAtRef.current && elapsed < 2000 ? 2000 - elapsed : 0;

    clearFinalProgressSync();
    finalSyncTimerRef.current = setTimeout(() => {
      finalSyncTimerRef.current = null;
      syncProgress(watchSeconds, true);
    }, delayMs);
  }, [clearFinalProgressSync, syncProgress]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const interval = setInterval(() => {
      syncProgress();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, syncProgress]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        pauseVideo();
        scheduleFinalProgressSync();
      };
    }, [pauseVideo, scheduleFinalProgressSync])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        pauseVideo();
        scheduleFinalProgressSync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [pauseVideo, scheduleFinalProgressSync]);

  useEffect(() => {
    return () => {
      clearFinalProgressSync();
    };
  }, [clearFinalProgressSync]);

  const toggleVideo = () => {
    if (hasError) {
      openExternalVideo();
      return;
    }

    setHasError(false);
    if (isPlaying) {
      pauseVideo();
      syncProgress();
      return;
    }
    clearFinalProgressSync();
    if (isEnded) {
      callVideoAction(() => player.replay(), "phát lại");
      setIsEnded(false);
      return;
    }
    callVideoAction(() => player.play(), "phát");
  };

  const seekBy = (seconds: number) => {
    if (hasError) {
      return;
    }
    if (!canSeekVideo) {
      return;
    }
    const target = Math.max(0, Math.min(durationSeconds || player.duration || 0, player.currentTime + seconds));
    setVideoTime(target);
    setCurrentSeconds(target);
    currentSecondsRef.current = target;
    setIsEnded(false);
  };

  const seekFromPress = (event: GestureResponderEvent) => {
    if (!canSeekVideo || !durationSeconds || !seekWidth) {
      return;
    }
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / seekWidth));
    const target = durationSeconds * ratio;
    setVideoTime(target);
    setCurrentSeconds(target);
    currentSecondsRef.current = target;
    setIsEnded(false);
  };

  const onSeekLayout = (event: LayoutChangeEvent) => {
    setSeekWidth(event.nativeEvent.layout.width);
  };

  const openFullscreen = () => {
    if (!canSeekVideo) {
      return;
    }
    setNativeControlsEnabled(true);
    setTimeout(() => {
      callVideoAction(() => videoViewRef.current?.enterFullscreen(), "mở toàn màn hình");
    }, 0);
  };

  const watchedPercent = durationSeconds > 0 ? Math.min(100, (currentSeconds / durationSeconds) * 100) : 0;
  const durationLabel = durationSeconds > 0 ? formatWatchTime(durationSeconds) : "--:--";

  return (
    <>
      <VideoView
        ref={videoViewRef}
        allowsPictureInPicture
        fullscreenOptions={{ enable: true, orientation: "landscape", autoExitOnRotate: false }}
        nativeControls={nativeControlsEnabled}
        onFullscreenEnter={() => setNativeControlsEnabled(true)}
        onFullscreenExit={() => setNativeControlsEnabled(false)}
        player={player}
        style={styles.lessonVideoPlayer}
      />
      <View style={styles.lessonNativeControls}>
        <View style={styles.lessonVideoMeta}>
          <Text style={styles.lessonVideoTime}>{formatWatchTime(currentSeconds)}</Text>
          <Text style={styles.lessonVideoTime}>{durationLabel}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!canSeekVideo || !durationSeconds}
          onLayout={onSeekLayout}
          onPress={seekFromPress}
          style={({ pressed }) => [
            styles.lessonNativeSeekTrack,
            !canSeekVideo && styles.lessonNativeSeekTrackLocked,
            pressed && canSeekVideo && styles.lessonNativeSeekTrackPressed
          ]}
        >
          <View style={[styles.lessonSeekFill, { width: `${watchedPercent}%` }]} />
        </Pressable>
        <View style={styles.lessonVideoControlRow}>
          <View style={styles.lessonVideoSideSlot} />
          <View style={styles.lessonVideoButtonRow}>
            <Pressable
              accessibilityRole="button"
              disabled={!canSeekVideo}
              onPress={() => seekBy(-10)}
              style={({ pressed }) => [styles.lessonVideoControlButton, !canSeekVideo && styles.lessonVideoControlButtonDisabled, pressed && canSeekVideo && styles.pressed]}
            >
              <Ionicons name="play-back" size={18} color="#ffffff" />
              <Text style={styles.lessonVideoSmallText}>10s</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={toggleVideo}
              style={({ pressed }) => [styles.lessonVideoPrimaryButton, pressed && styles.pressed]}
            >
              <Ionicons
                name={hasError ? "open-outline" : isEnded ? "refresh" : isPlaying ? "pause" : "play"}
                size={26}
                color="#ffffff"
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canSeekVideo}
              onPress={() => seekBy(10)}
              style={({ pressed }) => [styles.lessonVideoControlButton, !canSeekVideo && styles.lessonVideoControlButtonDisabled, pressed && canSeekVideo && styles.pressed]}
            >
              <Text style={styles.lessonVideoSmallText}>10s</Text>
              <Ionicons name="play-forward" size={18} color="#ffffff" />
            </Pressable>
          </View>
          <View style={styles.lessonVideoSideSlot}>
            <Pressable
              accessibilityRole="button"
              disabled={!canSeekVideo}
              onPress={openFullscreen}
              style={({ pressed }) => [styles.lessonVideoFullscreenButton, !canSeekVideo && styles.lessonVideoControlButtonDisabled, pressed && canSeekVideo && styles.pressed]}
            >
              <Ionicons name="scan-outline" size={20} color="#ffffff" />
            </Pressable>
          </View>
        </View>
        {hasError ? (
          <Pressable accessibilityRole="button" onPress={openExternalVideo} style={styles.lessonVideoExternalButton}>
            <Ionicons name="open-outline" size={16} color="#ffffff" />
            <Text style={styles.lessonVideoExternalText}>Mở video</Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );
}


// ---- Local helpers extracted from original monolith ----

function attachmentTitle(attachment: LearningLessonAttachment) {
  return attachment.title || attachment.name || attachment.file_name || attachment.fileName || "Tài liệu bài học";
}


// ---- Local helpers extracted from original monolith ----

function attachmentSize(attachment: LearningLessonAttachment) {
  return attachment.size || attachment.file_size || attachment.fileSize || "Tài liệu đính kèm";
}


// ---- Local helpers extracted from original monolith ----

function attachmentType(attachment: LearningLessonAttachment): "pdf" | "doc" {
  const value = `${attachmentTitle(attachment)} ${attachment.mime_type || attachment.mimeType || attachment.type || ""}`;
  return value.toLowerCase().includes("pdf") ? "pdf" : "doc";
}

