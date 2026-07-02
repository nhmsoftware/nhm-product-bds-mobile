import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Linking, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import { Pressable } from "@/components/SafePressable";
import { EmployeePage } from "@/components/EmployeeUI";
import { employeePalette } from "@/libs/employee-theme";
import { appLogger } from "@/libs/logger";
import { mediaUrl } from "@/libs/media";
import { notifyError } from "@/libs/notify";
import type { LearningLessonDetail, LearningLessonProgressUpdate } from "@/services/employee/types";
import { styles } from "@/components/employee/utils/styles";
import { learningImages } from "./utils/constants";
import { backToRequiredLearning } from "./utils/navigation";
import { htmlToPlainText, formatWatchTime, attachmentTitle, attachmentSize, attachmentType } from "./lesson/lessonHelpers";
import { useCourseQuizStatus } from "./hooks/useCourseQuizStatus";
import { useVideoProgressSync } from "./hooks/useVideoProgressSync";

export function LessonDetailScreen({
  lesson,
  onProgressUpdate
}: {
  lesson: LearningLessonDetail;
  onProgressUpdate?: (progress: LearningLessonProgressUpdate) => void;
}) {
  const {
    effectiveCourseQuizStatus,
    courseQuizPending,
    hasCourseQuiz,
    courseQuizHasResult,
    courseQuizIsGrading,
    courseQuizActionDisabled,
    nextActionLabel,
    completedNotice,
    openNextLesson,
    isCompleted,
    hasNextLesson
  } = useCourseQuizStatus(lesson);

  const description = htmlToPlainText(lesson.content || "");
  const durationSeconds = lesson.duration_seconds ?? (lesson.duration_minutes ?? 0) * 60;
  const watchedPercent = durationSeconds > 0 ? Math.min(100, ((lesson.current_watch_seconds || 0) / durationSeconds) * 100) : 0;
  const durationLabel = formatWatchTime(durationSeconds);
  const watchLabel = formatWatchTime(lesson.current_watch_seconds || 0);
  const safeAttachments = Array.isArray(lesson.attachments) ? lesson.attachments : [];

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
            initialWatchSeconds={lesson.current_watch_seconds || 0}
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
          <Text style={styles.lessonBadgeText}>{(lesson.status_label || "").toUpperCase()}</Text>
        </View>
        <Text style={styles.lessonDetailTitle}>Bài {lesson.order || ""}: {lesson.title || ""}</Text>
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
          {safeAttachments.length > 0 ? (
            safeAttachments.map((attachment, index) => (
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

  const { syncProgress, scheduleFinalProgressSync, clearFinalProgressSync, lastSyncedSecondsRef, lastSyncedAtRef } = useVideoProgressSync({
    lessonId,
    progressSyncDisabled,
    onProgressUpdate,
    player,
    currentSecondsRef
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
      if (!restoredInitialWatchRef.current && resumeSeconds > 0) {
        const resumeAt = event.duration > 0 ? Math.min(resumeSeconds, event.duration) : resumeSeconds;
        setVideoTime(resumeAt);
        setCurrentSeconds(resumeAt);
        currentSecondsRef.current = resumeAt;
        setIsEnded(event.duration > 0 && resumeAt >= event.duration - 0.5);
        restoredInitialWatchRef.current = true;
      } else if (!restoredInitialWatchRef.current) {
        setVideoTime(0);
        setCurrentSeconds(0);
        currentSecondsRef.current = 0;
        setIsEnded(false);
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

  useEffect(() => {
    if (!isEnded) return;
    const endSeconds = durationSeconds || player.duration || currentSecondsRef.current;
    syncProgress(endSeconds, true);
  }, [durationSeconds, isEnded, player, syncProgress]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = setInterval(() => {
      syncProgress();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, syncProgress]);

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
    if (hasError || !canSeekVideo) return;
    const target = Math.max(0, Math.min(durationSeconds || player.duration || 0, player.currentTime + seconds));
    setVideoTime(target);
    setCurrentSeconds(target);
    currentSecondsRef.current = target;
    setIsEnded(false);
  };

  const seekFromPress = (event: GestureResponderEvent) => {
    if (!canSeekVideo || !durationSeconds || !seekWidth) return;
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
            {canSeekVideo ? (
              <Pressable
                accessibilityRole="button"
                disabled={!canSeekVideo}
                onPress={() => seekBy(-10)}
                style={({ pressed }) => [styles.lessonVideoControlButton, !canSeekVideo && styles.lessonVideoControlButtonDisabled, pressed && canSeekVideo && styles.pressed]}
              >
                <Ionicons name="play-back" size={18} color="#ffffff" />
                <Text style={styles.lessonVideoSmallText}>10s</Text>
              </Pressable>
            ) : null}
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
            {canSeekVideo ? (
              <Pressable
                accessibilityRole="button"
                disabled={!canSeekVideo}
                onPress={() => seekBy(10)}
                style={({ pressed }) => [styles.lessonVideoControlButton, !canSeekVideo && styles.lessonVideoControlButtonDisabled, pressed && canSeekVideo && styles.pressed]}
              >
                <Text style={styles.lessonVideoSmallText}>10s</Text>
                <Ionicons name="play-forward" size={18} color="#ffffff" />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.lessonVideoSideSlot}>
            <Pressable
              accessibilityRole="button"
              onPress={openFullscreen}
              style={({ pressed }) => [styles.lessonVideoFullscreenButton, pressed && styles.pressed]}
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
