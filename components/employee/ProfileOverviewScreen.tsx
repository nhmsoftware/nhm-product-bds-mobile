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
import { apiText, avatarInitial, isApiObject } from "./utils/apiNormalizers";
import { profileImages, showProfileRewardHistoryShortcut } from "./utils/constants";
import { normalizeRewardRank, rewardRankName } from "./utils/formatters";
import { useCopy } from "./utils/i18n";
import { employeeApplicationStatusText, hasApprovedEmployeeProfile, loadLearningCertificateData } from "./utils/sharedHelpers";

import { vi } from "./utils/i18n";
function isRemoteImage(value: string) {
  return /^(data:image\/|https?:\/\/.*\.(?:png|jpe?g|webp|gif|svg)(?:$|[?#]))/i.test(value);
}
// ---- Local helpers ----

function isRemoteSvg(value: string) {
  return /\.svg($|\?)/i.test(value);
}
// ---- Local helpers ----

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

export function ProfileOverviewScreen() {
  const qrCopy = useCopy().qr;
  const { session, signOut } = useAuth();
  const user = session?.user;
  const hidePersonalAchievementSections = isExecutiveAdminRole(user?.role);
  const skipPersonalAchievementApi = !user?.role || hidePersonalAchievementSections;
  const { data: profileData } = useEmployeeApiData(() => employeeApi.employeeProfile(), []);
  const { data: rewardOverviewData } = useEmployeeApiData(
    () => skipPersonalAchievementApi ? Promise.resolve({ data: {} }) : employeeApi.rewardPointOverview(),
    [skipPersonalAchievementApi]
  );
  const { data: customerQrData } = useEmployeeApiData(() => employeeApi.customerReferralQr(), []);
  const { data: recruitmentQrData } = useEmployeeApiData(() => employeeApi.recruitmentReferralQr(), []);
  const { data: learningCertificateData } = useEmployeeApiData(
    () => skipPersonalAchievementApi ? Promise.resolve({ data: { certificates: [], quizRows: [] } }) : loadLearningCertificateData(),
    [skipPersonalAchievementApi]
  );
  const [activeProfileQr, setActiveProfileQr] = useState<"recruitment" | "customer">("customer");
  const profile = isApiObject(profileData) ? profileData : {};
  const rewardOverview = isApiObject(rewardOverviewData) ? rewardOverviewData : {};
  const isManager = isManagerAccessRole(user?.role);
  const canApproveDepartmentTransfers = isDepartmentTransferApproverRole(user?.role);
  const fullName = apiText(profile.full_name ?? profile.name ?? user?.fullName, "Chưa cập nhật tên");
  const jobTitle = apiText(profile.job_position ?? profile.position ?? user?.jobPosition, "Chưa có chức danh");
  const approvedEmployeeProfile = hasApprovedEmployeeProfile(user);
  const profileRankValue = rewardOverview.rank ?? rewardOverview.rank_label ?? rewardOverview.tier ?? profile.rank ?? profile.rank_label ?? profile.tier;
  const profileRankName = rewardRankName(profileRankValue);
  const profileRankText = normalizeRewardRank(profileRankValue);
  const profileRewardPoints = apiText(
    rewardOverview.total_points ?? rewardOverview.reward_points ?? rewardOverview.points ?? profile.reward_points ?? profile.total_points,
    "0"
  );
  const profileRankSummary = `${profileRankName === "Chưa xếp hạng" ? profileRankName : `Hạng ${profileRankName}`} hiện tại với ${profileRewardPoints} điểm tích lũy.`;
  const customerQr = referralQrValue(customerQrData);
  const activeProfileQrValue = customerQr;
  const activeProfileReferralCode = isApiObject(customerQrData) ? apiText(customerQrData.referral_code ?? customerQrData.referralCode ?? customerQrData.code, "") : "";
  const profileCertificates = learningCertificateData?.certificates ?? [];
  const profileQuizRows = learningCertificateData?.quizRows ?? [];
  const profileUser = isApiObject(profile.user) ? profile.user : {};
  const profileAvatarUri = mediaUrl(user?.avatar ?? profileUser.avatar ?? profile.avatar);
  const profileInitial = avatarInitial(user?.fullName ?? profileUser.name ?? profile.name);

  function confirmSignOut() {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xác nhận", style: "destructive", onPress: () => void signOut() }
    ]);
  }

  async function shareProfileQr() {
    try {
      await Share.share({
        message: referralQrShareText(
          customerQrData,
          activeProfileQrValue || qrCopy.customerSubtitle
        )
      });
    } catch (error) {
      appLogger.warn("employee.profile.referral_qr.share", "Không thể chia sẻ mã giới thiệu.", { error });
      notifyError("Không thể chia sẻ mã lúc này.");
    }
  }

  return (
    <EmployeePage edges={["top", "left", "right"]} contentStyle={styles.profileFigmaContent}>
      <View style={styles.profileHeroCard}>
        <View style={styles.profileHeroDecoration} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/employee/personal-info", params: { from: "profile" } })}
          style={({ pressed }) => [styles.profileHeroAvatarButton, pressed && styles.pressed]}
        >
          {profileAvatarUri ? (
            <Image source={{ uri: profileAvatarUri }} style={styles.profileHeroAvatar} />
          ) : (
            <View style={styles.profileHeroAvatarFallback}>
              <Text style={styles.profileHeroAvatarInitial}>{profileInitial}</Text>
            </View>
          )}
        </Pressable>
        <Image source={profileImages.verifiedBadge} style={styles.profileVerifyBadgeImage} />
        <Text style={styles.profileHeroName}>{fullName}</Text>
        <Text style={styles.profileHeroRole}>{jobTitle}</Text>
        {hidePersonalAchievementSections ? null : (
          <View style={styles.profileRankPill}>
            <ProfileRankIcon />
            <Text style={styles.profileRankPillText}>{profileRankText}</Text>
          </View>
        )}
      </View>

      {hidePersonalAchievementSections ? null : (
        <>
          <Text style={styles.profileSectionTitle}>Xếp hạng</Text>
          <Text style={styles.bodyText}>{profileRankSummary}</Text>
          {showProfileRewardHistoryShortcut ? <ProfileRewardHistoryButton /> : null}

          <View style={styles.profileSectionHeader}>
            <Text style={styles.profileSectionTitle}>Chứng chỉ đã đạt</Text>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push({ pathname: "/employee/certificates", params: { from: "profile" } })}
              style={({ pressed }) => [styles.profileSeeAllButton, pressed && styles.pressed]}
            >
              <Text style={styles.profileSeeAll}>Xem tất cả</Text>
            </Pressable>
          </View>
          {profileCertificates.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileCertList}>
              {profileCertificates.map((certificate, index) => (
                <ProfileCertificateCard
                  key={certificate.id}
                  compact={index > 0}
                  date={certificate.issuedAt}
                  title={certificate.title}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.bodyText}>Chưa có chứng chỉ hoàn thành khóa học.</Text>
          )}

          <Text style={styles.profileSectionTitle}>Điểm thi trắc nghiệm</Text>
          <View style={styles.profileScoreList}>
            {profileQuizRows.length > 0 ? (
              profileQuizRows.map((row) => <ProfileScoreRow key={row.title} {...row} />)
            ) : (
              <Text style={styles.bodyText}>Chưa có điểm bài kiểm tra.</Text>
            )}
          </View>
        </>
      )}

      {isManager ? <ProfileManagerActions canApproveDepartmentTransfers={canApproveDepartmentTransfers} userRole={user?.role} /> : <ProfileEmployeeActions />}

      {approvedEmployeeProfile ? (
        <View style={styles.profileQrSection}>
          <Text style={[styles.profileSectionTitle, styles.profileQrTitle]}>{qrCopy.title}</Text>
          <ReferralQrPanel
            copy={qrCopy}
            mode="customer"
            onShare={shareProfileQr}
            qrValue={activeProfileQrValue}
            referralCode={activeProfileReferralCode}
          />
        </View>
      ) : (
        <View style={styles.profileQrSection}>
          <Text style={[styles.profileSectionTitle, styles.profileQrTitle]}>Hồ sơ ứng tuyển</Text>
          <Text style={styles.bodyText}>{employeeApplicationStatusText(user)}</Text>
          <EmployeeButton title="Mở form ứng tuyển" tone="red" icon="document-text-outline" onPress={() => router.push("/(app)/employee/application" as Href)} />
        </View>
      )}
      <EmployeeButton title="Đăng xuất" tone="light" icon="log-out-outline" onPress={confirmSignOut} style={styles.logoutButton} />
    </EmployeePage>
  );
}

function ProfileEmployeeActions() {
  return (
    <View style={styles.profileActionCard}>
      <Pressable
        onPress={() => router.push({ pathname: "/(app)/employee/leave-requests", params: { from: "profile" } })}
        style={({ pressed }) => [styles.profileLeaveButton, pressed && styles.pressed]}
      >
        <Text style={styles.profileLeaveButtonText}>Xin phép nghỉ</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push({ pathname: "/(app)/employee/transfer-requests", params: { from: "profile" } })}
        style={({ pressed }) => [styles.profileTransferButton, pressed && styles.pressed]}
      >
        <Ionicons name="send" size={17} color="#ffffff" />
        <Text style={styles.profileTransferButtonText}>Xin phép chuyển phòng ban</Text>
      </Pressable>
    </View>
  );
}

function ProfileManagerActions({ canApproveDepartmentTransfers, userRole }: { canApproveDepartmentTransfers: boolean; userRole?: any }) {
  return (
    <View style={styles.profileActionCard}>
      <Pressable
        onPress={() => router.push({ pathname: "/(app)/employee/leave-requests", params: { from: "profile" } })}
        style={({ pressed }) => [styles.profileLeaveButton, pressed && styles.pressed]}
      >
        <Text style={styles.profileLeaveButtonText}>Duyệt đơn xin nghỉ phép</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push({ pathname: "/(app)/employee/transfer-requests", params: { from: "profile" } })}
        style={({ pressed }) => [styles.profileTransferButton, pressed && styles.pressed]}
      >
        <Ionicons name={canApproveDepartmentTransfers ? "swap-horizontal" : "send"} size={17} color="#ffffff" />
        <Text style={styles.profileTransferButtonText}>
          {canApproveDepartmentTransfers ? "Duyệt đơn xin chuyển phòng ban" : "Xin phép chuyển phòng ban"}
        </Text>
      </Pressable>
      {isRecruitmentApproverRole(userRole) ? (
        <Pressable
          onPress={() => router.push({ pathname: "/(app)/employee/recruitment-approvals", params: { from: "profile" } })}
          style={({ pressed }) => [styles.profileLeaveButton, { backgroundColor: "#795900", borderColor: "#795900", marginTop: 8 }, pressed && styles.pressed]}
        >
          <Text style={[styles.profileLeaveButtonText, { color: "#FFD700" }]}>Duyệt đơn ứng tuyển</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => router.push({ pathname: "/(app)/employee/department-staff", params: { from: "profile" } })}
        style={({ pressed }) => [styles.profileReceiveTransferButton, pressed && styles.pressed]}
      >
        <Ionicons name="send" size={17} color="#ffffff" />
        <Text style={styles.profileTransferButtonText}>Danh sách nhân viên</Text>
      </Pressable>
    </View>
  );
}

function ProfileRewardHistoryButton() {
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/employee/point-history", params: { from: "profile" } })}
      style={({ pressed }) => [styles.profileRewardHistoryButton, pressed && styles.pressed]}
    >
      <View style={styles.profileRewardHistoryIcon}>
        <ProfileRankIcon />
      </View>
      <View style={styles.flex}>
        <Text style={styles.profileRewardHistoryTitle}>Lịch sử điểm</Text>
        <Text style={styles.profileRewardHistorySubtitle}>Xem điểm thưởng và thành tích tích lũy</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={employeePalette.muted} />
    </Pressable>
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
        <Text style={styles.profileScoreMax}>/10</Text>
      </View>
    </View>
  );
}



// ---- Local helpers extracted from original monolith ----

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


// ---- Local helpers extracted from original monolith ----

function referralQrValue(data: unknown) {
  if (!isApiObject(data)) {
    return "";
  }

  const value = apiText(
    data.qr_url ??
      data.qrUrl ??
      data.qr_image ??
      data.qrImage ??
      data.image_url ??
      data.imageUrl ??
      data.qr_value ??
      data.qrValue ??
      data.qr_data ??
      data.qrData ??
      data.share_url ??
      data.shareUrl ??
      data.url ??
      data.referral_code ??
      data.referralCode ??
      data.code,
    ""
  );

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return value;
}


// ---- Local helpers extracted from original monolith ----

function referralQrShareText(data: unknown, fallback: string) {
  if (!isApiObject(data)) {
    return fallback;
  }

  return apiText(
    data.share_text ??
      data.shareText ??
      data.description ??
      data.referral_code ??
      data.referralCode,
    fallback
  );
}


// ---- Local helpers extracted from original monolith ----

function ReferralQrPanel({
  copy,
  mode = "customer",
  onShare,
  qrValue = "",
  referralCode = ""
}: {
  copy: typeof vi.qr;
  mode?: "recruitment" | "customer";
  onShare?: () => void;
  qrValue?: string;
  referralCode?: string;
}) {
  const helper = mode === "customer" ? copy.customerSubtitle : copy.recruitmentSubtitle;
  const remoteImage = isRemoteImage(qrValue);
  const remoteSvg = remoteImage && isRemoteSvg(qrValue);

  const copyToClipboard = () => {
    if (referralCode) {
      Clipboard.setString(referralCode);
      notifySuccess({ message: "Đã sao chép mã giới thiệu vào bộ nhớ tạm." });
    }
  };

  return (
    <View style={styles.qrCard}>
      <Text style={styles.referralQrHelper}>{helper}</Text>
      <View style={styles.qrImageFrame}>
        {remoteSvg ? (
          <SvgUri height={160} uri={qrValue} width={160} />
        ) : remoteImage ? (
          <Image source={{ uri: qrValue }} style={styles.qrImage} />
        ) : qrValue ? (
          <QRCode backgroundColor="#ffffff" color="#191C1D" size={160} value={qrValue} />
        ) : (
          <ReferralQrCode />
        )}
      </View>

      {referralCode ? (
        <Pressable 
          accessibilityRole="button"
          onPress={copyToClipboard}
          style={({ pressed }) => [styles.referralCodeContainer, pressed && styles.pressed]}
        >
          <Text style={styles.referralCodeLabel}>MÃ GIỚI THIỆU CỦA BẠN</Text>
          <View style={styles.referralCodeRow}>
            <Text style={styles.referralCodeText}>{referralCode}</Text>
            <Ionicons name="copy-outline" size={16} color={employeePalette.red} />
          </View>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onShare}
        style={({ pressed }) => [styles.qrShareButton, pressed && styles.pressed]}
      >
        <Ionicons name="share-social-outline" size={17} color="#ffffff" />
        <Text style={styles.qrShareText}>{copy.share}</Text>
      </Pressable>
    </View>
  );
}

