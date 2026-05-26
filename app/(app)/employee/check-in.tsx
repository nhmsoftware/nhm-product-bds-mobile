import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { employeePalette } from "@/libs/employee-theme";
import { useI18n } from "@/libs/i18n";
import { appFonts } from "@/libs/typography";
import { notifyError, notifySuccess } from "@/libs/notify";
import { useAuth } from "@/services/auth/store";
import { employeeApi } from "@/services/employee/api";

type ActivityItem = {
  id: string;
  time: string;
  title: string;
  meta: string;
  icon: keyof typeof Ionicons.glyphMap;
  status?: "completed" | "upcoming";
};

const activities: ActivityItem[] = [
  {
    id: "activity-1",
    time: "08:00 AM - 08:30 AM",
    title: "Empire Estate Viewing",
    meta: "District 1, Ho Chi Minh City",
    icon: "location-outline",
    status: "completed"
  },
  {
    id: "activity-2",
    time: "09:15 AM - 10:00 AM",
    title: "Client Strategy Meeting",
    meta: "Mr. Nguyen - Signature Villa",
    icon: "people-outline",
    status: "upcoming"
  },
  {
    id: "activity-3",
    time: "11:30 AM",
    title: "Contract Signing",
    meta: "Main Office Headquarters",
    icon: "document-text-outline"
  }
];

export default function EmployeeCheckInScreen() {
  const { t } = useI18n();
  const { session } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const primaryColor = checkedIn ? employeePalette.red : employeePalette.green;
  const fullName = session?.user.fullName || t("employee.home.fallbackName");

  async function handlePunch() {
    setSubmitting(true);
    try {
      const response = checkedIn ? await employeeApi.checkOut() : await employeeApi.checkIn();
      setCheckedIn(!checkedIn);
      notifySuccess({ message: response.message });
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen edges={["top", "left", "right"]} padded={false}>
      <View style={styles.topBar}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{fullName.slice(0, 1)}</Text>
        </View>
        <Ionicons name="notifications-outline" size={20} color="#94a3b8" />
      </View>

      <View style={styles.body}>
        <View style={styles.centerStage}>
          <View style={styles.gpsPill}>
            <Ionicons name="locate-outline" size={16} color="#f7c650" />
            <Text style={styles.gpsText}>{t("employee.check.gpsActive")}</Text>
          </View>

          <Text style={styles.timeText}>{checkedIn ? "18:00 AM" : "08:42 AM"}</Text>

          <Pressable
            disabled={submitting}
            onPress={handlePunch}
            style={({ pressed }) => [
              styles.mainPunch,
              {
                backgroundColor: primaryColor,
                shadowColor: primaryColor
              },
              pressed && styles.pressed,
              submitting && styles.pressed
            ]}
          >
            <View style={styles.checkMark}>
                <Ionicons name="checkmark" size={28} color={primaryColor} />
            </View>
            <Text style={styles.mainPunchText}>
              {checkedIn ? t("employee.check.checkOutAction") : t("employee.check.checkInAction")}
            </Text>
          </Pressable>

          {!checkedIn ? (
            <View style={styles.quickActions}>
              <Pressable
                onPress={() => router.push("/(app)/employee/meet-client")}
                style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              >
                <Ionicons name="person" size={19} color="#ffffff" />
                <Text style={styles.quickActionText}>{t("employee.check.clientMeeting").toUpperCase()}</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/(app)/employee/showing-client")}
                style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              >
                <Ionicons name="walk" size={25} color="#ffffff" />
                <Text style={styles.quickActionText}>{t("employee.check.showing").toUpperCase()}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={[styles.activitySection, checkedIn && styles.activitySectionCheckout]}>
          <Text style={styles.sectionTitle}>{t("employee.check.history")}</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineLine} />
            {activities.map((item, index) => (
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
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 57,
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
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.2,
    shadowRadius: 31,
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
  activitySectionCheckout: {
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
    backgroundColor: "#ffffff",
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
    letterSpacing: 0.32,
    lineHeight: 22
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
  statusPill: {
    borderRadius: 6,
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
