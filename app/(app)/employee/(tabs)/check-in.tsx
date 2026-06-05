import {
  Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router,
  useFocusEffect } from "expo-router";
import { useCallback,
  useState } from "react";
import { Platform,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Pressable } from "@/components/SafePressable";

import { Screen } from "@/components/Screen";
import { EmployeeAvatarButton, EmployeeNotificationButton } from "@/components/EmployeeUI";
import { employeePalette } from "@/libs/employee-theme";
import { useI18n } from "@/libs/i18n";
import { appLogger } from "@/libs/logger";
import { appFonts } from "@/libs/typography";
import { notifyError, notifySuccess } from "@/libs/notify";
import { useAuth } from "@/services/auth/store";
import {
  employeeApi,
  type AttendancePunchInput,
  type AttendanceTodayStatus
} from "@/services/employee/api";

type ActivityItem = {
  createdAtMs: number;
  id: string;
  time: string;
  title: string;
  meta: string;
  icon: keyof typeof Ionicons.glyphMap;
  status?: "completed" | "upcoming";
};

type ApiObject = Record<string, unknown>;

function isApiObject(value: unknown): value is ApiObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function apiText(value: unknown, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    return fallback;
  }

  const text = String(value);
  return text.trim() === "[object Object]" ? fallback : text;
}

function apiDisplayText(value: unknown, fallback = ""): string {
  if (Array.isArray(value)) {
    const text = value.map((item) => apiDisplayText(item, "")).filter(Boolean).join(", ");
    return text || fallback;
  }

  if (isApiObject(value)) {
    return apiDisplayText(
      value.name ??
        value.title ??
        value.project_name ??
        value.projectName ??
        value.project ??
        value.area_name ??
        value.areaName ??
        value.area ??
        value.land_area ??
        value.landArea ??
        value.location_name ??
        value.locationName ??
        value.customer_name ??
        value.customerName ??
        value.client_name ??
        value.clientName ??
        value.label ??
        value.value ??
        value.address,
      fallback
    );
  }

  return apiText(value, fallback);
}

function firstApiDisplayText(values: unknown[], fallback: string): string {
  for (const value of values) {
    const text = apiDisplayText(value, "").trim();

    if (text) {
      return text;
    }
  }

  return fallback;
}

function apiList(value: unknown): ApiObject[] {
  if (Array.isArray(value)) {
    return value.filter(isApiObject);
  }

  if (!isApiObject(value)) {
    return [];
  }

  const candidates = [value.data, value.items, value.activities, value.meetings, value.history];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isApiObject);
    }
  }

  return [];
}

function formatAttendanceTime(value?: string | null) {
  if (!value) {
    return "--:--";
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      hour12: false,
      minute: "2-digit"
    });
  }

  const timeMatch = value.match(/\d{1,2}:\d{2}/);
  return timeMatch?.[0] ?? value;
}

function formatActivityTime(value: unknown) {
  const text = apiText(value, "");
  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) {
    return text || "Mới cập nhật";
  }

  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit"
  });
}

function activityTimeValue(item: ApiObject) {
  return item.check_in_at ??
    item.checked_in_at ??
    item.created_at ??
    item.meeting_at ??
    item.tour_at ??
    item.scheduled_at ??
    item.time;
}

function parseActivityTimeMs(value: unknown) {
  const parsed = new Date(apiText(value, ""));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function statusFromActivity(value: unknown): ActivityItem["status"] {
  const status = apiDisplayText(value, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (["completed", "done", "success", "finished", "hoan tat", "hoan thanh", "thanh cong"].includes(status)) {
    return "completed";
  }

  if (["upcoming", "pending", "scheduled", "cho xu ly", "sap toi", "sap dien ra"].includes(status)) {
    return "upcoming";
  }

  return undefined;
}

function activityStatus(item: ApiObject) {
  return statusFromActivity(
    item.status ??
      item.lable_status ??
      item.label_status ??
      item.status_label ??
      item.statusLabel ??
      item.state
  );
}

function mapRecentMeeting(item: ApiObject, index: number): ActivityItem {
  const customerName = firstApiDisplayText([
    item.customer_name,
    item.customerName,
    item.client_name,
    item.clientName,
    item.customer,
    item.client,
    item.name
  ], "Khách hàng");
  const project = firstApiDisplayText([
    item.project_name,
    item.projectName,
    item.project,
    item.area,
    item.land_area,
    item.landArea,
    item.location,
    item.address
  ], "Gặp khách hàng");
  const title = firstApiDisplayText([item.title], `Gặp ${customerName}`);
  const meta = firstApiDisplayText([item.note, item.description, item.meta], project);
  const timeValue = activityTimeValue(item);

  return {
    createdAtMs: parseActivityTimeMs(timeValue),
    icon: "people-outline",
    id: `meeting-${apiText(item.id, `recent-meeting-${index}`)}`,
    meta,
    status: activityStatus(item),
    time: formatActivityTime(timeValue),
    title
  };
}

function mapRecentSiteTour(item: ApiObject, index: number): ActivityItem {
  const customerName = firstApiDisplayText([
    item.customer_name,
    item.customerName,
    item.client_name,
    item.clientName,
    item.customer,
    item.client,
    item.name
  ], "Khách hàng");
  const project = firstApiDisplayText([
    item.project_name,
    item.projectName,
    item.project,
    item.area,
    item.land_area,
    item.landArea,
    item.location,
    item.address
  ], "Dẫn khách hàng");
  const unit = firstApiDisplayText([item.unit_code, item.unitCode, item.lot_code, item.lotCode], "");
  const meta = firstApiDisplayText([item.note, item.description, item.meta], unit ? `${customerName} - ${unit}` : project);
  const title = firstApiDisplayText([item.title], `Dẫn ${customerName}`);
  const timeValue = activityTimeValue(item);

  return {
    createdAtMs: parseActivityTimeMs(timeValue),
    icon: "walk",
    id: `site-tour-${apiText(item.id, `recent-site-tour-${index}`)}`,
    meta,
    status: activityStatus(item),
    time: formatActivityTime(timeValue),
    title
  };
}

function getTodayUiStatus(data: AttendanceTodayStatus) {
  const attendance = data.attendance ?? null;
  const hasCheckedIn = data.has_checked_in ?? data.checked_in ?? Boolean(attendance?.check_in_at);
  const hasCheckedOut = data.checked_out ?? Boolean(attendance?.check_out_at);
  const latestTime =
    attendance?.check_out_at ??
    attendance?.check_in_at ??
    data.check_out_time ??
    data.check_in_time;

  return {
    checkedIn: Boolean(hasCheckedIn && !hasCheckedOut),
    checkedOut: Boolean(hasCheckedOut),
    statusTime: formatAttendanceTime(latestTime)
  };
}

function calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latFrom = toRadians(lat1);
  const lngFrom = toRadians(lng1);
  const latTo = toRadians(lat2);
  const lngTo = toRadians(lng2);
  const latDelta = latTo - latFrom;
  const lngDelta = lngTo - lngFrom;
  const angle =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin(latDelta / 2) ** 2 +
          Math.cos(latFrom) * Math.cos(latTo) * Math.sin(lngDelta / 2) ** 2
      )
    );

  return Math.round(earthRadiusMeters * angle);
}

function coordinateToApiString(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error("Không thể xác định vị trí hiện tại.");
  }

  return value.toString();
}

function parseCoordinate(value?: number | string | null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export default function EmployeeCheckInScreen() {
  const { t } = useI18n();
  const { session } = useAuth();
  const [checkedIn, setCheckedIn] = useState(true);
  const [checkedOut, setCheckedOut] = useState(false);
  const [officeConfig, setOfficeConfig] = useState<AttendanceTodayStatus["office_config"] | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [recentMessage, setRecentMessage] = useState("Chưa có hoạt động gần đây.");
  const [recentLoading, setRecentLoading] = useState(true);
  const [statusTime, setStatusTime] = useState("18:00 AM");
  const [submitting, setSubmitting] = useState(false);
  const primaryColor = checkedIn ? employeePalette.red : employeePalette.green;
  const punchDisabled = submitting;
  const fullName = session?.user.fullName || t("employee.home.fallbackName");

  const applyTodayStatus = useCallback((data: AttendanceTodayStatus) => {
    const nextStatus = getTodayUiStatus(data);
    setCheckedIn(nextStatus.checkedIn);
    setCheckedOut(nextStatus.checkedOut);
    setOfficeConfig(data.office_config ?? null);
    setStatusTime(nextStatus.statusTime);
  }, []);

  const loadTodayStatus = useCallback(() => {
    let active = true;

    employeeApi
      .todayAttendance()
      .then((response) => {
        if (!active) return;
        applyTodayStatus(response.data);
      })
      .catch((error) => {
        appLogger.warn("employee.attendance.today", "Không thể tải trạng thái chấm công.", { error });
      });

    return () => {
      active = false;
    };
  }, [applyTodayStatus]);

  useFocusEffect(loadTodayStatus);

  const loadRecentActivities = useCallback(() => {
    let active = true;

    setRecentLoading(true);
    Promise.allSettled([
      employeeApi.recentMeetings(),
      employeeApi.siteToursRecent()
    ])
      .then((results) => {
        if (!active) return;

        const [meetingsResult, siteToursResult] = results;
        const meetingRows = meetingsResult.status === "fulfilled"
          ? apiList(meetingsResult.value.data).map(mapRecentMeeting)
          : [];
        const siteTourRows = siteToursResult.status === "fulfilled"
          ? apiList(siteToursResult.value.data).map(mapRecentSiteTour)
          : [];
        const rows = [...meetingRows, ...siteTourRows]
          .sort((left, right) => right.createdAtMs - left.createdAtMs)
          .slice(0, 5);

        if (meetingsResult.status === "rejected") {
          appLogger.warn("employee.customerMeetings.recent", "Không thể tải hoạt động gặp khách gần đây.", { error: meetingsResult.reason });
        }

        if (siteToursResult.status === "rejected") {
          appLogger.warn("employee.siteTours.recent", "Không thể tải hoạt động dẫn khách gần đây.", { error: siteToursResult.reason });
        }

        setRecentActivities(rows);
        setRecentMessage(rows.length > 0 ? "" : "Chưa có hoạt động gần đây.");
      })
      .catch((error) => {
        if (!active) return;
        appLogger.warn("employee.activities.recent", "Không thể tải hoạt động gần đây.", { error });
        setRecentActivities([]);
        setRecentMessage("Không thể tải hoạt động gần đây. Vui lòng thử lại.");
      })
      .finally(() => {
        if (active) {
          setRecentLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(loadRecentActivities);

  async function getGpsAttendancePayload(): Promise<AttendancePunchInput> {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      throw new Error(t("employee.check.locationPermissionDenied"));
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      return {
        device_name: `${Platform.OS} ${Platform.Version}`,
        latitude: coordinateToApiString(position.coords.latitude),
        longitude: coordinateToApiString(position.coords.longitude),
        method: "gps"
      };
    } catch (error) {
      appLogger.warn("employee.attendance.location", "Không thể lấy vị trí hiện tại.", { error });
      throw new Error(t("employee.check.locationUnavailable"));
    }
  }

  async function handlePunch() {
    setSubmitting(true);
    try {
      const payload = await getGpsAttendancePayload();
      const payloadLatitude = parseCoordinate(payload.latitude);
      const payloadLongitude = parseCoordinate(payload.longitude);
      const officeLatitude = parseCoordinate(officeConfig?.office_latitude);
      const officeLongitude = parseCoordinate(officeConfig?.office_longitude);
      const distanceToOfficeMeters =
        payloadLatitude !== null &&
        payloadLongitude !== null &&
        officeLatitude !== null &&
        officeLongitude !== null
          ? calculateDistanceMeters(payloadLatitude, payloadLongitude, officeLatitude, officeLongitude)
          : null;

      appLogger.info("employee.attendance.punch", "Payload gửi API chấm công.", {
        action: checkedIn ? "check-out" : "check-in",
        distance_to_office_meters: distanceToOfficeMeters,
        office_config: officeConfig,
        payload
      });

      const response = checkedIn ? await employeeApi.checkOut(payload) : await employeeApi.checkIn(payload);
      const today = await employeeApi.todayAttendance();
      applyTodayStatus(today.data);
      notifySuccess({ message: response.message });
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen edges={["top", "left", "right"]} padded={false} safeBackgroundColor="#ffffff">
      <View style={styles.topBar}>
        <EmployeeAvatarButton label={fullName} />
        <EmployeeNotificationButton returnTo="/employee/check-in" />
      </View>

      <View style={styles.body}>
        <View style={styles.centerStage}>
          <View style={styles.gpsPill}>
            <Ionicons name="locate-outline" size={16} color="#f7c650" />
            <Text style={styles.gpsText}>{t("employee.check.gpsActive")}</Text>
          </View>

          <Text style={styles.timeText}>{statusTime}</Text>

          <Pressable
            disabled={punchDisabled}
            onPress={handlePunch}
            style={({ pressed }) => [
              styles.mainPunch,
              {
                backgroundColor: primaryColor,
                shadowColor: primaryColor
              },
              pressed && styles.pressed,
              punchDisabled && styles.pressed
            ]}
          >
            <View style={styles.checkMark}>
              <Ionicons name="checkmark" size={28} color={primaryColor} />
            </View>
            <Text style={styles.mainPunchText}>
              {checkedIn
                ? t("employee.check.checkOutAction")
                : t("employee.check.checkInAction")}
            </Text>
          </Pressable>

          {!checkedOut ? (
            <View style={styles.quickActions}>
              <Pressable
                onPress={() => router.push("/employee/meet-client")}
                style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              >
                <Ionicons name="person" size={19} color="#ffffff" />
                <Text style={styles.quickActionText}>{t("employee.check.clientMeeting").toUpperCase()}</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/employee/showing-client")}
                style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              >
                <Ionicons name="walk" size={25} color="#ffffff" />
                <Text style={styles.quickActionText}>{t("employee.check.showing").toUpperCase()}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineLine} />
            {recentLoading ? (
              <Text style={styles.activityStateText}>Đang tải hoạt động gần đây...</Text>
            ) : null}
            {!recentLoading && recentActivities.length === 0 ? (
              <Text style={styles.activityStateText}>{recentMessage}</Text>
            ) : null}
            {!recentLoading && recentActivities.map((item, index) => (
                <View key={item.id} style={styles.timelineRow}>
                  <View
                    style={[
                      styles.timelineDot,
                      index === 0 ? styles.timelineDotActive : styles.timelineDotMuted
                    ]}
                  />
                  <View style={[styles.activityCard, !item.status && styles.activityCardMuted]}>
                    <View style={styles.activityTop}>
                      <View style={styles.activityCopy}>
                        <Text style={[styles.activityTime, !item.status && styles.mutedText]}>
                          {item.time}
                        </Text>
                        <Text style={[styles.activityTitle, !item.status && styles.mutedText]}>
                          {item.title}
                        </Text>
                      </View>
                      {item.status ? (
                        <View
                          style={[
                            styles.statusPill,
                            item.status === "completed"
                              ? styles.statusCompleted
                              : styles.statusUpcoming
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              item.status === "completed" && styles.statusTextCompleted
                            ]}
                          >
                            {item.status === "completed"
                              ? t("employee.check.completed")
                              : t("employee.check.upcoming")}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.activityMetaRow}>
                      <Ionicons
                        name={item.icon}
                        size={15}
                        color={item.status ? employeePalette.muted : "#9aa0a6"}
                      />
                      <Text style={[styles.activityMeta, !item.status && styles.mutedText]}>
                        {item.meta}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    height: 57,
    paddingHorizontal: 20
  },
  body: {
    backgroundColor: employeePalette.bg,
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#1f2933",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    overflow: "hidden",
    width: 32
  },
  avatarText: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "900"
  },
  notificationButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  centerStage: {
    alignItems: "center"
  },
  gpsPill: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e1e3e4",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 17,
    paddingVertical: 9
  },
  gpsText: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    lineHeight: 16
  },
  timeText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1.6,
    lineHeight: 44,
    paddingTop: 16
  },
  mainPunch: {
    alignItems: "center",
    borderRadius: 999,
    height: 160,
    justifyContent: "center",
    marginTop: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    width: 160,
    elevation: 7
  },
  checkMark: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  mainPunchText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.6,
    lineHeight: 24,
    paddingTop: 6,
    textAlignVertical: "center"
  },
  quickActions: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 16,
    width: "100%"
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: employeePalette.green,
    borderRadius: 12,
    flex: 1,
    gap: 3,
    justifyContent: "center",
    minHeight: 82,
    shadowColor: employeePalette.green,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 17,
    elevation: 4
  },
  quickActionText: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.65,
    lineHeight: 19.5
  },
  activitySection: {
    paddingTop: 48
  },
  sectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.48,
    lineHeight: 28.8,
    marginBottom: 24
  },
  timeline: {
    position: "relative"
  },
  timelineLine: {
    backgroundColor: "#e1e3e4",
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 2
  },
  timelineRow: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 24
  },
  timelineDot: {
    borderColor: employeePalette.bg,
    borderWidth: 4,
    borderRadius: 999,
    height: 16,
    marginLeft: -7,
    marginTop: 16,
    width: 16
  },
  timelineDotActive: {
    backgroundColor: employeePalette.red
  },
  timelineDotMuted: {
    backgroundColor: "#dfe3e6"
  },
  activityCard: {
    backgroundColor: employeePalette.bg,
    borderColor: "#e1e3e4",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 94,
    paddingHorizontal: 17,
    paddingVertical: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2
  },
  activityCardMuted: {
    opacity: 0.62
  },
  activityTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  activityCopy: {
    flex: 1
  },
  activityTime: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    lineHeight: 16
  },
  activityTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "900",
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 22,
    paddingTop: 4
  },
  activityMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingTop: 8
  },
  activityMeta: {
    color: employeePalette.muted,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  activityStateText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21,
    paddingLeft: 28,
    paddingVertical: 8
  },
  statusPill: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  statusCompleted: {
    backgroundColor: "#fff7df",
    borderColor: "#ffd987"
  },
  statusUpcoming: {
    backgroundColor: "#f2f2f2",
    borderColor: "#dedede"
  },
  statusText: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    lineHeight: 16,
    paddingTop: 1
  },
  statusTextCompleted: {
    color: "#755700"
  },
  mutedText: {
    color: "#6c7175"
  },
  pressed: {
    opacity: 0.86
  }
});
