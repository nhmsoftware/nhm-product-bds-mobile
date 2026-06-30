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
import { apiText } from "./utils/apiNormalizers";
import { leaveFilterTabs } from "./utils/constants";
import type { DepartmentOption, LeaveStatusFilter } from "./utils/constants";
import { backWithProfileSource } from "./utils/navigation";
import { formatPersonalDateDisplay, parsePersonalDate } from "./utils/sharedHelpers";

import { apiList } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { fallbackDepartmentOptions, hiddenTransferDepartmentNames } from "./utils/constants";
import { formatPersonalDateValue } from "./utils/sharedHelpers";

// ---- Local helpers ----

type LeaveRequestCardData = {
  dateRange: string;
  department: string;
  id: string;
  note: string;
  reason: string;
  status: "approved" | "pending" | "rejected" | "cancelled";
  title: string;
  type: string;
};

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

function normalizeLeaveStatus(status: unknown): LeaveRequestCardData["status"] {
  const value = String(status ?? "").trim().toLowerCase();
  if (["1", "pending"].includes(value) || value.includes("pending") || value.includes("chờ")) return "pending";
  if (["2", "approved"].includes(value) || value.includes("approve") || value.includes("đã duyệt")) return "approved";
  if (["3", "rejected"].includes(value) || value.includes("reject") || value.includes("từ chối")) return "rejected";
  return "pending";
}
// ---- Local helpers ----

function formatTransferRequestDate(item: ApiObject) {
  const desiredDate = apiText(item.desired_transfer_date ?? item.transfer_date ?? item.requested_date, "");
  if (desiredDate) {
    return `Ngày mong muốn: ${formatDisplayDate(desiredDate)}`;
  }

  return formatLeaveDateRange(item);
}

export function TransferRequestsScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const { session } = useAuth();
  const canApproveDepartmentTransfers = isDepartmentTransferApproverRole(session?.user.role);

  if (!canApproveDepartmentTransfers) {
    return <DepartmentTransferCreateScreen onBack={handleBack} />;
  }

  return <DepartmentTransferReviewScreen onBack={handleBack} />;
}

function DepartmentTransferReviewScreen({ onBack }: { onBack: () => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.departmentTransfers({ per_page: 50 }), [refreshKey]);
  const [filter, setFilter] = useState<LeaveStatusFilter>("all");
  const rows = transferRowsFromApi(data);
  const filteredRows = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.leaveSafe}>
      <View style={styles.leaveHeader}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.leaveHeaderButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </Pressable>
        <Text style={styles.leaveHeaderTitle}>Xin chuyển phòng ban</Text>
        <EmployeeNotificationButton returnTo="/employee/transfer-requests" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.leaveScrollContent}
        style={styles.leaveRoot}
      >
        <View style={styles.leaveIntro}>
          <Text style={styles.leaveTitle}>Danh sách xin chuyển phòng ban</Text>
          <Text style={styles.leaveSubtitle}>Quản lý, duyệt hoặc từ chối yêu cầu chuyển phòng ban của nhân viên.</Text>
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
          <Text style={styles.leaveStateText}>Không thể tải dữ liệu chuyển phòng ban. Vui lòng thử lại.</Text>
        ) : null}
        {loading ? <Text style={styles.leaveStateText}>Đang tải danh sách chuyển phòng ban...</Text> : null}
        {!loading && filteredRows.length === 0 ? (
          <Text style={styles.leaveStateText}>Chưa có yêu cầu chuyển phòng ban phù hợp.</Text>
        ) : null}

        <View style={styles.leaveList}>
          {filteredRows.map((row) => (
            <LeaveRequestCard
              key={row.id}
              onChanged={() => setRefreshKey((value) => value + 1)}
              request={row}
              requestType="transfer"
              collapsibleDetails={true}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DepartmentTransferCreateScreen({ onBack }: { onBack: () => void }) {
  const { session } = useAuth();
  const currentDepartment = apiText(session?.user.department, "Chưa cập nhật");

  const [branches, setBranches] = useState<{ id: number | string; name: string }[]>([]);
  const [targetBranch, setTargetBranch] = useState("");
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);

  const [departmentsData, setDepartmentsData] = useState<unknown>(null);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsFailed, setDepartmentsFailed] = useState(false);

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const {
    data: historyData,
    failed: historyFailed,
    loading: historyLoading
  } = useEmployeeApiData(() => employeeApi.departmentTransferHistory({ per_page: 50 }), [historyRefreshKey]);
  const [targetDepartment, setTargetDepartment] = useState("");
  const [desiredTransferDate, setDesiredTransferDate] = useState(defaultTransferDateValue);
  const [reason, setReason] = useState("");
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [departmentPickerVisible, setDepartmentPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const departmentOptions = departmentOptionsFromApi(departmentsData, currentDepartment);
  const selectedTargetDepartment = departmentOptions.find((option) => option.value === targetDepartment);
  const historyRows = transferRowsFromApi(historyData);

  useEffect(() => {
    employeeApi.recruitmentBranches()
      .then((res) => {
        if (res && Array.isArray(res.data)) {
          setBranches(res.data);
        }
      })
      .catch((err) => console.log("Failed to fetch branches in transfer", err));
  }, []);

  useEffect(() => {
    if (!targetBranch) {
      setDepartmentsData(null);
      return;
    }
    setDepartmentsLoading(true);
    setDepartmentsFailed(false);
    employeeApi.departments({ branch_id: String(targetBranch) })
      .then((res) => {
        if (res && res.data) {
          setDepartmentsData(res.data);
        } else {
          setDepartmentsFailed(true);
        }
      })
      .catch(() => {
        setDepartmentsFailed(true);
      })
      .finally(() => {
        setDepartmentsLoading(false);
      });
  }, [targetBranch]);

  useEffect(() => {
    setTargetDepartment("");
  }, [targetBranch]);

  useEffect(() => {
    if (!targetDepartment) return;
    if (departmentOptions.some((option) => option.value === targetDepartment)) return;

    setTargetDepartment("");
  }, [departmentOptions, targetDepartment]);

  async function submitTransferRequest() {
    const normalizedTarget = targetDepartment.trim();
    const normalizedReason = reason.trim();

    if (!normalizedTarget || !desiredTransferDate || !normalizedReason) {
      notifyError(new Error("Vui lòng nhập phòng ban muốn chuyển, ngày mong muốn và lý do."));
      return;
    }

    if (normalizeDepartmentName(normalizedTarget) === normalizeDepartmentName(currentDepartment)) {
      notifyError(new Error("Phòng ban muốn chuyển không được trùng với phòng ban hiện tại."));
      return;
    }

    const selectedDate = parsePersonalDate(desiredTransferDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!selectedDate || selectedDate < today) {
      notifyError(new Error("Ngày mong muốn chuyển phải từ hôm nay trở đi."));
      return;
    }

    setSubmitting(true);
    try {
      const response = await employeeApi.createDepartmentTransfer({
        desired_transfer_date: desiredTransferDate,
        reason: normalizedReason,
        target_department: normalizedTarget
      });

      notifySuccess({ message: response.message || "Gửi yêu cầu chuyển phòng ban thành công." });
      setTargetDepartment("");
      setReason("");
      setHistoryRefreshKey((current) => current + 1);
    } catch (error) {
      notifyError(error, "Không thể gửi yêu cầu chuyển phòng ban.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.leaveSafe}>
      <View style={styles.leaveHeader}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.leaveHeaderButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </Pressable>
        <Text style={styles.leaveHeaderTitle}>Xin chuyển phòng ban</Text>
        <EmployeeNotificationButton returnTo="/employee/transfer-requests" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.transferCreateContent}
        style={styles.leaveRoot}
      >
        <View style={styles.leaveIntro}>
          <Text style={styles.leaveTitle}>Yêu cầu chuyển phòng ban</Text>
          <Text style={styles.leaveSubtitle}>Gửi yêu cầu đến bộ phận phê duyệt theo đúng quy trình nhân sự.</Text>
        </View>

        <View style={styles.transferCreateCard}>
          <View style={styles.transferCurrentDepartmentBox}>
            <Ionicons name="business-outline" size={18} color="#950100" />
            <View style={styles.flex}>
              <Text style={styles.transferCurrentDepartmentLabel}>PHÒNG BAN HIỆN TẠI</Text>
              <Text style={styles.transferCurrentDepartmentText}>{currentDepartment}</Text>
            </View>
          </View>

          <View style={styles.transferField}>
            <Text style={styles.transferLabel}>CHI NHÁNH MUỐN CHUYỂN</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setBranchPickerVisible(true)}
              style={({ pressed }) => [
                styles.transferDepartmentSelect,
                pressed && styles.pressed
              ]}
            >
              <Text style={[styles.transferDepartmentSelectText, !targetBranch && styles.transferDepartmentPlaceholder]}>
                {branches.find(b => String(b.id) === targetBranch)?.name || "Chọn chi nhánh muốn chuyển"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#950100" />
            </Pressable>
          </View>

          <View style={styles.transferField}>
            <Text style={styles.transferLabel}>PHÒNG BAN MUỐN CHUYỂN</Text>
            <Pressable
              accessibilityRole="button"
              disabled={!targetBranch || departmentsLoading || departmentOptions.length === 0}
              onPress={() => setDepartmentPickerVisible(true)}
              style={({ pressed }) => [
                styles.transferDepartmentSelect,
                (!targetBranch || departmentsLoading || departmentOptions.length === 0) && styles.transferDepartmentSelectDisabled,
                pressed && styles.pressed
              ]}
            >
              <Text style={[styles.transferDepartmentSelectText, !selectedTargetDepartment && styles.transferDepartmentPlaceholder]}>
                {!targetBranch
                  ? "Vui lòng chọn chi nhánh trước"
                  : selectedTargetDepartment?.label || (departmentsLoading ? "Đang tải phòng ban..." : "Chọn phòng ban muốn chuyển")}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#950100" />
            </Pressable>
            {departmentsFailed ? (
              <Text style={styles.transferHelperText}>Không tải được danh sách phòng ban.</Text>
            ) : null}
          </View>

          <View style={styles.transferField}>
            <Text style={styles.transferLabel}>NGÀY MONG MUỐN CHUYỂN</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDatePickerVisible(true)}
              style={({ pressed }) => [styles.transferDateInput, pressed && styles.pressed]}
            >
              <Text style={styles.transferDateText}>{formatPersonalDateDisplay(desiredTransferDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#950100" />
            </Pressable>
          </View>

          <View style={styles.transferField}>
            <Text style={styles.transferLabel}>LÝ DO CHUYỂN PHÒNG BAN</Text>
            <TextInput
              multiline
              onChangeText={setReason}
              placeholder="Nhập lý do và bối cảnh chuyển phòng ban..."
              placeholderTextColor="#9ca3af"
              style={[styles.transferInput, styles.transferTextArea]}
              textAlignVertical="top"
              value={reason}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={submitTransferRequest}
            style={({ pressed }) => [styles.transferSubmitButton, (pressed || submitting) && styles.pressed]}
          >
            <Ionicons name="send" size={18} color="#ffffff" />
            <Text style={styles.transferSubmitText}>{submitting ? "Đang gửi yêu cầu" : "Gửi yêu cầu"}</Text>
          </Pressable>
        </View>

        <View style={[styles.leaveHistoryHeader, styles.transferHistoryHeader]}>
          <Text style={styles.leaveHistoryTitle}>Lịch sử xin phép chuyển phòng ban</Text>
        </View>

        {historyLoading ? <Text style={styles.leaveStateText}>Đang tải lịch sử xin phép chuyển phòng ban...</Text> : null}
        {historyFailed ? <Text style={styles.leaveStateText}>Không thể tải lịch sử xin phép chuyển phòng ban. Vui lòng thử lại.</Text> : null}
        {!historyLoading && historyRows.length === 0 ? <Text style={styles.leaveStateText}>Chưa có lịch sử xin phép chuyển phòng ban.</Text> : null}

        <View style={styles.leaveList}>
          {historyRows.map((row) => (
            <LeaveRequestCard key={row.id} collapsibleDetails request={row} requestType="transfer" showActions={false} />
          ))}
        </View>
      </ScrollView>

      <PersonalDatePickerModal
        title="Chọn ngày chuyển"
        value={desiredTransferDate}
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(value) => {
          setDesiredTransferDate(value);
          setDatePickerVisible(false);
        }}
      />
      <BranchPickerModal
        options={branches}
        value={targetBranch}
        visible={branchPickerVisible}
        onClose={() => setBranchPickerVisible(false)}
        onSelect={(value) => {
          setTargetBranch(value);
          setBranchPickerVisible(false);
        }}
      />
      <DepartmentPickerModal
        currentDepartment={currentDepartment}
        options={departmentOptions}
        value={targetDepartment}
        visible={departmentPickerVisible}
        onClose={() => setDepartmentPickerVisible(false)}
        onSelect={(value) => {
          setTargetDepartment(value);
          setDepartmentPickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

function BranchPickerModal({
  onClose,
  onSelect,
  options,
  value,
  visible
}: {
  onClose: () => void;
  onSelect: (value: string) => void;
  options: { id: string | number; name: string }[];
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
              <Text style={styles.departmentPickerTitle}>Chọn chi nhánh muốn chuyển</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.departmentPickerList}>
            {options.length === 0 ? (
              <Text style={styles.leaveStateText}>Đang tải danh sách chi nhánh...</Text>
            ) : null}
            {options.map((option) => {
              const active = String(option.id) === value;

              return (
                <Pressable
                  key={String(option.id)}
                  accessibilityRole="button"
                  onPress={() => onSelect(String(option.id))}
                  style={({ pressed }) => [
                    styles.departmentPickerOption,
                    active && styles.departmentPickerOptionActive,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.departmentPickerOptionText, active && styles.departmentPickerOptionTextActive]}>
                    {option.name}
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

function DepartmentPickerModal({
  currentDepartment,
  onClose,
  onSelect,
  options,
  value,
  visible
}: {
  currentDepartment: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: DepartmentOption[];
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
              <Text style={styles.departmentPickerTitle}>Chọn phòng ban muốn chuyển</Text>
              <Text style={styles.departmentPickerSubtitle}>Hiện tại: {currentDepartment}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.departmentPickerList}>
            {options.length === 0 ? (
              <Text style={styles.leaveStateText}>Chưa có phòng ban phù hợp để chọn.</Text>
            ) : null}
            {options.map((option) => {
              const active = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => onSelect(option.value)}
                  style={({ pressed }) => [styles.departmentPickerOption, active && styles.departmentPickerOptionActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.departmentPickerOptionText, active && styles.departmentPickerOptionTextActive]}>{option.label}</Text>
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



// ---- Local helpers extracted from original monolith ----

function normalizeDepartmentName(value: unknown) {
  return apiText(value, "").trim().toLocaleLowerCase("vi-VN");
}


// ---- Local helpers extracted from original monolith ----

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


// ---- Local helpers extracted from original monolith ----

function defaultTransferDateValue() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return formatPersonalDateValue(date);
}


// ---- Local helpers extracted from original monolith ----

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

    return {
      id: apiText(item.id, `transfer-${index}`),
      name: apiText(item.employee_name ?? item.user_name ?? item.name ?? item.requester_name, ""),
      department: apiText(item.department_name ?? item.department ?? item.current_department ?? item.from_department, ""),
      dateRange: formatTransferRequestDate(item),
      reason: detailText ? `${routeText} · ${detailText}` : routeText,
      status,
      avatar: { uri: "" }
    };
  });
}

