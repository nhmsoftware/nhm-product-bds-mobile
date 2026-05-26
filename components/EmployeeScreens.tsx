import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, type ComponentProps } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Path, Svg } from "react-native-svg";

import {
  EmployeeBadge,
  EmployeeButton,
  EmployeeCard,
  EmployeeInputPreview,
  EmployeeListRow,
  EmployeeMetric,
  EmployeePage,
  EmployeeSectionTitle
} from "@/components/EmployeeUI";
import { employeePalette } from "@/libs/employee-theme";
import { useI18n } from "@/libs/i18n";
import { appFonts } from "@/libs/typography";
import { isManagerAccessRole } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";
import { employeeLessons, employeeNewsPosts } from "@/services/employee/mock-data";
import type { MandatoryLearningCourse, MandatoryLearningLesson } from "@/services/employee/types";

const learningImages = {
  legal: require("@/assets/images/learning/project-legal.png"),
  market: require("@/assets/images/learning/market-analysis.png"),
  negotiation: require("@/assets/images/learning/negotiation.png"),
  requiredHero: require("@/assets/images/learning/required-course-hero.png"),
  lessonVideo: require("@/assets/images/learning/lesson-video-thumbnail.png"),
  planningQuizMap: require("@/assets/images/learning/planning-quiz-map.png"),
  resultQuestion1: require("@/assets/images/learning/result-question-1.png"),
  resultQuestion2: require("@/assets/images/learning/result-question-2.png")
};

const inventoryImages = {
  mapOverview: require("@/assets/images/inventory/inventory-map-overview.png"),
  lotHero: require("@/assets/images/inventory/lot-hero-overlay.png"),
  planningArea: require("@/assets/images/inventory/planning-area-map.png"),
  staffProfile: require("@/assets/images/inventory/staff-profile.png"),
  zoneA: require("@/assets/images/inventory/zone-a-map.png"),
  zoneB: require("@/assets/images/inventory/zone-b-map.png")
};

const internalNewsImages = {
  agentAvatar: require("@/assets/images/news/agent-avatar.png"),
  currentUser: require("@/assets/images/news/current-user.png"),
  luxuryPenthouse: require("@/assets/images/news/luxury-penthouse-view.png"),
  managementAvatar: require("@/assets/images/news/management-avatar.png"),
  staffProfileAvatar: require("@/assets/images/news/staff-profile-avatar.png")
};

const profileImages = {
  headshot: require("@/assets/images/profile/employee-headshot.png"),
  certificateGold: require("@/assets/images/profile/certificate-bg-gold.png"),
  verifiedBadge: require("@/assets/images/profile/verified-badge.png")
};

const showingImages = {
  gps: require("@/assets/images/showing/gps-icon.png"),
  chevronDown: require("@/assets/images/showing/chevron-down-icon.png"),
  camera: require("@/assets/images/showing/camera-icon.png"),
  play: require("@/assets/images/showing/play-icon.png"),
  timelineCheck: require("@/assets/images/showing/timeline-check-icon.png"),
  timelineHistory: require("@/assets/images/showing/timeline-history-icon.png")
};

const meetClientImages = {
  person: require("@/assets/images/meet-client/person-icon.png"),
  phone: require("@/assets/images/meet-client/phone-icon.png"),
  project: require("@/assets/images/meet-client/project-icon.png"),
  dropdown: require("@/assets/images/meet-client/dropdown-icon.png"),
  cameraEmpty: require("@/assets/images/meet-client/camera-empty-icon.png"),
  cameraButton: require("@/assets/images/meet-client/camera-button-icon.png"),
  historyForward: require("@/assets/images/meet-client/history-forward-icon.png"),
  time: require("@/assets/images/meet-client/time-icon.png"),
  location: require("@/assets/images/meet-client/location-icon.png"),
  recentClientA: require("@/assets/images/meet-client/recent-client-a.png"),
  recentClientB: require("@/assets/images/meet-client/recent-client-b.png")
};

function back() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace("/(app)/employee");
}

function home() {
  router.replace("/(app)/employee");
}

function backToCheckIn() {
  router.replace("/(app)/employee/check-in");
}

function backToRequiredLearning() {
  router.replace("/(app)/employee/required-learning");
}

const vi = {
  tabs: {
    learningTitle: "Học tập & Phát triển",
    learningSubtitle: "Hoàn thành bài học, bài thi và chứng chỉ cần thiết.",
    newsTitle: "Bảng tin nội bộ",
    newsSubtitle: "Tin tức, thông báo và thảo luận trong đội ngũ.",
    profileTitle: "Hồ sơ",
    profileSubtitle: "Quản lý thông tin cá nhân, điểm và yêu cầu nội bộ.",
    managerTitle: "Hồ sơ trưởng phòng",
    managerSubtitle: "Theo dõi đội nhóm, phê duyệt yêu cầu và hiệu suất phòng ban.",
    requiredTitle: "Lộ trình học bắt buộc",
    requiredSubtitle: "Các khóa cần hoàn thành trước khi nhận giỏ hàng mới."
  },
  meetClient: {
    title: "Gặp khách",
    headerTitle: "Check-in Gặp Khách",
    customerInfo: "Thông tin khách hàng",
    customer: "Nhập tên khách hàng",
    phone: "09xx xxx xxx",
    project: "Chọn dự án...",
    projects: ["Vinhomes Grand Park", "Masteri Centre Point", "The Beverly"],
    photoTitle: "Hình ảnh thực tế",
    photoCta: "Chụp ảnh thực tế",
    photoHelper: "Yêu cầu ảnh chụp cùng khách tại dự án",
    recent: "Hoạt động gần đây",
    seeAll: "Xem tất cả"
  },
  showing: {
    title: "Dẫn khách",
    headerTitle: "Check-in Dẫn Khách",
    project: "The Grand Hanoi, Trần Duy Hưng",
    unit: "A10, Tòa S2.01",
    customer: "Nguyễn Văn A",
    tripInfo: "Thông tin lượt dẫn",
    proof: "Chụp ảnh tại dự án",
    helper: "Hình ảnh cần hiển thị rõ vị trí hoặc khách hàng",
    action: "Bắt đầu Dẫn khách",
    history: "Lịch sử dẫn khách"
  },
  pointHistory: {
    title: "Lịch sử điểm",
    subtitle: "Theo dõi điểm tích lũy từ hoạt động và học tập.",
    total: "8,450",
    rank: "Hạng Vàng",
    month: "Tháng này",
    activity: "Hoạt động gần đây"
  },
  personalInfo: {
    title: "Thông tin cá nhân",
    subtitle: "Thông tin hồ sơ nhân viên và cấu hình liên hệ.",
    department: "Kinh doanh dự án",
    code: "KNL-2024-001",
    role: "Chuyên viên tư vấn cấp cao",
    save: "Cập nhật hồ sơ"
  },
  qr: {
    title: "Mã QR Giới thiệu",
    subtitle: "Sử dụng mã này để giới thiệu khách hàng tham gia hệ thống.",
    employee: "MÃ TUYỂN DỤNG",
    customer: "MÃ GT KHÁCH HÀNG",
    share: "Chia sẻ mã"
  },
  requests: {
    leaveTitle: "Danh sách Xin nghỉ phép",
    transferTitle: "Danh sách xin chuyển phòng",
    staffTitle: "Danh sách nhân viên phòng ban",
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    approve: "Duyệt",
    reject: "Từ chối"
  },
  learning: {
    detailTitle: "Chi tiết Bài học",
    quizTitle: "Làm bài thi",
    resultTitle: "Kết quả học tập",
    certTitle: "Chứng Chỉ Của Tôi",
    start: "Bắt đầu học",
    submit: "Nộp bài",
    retake: "Làm lại",
    score: "Điểm số"
  },
  inventory: {
    listTitle: "Danh sách kho hàng",
    mapTitle: "Sơ đồ Bảng Hàng",
    detailTitle: "Chi tiết Lô Đất",
    available: "Còn hàng",
    reserved: "Đang giữ chỗ",
    sold: "Đã bán",
    consult: "Tư vấn khách",
    hold: "Giữ chỗ"
  },
  notifications: {
    title: "Thông báo",
    subtitle: "Cập nhật mới từ hệ thống và quản lý.",
    comments: "Bình luận & Thảo luận",
    send: "Gửi"
  }
};

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

const requestRows = [
  ["Nguyễn Văn A", "Nghỉ phép 2 ngày - xử lý việc gia đình", "pending"],
  ["Lê Thị B", "Nghỉ nửa ngày - khám sức khỏe", "approved"],
  ["Phạm Văn C", "Nghỉ phép năm", "rejected"]
] as const;

const transferRows = [
  ["Trần Minh Huy", "Chuyển sang phòng Kinh doanh cao tầng", "pending"],
  ["Ngô Hà Linh", "Chuyển sang phòng Dự án thấp tầng", "approved"],
  ["Đỗ Thanh An", "Đổi nhóm phụ trách khu Đông", "pending"]
] as const;

const showingHistoryRows = [
  ["Hôm nay, 09:30 AM", "Lô A10, Tòa S2", "Khách: Nguyễn Văn A", "check"],
  ["Hôm qua, 14:15 PM", "Biệt thự V1-05", "Khách: Lê Thị B", "history"]
] as const;

const learningPathRows = [
  ["Chuyên viên Bán hàng", "Hoàn thành 3/5 khóa học cốt lõi.", 60, "ribbon-outline", "default"],
  ["Cố vấn Đầu tư Hạng sang", "Mục tiêu tiếp theo. Cần hoàn thành khóa Phân tích vi mô.", 15, "star", "active"],
  ["Giám đốc Khu vực", "Yêu cầu hoàn thành cấp độ Cố vấn Đầu tư.", 0, "lock-closed-outline", "locked"]
] as const;

const learningCourseRows = [
  [
    "Nghệ thuật Đàm phán Giá trị Cao",
    "Kỹ năng cốt lõi để chốt giao dịch các bất động sản siêu sang, xử lý từ chối và thiết lập...",
    75,
    learningImages.negotiation,
    true
  ],
  [
    "Phân tích Thị trường BĐS Nghỉ dưỡng",
    "Đọc hiểu báo cáo vĩ mô, nhận diện xu hướng dòng tiền và tâm lý nhà đầu tư phân khúc nghỉ...",
    30,
    learningImages.market,
    false
  ],
  [
    "Pháp lý Dự án & Quản trị Rủi ro",
    "Nắm vững hồ sơ pháp lý, các loại hợp đồng và quy trình giải quyết khiếu nại cho khách hàng...",
    5,
    learningImages.legal,
    false
  ]
] as const;

function useCopy() {
  const { language } = useI18n();
  return language === "en" ? en : vi;
}

export function LearningHomeScreen() {
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
          <Pressable onPress={() => router.push("/(app)/employee/required-learning")} style={styles.learningDetailLink}>
            <Text style={styles.learningDetailText}>Xem chi tiết</Text>
            <Ionicons name="arrow-forward" size={12} color={employeePalette.goldDark} />
          </Pressable>
        </View>
        <View style={styles.learningPathList}>
          {learningPathRows.map(([title, description, progress, icon, state]) => (
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
        <Text style={styles.learningTabActive}>Đang học</Text>
        <Text style={styles.learningTab}>Hoàn thành</Text>
      </View>

      <View style={styles.learningCourseList}>
        {learningCourseRows.map(([title, description, progress, image, required]) => (
          <LearningCourseCard
            key={title}
            description={description}
            image={image}
            progress={progress}
            required={required}
            title={title}
          />
        ))}
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
  description,
  progress,
  image,
  required
}: {
  title: string;
  description: string;
  progress: number;
  image: number;
  required: boolean;
}) {
  return (
    <Pressable onPress={() => router.push("/(app)/employee/lesson-detail")} style={({ pressed }) => [styles.learningCourseCard, pressed && styles.pressed]}>
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

export function RequiredLearningScreen({ course }: { course?: MandatoryLearningCourse | null }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  if (!course) {
    return (
      <EmployeePage headerTitle="Khóa học Bắt buộc" back={back} contentStyle={styles.requiredLearningContent}>
        <Text style={styles.requiredIntro}>Chưa có dữ liệu khóa học bắt buộc.</Text>
      </EmployeePage>
    );
  }

  const heroImage =
    course.thumbnailUrl && !thumbnailFailed
      ? { uri: course.thumbnailUrl }
      : learningImages.requiredHero;

  return (
    <EmployeePage headerTitle="Khóa học Bắt buộc" back={back} contentStyle={styles.requiredLearningContent}>
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
        onPress={() => router.push("/(app)/employee/lesson-detail")}
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

export function NewsFeedScreen() {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.newsFeedSafe}>
      <View style={styles.newsFeedHeader}>
        <View style={styles.newsFeedAvatarSmall}>
          <Image source={internalNewsImages.staffProfileAvatar} style={styles.newsFeedAvatarImage} />
        </View>
        <Ionicons name="notifications" size={22} color="#000000" />
      </View>

      <ScrollView contentContainerStyle={styles.newsFeedScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.newsFeedPageHeader}>
          <Text style={styles.newsFeedTitle}>Bảng Tin Nội Bộ</Text>
          <Text style={styles.newsFeedSubtitle}>Cập nhật tin tức và dự án mới nhất.</Text>
        </View>

        <View style={styles.newsCreateCard}>
          <View style={styles.newsCreateBody}>
            <View style={styles.newsCreateAvatar}>
              <Image source={internalNewsImages.currentUser} style={styles.newsFeedAvatarImage} />
            </View>
            <Text style={styles.newsCreatePlaceholder}>Chia sẻ thông tin dự án mới{"\n"}hoặc thành tích...</Text>
          </View>
          <View style={styles.newsCreateFooter}>
            <View style={styles.newsCreateTools}>
              <Ionicons name="image-outline" size={20} color={employeePalette.red} />
              <Ionicons name="attach-outline" size={22} color={employeePalette.red} />
            </View>
            <Pressable accessibilityRole="button" style={styles.newsCreateButton}>
              <Text style={styles.newsCreateButtonText}>Tạo bài viết</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.newsFeedList}>
          <View style={[styles.newsPostCard, styles.newsPostHighlighted]}>
            <View style={styles.newsPostHeader}>
              <View style={styles.newsPostAuthorRow}>
                <View style={styles.newsPostAvatarGold}>
                  <Image source={internalNewsImages.managementAvatar} style={styles.newsFeedAvatarImage} />
                </View>
                <View>
                  <Text style={styles.newsPostAuthor}>Ban Giám Đốc</Text>
                  <Text style={styles.newsPostMeta}>2 giờ trước • Thông báo chung</Text>
                </View>
              </View>
              <View style={styles.newsStarPill}>
                <Ionicons name="star" size={13} color={employeePalette.goldDark} />
              </View>
            </View>
            <Text style={styles.newsPostTitle}>Chính sách thưởng nóng Quý 4 -{"\n"}Dự án The Royal Peninsula</Text>
            <Text style={styles.newsPostBody}>
              Kính gửi toàn thể chuyên viên tư vấn. Ban giám đốc chính thức ban hành chính sách thưởng nóng lên đến 50 triệu đồng cho mỗi giao dịch thành công tại phân khu Biệt thự ven sông. Áp dụng từ ngày hôm nay đến hết tháng 12... <Text style={styles.newsReadMore}>Xem thêm</Text>
            </Text>
            <NewsPostActions likes="124" comments="18 Bình luận" />
            <View style={styles.newsGoldAccent} />
          </View>

          <View style={styles.newsPostCard}>
            <View style={styles.newsPostHeader}>
              <View style={styles.newsPostAuthorRow}>
                <View style={styles.newsPostAvatar}>
                  <Image source={internalNewsImages.agentAvatar} style={styles.newsFeedAvatarImage} />
                </View>
                <View>
                  <Text style={styles.newsPostAuthor}>Trần Minh Quân</Text>
                  <Text style={styles.newsPostMeta}>4 giờ trước • Nhóm Kinh Doanh B</Text>
                </View>
              </View>
              <Ionicons name="ellipsis-horizontal" size={20} color={employeePalette.muted} />
            </View>
            <Text style={styles.newsStandardBody}>
              Vừa hoàn tất thủ tục bàn giao căn Penthouse tháp A cho khách hàng VIP. Tầm nhìn panorama toàn cảnh thành phố tuyệt đẹp. Khách hàng cực kỳ hài lòng với tiến độ và chất lượng hoàn thiện của dự án! 🥂✨
            </Text>
            <Image source={internalNewsImages.luxuryPenthouse} style={styles.newsPostImage} />
            <NewsPostActions likes="89" comments="5 Bình luận" share />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NewsPostActions({ comments, likes, share }: { comments: string; likes: string; share?: boolean }) {
  return (
    <View style={styles.newsPostActions}>
      <View style={styles.newsPostAction}>
        <Ionicons name="thumbs-up-outline" size={20} color={employeePalette.muted} />
        <Text style={styles.newsPostActionText}>{likes}</Text>
      </View>
      <Pressable onPress={() => router.push("/(app)/employee/comments")} style={styles.newsPostAction}>
        <Ionicons name="chatbox-outline" size={20} color={employeePalette.muted} />
        <Text style={styles.newsPostActionText}>{comments}</Text>
      </Pressable>
      {share ? (
        <View style={styles.newsPostActionShare}>
          <Ionicons name="share-social-outline" size={20} color={employeePalette.muted} />
        </View>
      ) : null}
    </View>
  );
}

export function ProfileOverviewScreen() {
  const qrCopy = useCopy().qr;
  const { session, signOut } = useAuth();
  const user = session?.user;
  const isManager = isManagerAccessRole(user?.role);
  const fullName = user?.fullName || "Nguyen Van Huy";
  const jobTitle = user?.jobPosition || (isManager ? "Trưởng phòng" : "Tư vấn viên Cao cấp");

  return (
    <EmployeePage edges={["top", "left", "right"]} contentStyle={styles.profileFigmaContent}>
      <View style={styles.profileHeroCard}>
        <View style={styles.profileHeroDecoration} />
        <Image source={profileImages.headshot} style={styles.profileHeroAvatar} />
        <Image source={profileImages.verifiedBadge} style={styles.profileVerifyBadgeImage} />
        <Text style={styles.profileHeroName}>{fullName}</Text>
        <Text style={styles.profileHeroRole}>{jobTitle}</Text>
        <View style={styles.profileRankPill}>
          <ProfileRankIcon />
          <Text style={styles.profileRankPillText}>HẠNG VÀNG</Text>
        </View>
      </View>

      <Text style={styles.profileSectionTitle}>Xếp hạng</Text>
      <ProfileRankingCard tone="green" label="Nội bộ phòng ban" rank="#3" suffix="/ 45 nhân viên" icon="trophy" progress={0.84} />
      <ProfileRankingCard tone="red" label="Xếp hạng phòng ban" rank="#1" suffix="/ 20 phòng ban" icon="trophy" progress={0.84} />

      <View style={styles.profileSectionHeader}>
        <Text style={styles.profileSectionTitle}>Chứng chỉ đã đạt</Text>
        <Text style={styles.profileSeeAll}>Xem tất cả</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileCertList}>
        <ProfileCertificateCard title="Chuyên gia BĐS Hạng sang" date="T10/2023" />
        <ProfileCertificateCard title="Đàm phán BĐS Cao cấp" date="T7/2023" compact />
      </ScrollView>

      <Text style={styles.profileSectionTitle}>Điểm thi trắc nghiệm</Text>
      <View style={styles.profileScoreList}>
        <ProfileScoreRow title="Khung pháp lý 2024" badge="XUẤT SẮC" date="12 thg 11" score="95" tone="red" />
        <ProfileScoreRow title="Phân tích Thị trường Q4" badge="ĐẠT" date="28 thg 10" score="82" tone="gold" />
      </View>

      {isManager ? <ProfileManagerActions /> : <ProfileEmployeeActions />}

      <Text style={styles.profileSectionTitle}>{qrCopy.title}</Text>
      <View style={styles.profileQrSegment}>
        <View style={styles.profileQrSegmentActive}>
          <Text style={styles.profileQrSegmentActiveText}>{qrCopy.employee}</Text>
        </View>
        <View style={styles.profileQrSegmentInactive}>
          <Text style={styles.profileQrSegmentInactiveText}>{qrCopy.customer}</Text>
        </View>
      </View>
      <ReferralQrPanel copy={qrCopy} />
      <EmployeeButton title="Đăng xuất" tone="light" icon="log-out-outline" onPress={signOut} style={styles.logoutButton} />
    </EmployeePage>
  );
}

function ProfileEmployeeActions() {
  return (
    <View style={styles.profileActionCard}>
      <Pressable
        onPress={() => router.push("/(app)/employee/leave-requests")}
        style={({ pressed }) => [styles.profileLeaveButton, pressed && styles.pressed]}
      >
        <Text style={styles.profileLeaveButtonText}>Xin phép nghỉ</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/(app)/employee/transfer-requests")}
        style={({ pressed }) => [styles.profileTransferButton, pressed && styles.pressed]}
      >
        <Ionicons name="send" size={17} color="#ffffff" />
        <Text style={styles.profileTransferButtonText}>Xin phép chuyển phòng</Text>
      </Pressable>
    </View>
  );
}

function ProfileManagerActions() {
  return (
    <View style={styles.profileActionCard}>
      <Pressable
        onPress={() => router.push("/(app)/employee/leave-requests")}
        style={({ pressed }) => [styles.profileLeaveButton, pressed && styles.pressed]}
      >
        <Text style={styles.profileLeaveButtonText}>Duyệt đơn xin phép</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/(app)/employee/transfer-requests")}
        style={({ pressed }) => [styles.profileTransferButton, pressed && styles.pressed]}
      >
        <Ionicons name="send" size={17} color="#ffffff" />
        <Text style={styles.profileTransferButtonText}>Duyệt đơn xin chuyển phòng</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/(app)/employee/department-staff")}
        style={({ pressed }) => [styles.profileReceiveTransferButton, pressed && styles.pressed]}
      >
        <Ionicons name="send" size={17} color="#ffffff" />
        <Text style={styles.profileTransferButtonText}>Nhận nhân viên chuyển phòng</Text>
      </Pressable>
    </View>
  );
}

function ProfileRankingCard({
  tone,
  label,
  rank,
  suffix,
  icon,
  progress
}: {
  tone: "green" | "red";
  label: string;
  rank: string;
  suffix: string;
  icon: keyof typeof Ionicons.glyphMap;
  progress: number;
}) {
  const isGreen = tone === "green";
  const backgroundColor = isGreen ? "#1e9a46" : employeePalette.red;

  return (
    <View style={[styles.profileRankingCard, { backgroundColor }]}>
      <View style={styles.profileRankingGlow} />
      <View style={styles.flex}>
        <Text style={styles.profileRankingLabel}>{label}</Text>
        <View style={styles.profileRankingValueRow}>
          <Text style={styles.profileRankingValue}>{rank}</Text>
          <Text style={styles.profileRankingSuffix}>{suffix}</Text>
        </View>
        <View style={styles.profileRankingTrack}>
          <View style={[styles.profileRankingFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
      <View style={styles.profileRankingIcon}>
        <Ionicons name={icon} size={26} color="#ffdf9f" />
      </View>
    </View>
  );
}

function ProfileCertificateCard({ title, date, compact }: { title: string; date: string; compact?: boolean }) {
  return (
    <View style={[styles.profileCertificateCard, compact && styles.profileCertificateCardCompact]}>
      <Image source={profileImages.certificateGold} style={styles.profileCertificateBg} />
      <Ionicons name="ribbon" size={25} color="#eec05b" />
      <Text style={styles.profileCertificateTitle} numberOfLines={compact ? 2 : 1}>{title}</Text>
      <Text style={styles.profileCertificateDate}>{date}</Text>
    </View>
  );
}

function ProfileScoreRow({
  title,
  badge,
  date,
  score,
  tone
}: {
  title: string;
  badge: string;
  date: string;
  score: string;
  tone: "red" | "gold";
}) {
  const isRed = tone === "red";

  return (
    <View style={styles.profileScoreRow}>
      <View style={styles.flex}>
        <Text style={styles.profileScoreTitle}>{title}</Text>
        <View style={styles.profileScoreMeta}>
          <View style={[styles.profileScoreBadge, isRed ? styles.profileScoreBadgeRed : styles.profileScoreBadgeGold]}>
            <Text style={[styles.profileScoreBadgeText, isRed ? styles.profileScoreBadgeTextRed : styles.profileScoreBadgeTextGold]}>
              {badge}
            </Text>
          </View>
          <Text style={styles.profileScoreDate}>{date}</Text>
        </View>
      </View>
      <View style={styles.profileScoreDivider} />
      <View style={styles.profileScoreValueRow}>
        <Text style={[styles.profileScoreValue, isRed && styles.profileScoreValueRed]}>{score}</Text>
        <Text style={styles.profileScoreMax}>/100</Text>
      </View>
    </View>
  );
}

export function ManagerProfileScreen() {
  const c = useCopy().tabs;
  return (
    <EmployeePage title={c.managerTitle} subtitle={c.managerSubtitle} back={back}>
      <View style={styles.metricRow}>
        <EmployeeMetric value="24" label="Nhân viên" tone="red" />
        <EmployeeMetric value="92%" label="KPI phòng" tone="green" />
      </View>
      <EmployeeListRow icon="people-outline" title="Nhân viên phòng ban" description="Danh sách và hiệu suất đội nhóm" onPress={() => router.push("/(app)/employee/department-staff")} />
      <EmployeeListRow icon="calendar-outline" title="Duyệt nghỉ phép" description="3 yêu cầu đang chờ xử lý" onPress={() => router.push("/(app)/employee/leave-requests")} />
      <EmployeeListRow icon="swap-horizontal-outline" title="Duyệt chuyển phòng" description="2 yêu cầu cần xem xét" onPress={() => router.push("/(app)/employee/transfer-requests")} />
    </EmployeePage>
  );
}

export function MeetClientScreen() {
  const c = useCopy().meetClient;
  return (
    <EmployeePage headerTitle={c.headerTitle} back={backToCheckIn} backType="previous">
      <Text style={styles.meetSectionLabel}>{c.customerInfo}</Text>
      <MeetClientField label="TÊN KHÁCH HÀNG" value={c.customer} icon={meetClientImages.person} iconStyle={styles.meetPersonIcon} />
      <MeetClientField label="SỐ ĐIỆN THOẠI" value={c.phone} icon={meetClientImages.phone} iconStyle={styles.meetPhoneIcon} />
      <View style={styles.divider} />
      <Text style={styles.meetSectionLabel}>DỰ ÁN QUAN TÂM</Text>
      <MeetClientField
        value={c.project}
        icon={meetClientImages.project}
        iconStyle={styles.meetProjectIcon}
        rightIcon={meetClientImages.dropdown}
        rightIconStyle={styles.meetDropdownIcon}
      />
      <View style={styles.projectChips}>
        {c.projects.map((project, index) => (
          <View key={project} style={[styles.projectChip, index === 1 && styles.projectChipActive]}>
            <Text style={[styles.projectChipText, index === 1 && styles.projectChipTextActive]}>{project}</Text>
          </View>
        ))}
      </View>
      <View style={styles.divider} />
      <View style={styles.rowBetween}>
        <Text style={styles.meetSectionLabel}>{c.photoTitle}</Text>
        <EmployeeBadge label="BẮT BUỘC" />
      </View>
      <View style={styles.meetPhotoBox}>
        <View style={styles.roundCamera}>
          <Image source={meetClientImages.cameraEmpty} style={styles.meetCameraEmptyIcon} />
        </View>
        <Text style={styles.photoTapText}>Chạm để chụp ảnh</Text>
        <Text style={styles.photoHelper}>{c.photoHelper}</Text>
      </View>
      <MeetClientPhotoButton title={c.photoCta} />
      <View style={styles.divider} />
      <View style={styles.rowBetween}>
        <Text style={styles.meetSectionLabel}>{c.recent}</Text>
        <View style={styles.meetSeeAll}>
          <Text style={styles.meetSeeAllText}>{c.seeAll}</Text>
          <Image source={meetClientImages.historyForward} style={styles.meetForwardIcon} />
        </View>
      </View>
      <View style={styles.meetRecentList}>
        <MeetRecentCard
          avatar={meetClientImages.recentClientA}
          name="Nguyễn Văn A"
          time="Hôm nay, 10:30 AM"
          location="VP Sales Gallery - Vinhomes"
          status="Hoàn tất"
        />
        <MeetRecentCard
          avatar={meetClientImages.recentClientB}
          name="Trần Thị B"
          time="Hôm qua, 14:00 PM"
          location="Masteri Centre Point - Site"
        />
      </View>
    </EmployeePage>
  );
}

function MeetClientField({
  label,
  value,
  icon,
  iconStyle,
  rightIcon,
  rightIconStyle
}: {
  label?: string;
  value: string;
  icon: number;
  iconStyle: object;
  rightIcon?: number;
  rightIconStyle?: object;
}) {
  return (
    <View style={styles.meetField}>
      {label ? <Text style={styles.meetFieldLabel}>{label}</Text> : null}
      <View style={styles.meetFieldInput}>
        <Image source={icon} style={iconStyle} />
        <Text style={styles.meetFieldValue}>{value}</Text>
        {rightIcon ? <Image source={rightIcon} style={rightIconStyle} /> : null}
      </View>
    </View>
  );
}

function MeetClientPhotoButton({ title }: { title: string }) {
  return (
    <Pressable style={({ pressed }) => [styles.meetPhotoButton, pressed && styles.pressed]}>
      <Image source={meetClientImages.cameraButton} style={styles.meetCameraButtonIcon} />
      <Text style={styles.meetPhotoButtonText}>{title}</Text>
    </Pressable>
  );
}

function MeetRecentCard({
  avatar,
  name,
  time,
  location,
  status
}: {
  avatar: number;
  name: string;
  time: string;
  location: string;
  status?: string;
}) {
  return (
    <View style={styles.meetRecentCard}>
      <Image source={avatar} style={styles.meetRecentAvatar} />
      <View style={styles.meetRecentCopy}>
        <Text style={styles.meetRecentName}>{name}</Text>
        <View style={styles.meetRecentMetaRow}>
          <Image source={meetClientImages.time} style={styles.meetRecentTimeIcon} />
          <Text style={styles.meetRecentMetaText}>{time}</Text>
        </View>
        <View style={styles.meetRecentMetaRow}>
          <Image source={meetClientImages.location} style={styles.meetRecentLocationIcon} />
          <Text style={styles.meetRecentMetaText}>{location}</Text>
        </View>
      </View>
      {status ? (
        <View style={styles.meetRecentStatus}>
          <Text style={styles.meetRecentStatusText}>{status}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ShowingClientScreen() {
  const c = useCopy().showing;
  return (
    <EmployeePage headerTitle={c.headerTitle} back={backToCheckIn} backType="previous">
      <View style={styles.showingGpsCard}>
        <View style={styles.locationRow}>
          <Image source={showingImages.gps} style={styles.showingGpsIcon} />
          <Text style={styles.bodyText}>
            <Text style={styles.inlineStrong}>Vị trí: </Text>
            {c.project}
          </Text>
        </View>
      </View>
      <EmployeeSectionTitle title={c.tripInfo} />
      <View style={styles.showingForm}>
        <ShowingField label="DỰ ÁN" value="Chọn dự án..." dropdown />
        <ShowingField label="MÃ LÔ/CĂN HỘ" value="Vd: A10, Tòa S2.01" muted />
        <ShowingField label="TÊN KHÁCH HÀNG" value="Nhập tên khách hàng" muted />
      </View>
      <View style={styles.showingPhotoHeader}>
        <EmployeeSectionTitle title="Minh chứng Check-in" />
        <EmployeeBadge label="BẮT BUỘC" />
      </View>
      <View style={styles.photoProof}>
        <View style={styles.photoProofTexture} />
        <View style={styles.photoButton}>
          <Image source={showingImages.camera} style={styles.showingCameraIcon} />
          <Text style={styles.photoTitle}>{c.proof}</Text>
        </View>
        <Text style={styles.photoHelper}>{c.helper}</Text>
      </View>
      <ShowingPrimaryButton title={c.action} />
      <EmployeeSectionTitle title={c.history} />
      <ShowingHistoryTimeline />
    </EmployeePage>
  );
}

function ShowingField({
  label,
  value,
  dropdown,
  muted
}: {
  label: string;
  value: string;
  dropdown?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={styles.showingField}>
      <Text style={styles.showingFieldLabel}>{label}</Text>
      <View style={styles.showingFieldInput}>
        <Text style={[styles.showingFieldValue, muted && styles.showingFieldValueMuted]}>{value}</Text>
        {dropdown ? <Image source={showingImages.chevronDown} style={styles.showingChevronIcon} /> : null}
      </View>
    </View>
  );
}

function ShowingPrimaryButton({ title }: { title: string }) {
  return (
    <Pressable style={({ pressed }) => [styles.showingPrimaryButton, pressed && styles.pressed]}>
      <Image source={showingImages.play} style={styles.showingPlayIcon} />
      <Text style={styles.showingPrimaryButtonText}>{title}</Text>
    </Pressable>
  );
}

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

function ShowingHistoryTimeline() {
  return (
    <View style={styles.showingTimeline}>
      <View style={styles.showingTimelineLine} />
      {showingHistoryRows.map(([time, title, customer, icon], index) => (
        <View key={title} style={styles.showingTimelineItem}>
          <View style={[styles.showingTimelineIcon, index === 0 && styles.showingTimelineIconActive]}>
            <Image
              source={icon === "check" ? showingImages.timelineCheck : showingImages.timelineHistory}
              style={icon === "check" ? styles.showingTimelineCheckAsset : styles.showingTimelineHistoryAsset}
            />
          </View>
          <View style={styles.showingTimelineCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.showingTimelineTime}>{time}</Text>
              <View style={styles.showingTimelineBadge}>
                <Text style={styles.showingTimelineBadgeText}>HOÀN THÀNH</Text>
              </View>
            </View>
            <Text style={styles.showingTimelineTitle}>{title}</Text>
            <Text style={styles.showingTimelineCustomer}>{customer}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function PointHistoryScreen() {
  const c = useCopy().pointHistory;
  return (
    <EmployeePage title={c.title} subtitle={c.subtitle} back={back}>
      <View style={styles.metricRow}>
        <EmployeeMetric value={c.total} label={c.rank} tone="gold" />
        <EmployeeMetric value="+420" label={c.month} tone="green" />
      </View>
      <EmployeeSectionTitle title={c.activity} />
      {[
        ["Điểm danh nhanh", "+20", "Hôm nay, 08:42"],
        ["Hoàn thành khóa pháp lý", "+300", "Hôm qua"],
        ["Dẫn khách dự án", "+100", "Thứ hai"]
      ].map((item) => (
        <EmployeeCard key={item[0]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.listTitle}>{item[0]}</Text>
              <Text style={styles.bodyText}>{item[2]}</Text>
            </View>
            <EmployeeBadge label={item[1]} tone="green" />
          </View>
        </EmployeeCard>
      ))}
    </EmployeePage>
  );
}

export function PersonalInfoScreen() {
  const c = useCopy().personalInfo;
  const { session } = useAuth();
  const user = session?.user;
  return (
    <EmployeePage title={c.title} subtitle={c.subtitle} back={back}>
      <EmployeeCard>
        <EmployeeInputPreview label="HỌ VÀ TÊN" value={user?.fullName || "Nguyễn Văn Huy"} icon="person-outline" />
        <EmployeeInputPreview label="EMAIL" value={user?.email || "employee@nhmbds.local"} icon="mail-outline" />
        <EmployeeInputPreview label="SỐ ĐIỆN THOẠI" value={user?.phone || "090 123 4567"} icon="call-outline" />
        <EmployeeInputPreview label="MÃ NHÂN VIÊN" value={c.code} icon="id-card-outline" />
        <EmployeeInputPreview label="PHÒNG BAN" value={c.department} icon="business-outline" />
        <EmployeeInputPreview label="VAI TRÒ" value={c.role} icon="ribbon-outline" />
      </EmployeeCard>
      <EmployeeButton title={c.save} icon="save-outline" />
    </EmployeePage>
  );
}

export function ReferralQrScreen() {
  const c = useCopy().qr;
  const { signOut } = useAuth();
  return (
    <EmployeePage title={c.title} subtitle={c.subtitle} back={back}>
      <View style={styles.segment}>
        <EmployeeButton title={c.employee} tone="light" style={styles.segmentButton} />
        <EmployeeButton title={c.customer} tone="green" style={styles.segmentButton} />
      </View>
      <ReferralQrPanel copy={c} />
      <EmployeeButton title="Đăng xuất" tone="light" icon="log-out-outline" onPress={signOut} style={styles.logoutButton} />
    </EmployeePage>
  );
}

function ReferralQrPanel({ copy }: { copy: typeof vi.qr }) {
  return (
    <EmployeeCard style={styles.qrCard}>
      <Text style={styles.bodyText}>{copy.subtitle}</Text>
      <View style={styles.qrImageFrame}>
        <ReferralQrCode />
      </View>
      <EmployeeButton title={copy.share} icon="share-social-outline" style={styles.qrShareButton} />
    </EmployeeCard>
  );
}

function ReferralQrCode() {
  return (
    <Svg height="100%" viewBox="0 0 160 160" width="100%">
      <Path d="M0 0H70V70H0V0V0M10 10V60H60V10H10V10" fill="#191C1D" />
      <Path d="M20 20H50V50H20V20V20" fill="#191C1D" />
      <Path d="M90 0H160V70H90V0V0M100 10V60H150V10H100V10" fill="#191C1D" />
      <Path d="M110 20H140V50H110V20V20" fill="#191C1D" />
      <Path d="M0 90H70V160H0V90V90M10 100V150H60V100H10V100" fill="#191C1D" />
      <Path d="M20 110H50V140H20V110V110" fill="#191C1D" />
      <Path d="M90 90H110V110H90V90V90" fill="#191C1D" />
      <Path d="M120 90H140V110H120V90V90" fill="#191C1D" />
      <Path d="M140 110H160V130H140V110V110" fill="#191C1D" />
      <Path d="M110 120H130V140H110V120V120" fill="#191C1D" />
      <Path d="M90 140H110V160H90V140V140" fill="#191C1D" />
      <Path d="M130 140H160V160H130V140V140" fill="#191C1D" />
    </Svg>
  );
}

export function LeaveRequestsScreen() {
  const c = useCopy().requests;
  return <RequestList title={c.leaveTitle} rows={requestRows} />;
}

export function TransferRequestsScreen() {
  const c = useCopy().requests;
  return <RequestList title={c.transferTitle} rows={transferRows} />;
}

function RequestList({ title, rows }: { title: string; rows: readonly (readonly [string, string, string])[] }) {
  const c = useCopy().requests;
  return (
    <EmployeePage title={title} subtitle="Duyệt và theo dõi trạng thái yêu cầu của nhân viên." back={back}>
      {rows.map(([name, detail, status]) => (
        <EmployeeCard key={name}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.listTitle}>{name}</Text>
              <Text style={styles.bodyText}>{detail}</Text>
            </View>
            <EmployeeBadge
              label={status === "approved" ? c.approved : status === "rejected" ? c.rejected : c.pending}
              tone={status === "approved" ? "green" : status === "rejected" ? "neutral" : "gold"}
            />
          </View>
          {status === "pending" ? (
            <View style={styles.twoButtons}>
              <EmployeeButton title={c.approve} tone="green" style={styles.flex} />
              <EmployeeButton title={c.reject} tone="light" style={styles.flex} />
            </View>
          ) : null}
        </EmployeeCard>
      ))}
    </EmployeePage>
  );
}

export function DepartmentStaffScreen() {
  const c = useCopy().requests;
  return (
    <EmployeePage title={c.staffTitle} subtitle="Theo dõi nhân sự và hiệu suất phòng ban." back={back}>
      {["Nguyễn Văn Huy", "Phạm Thanh Thủy", "Lê Minh Quân", "Đỗ Hà Linh"].map((name, index) => (
        <EmployeeListRow
          key={name}
          icon="person-outline"
          title={name}
          description={index === 0 ? "Trưởng nhóm · KPI 95%" : "Chuyên viên tư vấn · KPI 82%"}
          badge={<EmployeeBadge label={index === 0 ? "LEAD" : "ACTIVE"} tone={index === 0 ? "gold" : "green"} />}
        />
      ))}
    </EmployeePage>
  );
}

export function LessonDetailScreen() {
  return (
    <EmployeePage
      headerTitle="Khóa học Bất động sản Cao cấp"
      back={backToRequiredLearning}
      backType="previous"
      right={<View style={styles.lessonHeaderRight} />}
      contentStyle={styles.lessonDetailContent}
    >
      <View style={styles.lessonVideo}>
        <Image source={learningImages.lessonVideo} style={styles.lessonVideoImage} />
        <View style={styles.lessonVideoOverlay} />
        <View style={styles.lessonCastButton}>
          <Ionicons name="tv-outline" size={21} color="#ffffff" />
        </View>
        <View style={styles.lessonPlayButton}>
          <Ionicons name="play" size={28} color="#ffffff" />
        </View>
        <View style={styles.lessonVideoControls}>
          <View style={styles.rowBetween}>
            <Text style={styles.lessonVideoTime}>00:00</Text>
            <Text style={styles.lessonVideoTime}>15:45</Text>
          </View>
          <View style={styles.lessonSeekTrack} />
          <View style={styles.lessonControlRow}>
            <View style={styles.lessonControlLeft}>
              <Ionicons name="volume-high-outline" size={22} color="#ffffff" />
              <Ionicons name="reader-outline" size={22} color="#ffffff" />
            </View>
            <Ionicons name="scan-outline" size={22} color="#ffffff" />
          </View>
        </View>
      </View>

      <View style={styles.lessonDetailBody}>
        <View style={styles.lessonBadge}>
          <Text style={styles.lessonBadgeText}>BẮT BUỘC</Text>
        </View>
        <Text style={styles.lessonDetailTitle}>Bài 3: Nghệ thuật Đàm phán Giá trị Cao</Text>
        <Text style={styles.lessonDetailDescription}>
          Trong bài học này, chúng ta sẽ đi sâu vào các kỹ thuật tâm lý và chiến lược đàm phán được sử dụng bởi các chuyên gia bán bất động sản hạng sang hàng đầu.
        </Text>

        <View style={styles.lessonNotice}>
          <View style={styles.lessonNoticeRow}>
            <Ionicons name="information-circle-outline" size={24} color="#c91f1f" />
            <Text style={styles.lessonNoticeText}>Vui lòng xem hết video để mở khóa bài học tiếp theo.</Text>
          </View>
          <View style={styles.lessonNextButtonDisabled}>
            <Ionicons name="lock-closed-outline" size={18} color="#ffffff" />
            <Text style={styles.lessonNextButtonText}>Bài tiếp theo</Text>
          </View>
        </View>

        <Text style={styles.lessonAttachmentsTitle}>Tài liệu đính kèm</Text>
        <View style={styles.lessonAttachmentList}>
          <LessonAttachment title="Sổ tay Đàm phán BĐS.pdf" size="2.4 MB" type="pdf" />
          <LessonAttachment title="Mẫu Hợp đồng Đặt cọc.docx" size="1.1 MB" type="doc" />
        </View>
      </View>
    </EmployeePage>
  );
}

function LessonAttachment({ title, size, type }: { title: string; size: string; type: "pdf" | "doc" }) {
  const isPdf = type === "pdf";

  return (
    <View style={styles.lessonAttachmentRow}>
      <View style={[styles.lessonAttachmentIcon, isPdf ? styles.lessonAttachmentIconPdf : styles.lessonAttachmentIconDoc]}>
        <Ionicons name={isPdf ? "document-text-outline" : "document-outline"} size={22} color={isPdf ? employeePalette.redDark : "#3f3000"} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.lessonAttachmentTitle}>{title}</Text>
        <Text style={styles.lessonAttachmentSize}>{size}</Text>
      </View>
      <Ionicons name="download-outline" size={22} color="#e3beb8" />
    </View>
  );
}

export function QuizScreen() {
  const options = [
    "A. Đất thương mại dịch vụ",
    "B. Đất ở đô thị hỗn hợp",
    "C. Đất cây xanh cảnh quan",
    "D. Đất công trình công cộng"
  ];

  return (
    <SafeAreaView style={styles.quizSafe}>
      <View style={styles.quizHeader}>
        <Pressable accessibilityRole="button" onPress={back} style={styles.quizBackButton}>
          <Ionicons name="arrow-back" size={24} color="#111111" />
        </Pressable>
        <Text style={styles.quizHeaderTitle} numberOfLines={1}>
          Bài kiểm tra kiến thức
        </Text>
        <View style={styles.quizTimerPill}>
          <Ionicons name="timer" size={18} color={employeePalette.red} />
          <Text style={styles.quizTimerText}>45:00</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.quizScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quizProgressBlock}>
          <View style={styles.quizProgressHeader}>
            <Text style={styles.quizProgressLabel}>TIẾN ĐỘ HOÀN THÀNH</Text>
            <Text style={styles.quizProgressCount}>Câu 3/10</Text>
          </View>
          <View style={styles.quizProgressTrack}>
            <View style={styles.quizProgressFill} />
          </View>
        </View>

        <View style={styles.quizQuestionCard}>
          <Text style={styles.quizQuestionTitle}>Câu 3: Quy hoạch phân khu</Text>
          <Text style={styles.quizQuestionBody}>
            Dựa vào bản đồ quy hoạch 1/2000 đính kèm, khu đất được khoanh đỏ thuộc loại hình quy hoạch sử dụng đất nào?
          </Text>
          <View style={styles.quizMapFrame}>
            <Image source={learningImages.planningQuizMap} style={styles.quizMapImage} />
          </View>

          <View style={styles.quizOptionsList}>
            {options.map((option, index) => {
              const selected = index === 1;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={option}
                  style={[styles.quizOption, selected && styles.quizOptionSelected]}
                >
                  <View style={[styles.quizRadio, selected && styles.quizRadioSelected]}>
                    {selected ? <View style={styles.quizRadioDot} /> : null}
                  </View>
                  <Text style={[styles.quizOptionText, selected && styles.quizOptionTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.quizEssaySection}>
          <Text style={styles.quizEssayTitle}>Câu hỏi tự luận</Text>
          <View style={styles.quizEssayCard}>
            <Text style={styles.quizEssayPrompt}>
              Phân tích những lợi thế cạnh tranh cốt lõi của dự án Elite Riverside so với các đối thủ cùng phân khúc trong khu vực. Từ đó, đề xuất 3 điểm nhấn (key selling points) quan trọng nhất khi tư vấn cho khách hàng mua đầu tư.
            </Text>
            <View style={styles.quizTextareaWrap}>
              <TextInput
                multiline
                placeholder="Nhập câu trả lời của bạn tại đây..."
                placeholderTextColor="#8f706b"
                style={styles.quizTextarea}
                textAlignVertical="top"
              />
              <Ionicons name="document-text-outline" size={22} color="#8f706b" style={styles.quizTextareaIcon} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.quizBottomActions}>
        <Pressable accessibilityRole="button" style={[styles.quizFooterButton, styles.quizDraftButton]}>
          <Ionicons name="save-outline" size={19} color={employeePalette.red} />
          <Text style={styles.quizDraftButtonText}>Lưu bản nháp</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={[styles.quizFooterButton, styles.quizSubmitButton]}>
          <Ionicons name="send" size={18} color="#ffffff" />
          <Text style={styles.quizSubmitButtonText}>Nộp bài</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function QuizResultScreen() {
  const questions = [
    {
      answer: "Tầm nhìn và sự riêng tư",
      correct: true,
      expanded: true,
      image: learningImages.resultQuestion1,
      note:
        "Đối với phân khúc hạng sang (penthouse), khách hàng ưu tiên trải nghiệm độc bản. Tầm nhìn panorama và tính bảo mật cá nhân vượt lên trên các yếu tố cơ bản như diện tích hay tiện ích chung.",
      title: "Yếu tố nào quan trọng nhất khi định giá một căn penthouse tại trung tâm?"
    },
    {
      answer: "Biệt thự nghỉ dưỡng cá nhân",
      correct: false,
      correctAnswer: "Tòa nhà văn phòng thương mại",
      expanded: true,
      image: learningImages.resultQuestion2,
      note:
        "Phương pháp vốn hóa dựa trên dòng tiền sinh lời đều đặn. Tòa nhà văn phòng cung cấp nguồn thu nhập từ việc cho thuê ổn định, trong khi biệt thự nghỉ dưỡng cá nhân thường được định giá dựa trên phương pháp so sánh thị trường.",
      title: "Phương pháp vốn hóa thu nhập thường áp dụng cho loại hình nào?"
    },
    {
      answer: "Giá trị tài sản",
      correct: true,
      title: "Tỷ suất sinh lời kỳ vọng (Cap Rate) tỷ lệ nghịch với yếu tố nào?"
    },
    {
      answer: "Không quá 15%",
      correct: true,
      title: "Biên độ dao động giá cho phép khi dùng phương pháp so sánh?"
    }
  ];

  return (
    <SafeAreaView style={styles.resultSafe}>
      <View style={styles.resultHeader}>
        <Pressable accessibilityRole="button" onPress={back} style={styles.resultCloseButton}>
          <Ionicons name="close" size={24} color="#000000" />
        </Pressable>
        <Text style={styles.resultHeaderTitle}>Kết quả</Text>
        <View style={styles.resultHeaderSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.resultScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHero}>
          <View style={styles.resultGoldGlow} />
          <View style={styles.resultRedGlow} />
          <View style={styles.resultScoreBlock}>
            <Text style={styles.resultScoreLabel}>ĐIỂM SỐ CỦA BẠN</Text>
            <View style={styles.resultScoreRow}>
              <Text style={styles.resultScoreBig}>8</Text>
              <Text style={styles.resultScoreTotal}>/10</Text>
            </View>
          </View>

          <View style={styles.resultAchievementCard}>
            <View style={styles.resultMedalCircle}>
              <Ionicons name="ribbon-outline" size={22} color={employeePalette.gold} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.resultAchievementTitle}>Xuất sắc!</Text>
              <Text style={styles.resultAchievementText}>
                Bạn đã nắm vững kiến thức về định giá bất động sản cao cấp.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.resultReviewSection}>
          <View style={styles.resultReviewHeader}>
            <Text style={styles.resultReviewTitle}>Chi tiết câu hỏi</Text>
            <View style={styles.resultCountPill}>
              <Text style={styles.resultCountText}>10 CÂU</Text>
            </View>
          </View>

          <View style={styles.resultQuestionList}>
            {questions.map((question, index) => (
              <ResultQuestionCard key={question.title} index={index + 1} {...question} />
            ))}
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={home} style={styles.resultDashboardButton}>
          <Text style={styles.resultDashboardText}>Trở về Dashboard</Text>
          <Ionicons name="arrow-forward" size={18} color="#ffffff" />
        </Pressable>
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
  title
}: {
  answer: string;
  correct: boolean;
  correctAnswer?: string;
  expanded?: boolean;
  image?: number;
  index: number;
  note?: string;
  title: string;
}) {
  return (
    <View style={[styles.resultQuestionCard, !correct && styles.resultQuestionCardWrong]}>
      <View style={[styles.resultQuestionTop, expanded && styles.resultQuestionTopExpanded]}>
        <View style={[styles.resultStatusIcon, correct ? styles.resultStatusCorrect : styles.resultStatusWrong]}>
          <Ionicons name={correct ? "checkmark" : "close"} size={18} color={correct ? employeePalette.green : "#d93025"} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.resultQuestionKicker}>CÂU {index}</Text>
          <Text style={styles.resultQuestionTitle}>{title}</Text>
          <View style={[styles.resultAnswerLine, correct ? styles.resultAnswerCorrect : styles.resultAnswerWrong]}>
            <Text style={[styles.resultAnswerText, !correct && styles.resultAnswerTextWrong]}>{answer}</Text>
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

export function CertificatesScreen() {
  const c = useCopy().learning;
  return (
    <EmployeePage title={c.certTitle} subtitle="Danh sách chứng chỉ và thành tích chuyên môn." back={back}>
      {employeeLessons.map((lesson) => (
        <EmployeeCard key={lesson.id}>
          <EmployeeBadge
            label={lesson.status === "verified" ? "ĐÃ XÁC THỰC" : lesson.status === "required" ? "BẮT BUỘC" : "ĐANG HỌC"}
            tone={lesson.status === "verified" ? "green" : lesson.status === "required" ? "red" : "gold"}
          />
          <Text style={styles.listTitle}>{lesson.title}</Text>
          <Text style={styles.bodyText}>{lesson.provider}</Text>
        </EmployeeCard>
      ))}
    </EmployeePage>
  );
}

export function InventoryListScreen() {
  const zones = [
    { available: "CÒN 12/45 LÔ", hot: true, image: inventoryImages.zoneA, name: "Láng hòa lạc", total: "Tổng: 45 lô" },
    { available: "CÒN 5/30 LÔ", image: inventoryImages.zoneB, name: "Mỹ Đình", total: "Tổng: 30 lô" },
    { available: "CÒN 12/45 LÔ", image: inventoryImages.zoneA, name: "Chương Mỹ", total: "Tổng: 45 lô" },
    { available: "CÒN 5/30 LÔ", image: inventoryImages.zoneB, name: "Cầu Giấy", total: "Tổng: 30 lô" }
  ];

  return (
    <SafeAreaView style={styles.inventoryAreaSafe}>
      <View style={styles.inventoryAreaHeader}>
        <View style={styles.inventoryAreaHeaderLeft}>
          <Pressable accessibilityRole="button" onPress={back} style={styles.inventoryAreaIconButton}>
            <Ionicons name="arrow-back" size={24} color="#111111" />
          </Pressable>
          <Text style={styles.inventoryAreaTitle}>Danh sách Khu đất</Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.inventoryAreaBellButton}>
          <Ionicons name="notifications-outline" size={22} color="#111111" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.inventoryAreaScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inventoryAreaSearchRow}>
          <View style={styles.inventoryAreaSearchInput}>
            <Ionicons name="search" size={22} color="#8f706b" />
            <Text style={styles.inventoryAreaSearchText}>Tìm kiếm khu vực...</Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.inventoryAreaFilterButton}>
            <Ionicons name="filter" size={22} color={employeePalette.muted} />
          </Pressable>
        </View>

        <View style={styles.inventoryAreaGrid}>
          {zones.map((zone) => (
            <InventoryZoneCard key={zone.name} {...zone} />
          ))}
        </View>
      </ScrollView>

      <InventoryAreaBottomNav />
    </SafeAreaView>
  );
}

function InventoryZoneCard({
  available,
  hot,
  image,
  name,
  total
}: {
  available: string;
  hot?: boolean;
  image: number;
  name: string;
  total: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push("/(app)/employee/inventory-map")}
      style={({ pressed }) => [styles.inventoryAreaCard, pressed && styles.pressed]}
    >
      <View style={styles.inventoryAreaCardImageWrap}>
        <Image source={image} style={styles.inventoryAreaCardImage} />
        {hot ? (
          <View style={styles.inventoryAreaHotPill}>
            <Text style={styles.inventoryAreaHotText}>HOT</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.inventoryAreaCardBody}>
        <View style={styles.inventoryAreaCardCopy}>
          <Text style={styles.inventoryAreaCardTitle}>{name}</Text>
          <View style={styles.inventoryAreaCardMeta}>
            <Ionicons name="grid-outline" size={12} color={employeePalette.muted} />
            <Text style={styles.inventoryAreaCardMetaText}>{total}</Text>
          </View>
        </View>
        <View style={styles.inventoryAreaCardFooter}>
          <Text style={styles.inventoryAreaCardAvailable}>{available}</Text>
          <Ionicons name="arrow-forward" size={18} color="#6a0100" />
        </View>
      </View>
    </Pressable>
  );
}

function InventoryAreaBottomNav() {
  const items = [
    ["grid-outline", "Dashboard"],
    ["school-outline", "Learning"],
    ["location", "Khu vực"],
    ["chatbox-outline", "News"],
    ["person-outline", "Profile"]
  ] as const;

  return (
    <View style={styles.inventoryAreaBottomNav}>
      {items.map(([icon, label]) => {
        const active = label === "Khu vực";
        return (
          <Pressable key={label} style={styles.inventoryAreaNavItem}>
            <Ionicons name={icon} size={active ? 22 : 20} color={active ? "#6a0100" : "rgba(91, 64, 60, 0.6)"} />
            <Text style={[styles.inventoryAreaNavLabel, active && styles.inventoryAreaNavLabelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function InventoryMapScreen() {
  const lots = Array.from({ length: 28 }).map((_, index) => {
    if (index === 10) return "held";
    if (index === 26 || index === 27) return "sold";
    return "available";
  });

  return (
    <SafeAreaView style={styles.inventoryMapSafe}>
      <ScrollView contentContainerStyle={styles.inventoryMapScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inventoryMapHeader}>
          <Pressable accessibilityRole="button" onPress={back} style={styles.inventoryMapBackButton}>
            <Ionicons name="arrow-back" size={24} color={employeePalette.text} />
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.inventoryMapBell}>
            <Ionicons name="notifications-outline" size={22} color="#8a9ab1" />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inventoryMapLegendWrap}>
          <View style={styles.inventoryMapLegend}>
            <LegendItem color="#eec05b" label="Còn hàng" />
            <LegendItem color={employeePalette.red} label="Đã bán" />
            <LegendItem color="#2e7d32" label="Đang giữ chỗ" />
            <LegendItem color="#c8c6c5" label="Không bán" />
          </View>
        </ScrollView>

        <View style={styles.inventoryMapCanvas}>
          <Image source={inventoryImages.mapOverview} style={styles.inventoryMapOverview} />
          <View style={styles.inventoryMapControls}>
            <MapControl icon="add" />
            <MapControl icon="remove" />
            <MapControl icon="locate-outline" highlight />
          </View>
        </View>

        <View style={styles.inventoryLotGrid}>
          {lots.map((status, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              onPress={() => router.push("/(app)/employee/lot-detail")}
              style={[
                styles.inventoryLotCell,
                status === "held" && styles.inventoryLotHeld,
                status === "sold" && styles.inventoryLotSold
              ]}
            >
              <Text style={[styles.inventoryLotText, status !== "available" && styles.inventoryLotTextLight]}>A1</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inventoryMapSheet}>
          <View style={styles.inventorySaleBadge}>
            <Text style={styles.inventorySaleBadgeText}>ĐANG MỞ BÁN</Text>
          </View>
          <Text style={styles.inventorySheetTitle}>Khu 25 thửa phú cát</Text>

          <View style={styles.inventorySheetStats}>
            <InfoTile label="DIỆN TÍCH" value="100.3 m²" />
            <InfoTile label="HƯỚNG" value="Đông Nam" />
          </View>

          <View style={styles.inventoryPriceRow}>
            <View>
              <Text style={styles.inventoryPriceLabel}>GIÁ BÁN</Text>
              <Text style={styles.inventoryPriceValue}>4.5 Tỷ</Text>
            </View>
            <Text style={styles.inventoryPricePerMeter}>~44.8 tr/m²</Text>
          </View>

          <Pressable accessibilityRole="button" style={styles.inventoryRouteButton}>
            <Text style={styles.inventoryActionText}>Xem chỉ đường</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.inventoryPlanningButton}>
            <Text style={styles.inventoryActionText}>Kiểm tra quy hoạch</Text>
          </Pressable>

          <Image source={inventoryImages.planningArea} style={styles.inventoryPlanningMap} />

          <View style={styles.inventoryComments}>
            <View style={styles.inventoryCommentsHeader}>
              <Text style={styles.inventoryCommentsTitle}>BÌNH LUẬN & THẢO LUẬN</Text>
              <View style={styles.inventoryCommentsCount}>
                <Text style={styles.inventoryCommentsCountText}>3</Text>
              </View>
            </View>
            <CommentRow initials="TA" name="Tuấn Anh" time="10:30 AM" text="Khách đang cân nhắc, hẹn quay lại chiều nay để xem thực tế lô đất." tone="red" />
            <CommentRow initials="MH" name="Minh Hạnh" time="Hôm qua" text="Lô này có pháp lý đầy đủ, sổ hồng sẵn sàng bàn giao." tone="gold" />
            <View style={styles.inventoryCommentInput}>
              <Text style={styles.inventoryCommentPlaceholder}>Nhập nội dung trao đổi...</Text>
              <Ionicons name="send" size={20} color={employeePalette.red} />
            </View>
          </View>
        </View>
      </ScrollView>
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

function MapControl({ highlight, icon }: { highlight?: boolean; icon: ComponentProps<typeof Ionicons>["name"] }) {
  return (
    <Pressable style={styles.inventoryMapControl}>
      <Ionicons name={icon} size={highlight ? 22 : 24} color={highlight ? employeePalette.red : "#111111"} />
    </Pressable>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.inventoryInfoTile}>
      <Text style={styles.inventoryInfoLabel}>{label}</Text>
      <Text style={styles.inventoryInfoValue}>{value}</Text>
    </View>
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

export function LotDetailScreen() {
  return (
    <SafeAreaView style={styles.lotDetailSafe}>
      <ScrollView contentContainerStyle={styles.lotDetailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.lotDetailHero}>
          <Image source={inventoryImages.lotHero} style={styles.lotDetailHeroImage} />
          <View style={styles.lotDetailHeroActions}>
            <Pressable accessibilityRole="button" onPress={back} style={styles.lotDetailHeroButton}>
              <Ionicons name="arrow-back" size={28} color={employeePalette.text} />
            </Pressable>
            <View style={styles.lotDetailHeroRightActions}>
              <Pressable accessibilityRole="button" style={styles.lotDetailHeroButton}>
                <Ionicons name="map-outline" size={27} color={employeePalette.text} />
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.lotDetailHeroButton}>
                <Ionicons name="share-social-outline" size={27} color={employeePalette.text} />
              </Pressable>
            </View>
          </View>
          <View style={styles.lotDetailGalleryPill}>
            <Ionicons name="image" size={14} color={employeePalette.red} />
            <Text style={styles.lotDetailGalleryText}>1/8</Text>
          </View>
        </View>

        <View style={styles.lotDetailBody}>
          <View style={styles.lotDetailTitleRow}>
            <View style={styles.flex}>
              <Text style={styles.lotDetailTitle}>Lô A10</Text>
              <View style={styles.lotDetailLocationRow}>
                <Ionicons name="location-outline" size={18} color={employeePalette.muted} />
                <Text style={styles.lotDetailLocationText}>Khu 25 Thừa Phú Cát</Text>
              </View>
            </View>
            <View style={styles.lotDetailStatusPill}>
              <Text style={styles.lotDetailStatusText}>ĐANG GIỮ CHỖ</Text>
            </View>
          </View>

          <View style={styles.lotDetailPriceCard}>
            <Text style={styles.lotDetailPriceLabel}>TỔNG GIÁ BÁN</Text>
            <View style={styles.lotDetailTotalRow}>
              <Text style={styles.lotDetailTotalPrice}>3.7 Tỷ</Text>
              <Text style={styles.lotDetailCurrency}>VNĐ</Text>
            </View>
            <View style={styles.lotDetailDivider} />
            <View style={styles.lotDetailUnitRow}>
              <Text style={styles.lotDetailUnitLabel}>Đơn giá</Text>
              <Text style={styles.lotDetailUnitValue}>36.9 Tr/m²</Text>
            </View>
          </View>

          <View style={styles.lotDetailStatsGrid}>
            <LotStat icon="resize-outline" label="DIỆN TÍCH" value="36.9 Tr/m²" />
            <LotStat icon="analytics-outline" label="MẶT TIỀN" value="6.21m" />
            <LotStat icon="compass-outline" label="HƯỚNG" value="36.9 Tr/m²" />
            <LotStat icon="document-text-outline" label="PHÁP LÝ" value="36.9 Tr/m²" />
          </View>

          <View style={styles.lotDetailDescriptionSection}>
            <Text style={styles.lotDetailSectionTitle}>Mô tả chi tiết</Text>
            <Text style={styles.lotDetailDescription}>
              Lô đất góc 2 mặt tiền cực hiếm tại phân khu trung tâm The Pearl. View trực diện công viên nội khu và rạch cảnh quan. Cơ sở hạ tầng đã hoàn thiện 100%, sẵn sàng xây dựng ngay. Rất thích hợp để xây biệt thự nghỉ dưỡng hoặc shophouse thương mại cao cấp.
            </Text>
          </View>

          <Text style={styles.lotDetailNote}>
            Note: Nếu khách hàng cọc thì vui lòng đợi xác nhận từ Admin hoặc liên hệ với admin xác nhận
          </Text>
        </View>
      </ScrollView>

      <View style={styles.lotDetailBottomActions}>
        <Pressable accessibilityRole="button" style={[styles.lotDetailActionButton, styles.lotDetailLockButton]}>
          <Ionicons name="save-outline" size={20} color="#1e8e3e" />
          <Text style={styles.lotDetailLockText}>LOCK</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={[styles.lotDetailActionButton, styles.lotDetailDepositButton]}>
          <Ionicons name="send" size={20} color="#ffffff" />
          <Text style={styles.lotDetailDepositText}>CỌC</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function LotStat({ icon, label, value }: { icon: ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  return (
    <View style={styles.lotDetailStatCard}>
      <Ionicons name={icon} size={22} color="#8f706b" />
      <Text style={styles.lotDetailStatLabel}>{label}</Text>
      <Text style={styles.lotDetailStatValue}>{value}</Text>
    </View>
  );
}

export function NotificationsScreen() {
  const c = useCopy().notifications;
  return (
    <EmployeePage title={c.title} subtitle={c.subtitle} back={back}>
      {employeeNewsPosts.map((post) => (
        <EmployeeListRow
          key={post.id}
          icon="notifications-outline"
          title={post.title}
          description={`${post.timeAgo} · ${post.category}`}
          onPress={() => router.push("/(app)/employee/comments")}
        />
      ))}
    </EmployeePage>
  );
}

export function CommentsScreen() {
  const c = useCopy().notifications;
  return (
    <EmployeePage title={c.comments} subtitle="Kinh Doanh Dự Án Cao Cấp" back={back}>
      <EmployeeCard>
        <Text style={styles.listTitle}>Ban quản lý</Text>
        <Text style={styles.bodyText}>Cập nhật chính sách hoa hồng quý 3 và danh sách sản phẩm ưu tiên.</Text>
      </EmployeeCard>
      {["Khách đang cân nhắc, hẹn quay lại chiều nay để xem thực tế lô đất.", "Lô này có pháp lý đầy đủ, sổ hồng sẵn sàng bàn giao."].map((comment, index) => (
        <EmployeeCard key={comment}>
          <Text style={styles.listTitle}>{index === 0 ? "Minh Anh" : "Tuấn Kiệt"}</Text>
          <Text style={styles.bodyText}>{comment}</Text>
        </EmployeeCard>
      ))}
      <EmployeeInputPreview label="BÌNH LUẬN" value="Nhập nội dung trao đổi..." icon="chatbubble-outline" />
      <EmployeeButton title={c.send} icon="send-outline" />
    </EmployeePage>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  metricRow: {
    flexDirection: "row",
    gap: 12
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  twoButtons: {
    flexDirection: "row",
    gap: 12
  },
  learningContent: {
    gap: 24,
    paddingTop: 24
  },
  learningSection: {
    gap: 16,
    paddingVertical: 24
  },
  learningSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  learningSectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 20,
    lineHeight: 30
  },
  learningDetailLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    minHeight: 32
  },
  learningDetailText: {
    color: employeePalette.goldDark,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  learningPathList: {
    gap: 16
  },
  learningPathCard: {
    alignItems: "flex-start",
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 92,
    overflow: "hidden",
    padding: 16
  },
  learningPathGlow: {
    backgroundColor: "#ffdf9f",
    borderRadius: 999,
    height: 96,
    position: "absolute",
    right: -24,
    top: -24,
    width: 96
  },
  learningPathGlowDefault: {
    opacity: 0.2
  },
  learningPathGlowActive: {
    opacity: 0.4
  },
  learningPathCardActive: {
    borderColor: employeePalette.gold
  },
  learningPathCardLocked: {
    opacity: 0.7
  },
  learningPathIcon: {
    alignItems: "center",
    backgroundColor: "#edeeef",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  learningPathIconActive: {
    backgroundColor: "#ffdf9f"
  },
  learningPathTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22.5
  },
  learningPathDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 19.5,
    paddingBottom: 8
  },
  learningProgressTrack: {
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
    width: "100%"
  },
  learningProgressFill: {
    backgroundColor: employeePalette.gold,
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  learningProgressFillActive: {
    backgroundColor: employeePalette.goldDark
  },
  learningTabs: {
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 24,
    minHeight: 33
  },
  learningTabActive: {
    borderBottomColor: employeePalette.redDark,
    borderBottomWidth: 2,
    color: employeePalette.redDark,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22.5,
    paddingBottom: 8
  },
  learningTab: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22.5,
    paddingBottom: 8
  },
  learningCourseList: {
    gap: 24
  },
  learningCourseCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden"
  },
  learningCourseImageWrap: {
    backgroundColor: "#edeeef",
    height: 180,
    overflow: "hidden",
    width: "100%"
  },
  learningCourseImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  learningRequiredPill: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#e3beb8",
    borderRadius: 999,
    borderWidth: 1,
    left: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: "absolute",
    top: 8
  },
  learningRequiredText: {
    color: employeePalette.redDark,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  learningCourseBody: {
    gap: 8,
    padding: 16
  },
  learningCourseTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 27
  },
  learningCourseDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  learningCourseProgressHeader: {
    alignItems: "center",
    borderTopColor: employeePalette.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 17
  },
  learningProgressLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  learningProgressPercent: {
    color: employeePalette.goldDark,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  requiredLearningContent: {
    gap: 15,
    paddingTop: 24
  },
  requiredHero: {
    backgroundColor: "#e7e8e9",
    borderRadius: 12,
    height: 192,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    width: "100%",
    elevation: 1
  },
  requiredHeroImage: {
    height: "145.2%",
    resizeMode: "cover",
    top: "-22.6%",
    width: "100%"
  },
  requiredHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(25, 28, 29, 0.38)"
  },
  requiredHeroCopy: {
    bottom: 16,
    left: 16,
    position: "absolute",
    right: 16
  },
  requiredHeroKicker: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(25, 28, 29, 0.5)",
    borderColor: "rgba(255, 223, 159, 0.3)",
    borderWidth: 1,
    borderRadius: 999,
    color: "#fbe6a4",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12,
    marginBottom: 6,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  requiredHeroTitle: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    maxWidth: 318
  },
  requiredIntro: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  requiredAlert: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 218, 214, 0.3)",
    borderColor: "#ffdad6",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 10
  },
  requiredAlertIcon: {
    alignItems: "center",
    backgroundColor: "#d42121",
    borderRadius: 999,
    height: 20,
    justifyContent: "center",
    marginTop: 2,
    width: 20
  },
  requiredAlertText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 21.13
  },
  requiredTimeline: {
    gap: 18,
    paddingBottom: 72,
    position: "relative"
  },
  requiredTimelineLine: {
    backgroundColor: "#e2e3e4",
    bottom: 0,
    left: 15,
    position: "absolute",
    top: 18,
    width: 2
  },
  requiredTimelineRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16
  },
  requiredTimelineNode: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    marginTop: 13,
    width: 28,
    zIndex: 2
  },
  requiredTimelineNodeActive: {
    backgroundColor: employeePalette.redDark,
    shadowColor: employeePalette.redDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3
  },
  requiredTimelineNodeLocked: {
    backgroundColor: "#ededed"
  },
  requiredLessonCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minHeight: 152,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2
  },
  requiredLessonCardLocked: {
    minHeight: 128,
    opacity: 0.65
  },
  requiredLessonHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  requiredLessonStep: {
    color: employeePalette.redDark,
    fontFamily: appFonts.bold,
    fontSize: 14,
    letterSpacing: 1.2,
    lineHeight: 20
  },
  requiredLessonStatus: {
    backgroundColor: "#f1efef",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 6
  },
  requiredLessonStatusText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18
  },
  requiredLessonTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 22
  },
  requiredLessonTitleLocked: {
    color: "#707477"
  },
  requiredLessonMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  requiredLessonDuration: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  requiredProgressTrack: {
    backgroundColor: "#e3e4e4",
    borderRadius: 999,
    height: 6,
    marginTop: 6,
    overflow: "hidden"
  },
  requiredProgressFill: {
    backgroundColor: employeePalette.redDark,
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  requiredProgressFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  requiredProgressText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 19.5
  },
  requiredContinueText: {
    color: employeePalette.redDark,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 19.5
  },
  requiredLessonMuted: {
    color: "#9d8d8a"
  },
  lessonHeaderRight: {
    width: 20
  },
  lessonDetailContent: {
    gap: 0,
    paddingHorizontal: 0,
    paddingTop: 0
  },
  lessonVideo: {
    backgroundColor: "#000000",
    height: 280,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%"
  },
  lessonVideoImage: {
    height: "127.08%",
    opacity: 0.8,
    resizeMode: "cover",
    top: "-13.54%",
    width: "100%"
  },
  lessonVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.18)"
  },
  lessonCastButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 16,
    top: 16,
    width: 36
  },
  lessonPlayButton: {
    alignItems: "center",
    backgroundColor: "rgba(106, 1, 0, 0.86)",
    borderRadius: 999,
    height: 72,
    justifyContent: "center",
    left: "50%",
    marginLeft: -36,
    marginTop: -36,
    position: "absolute",
    top: "50%",
    width: 72
  },
  lessonVideoControls: {
    bottom: 16,
    gap: 8,
    left: 16,
    position: "absolute",
    right: 16
  },
  lessonVideoTime: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16
  },
  lessonSeekTrack: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 999,
    height: 4,
    opacity: 0.5
  },
  lessonControlRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8
  },
  lessonControlLeft: {
    flexDirection: "row",
    gap: 16
  },
  lessonDetailBody: {
    gap: 14,
    paddingBottom: 64,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  lessonBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ffdad6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  lessonBadgeText: {
    color: "#410000",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  lessonDetailTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  lessonDetailDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lessonNotice: {
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    marginTop: 24,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  lessonNoticeRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12
  },
  lessonNoticeText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 25.6
  },
  lessonNextButtonDisabled: {
    alignItems: "center",
    backgroundColor: "rgba(149, 1, 0, 0.4)",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    opacity: 0.7
  },
  lessonNextButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 24,
    paddingTop: 1
  },
  lessonAttachmentsTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    marginTop: 56
  },
  lessonAttachmentList: {
    gap: 8
  },
  lessonAttachmentRow: {
    alignItems: "center",
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 82,
    padding: 17
  },
  lessonAttachmentIcon: {
    alignItems: "center",
    borderRadius: 4,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  lessonAttachmentIconPdf: {
    backgroundColor: "#ffdad6"
  },
  lessonAttachmentIconDoc: {
    backgroundColor: "#ffdf9f"
  },
  lessonAttachmentTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 25.6
  },
  lessonAttachmentSize: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  divider: {
    backgroundColor: employeePalette.border,
    height: 1,
    marginVertical: 12
  },
  upperTitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 13,
    letterSpacing: 0.9,
    lineHeight: 18,
    textTransform: "uppercase"
  },
  meetSectionLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 12,
    textTransform: "uppercase"
  },
  meetField: {
    gap: 8
  },
  meetFieldLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  meetFieldInput: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 13,
    paddingVertical: 13
  },
  meetFieldValue: {
    color: employeePalette.muted,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 20
  },
  meetPersonIcon: {
    height: 13,
    resizeMode: "contain",
    width: 13
  },
  meetPhoneIcon: {
    height: 15,
    resizeMode: "contain",
    width: 15
  },
  meetProjectIcon: {
    height: 15,
    resizeMode: "contain",
    width: 15
  },
  meetDropdownIcon: {
    height: 5,
    resizeMode: "contain",
    width: 17
  },
  projectChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  projectChip: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  projectChipActive: {
    backgroundColor: "#fff7df",
    borderColor: "#f5c14b"
  },
  projectChipText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 13,
    letterSpacing: 0.8,
    lineHeight: 18,
    paddingTop: 1
  },
  projectChipTextActive: {
    color: employeePalette.goldDark
  },
  meetPhotoBox: {
    alignItems: "center",
    backgroundColor: "#eff0f1",
    borderColor: "#dfe3e6",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 8,
    minHeight: 210,
    justifyContent: "center",
    padding: 20
  },
  roundCamera: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: 64,
    elevation: 2
  },
  meetCameraEmptyIcon: {
    height: 22,
    resizeMode: "contain",
    width: 24
  },
  photoTapText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  meetPhotoButton: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.red,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 51,
    paddingVertical: 17
  },
  meetCameraButtonIcon: {
    height: 17,
    resizeMode: "contain",
    width: 19
  },
  meetPhotoButtonText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  meetSeeAll: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  meetSeeAllText: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  meetForwardIcon: {
    height: 8,
    resizeMode: "contain",
    width: 5
  },
  meetRecentList: {
    gap: 8
  },
  meetRecentCard: {
    alignItems: "flex-start",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 88,
    padding: 17
  },
  meetRecentAvatar: {
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    resizeMode: "cover",
    width: 48
  },
  meetRecentCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  meetRecentName: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  meetRecentMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  meetRecentTimeIcon: {
    height: 12,
    resizeMode: "contain",
    width: 12
  },
  meetRecentLocationIcon: {
    height: 12,
    resizeMode: "contain",
    width: 9
  },
  meetRecentMetaText: {
    color: employeePalette.muted,
    flexShrink: 1,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  meetRecentStatus: {
    backgroundColor: "#e7e8e9",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  meetRecentStatusText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  inlineStrong: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold
  },
  showingGpsCard: {
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 17,
    paddingVertical: 13
  },
  showingGpsIcon: {
    height: 22,
    resizeMode: "contain",
    width: 22
  },
  showingForm: {
    gap: 16
  },
  showingField: {
    gap: 4
  },
  showingFieldLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  showingFieldInput: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    height: 48,
    justifyContent: "space-between",
    paddingHorizontal: 17
  },
  showingFieldValue: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  showingFieldValueMuted: {
    color: "#6b7280"
  },
  showingChevronIcon: {
    height: 8,
    resizeMode: "contain",
    width: 12
  },
  showingPhotoHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  showingCameraIcon: {
    height: 23,
    resizeMode: "contain",
    width: 25
  },
  showingPrimaryButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    shadowColor: employeePalette.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2
  },
  showingPlayIcon: {
    height: 14,
    resizeMode: "contain",
    width: 11
  },
  showingPrimaryButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  showingTimeline: {
    borderTopColor: employeePalette.border,
    borderTopWidth: 1,
    gap: 0,
    paddingTop: 16,
    position: "relative"
  },
  showingTimelineLine: {
    backgroundColor: employeePalette.border,
    bottom: 16,
    left: 19,
    position: "absolute",
    top: 32,
    width: 2
  },
  showingTimelineItem: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 8
  },
  showingTimelineIcon: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  showingTimelineIconActive: {
    borderColor: employeePalette.red
  },
  showingTimelineCheckAsset: {
    height: 17,
    resizeMode: "contain",
    width: 17
  },
  showingTimelineHistoryAsset: {
    height: 15,
    resizeMode: "contain",
    width: 15
  },
  showingTimelineCard: {
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 78,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1
  },
  showingTimelineTime: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  showingTimelineBadge: {
    backgroundColor: "#ffdf9f",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  showingTimelineBadgeText: {
    color: "#261a00",
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  showingTimelineTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21,
    paddingTop: 4
  },
  showingTimelineCustomer: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 19.5
  },
  newsMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  linkText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 20
  },
  profileFigmaContent: {
    gap: 16,
    paddingBottom: 108,
    paddingTop: 24
  },
  profileHeroCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 272,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 27,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  profileHeroDecoration: {
    backgroundColor: "rgba(149, 1, 0, 0.05)",
    borderBottomLeftRadius: 100,
    height: 128,
    position: "absolute",
    right: -32,
    top: -32,
    width: 128
  },
  profileHeroAvatar: {
    borderColor: "#ffffff",
    borderRadius: 48,
    borderWidth: 4,
    height: 96,
    resizeMode: "cover",
    width: 96
  },
  profileVerifyBadge: {
    alignItems: "center",
    backgroundColor: "#e7f5f7",
    borderColor: employeePalette.text,
    borderRadius: 999,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    position: "absolute",
    right: 25,
    top: 24,
    width: 50
  },
  profileVerifyBadgeImage: {
    height: 50,
    position: "absolute",
    resizeMode: "contain",
    right: 25,
    top: 24,
    width: 50
  },
  profileHeroName: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    paddingTop: 16,
    textAlign: "center"
  },
  profileHeroRole: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6,
    textAlign: "center"
  },
  profileRankPill: {
    alignItems: "center",
    backgroundColor: "rgba(238, 192, 91, 0.2)",
    borderColor: "#eec05b",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 17,
    paddingVertical: 9
  },
  profileRankIcon: {
    height: 16,
    resizeMode: "contain",
    width: 12
  },
  profileRankPillText: {
    color: "#755700",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12,
    textAlignVertical: "center"
  },
  profileSectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    marginTop: 16
  },
  profileSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16
  },
  profileSeeAll: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  profileRankingCard: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 120,
    overflow: "hidden",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  profileRankingGlow: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    height: 160,
    position: "absolute",
    right: -40,
    top: -40,
    width: 160
  },
  profileRankingLabel: {
    color: "#ffdad4",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  profileRankingValueRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
    paddingTop: 4
  },
  profileRankingValue: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 40,
    letterSpacing: -1.6,
    lineHeight: 40
  },
  profileRankingSuffix: {
    color: "#ffdad4",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6,
    paddingBottom: 2
  },
  profileRankingTrack: {
    backgroundColor: "rgba(106, 1, 0, 0.4)",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
    width: "100%"
  },
  profileRankingFill: {
    backgroundColor: "#eec05b",
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  profileRankingIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 999,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    marginLeft: 20,
    width: 64
  },
  profileCertList: {
    gap: 16,
    paddingRight: 20
  },
  profileCertificateCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 160,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: 17,
    width: 260
  },
  profileCertificateCardCompact: {
    width: 180
  },
  profileCertificateBg: {
    ...StyleSheet.absoluteFillObject,
    height: "135%",
    opacity: 0.1,
    resizeMode: "cover",
    width: "100%"
  },
  profileCertificateTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  },
  profileCertificateDate: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  profileScoreList: {
    gap: 8
  },
  profileScoreRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 74,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  profileScoreTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  profileScoreMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingTop: 8
  },
  profileScoreBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  profileScoreBadgeRed: {
    backgroundColor: "rgba(149, 1, 0, 0.1)"
  },
  profileScoreBadgeGold: {
    backgroundColor: "rgba(238, 192, 91, 0.2)"
  },
  profileScoreBadgeText: {
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  profileScoreBadgeTextRed: {
    color: employeePalette.red
  },
  profileScoreBadgeTextGold: {
    color: "#755700"
  },
  profileScoreDate: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  profileScoreDivider: {
    backgroundColor: employeePalette.border,
    height: 48,
    marginHorizontal: 16,
    width: 1
  },
  profileScoreValueRow: {
    alignItems: "flex-end",
    flexDirection: "row"
  },
  profileScoreValue: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 32,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  profileScoreValueRed: {
    color: employeePalette.red
  },
  profileScoreMax: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 19.2,
    paddingBottom: 5
  },
  profileActionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    gap: 12,
    marginTop: 30,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  profileLeaveButton: {
    alignItems: "center",
    borderColor: "#c08400",
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    justifyContent: "center"
  },
  profileLeaveButtonText: {
    color: "#c08400",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16,
    paddingTop: 1
  },
  profileTransferButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center"
  },
  profileReceiveTransferButton: {
    alignItems: "center",
    backgroundColor: employeePalette.green,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center"
  },
  profileTransferButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16,
    paddingTop: 1
  },
  profileQrSegment: {
    flexDirection: "row",
    gap: 10
  },
  profileQrSegmentActive: {
    alignItems: "center",
    backgroundColor: employeePalette.green,
    borderRadius: 12,
    flex: 1,
    height: 42,
    justifyContent: "center"
  },
  profileQrSegmentInactive: {
    alignItems: "center",
    backgroundColor: "#a1a1aa",
    borderRadius: 12,
    flex: 1.2,
    height: 42,
    justifyContent: "center"
  },
  profileQrSegmentActiveText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  profileQrSegmentInactiveText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  profileAvatar: {
    alignItems: "center",
    backgroundColor: "#1f2933",
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  profileAvatarText: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 24
  },
  bodyText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  listTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 24
  },
  heroTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  photoProof: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 15,
    justifyContent: "center",
    minHeight: 160,
    overflow: "hidden",
    padding: 17
  },
  photoProofTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(238, 192, 91, 0.08)",
    opacity: 0.35
  },
  photoButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#eec05b",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 25,
    paddingVertical: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 1
  },
  photoTitle: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 24
  },
  photoHelper: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 12,
    textAlign: "center"
  },
  segment: {
    flexDirection: "row",
    gap: 12
  },
  segmentButton: {
    flex: 1
  },
  qrCard: {
    alignItems: "center",
    width: "100%"
  },
  qrBox: {
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    height: 194,
    padding: 18,
    width: 194
  },
  qrCell: {
    backgroundColor: "#ffffff",
    height: 22,
    width: 22
  },
  qrCellDark: {
    backgroundColor: employeePalette.text
  },
  qrImage: {
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 194,
    resizeMode: "contain",
    width: 194
  },
  qrImageFrame: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 194,
    justifyContent: "center",
    padding: 17,
    width: 194
  },
  qrShareButton: {
    marginTop: 4,
    width: "100%"
  },
  logoutButton: {
    borderColor: "#e3beb8",
    marginTop: 4
  },
  quizSafe: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  quizHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f4f4f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 64,
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 1
  },
  quizBackButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  quizHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 28,
    marginLeft: 2
  },
  quizTimerPill: {
    alignItems: "center",
    backgroundColor: employeePalette.subtle,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  quizTimerText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  quizScrollContent: {
    gap: 24,
    paddingBottom: 124,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  quizProgressBlock: {
    gap: 8
  },
  quizProgressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  quizProgressLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  quizProgressCount: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  quizProgressTrack: {
    backgroundColor: employeePalette.subtle,
    borderRadius: 999,
    height: 8,
    overflow: "hidden"
  },
  quizProgressFill: {
    backgroundColor: employeePalette.red,
    borderRadius: 999,
    height: 8,
    width: "30%"
  },
  quizQuestionCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  quizQuestionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 20,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  quizQuestionBody: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  quizMapFrame: {
    backgroundColor: employeePalette.subtle,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    height: 356,
    justifyContent: "center",
    marginTop: 6,
    overflow: "hidden"
  },
  quizMapImage: {
    height: 349,
    resizeMode: "cover",
    width: 543
  },
  quizOptionsList: {
    gap: 8,
    paddingTop: 9
  },
  quizOption: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 66,
    padding: 17
  },
  quizOptionSelected: {
    backgroundColor: "rgba(255, 218, 214, 0.2)",
    borderColor: employeePalette.red,
    borderWidth: 2,
    padding: 16
  },
  quizRadio: {
    alignItems: "center",
    borderColor: "#8f706b",
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    marginRight: 20,
    width: 20
  },
  quizRadioSelected: {
    backgroundColor: employeePalette.red,
    borderColor: employeePalette.red
  },
  quizRadioDot: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 8,
    width: 8
  },
  quizOptionText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  quizOptionTextSelected: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold
  },
  quizEssaySection: {
    gap: 8,
    paddingTop: 24
  },
  quizEssayTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  quizEssayCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    paddingBottom: 17,
    paddingHorizontal: 17,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  quizEssayPrompt: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  quizTextareaWrap: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 260,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  quizTextarea: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6,
    minHeight: 260,
    paddingHorizontal: 17,
    paddingTop: 16
  },
  quizTextareaIcon: {
    bottom: 16,
    position: "absolute",
    right: 16
  },
  quizBottomActions: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopColor: "#e4e4e7",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    left: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 21,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 12
  },
  quizFooterButton: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48
  },
  quizDraftButton: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.red,
    borderWidth: 1,
    flex: 1.05,
    paddingHorizontal: 12
  },
  quizSubmitButton: {
    backgroundColor: employeePalette.red,
    flex: 1,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  quizDraftButtonText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  quizSubmitButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  resultSafe: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  resultHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f4f4f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 64,
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 1
  },
  resultCloseButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    marginLeft: -10,
    width: 48
  },
  resultHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.6,
    lineHeight: 28.8,
    textAlign: "center"
  },
  resultHeaderSpacer: {
    width: 48
  },
  resultScrollContent: {
    paddingBottom: 72
  },
  resultHero: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    overflow: "hidden",
    paddingBottom: 49,
    paddingHorizontal: 20,
    paddingTop: 24
  },
  resultGoldGlow: {
    backgroundColor: "#fdce67",
    borderRadius: 999,
    height: 128,
    opacity: 0.2,
    position: "absolute",
    right: -40,
    top: -40,
    width: 128
  },
  resultRedGlow: {
    backgroundColor: employeePalette.red,
    borderRadius: 999,
    bottom: -19,
    height: 96,
    left: -20,
    opacity: 0.1,
    position: "absolute",
    width: 96
  },
  resultScoreBlock: {
    alignItems: "center",
    paddingBottom: 16
  },
  resultScoreLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    textAlign: "center"
  },
  resultScoreRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 4,
    justifyContent: "center"
  },
  resultScoreBig: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 64,
    letterSpacing: -3.2,
    lineHeight: 64
  },
  resultScoreTotal: {
    color: "#8f706b",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  resultAchievementCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(238, 192, 91, 0.3)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    width: "100%",
    elevation: 1
  },
  resultMedalCircle: {
    alignItems: "center",
    backgroundColor: "rgba(238, 192, 91, 0.2)",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  resultAchievementTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  },
  resultAchievementText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 19.25,
    marginTop: 3
  },
  resultReviewSection: {
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 48
  },
  resultReviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  resultReviewTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 20,
    lineHeight: 30
  },
  resultCountPill: {
    backgroundColor: employeePalette.subtle,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  resultCountText: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  resultQuestionList: {
    gap: 16
  },
  resultQuestionCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 1
  },
  resultQuestionCardWrong: {
    borderColor: "#ffdad6"
  },
  resultQuestionTop: {
    flexDirection: "row",
    gap: 16,
    padding: 16
  },
  resultQuestionTopExpanded: {
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    paddingBottom: 17
  },
  resultStatusIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    marginTop: 4,
    width: 32
  },
  resultStatusCorrect: {
    backgroundColor: "#e6f4ea"
  },
  resultStatusWrong: {
    backgroundColor: "#fce8e6"
  },
  resultQuestionKicker: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  resultQuestionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 25.6,
    marginBottom: 8,
    marginTop: 3
  },
  resultAnswerLine: {
    borderLeftWidth: 2,
    paddingLeft: 10
  },
  resultAnswerCorrect: {
    borderLeftColor: employeePalette.green
  },
  resultAnswerWrong: {
    borderLeftColor: "#d93025",
    marginBottom: 8
  },
  resultAnswerText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  resultAnswerTextWrong: {
    textDecorationLine: "line-through"
  },
  resultAnswerTextDark: {
    color: employeePalette.text
  },
  resultExplanation: {
    backgroundColor: employeePalette.bg,
    gap: 8,
    padding: 16
  },
  resultExplanationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  resultExplanationTitle: {
    color: employeePalette.goldDark,
    fontFamily: appFonts.regular,
    fontSize: 11,
    letterSpacing: 1.1,
    lineHeight: 16.5
  },
  resultExplanationText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22.75
  },
  resultExplanationImage: {
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 128,
    resizeMode: "cover",
    width: "100%"
  },
  resultDashboardButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#6a0100",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 48,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },
  resultDashboardText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18,
    textAlign: "center"
  },
  inventoryAreaSafe: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  inventoryAreaHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 1
  },
  inventoryAreaHeaderLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  inventoryAreaIconButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    marginLeft: -8,
    width: 40
  },
  inventoryAreaBellButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  inventoryAreaTitle: {
    color: "#000000",
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 28
  },
  inventoryAreaScroll: {
    gap: 24,
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  inventoryAreaSearchRow: {
    flexDirection: "row",
    gap: 8
  },
  inventoryAreaSearchInput: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 14,
    height: 44,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  inventoryAreaSearchText: {
    color: "#6b7280",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 22
  },
  inventoryAreaFilterButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    width: 44,
    elevation: 1
  },
  inventoryAreaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  inventoryAreaCard: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "47.7%",
    flexGrow: 1,
    maxWidth: "47.8%",
    minHeight: 224,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  inventoryAreaCardImageWrap: {
    backgroundColor: employeePalette.subtle,
    height: 120,
    overflow: "hidden",
    width: "100%"
  },
  inventoryAreaCardImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  inventoryAreaHotPill: {
    backgroundColor: "#6a0100",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    top: 8,
    elevation: 1
  },
  inventoryAreaHotText: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  inventoryAreaCardBody: {
    flex: 1,
    justifyContent: "space-between",
    padding: 16
  },
  inventoryAreaCardCopy: {
    gap: 4
  },
  inventoryAreaCardTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  },
  inventoryAreaCardMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  inventoryAreaCardMetaText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20.8
  },
  inventoryAreaCardFooter: {
    alignItems: "center",
    borderTopColor: "#f3f4f5",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 9
  },
  inventoryAreaCardAvailable: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  inventoryAreaBottomNav: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopColor: "#ffffff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    height: 80,
    justifyContent: "space-around",
    left: 0,
    paddingBottom: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 12
  },
  inventoryAreaNavItem: {
    alignItems: "center",
    flex: 1,
    gap: 3,
    justifyContent: "center"
  },
  inventoryAreaNavLabel: {
    color: "rgba(91, 64, 60, 0.6)",
    fontFamily: appFonts.regular,
    fontSize: 11,
    lineHeight: 17.6,
    textAlign: "center"
  },
  inventoryAreaNavLabelActive: {
    color: "#6a0100",
    fontFamily: appFonts.bold
  },
  inventoryMapSafe: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  inventoryMapScroll: {
    paddingBottom: 0
  },
  inventoryMapHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 65,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  inventoryMapBackButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    marginLeft: -8,
    width: 40
  },
  inventoryMapBell: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  inventoryMapLegendWrap: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    height: 37
  },
  inventoryMapLegend: {
    alignItems: "center",
    flexDirection: "row",
    gap: 25,
    height: 37,
    paddingHorizontal: 20
  },
  inventoryLegendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  inventoryLegendDot: {
    borderRadius: 999,
    height: 12,
    width: 12
  },
  inventoryLegendText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  inventoryMapCanvas: {
    backgroundColor: "#ffffff",
    height: 260,
    overflow: "hidden"
  },
  inventoryMapOverview: {
    height: 292,
    resizeMode: "cover",
    width: 414
  },
  inventoryMapControls: {
    gap: 8,
    position: "absolute",
    right: 15,
    top: 54
  },
  inventoryMapControl: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    width: 48,
    elevation: 2
  },
  inventoryLotGrid: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
    paddingBottom: 55,
    paddingHorizontal: 25,
    paddingTop: 25
  },
  inventoryLotCell: {
    alignItems: "center",
    backgroundColor: "#eec05b",
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  inventoryLotHeld: {
    backgroundColor: "#1e8e3e"
  },
  inventoryLotSold: {
    backgroundColor: employeePalette.red
  },
  inventoryLotText: {
    color: "#000000",
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 20
  },
  inventoryLotTextLight: {
    color: "#ffffff"
  },
  inventoryMapSheet: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    marginTop: -1,
    paddingBottom: 58,
    paddingHorizontal: 24,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  inventorySaleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    borderColor: "#c8e6c9",
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  inventorySaleBadgeText: {
    color: "#2e7d32",
    fontFamily: appFonts.regular,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 15
  },
  inventorySheetTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 38.4,
    marginTop: 10
  },
  inventorySheetStats: {
    flexDirection: "row",
    gap: 16,
    paddingBottom: 8,
    paddingTop: 16
  },
  inventoryInfoTile: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    padding: 13
  },
  inventoryInfoLabel: {
    color: "#8f706b",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  inventoryInfoValue: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 30.6
  },
  inventoryPriceRow: {
    alignItems: "flex-end",
    borderTopColor: employeePalette.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 17
  },
  inventoryPriceLabel: {
    color: "#8f706b",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  inventoryPriceValue: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    marginTop: 4
  },
  inventoryPricePerMeter: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  inventoryRouteButton: {
    alignItems: "center",
    backgroundColor: "#eec05b",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    marginTop: 22,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  inventoryPlanningButton: {
    alignItems: "center",
    backgroundColor: "#1e8e3e",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    marginTop: 24,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  inventoryActionText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  inventoryPlanningMap: {
    borderRadius: 10,
    height: 212,
    marginTop: 40,
    resizeMode: "cover",
    width: "100%"
  },
  inventoryComments: {
    borderTopColor: employeePalette.border,
    borderTopWidth: 1,
    gap: 16,
    marginTop: 44,
    paddingTop: 17
  },
  inventoryCommentsHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  inventoryCommentsTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 14
  },
  inventoryCommentsCount: {
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  inventoryCommentsCountText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  inventoryCommentRow: {
    flexDirection: "row",
    gap: 12
  },
  inventoryCommentAvatar: {
    alignItems: "center",
    backgroundColor: employeePalette.redSoft,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  inventoryCommentAvatarGold: {
    backgroundColor: employeePalette.goldSoft
  },
  inventoryCommentInitials: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 10,
    lineHeight: 15
  },
  inventoryCommentInitialsGold: {
    color: employeePalette.goldDark
  },
  inventoryCommentMeta: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8
  },
  inventoryCommentName: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 13,
    lineHeight: 19.5
  },
  inventoryCommentTime: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 11,
    lineHeight: 16.5
  },
  inventoryCommentText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 21.13
  },
  inventoryCommentInput: {
    alignItems: "center",
    backgroundColor: "#f3f4f5",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    minHeight: 50,
    paddingLeft: 16,
    paddingRight: 16
  },
  inventoryCommentPlaceholder: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 22
  },
  lotDetailSafe: {
    backgroundColor: "#d9dadb",
    flex: 1
  },
  lotDetailScroll: {
    backgroundColor: employeePalette.bg,
    paddingBottom: 94
  },
  lotDetailHero: {
    height: 353,
    overflow: "hidden",
    width: "100%"
  },
  lotDetailHeroImage: {
    height: 403,
    left: -87,
    resizeMode: "cover",
    top: 0,
    width: 644
  },
  lotDetailHeroActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
    top: 0
  },
  lotDetailHeroRightActions: {
    flexDirection: "row",
    gap: 8
  },
  lotDetailHeroButton: {
    alignItems: "center",
    backgroundColor: "rgba(248, 249, 250, 0.8)",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    width: 48,
    elevation: 1
  },
  lotDetailGalleryPill: {
    alignItems: "center",
    backgroundColor: "rgba(248, 249, 250, 0.9)",
    borderRadius: 999,
    bottom: 41,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "absolute",
    right: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  lotDetailGalleryText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  lotDetailBody: {
    backgroundColor: employeePalette.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 24,
    marginTop: -24,
    paddingBottom: 52,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  lotDetailTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  lotDetailTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -1.6,
    lineHeight: 44
  },
  lotDetailLocationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  lotDetailLocationText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lotDetailStatusPill: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 17,
    paddingVertical: 9
  },
  lotDetailStatusText: {
    color: "#15803d",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  lotDetailPriceCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1
  },
  lotDetailPriceLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  lotDetailTotalRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12
  },
  lotDetailTotalPrice: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -1.6,
    lineHeight: 44
  },
  lotDetailCurrency: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lotDetailDivider: {
    backgroundColor: employeePalette.border,
    height: 1,
    width: "100%"
  },
  lotDetailUnitRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12
  },
  lotDetailUnitLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lotDetailUnitValue: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  lotDetailStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  lotDetailStatCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "47.5%",
    flexGrow: 1,
    gap: 4,
    minHeight: 107,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  lotDetailStatLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  lotDetailStatValue: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  lotDetailDescriptionSection: {
    gap: 15,
    paddingTop: 16
  },
  lotDetailSectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  lotDetailDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 30.6
  },
  lotDetailNote: {
    color: "#b50000",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 20,
    marginTop: 105
  },
  lotDetailBottomActions: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopColor: "#e4e4e7",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    left: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 21,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 12
  },
  lotDetailActionButton: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center"
  },
  lotDetailLockButton: {
    backgroundColor: "#ffffff",
    borderColor: "#1e8e3e",
    borderWidth: 1,
    flex: 1.05
  },
  lotDetailDepositButton: {
    backgroundColor: employeePalette.red,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  lotDetailLockText: {
    color: "#1e8e3e",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  lotDetailDepositText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  newsFeedSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  newsFeedHeader: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 13,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  newsFeedAvatarSmall: {
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    height: 32,
    overflow: "hidden",
    width: 32
  },
  newsFeedAvatarImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  newsFeedScroll: {
    paddingBottom: 28,
    paddingHorizontal: 20
  },
  newsFeedPageHeader: {
    gap: 3,
    paddingVertical: 24
  },
  newsFeedTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 40
  },
  newsFeedSubtitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  newsCreateCard: {
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  newsCreateBody: {
    flexDirection: "row",
    gap: 16
  },
  newsCreateAvatar: {
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    height: 40,
    overflow: "hidden",
    width: 40
  },
  newsCreatePlaceholder: {
    color: "rgba(91, 64, 60, 0.5)",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 30.6
  },
  newsCreateFooter: {
    alignItems: "center",
    borderTopColor: "rgba(227, 190, 184, 0.3)",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 9
  },
  newsCreateTools: {
    flexDirection: "row",
    gap: 16,
    paddingLeft: 8
  },
  newsCreateButton: {
    alignItems: "center",
    backgroundColor: "#6a0100",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 24,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  newsCreateButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  newsFeedList: {
    gap: 24,
    paddingTop: 48
  },
  newsPostCard: {
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  newsPostHighlighted: {
    borderColor: "#eec05b",
    borderWidth: 2,
    gap: 15,
    overflow: "hidden",
    padding: 26
  },
  newsPostHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  newsPostAuthorRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 16
  },
  newsPostAvatarGold: {
    backgroundColor: employeePalette.border,
    borderColor: "#e3beb8",
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    overflow: "hidden",
    width: 48
  },
  newsPostAvatar: {
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    height: 48,
    overflow: "hidden",
    width: 48
  },
  newsPostAuthor: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 28.8
  },
  newsPostMeta: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  newsStarPill: {
    alignItems: "center",
    backgroundColor: "rgba(255, 223, 159, 0.3)",
    borderColor: "rgba(238, 192, 91, 0.5)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 13,
    paddingVertical: 5
  },
  newsPostTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 30.6
  },
  newsPostBody: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  newsReadMore: {
    color: employeePalette.red,
    fontFamily: appFonts.bold
  },
  newsStandardBody: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  newsPostImage: {
    backgroundColor: "#d9dadb",
    borderColor: "rgba(227, 190, 184, 0.3)",
    borderRadius: 8,
    borderWidth: 1,
    height: 224,
    resizeMode: "cover",
    width: "100%"
  },
  newsPostActions: {
    alignItems: "center",
    borderTopColor: "rgba(227, 190, 184, 0.5)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 16,
    paddingTop: 10
  },
  newsPostAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  newsPostActionShare: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  newsPostActionText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22.4
  },
  newsGoldAccent: {
    backgroundColor: "rgba(238, 192, 91, 0.1)",
    height: 64,
    position: "absolute",
    right: 0,
    top: 0,
    width: 64
  },
  question: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 20,
    lineHeight: 28
  },
  option: {
    borderColor: employeePalette.border,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14
  },
  optionActive: {
    backgroundColor: "#fff7df",
    borderColor: "#eec05b"
  },
  optionText: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22
  },
  resultCard: {
    alignItems: "center"
  },
  resultScore: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 64,
    letterSpacing: -1.6,
    lineHeight: 72
  },
  inventoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  lotCell: {
    alignItems: "center",
    backgroundColor: "#dff7e9",
    borderColor: "rgba(30, 142, 62, 0.25)",
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: "17.5%"
  },
  lotReserved: {
    backgroundColor: "#fff7df",
    borderColor: "#ffd987"
  },
  lotSold: {
    backgroundColor: "#f2f2f2",
    borderColor: employeePalette.border
  },
  lotText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    lineHeight: 16
  },
  legend: {
    flexDirection: "row",
    gap: 8
  },
  pressed: {
    opacity: 0.84
  }
});
