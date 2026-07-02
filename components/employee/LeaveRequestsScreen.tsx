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
import { apiList, apiNumber, apiText } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { backWithProfileSource } from "./utils/navigation";
import { formatPersonalDateValue } from "./utils/sharedHelpers";
import { formatPersonalDateDisplay, parsePersonalDate, personalCalendarCells } from "./utils/sharedHelpers";
export function LeaveRequestsScreen() {
  const { session } = useAuth();

  if (!isManagerAccessRole(session?.user.role, session?.user.permissions)) {
    return <EmployeeLeaveSelfServiceScreen />;
  }

  return <LeaveApprovalRequestsScreen />;
}

function LeaveApprovalRequestsScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.leaveRequests(), [refreshKey]);
  const [filter, setFilter] = useState<LeaveStatusFilter>("all");
  const rows = leaveRowsFromApi(data);
  const filteredRows = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.leaveSafe}>
      <View style={styles.leaveHeader}>
        <Pressable accessibilityRole="button" onPress={handleBack} style={styles.leaveHeaderButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </Pressable>
        <Text style={styles.leaveHeaderTitle}>Xin nghỉ phép</Text>
        <EmployeeNotificationButton returnTo="/employee/leave-requests" />
      </View>

      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.leaveScrollContent}
        style={styles.leaveRoot}
      >
        <View style={styles.leaveIntro}>
          <Text style={styles.leaveTitle}>Danh sách Xin nghỉ phép</Text>
          <Text style={styles.leaveSubtitle}>Quản lý và phê duyệt yêu cầu nghỉ phép của nhân viên.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leaveFilterContent}
          style={styles.leaveFilterScroll}
        >
          {leaveFilterTabs.map((tab) => (
            <Pressable
              key={tab.value}
              accessibilityRole="button"
              onPress={() => setFilter(tab.value)}
              style={[styles.leaveFilterChip, filter === tab.value && styles.leaveFilterChipActive]}
            >
              <Text style={[styles.leaveFilterText, filter === tab.value && styles.leaveFilterTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {failed ? (
          <Text style={styles.leaveStateText}>Không thể tải dữ liệu nghỉ phép. Vui lòng thử lại.</Text>
        ) : null}
        {loading ? <Text style={styles.leaveStateText}>Đang tải danh sách nghỉ phép...</Text> : null}
        {!loading && !failed && filteredRows.length === 0 ? (
          <Text style={styles.leaveStateText}>Chưa có yêu cầu nghỉ phép nào.</Text>
        ) : null}

        <View style={styles.leaveList}>
          {filteredRows.map((row) => (
            <LeaveRequestCard
              key={row.id}
              onChanged={() => setRefreshKey((value) => value + 1)}
              request={row}
              collapsibleDetails={true}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type EmployeeLeaveForm = {
  approver_id: string;
  end_date: string;
  leave_type: string;
  reason: string;
  start_date: string;
};

type EmployeeLeaveHistoryRow = {
  approverName: string;
  dateRange: string;
  id: string;
  leaveType: string;
  reason: string;
  rejectionReason: string;
  status: LeaveRequestCardData["status"] | "cancelled";
};

const leaveTypeOptions = [
  { label: "Nghỉ phép năm", value: "1" },
  { label: "Nghỉ không lương", value: "2" },
  { label: "Nghỉ cá nhân", value: "3" },
  { label: "Nghỉ thai sản", value: "4" },
  { label: "Nghỉ công tác", value: "5" },
  { label: "Nghỉ bù", value: "6" }
];

function defaultLeaveForm(): EmployeeLeaveForm {
  const today = formatPersonalDateValue(new Date());

  return {
    approver_id: "",
    end_date: today,
    leave_type: leaveTypeOptions[0].value,
    reason: "",
    start_date: today
  };
}

function leaveTypeLabel(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const aliases: Record<string, string> = {
    annual: "1",
    unpaid: "2",
    personal: "3",
    maternity: "4",
    business: "5",
    compensatory: "6"
  };
  const optionValue = aliases[normalized] ?? normalized;
  return leaveTypeOptions.find((option) => option.value === optionValue)?.label || apiText(value, "Nghỉ phép");
}

function normalizeLeaveHistoryStatus(status: unknown): EmployeeLeaveHistoryRow["status"] {
  const value = String(status ?? "").trim().toLowerCase();
  if (["4", "cancelled"].includes(value) || value.includes("hủy")) return "cancelled";
  return normalizeLeaveStatus(status);
}

function leaveHistoryRowsFromApi(data: unknown): EmployeeLeaveHistoryRow[] {
  return apiList(data).map((item, index) => ({
    approverName: apiText(item.approver_name ?? item.approverName, ""),
    dateRange: formatLeaveDateRange(item),
    id: apiText(item.id, `leave-history-${index}`),
    leaveType: leaveTypeLabel(item.leave_type ?? item.leaveType ?? item.type),
    reason: apiText(item.reason ?? item.detail ?? item.note, "Chưa cập nhật lý do nghỉ."),
    rejectionReason: apiText(item.rejection_reason ?? item.rejectionReason, ""),
    status: normalizeLeaveHistoryStatus(item.status ?? item.status_label)
  }));
}

function EmployeeLeaveSelfServiceScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const [form, setForm] = useState<EmployeeLeaveForm>(() => defaultLeaveForm());
  const [dateField, setDateField] = useState<"start_date" | "end_date" | null>(null);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [approvers, setApprovers] = useState<{ id: string; name: string }[]>([]);
  const [approversLoading, setApproversLoading] = useState(true);
  const [approverPickerVisible, setApproverPickerVisible] = useState(false);
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.leaveHistory(), [refreshKey]);
  const historyRows = leaveHistoryRowsFromApi(data);
  const selectedLeaveType = leaveTypeLabel(form.leave_type);
  const selectedApprover = approvers.find((a) => a.id === form.approver_id);

  useEffect(() => {
    setApproversLoading(true);
    employeeApi.leaveApprovers()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setApprovers(list);
      })
      .catch(() => setApprovers([]))
      .finally(() => setApproversLoading(false));
  }, []);

  function updateForm(key: keyof EmployeeLeaveForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitLeaveRequest() {
    const normalizedReason = form.reason.trim();

    if (!form.leave_type || !form.start_date || !form.end_date || !normalizedReason) {
      notifyError("Vui lòng nhập đầy đủ thông tin nghỉ phép.");
      return;
    }

    if (!form.approver_id) {
      notifyError("Vui lòng chọn người phê duyệt.");
      return;
    }

    if (normalizedReason.length < 5) {
      notifyError("Lý do nghỉ phép phải có ít nhất 5 ký tự.");
      return;
    }

    if (form.end_date < form.start_date) {
      notifyError("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await employeeApi.createLeaveRequest({
        approver_id: form.approver_id,
        end_date: form.end_date,
        leave_type: form.leave_type,
        reason: normalizedReason,
        start_date: form.start_date
      });

      notifySuccess({ message: response.message || "Gửi yêu cầu nghỉ phép thành công." });
      setForm((current) => ({ ...current, reason: "" }));
      setRefreshKey((current) => current + 1);
    } catch (error) {
      notifyError(error, "Không thể gửi yêu cầu nghỉ phép. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.leaveSafe}>
      <View style={styles.leaveHeader}>
        <Pressable accessibilityRole="button" onPress={handleBack} style={styles.leaveHeaderButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </Pressable>
        <Text style={styles.leaveHeaderTitle}>Xin nghỉ phép</Text>
        <EmployeeNotificationButton returnTo="/employee/leave-requests" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.leaveScrollContent}
        style={styles.leaveRoot}
      >
        <View style={styles.leaveIntroCompact}>
          <Text style={styles.leaveTitle}>Tạo đơn nghỉ phép</Text>
          <Text style={styles.leaveSubtitle}>Gửi yêu cầu để quản lý xét duyệt theo quy trình nhân sự.</Text>
        </View>

        <View style={styles.leaveFormCard}>
          <Text style={styles.leaveFormTitle}>Thông tin nghỉ phép</Text>
          <View style={styles.personalField}>
            <Text style={styles.personalFieldLabel}>Loại nghỉ phép</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setTypeModalVisible(true)}
              style={({ pressed }) => [styles.leaveTypeButton, pressed && styles.pressed]}
            >
              <Text style={styles.leaveTypeButtonText}>{selectedLeaveType}</Text>
              <Ionicons name="chevron-down" size={18} color="#950100" />
            </Pressable>
          </View>

          <PersonalDateField label="Ngày bắt đầu" value={form.start_date} onPress={() => setDateField("start_date")} />
          <PersonalDateField label="Ngày kết thúc" value={form.end_date} onPress={() => setDateField("end_date")} />
          <PersonalField
            label="Lý do nghỉ"
            multiline
            onChangeText={(value: string) => updateForm("reason", value)}
            placeholder="Nhập lý do nghỉ phép"
            value={form.reason}
          />

          <View style={styles.personalField}>
            <Text style={styles.personalFieldLabel}>Người phê duyệt</Text>
            {approversLoading ? (
              <Text style={styles.leaveTypeButtonText}>Đang tải...</Text>
            ) : approvers.length === 0 ? (
              <Text style={[styles.leaveTypeButtonText, { color: "#93000a" }]}>
                Không tìm thấy Trưởng phòng
              </Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setApproverPickerVisible(true)}
                style={({ pressed }) => [styles.leaveTypeButton, pressed && styles.pressed]}
              >
                <Text style={styles.leaveTypeButtonText}>
                  {selectedApprover ? selectedApprover.name : "Chọn người phê duyệt"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#950100" />
              </Pressable>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={submitting || approversLoading || approvers.length === 0}
            onPress={submitLeaveRequest}
            style={({ pressed }) => [styles.leaveSubmitButton, (pressed || submitting) && styles.pressed]}
          >
            <Ionicons name="send" size={18} color="#ffffff" />
            <Text style={styles.leaveSubmitText}>{submitting ? "Đang gửi yêu cầu" : "Gửi yêu cầu"}</Text>
          </Pressable>
        </View>

        <View style={styles.leaveHistoryHeader}>
          <Text style={styles.leaveHistoryTitle}>Lịch sử nghỉ phép</Text>
          {loading ? <Text style={styles.leaveHistoryMeta}>Đang tải...</Text> : <Text style={styles.leaveHistoryMeta}>{historyRows.length} đơn</Text>}
        </View>

        {failed ? <Text style={styles.leaveStateText}>Không thể tải lịch sử nghỉ phép. Vui lòng thử lại.</Text> : null}
        {!loading && historyRows.length === 0 ? <Text style={styles.leaveStateText}>Chưa có lịch sử nghỉ phép.</Text> : null}

        <View style={styles.leaveList}>
          {historyRows.map((row) => (
            <EmployeeLeaveHistoryCard key={row.id} request={row} onChanged={() => setRefreshKey((current) => current + 1)} />
          ))}
        </View>
      </ScrollView>

      <LeaveTypePickerModal
        onClose={() => setTypeModalVisible(false)}
        onSelect={(value) => {
          updateForm("leave_type", value);
          setTypeModalVisible(false);
        }}
        value={form.leave_type}
        visible={typeModalVisible}
      />
      <PersonalDatePickerModal
        title={dateField === "end_date" ? "Chọn ngày kết thúc" : "Chọn ngày bắt đầu"}
        value={dateField ? form[dateField] : form.start_date}
        visible={dateField !== null}
        onClose={() => setDateField(null)}
        onSelect={(value) => {
          if (dateField) updateForm(dateField, value);
          setDateField(null);
        }}
      />
      <ApproverPickerModal
        approvers={approvers}
        onClose={() => setApproverPickerVisible(false)}
        onSelect={(id) => {
          updateForm("approver_id", id);
          setApproverPickerVisible(false);
        }}
        value={form.approver_id}
        visible={approverPickerVisible}
      />
    </SafeAreaView>
  );
}

function leaveHistoryStatusLabel(status: EmployeeLeaveHistoryRow["status"]) {
  if (status === "approved") return "Đã duyệt";
  if (status === "rejected") return "Từ chối";
  if (status === "cancelled") return "Đã hủy";
  return "Chờ duyệt";
}

function EmployeeLeaveHistoryCard({
  onChanged,
  request
}: {
  onChanged: () => void;
  request: EmployeeLeaveHistoryRow;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const isPending = request.status === "pending";
  const isRejected = request.status === "rejected";
  const isCancelled = request.status === "cancelled";
  const badgeStyle =
    request.status === "approved"
      ? styles.leaveBadgeApproved
      : isRejected || isCancelled
        ? styles.leaveBadgeRejected
        : styles.leaveBadgePending;
  const badgeTextStyle =
    request.status === "approved"
      ? styles.leaveBadgeApprovedText
      : isRejected || isCancelled
        ? styles.leaveBadgeRejectedText
        : styles.leaveBadgePendingText;

  async function cancelRequest() {
    setSubmitting(true);
    try {
      const response = await employeeApi.cancelLeaveRequest(request.id);
      notifySuccess({ message: response.message || "Hủy yêu cầu nghỉ phép thành công." });
      onChanged();
    } catch (error) {
      notifyError(error, "Không thể hủy yêu cầu nghỉ phép. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.leaveCard, (isRejected || isCancelled) && styles.leaveCardRejected]}>
      <View style={styles.leaveHistoryCardTop}>
        <View style={styles.leaveHistoryCardTitleRow}>
          <Ionicons name="calendar-outline" size={18} color="#950100" />
          <Text style={styles.leaveHistoryCardTitle}>{request.leaveType}</Text>
        </View>
        <View style={[styles.leaveBadge, badgeStyle]}>
          <Text style={[styles.leaveBadgeText, badgeTextStyle]}>{leaveHistoryStatusLabel(request.status)}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setDetailsExpanded((value) => !value)}
        style={({ pressed }) => [styles.leaveDetailBox, styles.leaveDetailBoxPressable, pressed && styles.pressed]}
      >
        <View style={styles.leaveDetailRow}>
          <Ionicons name="time-outline" size={16} color="#950100" />
          <Text numberOfLines={detailsExpanded ? undefined : 1} style={styles.leaveDateText}>{request.dateRange}</Text>
          <Ionicons name={detailsExpanded ? "chevron-up" : "chevron-down"} size={16} color="#8f706b" />
        </View>
        <View style={styles.leaveDetailRow}>
          <Ionicons name="menu-outline" size={16} color="#5b403c" />
          <Text numberOfLines={detailsExpanded ? undefined : 2} style={styles.leaveReasonText}>{request.reason}</Text>
        </View>
        {request.rejectionReason ? (
          <View style={styles.leaveDetailRow}>
            <Ionicons name="alert-circle-outline" size={16} color="#93000a" />
            <Text numberOfLines={detailsExpanded ? undefined : 2} style={styles.leaveReasonText}>{request.rejectionReason}</Text>
          </View>
        ) : null}
        {request.approverName ? (
          <View style={styles.leaveDetailRow}>
            <Ionicons name="person-outline" size={16} color="#950100" />
            <Text numberOfLines={1} style={styles.leaveReasonText}>Phê duyệt: {request.approverName}</Text>
          </View>
        ) : null}
      </Pressable>

      {isPending ? (
        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={cancelRequest}
          style={({ pressed }) => [styles.leaveCancelButton, (pressed || submitting) && styles.pressed]}
        >
          <Text style={styles.leaveCancelText}>{submitting ? "Đang hủy" : "Hủy yêu cầu"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function LeaveTypePickerModal({
  onClose,
  onSelect,
  value,
  visible
}: {
  onClose: () => void;
  onSelect: (value: string) => void;
  value: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.transferRejectOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.leaveTypeModal}>
          <View style={styles.leaveTypeModalHeader}>
            <Text style={styles.leaveTypeModalTitle}>Chọn loại nghỉ phép</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>
          <View style={styles.leaveTypeModalList}>
            {leaveTypeOptions.map((option) => {
              const active = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => onSelect(option.value)}
                  style={({ pressed }) => [styles.leaveTypeOption, active && styles.leaveTypeOptionActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.leaveTypeOptionText, active && styles.leaveTypeOptionTextActive]}>{option.label}</Text>
                  {active ? <Ionicons name="checkmark" size={18} color="#950100" /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ApproverPickerModal({
  approvers,
  onClose,
  onSelect,
  value,
  visible
}: {
  approvers: { id: string; name: string }[];
  onClose: () => void;
  onSelect: (id: string) => void;
  value: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.transferRejectOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.leaveTypeModal}>
          <View style={styles.leaveTypeModalHeader}>
            <Text style={styles.leaveTypeModalTitle}>Chọn người phê duyệt</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>
          <View style={styles.leaveTypeModalList}>
            {approvers.map((approver) => {
              const active = approver.id === value;
              return (
                <Pressable
                  key={approver.id}
                  accessibilityRole="button"
                  onPress={() => onSelect(approver.id)}
                  style={({ pressed }) => [styles.leaveTypeOption, active && styles.leaveTypeOptionActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.leaveTypeOptionText, active && styles.leaveTypeOptionTextActive]}>{approver.name}</Text>
                  {active ? <Ionicons name="checkmark" size={18} color="#950100" /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

type LeaveStatusFilter = "all" | "pending" | "approved" | "rejected";

export type TransferApprovalStep = {
  currentStep: number;
  currentManagerName?: string;
  currentManagerApprovedAt?: string;
  targetManagerName?: string;
  targetManagerApprovedAt?: string;
  directorName?: string;
  directorApprovedAt?: string;
};

export type LeaveRequestCardData = {
  id: string;
  name: string;
  department: string;
  dateRange: string;
  reason: string;
  status: Exclude<LeaveStatusFilter, "all"> | "cancelled";
  avatar: ImageSourcePropType;
  transferApproval?: TransferApprovalStep;
};

const leaveFilterTabs: { label: string; value: LeaveStatusFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đã duyệt", value: "approved" },
  { label: "Từ chối", value: "rejected" }
];

type DepartmentOption = {
  label: string;
  value: string;
};

const fallbackDepartmentOptions: DepartmentOption[] = [
  { label: "Phòng Kinh doanh", value: "Phòng Kinh doanh" },
  { label: "Phòng Marketing", value: "Phòng Marketing" },
  { label: "Phòng Chăm sóc khách hàng", value: "Phòng Chăm sóc khách hàng" },
  { label: "Phòng Vận hành khu đất", value: "Phòng Vận hành khu đất" },
  { label: "Phòng Tài chính", value: "Phòng Tài chính" },
  { label: "Phòng Nhân sự", value: "Phòng Nhân sự" },
  { label: "Phòng IT", value: "Phòng IT" }
];

const hiddenTransferDepartmentNames = [
  "all",
  "tất cả",
  "tat ca",
  "system",
  "hệ thống",
  "he thong",
  "khách hàng",
  "khach hang",
  "phòng khách hàng",
  "phong khach hang"
];

function normalizeDepartmentName(value: unknown) {
  return apiText(value, "").trim().toLocaleLowerCase("vi-VN");
}

function departmentOptionsFromApi(data: unknown, currentDepartment: string): DepartmentOption[] {
  const rows = apiList(data);
  const apiOptions = rows
    .map((item) => {
      const value = apiText(item.value ?? item.name ?? item.department ?? item.label, "").trim();
      const label = apiText(item.label ?? item.name ?? item.department ?? item.value, value).trim();

      return value ? { label: label || value, value } : null;
    })
    .filter((item): item is DepartmentOption => item !== null);
  const source = apiOptions.length > 0 ? apiOptions : fallbackDepartmentOptions;
  const current = normalizeDepartmentName(currentDepartment);
  const unique = new Map<string, DepartmentOption>();

  source.forEach((option) => {
    const key = normalizeDepartmentName(option.value);

    if (
      !key ||
      key === current ||
      key === normalizeDepartmentName("Chưa cập nhật") ||
      hiddenTransferDepartmentNames.includes(key)
    ) {
      return;
    }

    unique.set(key, option);
  });

  return Array.from(unique.values());
}

function normalizeLeaveStatus(status: unknown): LeaveRequestCardData["status"] {
  const value = String(status ?? "").trim().toLowerCase();
  if (["1", "pending"].includes(value) || value.includes("pending") || value.includes("chờ")) return "pending";
  if (["2", "approved"].includes(value) || value.includes("approve") || value.includes("đã duyệt")) return "approved";
  if (["3", "rejected"].includes(value) || value.includes("reject") || value.includes("từ chối")) return "rejected";
  return "pending";
}

function formatLeaveDateRange(item: ApiObject) {
  const from = apiText(item.start_date ?? item.from_date ?? item.startDate, "");
  const to = apiText(item.end_date ?? item.to_date ?? item.endDate, "");
  const days = apiNumber(item.number_of_days ?? item.total_days ?? item.days ?? item.duration_days, 0);
  if (!from && !to) return "";
  if (!to) return `${formatDisplayDate(from)} (${days} ngày)`;
  return `${formatDisplayDate(from)} - ${formatDisplayDate(to)} (${days} ngày)`;
}

function formatDisplayDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function defaultTransferDateValue() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return formatPersonalDateValue(date);
}

function formatTransferRequestDate(item: ApiObject) {
  const desiredDate = apiText(item.desired_transfer_date ?? item.transfer_date ?? item.requested_date, "");
  if (desiredDate) {
    return `Ngày mong muốn: ${formatDisplayDate(desiredDate)}`;
  }

  return formatLeaveDateRange(item);
}

function leaveRowsFromApi(data: unknown): LeaveRequestCardData[] {
  const rows = apiList(data);
  if (rows.length === 0) return [];

  return rows.map((item, index) => {
    const status = normalizeLeaveStatus(item.status ?? item.status_label);
    return {
      id: apiText(item.id, `leave-${index}`),
      name: apiText(item.employee_name ?? item.user_name ?? item.name ?? item.requester_name, ""),
      department: apiText(item.department_name ?? item.department ?? item.employee_department, ""),
      dateRange: formatLeaveDateRange(item),
      reason: apiText(item.reason ?? item.detail ?? item.note, ""),
      status,
      avatar: { uri: "" }
    };
  });
}

function transferRowsFromApi(data: unknown): LeaveRequestCardData[] {
  const rows = apiList(data);
  if (rows.length === 0) return [];

  return rows.map((item, index) => {
    const status = normalizeLeaveStatus(item.status ?? item.status_label);
    const fromDepartment = apiText(item.from_department ?? item.current_department ?? item.old_department, "");
    const toDepartment = apiText(item.to_department ?? item.target_department ?? item.new_department, "");
    const routeText = fromDepartment && toDepartment
      ? `${fromDepartment} → ${toDepartment}`
      : apiText(item.target_department ?? item.to_department ?? item.new_department, "");
    const detailText = apiText(item.reason ?? item.detail ?? item.note, "");
    const currentStep = apiNumber(item.approval_step ?? item.approvalStep, 1);

    return {
      id: apiText(item.id, `transfer-${index}`),
      name: apiText(item.employee_name ?? item.user_name ?? item.name ?? item.requester_name, ""),
      department: apiText(item.department_name ?? item.department ?? item.current_department ?? item.from_department, ""),
      dateRange: formatTransferRequestDate(item),
      reason: detailText ? `${routeText} · ${detailText}` : routeText,
      status,
      avatar: { uri: "" },
      transferApproval: status === "pending" ? {
        currentStep,
        currentManagerName: apiText(item.current_manager_name, undefined),
        currentManagerApprovedAt: apiText(item.current_manager_approved_at, undefined),
        targetManagerName: apiText(item.target_manager_name, undefined),
        targetManagerApprovedAt: apiText(item.target_manager_approved_at, undefined),
        directorName: apiText(item.director_name, undefined),
        directorApprovedAt: apiText(item.director_approved_at, undefined),
      } : undefined,
    };
  });
}

export function LeaveRequestCard({
  collapsibleDetails = false,
  onChanged,
  request,
  requestType = "leave",
  showActions = true
}: {
  collapsibleDetails?: boolean;
  onChanged?: () => void;
  request: LeaveRequestCardData;
  requestType?: "leave" | "transfer";
  showActions?: boolean;
}) {
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const isPending = request.status === "pending";
  const isRejected = request.status === "rejected";
  const badgeStyle =
    request.status === "approved"
      ? styles.leaveBadgeApproved
      : request.status === "rejected"
        ? styles.leaveBadgeRejected
        : styles.leaveBadgePending;
  const badgeTextStyle =
    request.status === "approved"
      ? styles.leaveBadgeApprovedText
      : request.status === "rejected"
        ? styles.leaveBadgeRejectedText
        : styles.leaveBadgePendingText;
  const badgeLabel = request.status === "approved" ? "Đã duyệt" : request.status === "rejected" ? "Từ chối" : "Chờ duyệt";

  async function approve() {
    setSubmitting("approve");
    try {
      if (requestType === "transfer") {
        await employeeApi.approveDepartmentTransfer(request.id);
      } else {
        await employeeApi.approveLeaveRequest(request.id);
      }
      notifySuccess({ message: requestType === "transfer" ? "Đã duyệt yêu cầu chuyển phòng ban." : "Đã duyệt đơn nghỉ phép." });
      onChanged?.();
    } catch (error) {
      notifyError(error);
      onChanged?.();
    } finally {
      setSubmitting(null);
    }
  }

  async function reject(reason?: string) {
    const normalizedReason = reason?.trim();

    if (!normalizedReason) {
      notifyError(new Error("Vui lòng nhập lý do từ chối."));
      return;
    }

    setSubmitting("reject");
    try {
      if (requestType === "transfer") {
        await employeeApi.rejectDepartmentTransfer(request.id, normalizedReason);
      } else {
        await employeeApi.rejectLeaveRequest(request.id, normalizedReason);
      }
      notifySuccess({ message: requestType === "transfer" ? "Đã từ chối yêu cầu chuyển phòng ban." : "Đã từ chối đơn nghỉ phép." });
      setRejectModalVisible(false);
      setRejectReason("");
      onChanged?.();
    } catch (error) {
      notifyError(error);
      onChanged?.();
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <View style={[styles.leaveCard, isRejected && styles.leaveCardRejected]}>
      <View style={styles.leaveCardTop}>
        <View style={styles.leavePerson}>
          <Image source={request.avatar} style={styles.leaveAvatar} />
          <View style={styles.leavePersonText}>
            <Text numberOfLines={1} style={styles.leaveName}>{request.name}</Text>
            <Text numberOfLines={1} style={styles.leaveDepartment}>{request.department}</Text>
          </View>
        </View>
        <View style={[styles.leaveBadge, badgeStyle]}>
          <Text style={[styles.leaveBadgeText, badgeTextStyle]}>{badgeLabel}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole={collapsibleDetails ? "button" : undefined}
        disabled={!collapsibleDetails}
        onPress={() => setDetailsExpanded((value) => !value)}
        style={({ pressed }) => [styles.leaveDetailBox, collapsibleDetails && styles.leaveDetailBoxPressable, pressed && styles.pressed]}
      >
        <View style={styles.leaveDetailRow}>
          <Ionicons name="calendar-outline" size={16} color="#950100" />
          <Text numberOfLines={detailsExpanded ? undefined : 1} style={styles.leaveDateText}>{request.dateRange}</Text>
          {collapsibleDetails ? (
            <Ionicons name={detailsExpanded ? "chevron-up" : "chevron-down"} size={16} color="#8f706b" />
          ) : null}
        </View>
        <View style={styles.leaveDetailRow}>
          <Ionicons name="menu-outline" size={16} color="#5b403c" />
          <Text numberOfLines={detailsExpanded ? undefined : 1} style={styles.leaveReasonText}>{request.reason}</Text>
        </View>
      </Pressable>

      {request.transferApproval ? (
        <View style={transferApprovalStyles.container}>
          <Text style={transferApprovalStyles.title}>Quy trình phê duyệt</Text>
          <ApprovalStep
            stepNumber={1}
            label="Trưởng phòng hiện tại"
            approverName={request.transferApproval.currentManagerName}
            approvedAt={request.transferApproval.currentManagerApprovedAt}
            currentStep={request.transferApproval.currentStep}
            thisStep={1}
          />
          <ApprovalStep
            stepNumber={2}
            label="Trưởng phòng phòng mới"
            approverName={request.transferApproval.targetManagerName}
            approvedAt={request.transferApproval.targetManagerApprovedAt}
            currentStep={request.transferApproval.currentStep}
            thisStep={2}
          />
          <ApprovalStep
            stepNumber={3}
            label="GDKD / TGD"
            approverName={request.transferApproval.directorName}
            approvedAt={request.transferApproval.directorApprovedAt}
            currentStep={request.transferApproval.currentStep}
            thisStep={3}
          />
        </View>
      ) : null}

      {isPending && showActions ? (
        <View style={styles.leaveActions}>
          <Pressable
            accessibilityRole="button"
            disabled={submitting !== null}
            onPress={approve}
            style={({ pressed }) => [styles.leaveApproveButton, pressed && styles.pressed]}
          >
            <Text style={styles.leaveApproveText}>{submitting === "approve" ? "Đang duyệt" : "Duyệt"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={submitting !== null}
            onPress={() => {
              setRejectModalVisible(true);
            }}
            style={({ pressed }) => [styles.leaveRejectButton, pressed && styles.pressed]}
          >
            <Text style={styles.leaveRejectText}>{submitting === "reject" ? "Đang từ chối" : "Từ chối"}</Text>
          </Pressable>
        </View>
      ) : null}
      {showActions ? (
        <Modal animationType="fade" transparent visible={rejectModalVisible} onRequestClose={() => setRejectModalVisible(false)}>
          <View style={styles.transferRejectOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setRejectModalVisible(false)} />
            <View style={styles.transferRejectModal}>
              <Text style={styles.transferRejectTitle}>Lý do từ chối</Text>
              <Text style={styles.transferRejectSubtitle}>
                {requestType === "transfer"
                  ? "Ghi rõ lý do để nhân viên có đủ thông tin điều chỉnh yêu cầu."
                  : "Ghi rõ lý do để nhân viên nắm được quyết định duyệt nghỉ phép."}
              </Text>
              <TextInput
                multiline
                onChangeText={setRejectReason}
                placeholder="Nhập lý do từ chối..."
                placeholderTextColor="#9ca3af"
                style={styles.transferRejectInput}
                value={rejectReason}
              />
              <View style={styles.transferRejectActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setRejectModalVisible(false)}
                  style={styles.transferRejectCancel}
                >
                  <Text style={styles.transferRejectCancelText}>Hủy</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={submitting === "reject"}
                  onPress={() => reject(rejectReason)}
                  style={({ pressed }) => [styles.transferRejectConfirm, pressed && styles.pressed]}
                >
                  <Text style={styles.transferRejectConfirmText}>{submitting === "reject" ? "Đang gửi" : "Từ chối"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}



// ---- Local helpers extracted from original monolith ----

function PersonalField({
  editable = true,
  keyboardType,
  label,
  maxLength,
  multiline,
  onChangeText,
  placeholder,
  value
}: {
  editable?: boolean;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  label: string;
  maxLength?: number;
  multiline?: boolean;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={styles.personalField}>
      <Text style={styles.personalFieldLabel}>{label}</Text>
      <View style={styles.personalInputBox}>
        <TextInput
          editable={editable}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder || "Chưa cập nhật"}
          placeholderTextColor="#8f706b"
          style={[styles.personalInputText, multiline && styles.personalTextArea, !editable && styles.personalInputDisabled]}
          value={value}
        />
      </View>
    </View>
  );
}


// ---- Local helpers extracted from original monolith ----

function PersonalDateField({
  label,
  onPress,
  value
}: {
  label: string;
  onPress: () => void;
  value: string;
}) {
  const displayValue = formatPersonalDateDisplay(value);

  return (
    <View style={styles.personalField}>
      <Text style={styles.personalFieldLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.personalInputBox, styles.personalDateInputBox, pressed && styles.pressed]}
      >
        <View>
          <Text style={[styles.personalDateText, !displayValue && styles.personalDatePlaceholder]}>
            {displayValue || "Chọn ngày sinh"}
          </Text>
          <Text style={styles.personalDateHint}>Định dạng lưu: YYYY-MM-DD</Text>
        </View>
        <View style={styles.personalDateIconButton}>
          <Ionicons name="calendar-outline" size={20} color="#950100" />
        </View>
      </Pressable>
    </View>
  );
}


// ---- Local helpers extracted from original monolith ----

function PersonalDatePickerModal({
  onClose,
  onSelect,
  title = "Chọn ngày sinh",
  value,
  visible
}: {
  onClose: () => void;
  onSelect: (value: string) => void;
  title?: string;
  value: string;
  visible: boolean;
}) {
  const initialDate = parsePersonalDate(value) ?? new Date(2000, 0, 1);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [displayMonth, setDisplayMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const cells = personalCalendarCells(displayMonth);
  const todayValue = formatPersonalDateValue(new Date());
  const selectedValue = formatPersonalDateValue(selectedDate);

  useEffect(() => {
    if (!visible) return;

    const nextDate = parsePersonalDate(value) ?? new Date(2000, 0, 1);
    setSelectedDate(nextDate);
    setDisplayMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }, [value, visible]);

  function shiftMonth(offset: number) {
    setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function shiftYear(offset: number) {
    setDisplayMonth((current) => new Date(current.getFullYear() + offset, current.getMonth(), 1));
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.personalDateOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.personalDateModal}>
          <View style={styles.personalDateModalHeader}>
            <View>
              <Text style={styles.personalDateModalTitle}>{title}</Text>
              <Text style={styles.personalDateModalSubtitle}>{formatPersonalDateDisplay(selectedValue)}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>

          <View style={styles.personalCalendarYearRow}>
            <Pressable accessibilityRole="button" onPress={() => shiftYear(-1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="play-back" size={16} color="#950100" />
            </Pressable>
            <Text style={styles.personalCalendarYearText}>Năm {displayMonth.getFullYear()}</Text>
            <Pressable accessibilityRole="button" onPress={() => shiftYear(1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="play-forward" size={16} color="#950100" />
            </Pressable>
          </View>

          <View style={styles.personalCalendarHeader}>
            <Pressable accessibilityRole="button" onPress={() => shiftMonth(-1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="chevron-back" size={20} color="#950100" />
            </Pressable>
            <Text style={styles.personalCalendarTitle}>Tháng {displayMonth.getMonth() + 1}</Text>
            <Pressable accessibilityRole="button" onPress={() => shiftMonth(1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="chevron-forward" size={20} color="#950100" />
            </Pressable>
          </View>

          <View style={styles.personalCalendarWeekdays}>
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <Text key={day} style={styles.personalCalendarWeekday}>{day}</Text>
            ))}
          </View>

          <View style={styles.personalCalendarGrid}>
            {cells.map((day, index) => {
              const date = day ? new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day) : null;
              const dateValue = date ? formatPersonalDateValue(date) : "";
              const selected = dateValue === selectedValue;
              const today = dateValue === todayValue;

              return (
                <View key={`${dateValue || "empty"}-${index}`} style={styles.personalCalendarDayCell}>
                  {day ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSelectedDate(date as Date)}
                      style={[
                        styles.personalCalendarDay,
                        today && styles.personalCalendarDayToday,
                        selected && styles.personalCalendarDaySelected
                      ]}
                    >
                      <Text style={[styles.personalCalendarDayText, selected && styles.personalCalendarDayTextSelected]}>
                        {day}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={styles.personalDateActions}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCancelButton}>
              <Text style={styles.personalDateCancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(formatPersonalDateValue(selectedDate))}
              style={styles.personalDateConfirmButton}
            >
              <Text style={styles.personalDateConfirmText}>Chọn ngày</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ApprovalStep({
  stepNumber,
  label,
  approverName,
  approvedAt,
  currentStep,
  thisStep,
}: {
  stepNumber: number;
  label: string;
  approverName?: string;
  approvedAt?: string;
  currentStep: number;
  thisStep: number;
}) {
  const isDone = currentStep > thisStep || (currentStep === thisStep && thisStep < 3 && approvedAt);
  const isCurrent = currentStep === thisStep;
  const isRejected = false;

  let dotColor = "#d1d5db";
  if (isDone) dotColor = "#16a34a";
  else if (isCurrent) dotColor = "#950100";

  return (
    <View style={transferApprovalStyles.stepRow}>
      <View style={transferApprovalStyles.stepIndicator}>
        <View style={[transferApprovalStyles.stepDot, { backgroundColor: dotColor }]} />
        {thisStep < 3 ? <View style={transferApprovalStyles.stepLine} /> : null}
      </View>
      <View style={transferApprovalStyles.stepContent}>
        <Text style={transferApprovalStyles.stepLabel}>
          {stepNumber}. {label}
        </Text>
        {isDone && approvedAt ? (
          <Text style={transferApprovalStyles.stepApproved}>
            ✓ {approverName || "Đã xác nhận"} · {formatDisplayDate(approvedAt)}
          </Text>
        ) : isCurrent ? (
          <Text style={transferApprovalStyles.stepPending}>
            {approverName ? `Đang chờ ${approverName}` : "Đang chờ xử lý"}
          </Text>
        ) : (
          <Text style={transferApprovalStyles.stepWaiting}>Chưa đến bước</Text>
        )}
      </View>
    </View>
  );
}

const transferApprovalStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e0db",
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5b403c",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 0,
  },
  stepIndicator: {
    width: 20,
    alignItems: "center",
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e5e0db",
    minHeight: 20,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 10,
    paddingLeft: 6,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5b403c",
  },
  stepApproved: {
    fontSize: 12,
    color: "#16a34a",
    marginTop: 2,
  },
  stepPending: {
    fontSize: 12,
    color: "#950100",
    marginTop: 2,
    fontStyle: "italic",
  },
  stepWaiting: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
});

