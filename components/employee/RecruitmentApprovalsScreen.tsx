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
import { getPositionLabel } from "./utils/formatters";
export type RecruitmentApplicationData = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  applied_position: number;
  applied_branch_id: number;
  education: string;
  experience: string;
  profile_url: string;
  introduction: string;
  cv_url: string;
  status: "pending" | "approved" | "rejected";
  rejected_reason?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  user?: {
    fullName?: string;
    phone?: string;
  };
  branch?: {
    name?: string;
  };
};

export function RecruitmentApprovalsScreen() {
  const [applications, setApplications] = useState<RecruitmentApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  async function fetchApplications() {
    try {
      const res = await employeeApi.recruitmentApplications();
      if (res && Array.isArray(res.data)) {
        setApplications(res.data);
      }
    } catch (err) {
      console.log("Failed to fetch recruitment applications", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    fetchApplications();
  }

  const filtered = applications.filter((app) => {
    if (filter === "all") return true;
    return app.status === filter;
  });

  return (
    <EmployeePage edges={["top", "left", "right"]} contentStyle={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={employeePalette.redDark} />
        </Pressable>
        <Text style={styles.screenTitle}>Duyệt đơn ứng tuyển</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        {(["pending", "approved", "rejected", "all"] as const).map((tab) => {
          const active = filter === tab;
          const label =
            tab === "pending"
              ? "Chờ duyệt"
              : tab === "approved"
                ? "Đã duyệt"
                : tab === "rejected"
                  ? "Từ chối"
                  : "Tất cả";
          return (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.tabButton, active && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={employeePalette.redDark} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[employeePalette.redDark]} />}
        >
          {filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="document-text-outline" size={48} color="#b0b0b0" />
              <Text style={{ marginTop: 8, color: "#808080", fontFamily: appFonts.regular, fontSize: 16 }}>
                Không có đơn ứng tuyển nào.
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
              <RecruitmentApplicationCard key={item.id} application={item} onChanged={fetchApplications} />
            ))
          )}
        </ScrollView>
      )}
    </EmployeePage>
  );
}

function RecruitmentApplicationCard({
  application,
  onChanged
}: {
  application: RecruitmentApplicationData;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState<"approve" | "reject" | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [reason, setReason] = useState("");

  const statusLabel =
    application.status === "approved"
      ? "Đã duyệt"
      : application.status === "rejected"
        ? "Từ chối"
        : "Chờ duyệt";

  const statusColor =
    application.status === "approved"
      ? "#2e7d32"
      : application.status === "rejected"
        ? "#c62828"
        : "#ef6c00";

  const statusBg =
    application.status === "approved"
      ? "#e8f5e9"
      : application.status === "rejected"
        ? "#ffebee"
        : "#fff3e0";

  async function handleApprove() {
    Alert.alert("Phê duyệt", `Xác nhận phê duyệt hồ sơ của ứng viên ${application.name || application.user?.fullName}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xác nhận",
        onPress: async () => {
          setProcessing("approve");
          try {
            await employeeApi.processRecruitmentApplication(application.id, "approved");
            notifySuccess({ message: "Phê duyệt hồ sơ thành công." });
            onChanged();
          } catch (err: any) {
            notifyError(err);
          } finally {
            setProcessing(null);
          }
        }
      }
    ]);
  }

  async function handleReject() {
    if (!reason.trim()) {
      notifyError("Vui lòng nhập lý do từ chối.");
      return;
    }
    setProcessing("reject");
    try {
      await employeeApi.processRecruitmentApplication(application.id, "rejected", reason.trim());
      notifySuccess({ message: "Đã từ chối hồ sơ ứng tuyển." });
      setRejectModalVisible(false);
      setReason("");
      onChanged();
    } catch (err: any) {
      notifyError(err);
    } finally {
      setProcessing(null);
    }
  }

  function handleOpenCv() {
    if (!application.cv_url) return;
    const url = application.cv_url.startsWith("http")
      ? application.cv_url
      : `${API_URL}/storage/${application.cv_url}`;
    Linking.openURL(url).catch((err) => {
      console.log("Failed to open URL", err);
      notifyError("Không thể mở CV lúc này.");
    });
  }

  return (
    <View style={styles.recruitmentCard}>
      <View style={styles.recruitmentCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recruitmentName}>
            {application.name || application.user?.fullName || "Ứng viên"}
          </Text>
          <Text style={styles.recruitmentPhone}>
            SĐT: {application.phone || application.user?.phone || "Chưa cập nhật"}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.recruitmentInfoRow}>
        <Text style={styles.recruitmentInfoLabel}>Vị trí:</Text>
        <Text style={styles.recruitmentInfoValue}>
          {getPositionLabel(application.applied_position)}
        </Text>
      </View>
      <View style={styles.recruitmentInfoRow}>
        <Text style={styles.recruitmentInfoLabel}>Chi nhánh:</Text>
        <Text style={styles.recruitmentInfoValue}>
          {application.branch?.name || "Chưa cập nhật"}
        </Text>
      </View>

      {expanded && (
        <View style={styles.recruitmentDetails}>
          <View style={styles.detailDivider} />
          {application.education && (
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>Học vấn:</Text>
              <Text style={styles.detailValue}>{application.education}</Text>
            </View>
          )}
          {application.experience && (
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>Kinh nghiệm:</Text>
              <Text style={styles.detailValue}>{application.experience}</Text>
            </View>
          )}
          {application.introduction && (
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>Giới thiệu:</Text>
              <Text style={styles.detailValue}>{application.introduction}</Text>
            </View>
          )}
          {application.profile_url && (
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>Profile link:</Text>
              <Pressable onPress={() => Linking.openURL(application.profile_url)}>
                <Text style={[styles.detailValue, { color: "#0066cc", textDecorationLine: "underline" }]}>
                  {application.profile_url}
                </Text>
              </Pressable>
            </View>
          )}
          {application.cv_url && (
            <View style={styles.detailField}>
              <Text style={styles.detailLabel}>CV file:</Text>
              <Pressable onPress={handleOpenCv} style={styles.cvButton}>
                <Ionicons name="document-attach-outline" size={16} color="#6a0100" />
                <Text style={styles.cvButtonText}>Xem CV đính kèm</Text>
              </Pressable>
            </View>
          )}
          {application.rejected_reason && (
            <View style={[styles.detailField, { backgroundColor: "#ffebee", padding: 8, borderRadius: 6 }]}>
              <Text style={[styles.detailLabel, { color: "#c62828" }]}>Lý do từ chối:</Text>
              <Text style={[styles.detailValue, { color: "#c62828" }]}>{application.rejected_reason}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.recruitmentCardActions}>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.toggleExpandButton}>
          <Text style={styles.toggleExpandText}>{expanded ? "Thu gọn" : "Xem chi tiết"}</Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
        </Pressable>

        {application.status === "pending" && (
          <View style={styles.actionButtonContainer}>
            <Pressable
              disabled={processing !== null}
              onPress={() => setRejectModalVisible(true)}
              style={[styles.actionBtn, styles.rejectBtn]}
            >
              <Text style={styles.actionBtnTextReject}>Từ chối</Text>
            </Pressable>
            <Pressable
              disabled={processing !== null}
              onPress={handleApprove}
              style={[styles.actionBtn, styles.approveBtn]}
            >
              {processing === "approve" ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.actionBtnTextApprove}>Duyệt</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <Modal animationType="fade" onRequestClose={() => setRejectModalVisible(false)} transparent visible={rejectModalVisible}>
        <Pressable onPress={() => setRejectModalVisible(false)} style={styles.modalBackdrop}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Từ chối hồ sơ</Text>
            <Text style={styles.modalSubtitle}>Nhập lý do từ chối hồ sơ của ứng viên {application.name}:</Text>
            <TextInput
              multiline
              onChangeText={setReason}
              placeholder="Nhập lý do từ chối tại đây..."
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={reason}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setRejectModalVisible(false)} style={[styles.modalBtn, styles.modalCancelBtn]}>
                <Text style={styles.modalBtnTextCancel}>Hủy</Text>
              </Pressable>
              <Pressable disabled={processing !== null} onPress={handleReject} style={[styles.modalBtn, styles.modalConfirmBtn]}>
                {processing === "reject" ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalBtnTextConfirm}>Từ chối</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

