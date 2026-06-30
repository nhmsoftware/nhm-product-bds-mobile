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
import { learningImages } from "./utils/constants";
import { vi } from "./utils/i18n";
import type { ApiObject } from "./utils/apiNormalizers";
type LearningCourseRow = [string, string, number, ImageSourcePropType, boolean, string];
type LearningPathRow = [string, string, number, keyof typeof Ionicons.glyphMap, "active" | "default" | "locked"];

function useCopy() {
  const { language } = useI18n();
  return language === "en" ? en : vi;
}

export function LearningHomeScreen() {
  const { data, loading } = useEmployeeApiData(() => employeeApi.courses(), []);
  const [selectedLearningTab, setSelectedLearningTab] = useState<"inProgress" | "completed">("inProgress");
  const learningTabInitialized = useRef(false);
  const payload: ApiObject = isApiObject(data) ? data : {};
  const apiCourses = apiList(payload.courses);
  const fallbackCourse = isApiObject(payload.course) ? payload.course : null;
  const courseRecords = apiCourses.length > 0 ? apiCourses : fallbackCourse ? [fallbackCourse] : [];
  const totalCourses = courseRecords.length;
  const completedCourses = courseRecords.filter((course) => {
    const progress = isApiObject(course.progress) ? course.progress : {};
    return apiText(progress.status, "").toLowerCase() === "completed" || apiNumber(progress.percent, 0) >= 100;
  }).length;
  const courseProgressPercent = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
  const dynamicLearningPathRows: LearningPathRow[] = [
    [
      "Chuyên viên Bán hàng",
      `Hoàn thành ${completedCourses}/${totalCourses} khóa học cốt lõi.`,
      courseProgressPercent,
      "ribbon-outline",
      completedCourses >= totalCourses ? "default" : "active"
    ],
    [
      "Cố vấn Đầu tư Hạng sang",
      `Hoàn thành ${completedCourses}/${totalCourses} khóa học phát triển.`,
      courseProgressPercent,
      "star",
      completedCourses >= totalCourses ? "active" : "default"
    ],
    ["Giám đốc Khu vực", "Yêu cầu hoàn thành cấp độ Cố vấn Đầu tư.", 0, "lock-closed-outline", "locked"]
  ];
  const courses: LearningCourseRow[] = courseRecords.map((course) => {
    const progress = isApiObject(course.progress) ? course.progress : {};

    return [
      apiText(course.title, "Khóa học bắt buộc"),
      apiText(course.description, "Hoàn thành lộ trình học bắt buộc."),
      apiNumber(progress.percent, 0),
      mediaUrl(course.thumbnailUrl ?? course.thumbnail_url ?? course.thumbnail)
        ? { uri: mediaUrl(course.thumbnailUrl ?? course.thumbnail_url ?? course.thumbnail) }
        : learningImages.requiredHero,
      apiBoolean(course.isMandatory ?? course.is_mandatory, false),
      apiText(course.id, "")
    ];
  });
  const visibleCourses = courses.filter(([, , itemProgress]) => {
    const completed = itemProgress >= 100;
    return selectedLearningTab === "completed" ? completed : !completed;
  });

  useEffect(() => {
    if (loading || learningTabInitialized.current) {
      return;
    }

    learningTabInitialized.current = true;
    if (courses.length > 0 && courses.every(([, , itemProgress]) => itemProgress >= 100)) {
      setSelectedLearningTab("completed");
    }
  }, [courses, loading]);

  return (
    <EmployeePage
      title="Học viện Đào tạo"
      subtitle="Nâng tầm kỹ năng, chinh phục đỉnh cao bất động sản hạng sang."
      edges={["top", "left", "right"]}
      contentStyle={styles.learningContent}
    >
      <View style={styles.learningSection}>
        <View style={styles.learningSectionHeader}>
          <Text style={styles.learningSectionTitle}>Lộ trình phát triển</Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/employee/certificates",
                params: { from: "profile" }
              })
            }
            style={styles.learningDetailLink}
          >
            <Text style={styles.learningDetailText}>Xem chi tiết</Text>
            <Ionicons name="arrow-forward" size={12} color={employeePalette.goldDark} />
          </Pressable>
        </View>
        <View style={styles.learningPathList}>
          {dynamicLearningPathRows.map(([title, description, progress, icon, state]) => (
            <LearningPathCard
              key={title}
              description={description}
              icon={icon}
              progress={progress}
              state={state}
              title={title}
            />
          ))}
        </View>
      </View>

      <View style={styles.learningTabs}>
        <Pressable accessibilityRole="button" onPress={() => setSelectedLearningTab("inProgress")}>
          <Text style={selectedLearningTab === "inProgress" ? styles.learningTabActive : styles.learningTab}>Đang học</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setSelectedLearningTab("completed")}>
          <Text style={selectedLearningTab === "completed" ? styles.learningTabActive : styles.learningTab}>Hoàn thành</Text>
        </Pressable>
      </View>

      <View style={styles.learningCourseList}>
        {visibleCourses.length > 0 ? visibleCourses.map(([title, description, progress, image, required, courseId]) => (
          <LearningCourseCard
            key={title}
            description={description}
            courseId={courseId}
            image={image}
            progress={progress}
            required={required}
            title={title}
          />
        )) : (
          <Text style={styles.learningEmptyText}>
            {selectedLearningTab === "completed" ? "Chưa có khóa học hoàn thành." : "Hiện tại chưa có khóa học."}
          </Text>
        )}
      </View>
    </EmployeePage>
  );
}

function LearningPathCard({
  title,
  description,
  progress,
  icon,
  state
}: {
  title: string;
  description: string;
  progress: number;
  icon: keyof typeof Ionicons.glyphMap;
  state: "active" | "default" | "locked";
}) {
  const active = state === "active";
  const locked = state === "locked";
  return (
    <View style={[styles.learningPathCard, active && styles.learningPathCardActive, locked && styles.learningPathCardLocked]}>
      {!locked ? (
        <View
          pointerEvents="none"
          style={[styles.learningPathGlow, active ? styles.learningPathGlowActive : styles.learningPathGlowDefault]}
        />
      ) : null}
      <View style={[styles.learningPathIcon, active && styles.learningPathIconActive]}>
        <Ionicons
          name={icon}
          size={17}
          color={active ? employeePalette.goldDark : locked ? "#9aa0a6" : employeePalette.muted}
        />
      </View>
      <View style={styles.flex}>
        <Text style={styles.learningPathTitle}>{title}</Text>
        <Text style={styles.learningPathDescription}>{description}</Text>
        {progress > 0 ? (
          <View style={styles.learningProgressTrack}>
            <View
              style={[
                styles.learningProgressFill,
                active && styles.learningProgressFillActive,
                { width: `${progress}%` }
              ]}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function LearningCourseCard({
  title,
  courseId,
  description,
  progress,
  image,
  required
}: {
  title: string;
  courseId: string;
  description: string;
  progress: number;
  image: ImageSourcePropType;
  required: boolean;
}) {
  const openCourse = () => {
    if (!courseId) {
      notifyError("Khóa học chưa có dữ liệu lộ trình để mở.");
      return;
    }

    router.push({
      pathname: "/employee/required-learning",
      params: { courseId }
    });
  };

  return (
    <Pressable onPress={openCourse} style={({ pressed }) => [styles.learningCourseCard, pressed && styles.pressed]}>
      <View style={styles.learningCourseImageWrap}>
        <Image source={image} style={styles.learningCourseImage} />
        {required ? (
          <View style={styles.learningRequiredPill}>
            <Text style={styles.learningRequiredText}>BẮT BUỘC</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.learningCourseBody}>
        <Text style={styles.learningCourseTitle}>{title}</Text>
        <Text style={styles.learningCourseDescription}>{description}</Text>
        <View style={styles.learningCourseProgressHeader}>
          <Text style={styles.learningProgressLabel}>TIẾN ĐỘ</Text>
          <Text style={styles.learningProgressPercent}>{progress}%</Text>
        </View>
        <View style={styles.learningProgressTrack}>
          <View style={[styles.learningProgressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </Pressable>
  );
}



// ---- Local helpers extracted from original monolith ----

const en: typeof vi = {
  tabs: {
    learningTitle: "Learning & Development",
    learningSubtitle: "Complete required lessons, quizzes, and certificates.",
    newsTitle: "Internal News",
    newsSubtitle: "Team updates, announcements, and discussion.",
    profileTitle: "Profile",
    profileSubtitle: "Manage personal info, points, and internal requests.",
    managerTitle: "Manager Profile",
    managerSubtitle: "Track team members, approvals, and department performance.",
    requiredTitle: "Required Learning Path",
    requiredSubtitle: "Courses to finish before receiving new inventory."
  },
  meetClient: {
    title: "Client meeting",
    headerTitle: "Client Meeting Check-in",
    customerInfo: "Customer information",
    customer: "Enter customer name",
    phone: "09xx xxx xxx",
    project: "Choose project...",
    projects: ["Vinhomes Grand Park", "Masteri Centre Point", "The Beverly"],
    photoTitle: "Real photo",
    photoCta: "Take real photo",
    photoHelper: "Photo must include the customer at project site",
    recent: "Recent activity",
    seeAll: "See all"
  },
  showing: {
    title: "Property tour",
    headerTitle: "Property Tour Check-in",
    project: "The Grand Hanoi, Tran Duy Hung",
    unit: "A10, Tower S2.01",
    customer: "Nguyen Van A",
    tripInfo: "Tour information",
    proof: "Take project photo",
    helper: "Photo should show location or customer clearly",
    action: "Start property tour",
    history: "Tour history"
  },
  pointHistory: {
    title: "Point history",
    subtitle: "Track points from activity and learning.",
    total: "8,450",
    rank: "Gold Tier",
    month: "This month",
    activity: "Recent activity"
  },
  personalInfo: {
    title: "Personal info",
    subtitle: "Employee profile and contact settings.",
    department: "Project sales",
    code: "KNL-2024-001",
    role: "Senior consultant",
    save: "Update profile"
  },
  qr: {
    title: "Referral QR",
    subtitle: "Use this code to refer new clients to the system.",
    recruitmentSubtitle: "Use this code to refer candidates to the system.",
    customerSubtitle: "Use this code to refer new clients to the system.",
    employee: "HIRING CODE",
    customer: "CLIENT REFERRAL",
    share: "Share code"
  },
  requests: {
    leaveTitle: "Leave requests",
    transferTitle: "Transfer requests",
    staffTitle: "Department staff",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    approve: "Approve",
    reject: "Reject"
  },
  learning: {
    detailTitle: "Lesson detail",
    quizTitle: "Quiz",
    resultTitle: "Learning result",
    certTitle: "My Certificates",
    start: "Start lesson",
    submit: "Submit",
    retake: "Retake",
    score: "Score"
  },
  inventory: {
    listTitle: "Inventory",
    mapTitle: "Inventory Map",
    detailTitle: "Lot Detail",
    available: "Available",
    reserved: "Reserved",
    sold: "Sold",
    consult: "Consult client",
    hold: "Reserve"
  },
  notifications: {
    title: "Notifications",
    subtitle: "System and manager updates.",
    comments: "Comments & Discussion",
    send: "Send"
  }
};

