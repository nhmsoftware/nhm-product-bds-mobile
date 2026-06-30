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
import { apiList, apiText } from "./utils/apiNormalizers";
import { backWithProfileSource } from "./utils/navigation";
export function DepartmentStaffScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const { data: overviewData } = useEmployeeApiData(() => employeeApi.teamOverview(), []);
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.teamMembers({ per_page: 100 }), []);
  const [query, setQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("Tất cả vị trí");
  const [positionPickerVisible, setPositionPickerVisible] = useState(false);

  const overview = overviewData || {
    team_name: "Kinh Doanh Dự Án Cao Cấp",
    description: "Chuyên trách phân phối các sản phẩm biệt thự nghỉ dưỡng và penthouse hạng sang. Đội ngũ nòng cốt gồm những chuyên gia tư vấn bất động sản hàng đầu khu vực.",
    member_count: 24,
    manager_name: "Trần Anh Quân"
  };

  const members = apiList(data);
  const staffRows = members.map((member, index) => ({
    id: apiText(member.id, `staff-${index}`),
    name: apiText(member.full_name ?? member.name, "Nhân viên"),
    role: apiText(member.job_position ?? member.position ?? member.kpi_label, "Chuyên viên tư vấn"),
    phone: apiText(member.phone, ""),
    zalo: apiText(member.zalo ?? member.phone, "")
  }));

  const positions = useMemo(() => {
    const unique = Array.from(new Set(staffRows.map((s) => s.role).filter(Boolean)));
    return ["Tất cả vị trí", ...unique];
  }, [staffRows]);

  const visibleRows = staffRows.filter((staff) => {
    const normalized = query.trim().toLowerCase();
    if (normalized) {
      const matchQuery = `${staff.name} ${staff.role}`.toLowerCase().includes(normalized);
      if (!matchQuery) return false;
    }

    if (selectedPosition !== "Tất cả vị trí") {
      if (staff.role !== selectedPosition) return false;
    }

    return true;
  });

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.staffSafe}>
      <View style={styles.staffHeader}>
        <Pressable accessibilityRole="button" onPress={handleBack} style={styles.staffHeaderButton}>
          <Ionicons name="arrow-back" size={22} color="#191c1d" />
        </Pressable>
        <Text style={styles.staffHeaderTitle}>Danh sách nhân viên</Text>
        <View style={styles.staffHeaderButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.staffScrollContent}
        style={styles.staffRoot}
      >
        <View style={styles.staffDepartmentCard}>
          <View style={styles.staffDepartmentGlow} />
          <View style={styles.staffDepartmentLabelRow}>
            <Ionicons name="business-outline" size={18} color="#ffb4a8" />
            <Text style={styles.staffDepartmentLabel}>PHÒNG BAN HIỆN TẠI</Text>
          </View>
          <Text style={styles.staffDepartmentTitle}>{apiText(overview.team_name, "Kinh Doanh Dự Án Cao Cấp")}</Text>
          <Text style={styles.staffDepartmentDescription}>
            {apiText(overview.description, "Chuyên trách phân phối các sản phẩm biệt thự nghỉ dưỡng và penthouse hạng sang. Đội ngũ nòng cốt gồm những chuyên gia tư vấn bất động sản hàng đầu khu vực.")}
          </Text>
          <View style={styles.staffDepartmentMetaGroup}>
            <View style={styles.staffDepartmentMeta}>
              <Ionicons name="people-outline" size={13} color="#ffffff" />
              <Text style={styles.staffDepartmentMetaText}>{apiText(overview.member_count, "24")} Nhân viên</Text>
            </View>
            <View style={styles.staffDepartmentMeta}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#ffffff" />
              <Text style={styles.staffDepartmentMetaText}>Trưởng phòng: {apiText(overview.manager_name, "Trần Anh Quân")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.staffFilterSection}>
          <Text style={styles.staffFilterLabel}>TÌM KIẾM ĐỒNG NGHIỆP</Text>
          <View style={styles.staffInputFrame}>
            <Ionicons name="search-outline" size={18} color="#8f706b" />
            <TextInput
              autoCapitalize="none"
              value={query}
              onChangeText={setQuery}
              placeholder="Nhập tên hoặc mã nhân viên..."
              placeholderTextColor="#6b7280"
              style={styles.staffInput}
            />
          </View>

          <Text style={styles.staffFilterLabel}>LỌC THEO VỊ TRÍ</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPositionPickerVisible(true)}
            style={({ pressed }) => [styles.staffSelectFrame, pressed && styles.pressed]}
          >
            <Ionicons name="filter-outline" size={18} color="#8f706b" />
            <Text style={styles.staffSelectText}>{selectedPosition}</Text>
            <Ionicons name="chevron-down" size={18} color="#6b7280" />
          </Pressable>
        </View>

        {failed ? (
          <Text style={styles.staffStateText}>Không thể tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.</Text>
        ) : null}
        {loading ? <Text style={styles.staffStateText}>Đang tải danh sách nhân viên...</Text> : null}

        <View style={styles.staffList}>
          {!loading && !failed && visibleRows.length === 0 ? (
            <View style={styles.staffEmptyState}>
              <Ionicons name="people-outline" size={48} color="#d4a09a" />
              <Text style={styles.staffEmptyTitle}>Không có nhân viên nào</Text>
              <Text style={styles.staffEmptyDescription}>
                {query || selectedPosition !== "Tất cả vị trí"
                  ? "Không tìm thấy nhân viên phù hợp với bộ lọc hiện tại."
                  : "Hiện tại chưa có nhân viên trong phạm vi quản lý của bạn."}
              </Text>
            </View>
          ) : (
            visibleRows.map((staff) => (
              <StaffMemberCard key={staff.id} staff={staff} />
            ))
          )}
        </View>
      </ScrollView>

      <PositionPickerModal
        options={positions}
        value={selectedPosition}
        visible={positionPickerVisible}
        onClose={() => setPositionPickerVisible(false)}
        onSelect={(value) => {
          setSelectedPosition(value);
          setPositionPickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

function StaffMemberCard({
  staff
}: {
  staff: {
    id: string;
    name: string;
    role: string;
    phone: string;
    zalo: string;
  };
}) {
  const callStaff = () => {
    if (staff.phone) {
      Linking.openURL(`tel:${staff.phone}`);
    }
  };

  const openZalo = () => {
    if (staff.zalo) {
      Linking.openURL(`https://zalo.me/${staff.zalo.replace(/\D/g, "")}`);
    }
  };

  return (
    <View style={styles.staffCard}>
      <Text style={styles.staffName}>{staff.name}</Text>
      <Text style={styles.staffRole}>{staff.role}</Text>
      <View style={styles.staffActions}>
        <Pressable accessibilityRole="button" onPress={callStaff} style={({ pressed }) => [styles.staffCallButton, pressed && styles.pressed]}>
          <Ionicons name="call-outline" size={14} color="#6a0100" />
          <Text style={styles.staffCallText}>Gọi biên</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={openZalo} style={({ pressed }) => [styles.staffZaloButton, pressed && styles.pressed]}>
          <Ionicons name="chatbox-outline" size={15} color="#ffffff" />
          <Text style={styles.staffZaloText}>Zalo</Text>
        </Pressable>
      </View>
    </View>
  );
}

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

function formatWatchTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function attachmentTitle(attachment: LearningLessonAttachment) {
  return attachment.title || attachment.name || attachment.file_name || attachment.fileName || "Tài liệu bài học";
}

function attachmentSize(attachment: LearningLessonAttachment) {
  return attachment.size || attachment.file_size || attachment.fileSize || "Tài liệu đính kèm";
}

function attachmentType(attachment: LearningLessonAttachment): "pdf" | "doc" {
  const value = `${attachmentTitle(attachment)} ${attachment.mime_type || attachment.mimeType || attachment.type || ""}`;
  return value.toLowerCase().includes("pdf") ? "pdf" : "doc";
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

function PositionPickerModal({
  onClose,
  onSelect,
  options,
  value,
  visible
}: {
  onClose: () => void;
  onSelect: (value: string) => void;
  options: string[];
  value: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.transferRejectOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.departmentPickerModal}>
          <View style={styles.departmentPickerHeader}>
            <View style={styles.flex}>
              <Text style={styles.departmentPickerTitle}>Lọc theo vị trí công việc</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.departmentPickerList}>
            {options.map((option) => {
              const active = option === value;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => onSelect(option)}
                  style={({ pressed }) => [
                    styles.departmentPickerOption,
                    active && styles.departmentPickerOptionActive,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.departmentPickerOptionText, active && styles.departmentPickerOptionTextActive]}>
                    {option}
                  </Text>
                  {active ? <Ionicons name="checkmark-circle" size={20} color="#950100" /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

