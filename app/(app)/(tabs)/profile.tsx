import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { useLayoutMode } from "@/libs/layout-mode";
import { notifyError } from "@/libs/notify";
import { useAuth } from "@/services/auth/store";
import { profileApi } from "@/services/profile/api";
import type { UserProfile } from "@/services/profile/types";

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: string;
  onPress?: () => void;
};

export default function ProfileTab() {
  const { signOut } = useAuth();
  const { mode, setMode, theme } = useLayoutMode();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileApi
      .getProfile()
      .then((response) => setProfile(response.data))
      .catch((error) => notifyError(error))
      .finally(() => setLoading(false));
  }, []);

  const isVerified = profile?.verificationStatus === "Verified";
  const displayName = profile?.fullName || "Zentrix User";
  const uid = profile?.referralCode || profile?.id?.slice(0, 8) || "82739410";
  const shortUid = uid.replace(/-/g, "").slice(0, 8) || "82739410";
  const isPro = mode === "default";

  const showLayoutPicker = () => {
    Alert.alert("Chế độ giao diện", "Chọn bố cục hiển thị cho ứng dụng.", [
      { text: "Default", onPress: () => setMode("default") },
      { text: "Pro Style", onPress: () => setMode("pro") },
      { text: "Hủy", style: "cancel" }
    ]);
  };

  const menuItems: MenuItem[] = isPro
    ? [
        { icon: "settings-outline", label: "Cài đặt", onPress: showLayoutPicker },
        { icon: "shield-half-outline", label: "Bảo mật", badge: "CAO" },
        { icon: "notifications-outline", label: "Thông báo" },
        {
          icon: "headset-outline",
          label: "Hỗ trợ",
          onPress: () => router.push("/(app)/support")
        }
      ]
    : [
        { icon: "settings-outline", label: "Cài đặt hệ thống", onPress: showLayoutPicker },
        { icon: "shield-checkmark-outline", label: "Xác thực 2 lớp (2FA)", badge: "BẬT" },
        { icon: "notifications-outline", label: "Thông báo" },
        {
          icon: "headset-outline",
          label: "Trung tâm hỗ trợ",
          onPress: () => router.push("/(app)/support")
        }
      ];

  return (
    <Screen padded={false}>
      {loading ? (
        <LoadingState />
      ) : profile ? (
        <View style={[styles.page, { backgroundColor: theme.colors.bg }]}>
          <View style={[styles.topBar, { borderBottomColor: isPro ? "#242931" : "#1f2b3c" }]}>
            <Pressable hitSlop={10} onPress={() => router.back()}>
              <Ionicons color={theme.colors.text} name="arrow-back" size={24} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Hồ sơ</Text>
            <Pressable hitSlop={10}>
              <View>
                <Ionicons color={theme.colors.text} name="notifications-outline" size={23} />
                {!isPro ? <View style={styles.notificationDot} /> : null}
              </View>
            </Pressable>
          </View>

          <View style={styles.content}>
            <View
              style={[
                styles.profileCard,
                {
                  backgroundColor: isPro ? "#1b1f24" : "#1f2a3a",
                  borderColor: isPro ? "#202832" : "#2b384d"
                }
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  {
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.surfaceDark
                  }
                ]}
              >
                <Ionicons color={theme.colors.primary} name="trending-up-outline" size={30} />
                {!isPro ? <Text style={[styles.logoText, { color: theme.colors.primary }]}>TRADENEX</Text> : null}
                <View
                  style={[
                    styles.kycPill,
                    {
                      backgroundColor: theme.colors.success,
                      left: isPro ? -2 : 28,
                      minWidth: isPro ? 94 : 54
                    }
                  ]}
                >
                  {isPro ? <Ionicons color={theme.colors.ink} name="checkmark-circle" size={12} /> : null}
                  <Text style={[styles.kycText, { color: theme.colors.ink }]}>
                    {isPro ? (isVerified ? "Đã xác minh" : "Chưa xác minh") : "KYC"}
                  </Text>
                </View>
              </View>

              <View style={styles.identity}>
                <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={styles.uidRow}>
                  <Text style={[styles.uidLabel, { color: theme.colors.muted }]}>UID:</Text>
                  <Text style={[styles.uidValue, { color: theme.colors.muted }]}>{shortUid}</Text>
                  <Ionicons color={isPro ? theme.colors.muted : "#26a9e0"} name="copy-outline" size={14} />
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <MetricCard
                accent={theme.colors.success}
                icon={isPro ? "trending-up" : "trending-up-outline"}
                label="TỶ LỆ THẮNG"
                value="78.4%"
              />
              <MetricCard
                accent={isPro ? theme.colors.primary : "#38bdf8"}
                icon={isPro ? "bar-chart" : "analytics-outline"}
                label="TỔNG GIAO DỊCH"
                value="1,248"
              />
              <View style={styles.pnlFull}>
                <MetricCard
                  accent={isPro ? theme.colors.primary : "#38bdf8"}
                  icon="wallet-outline"
                  label="LỢI NHUẬN RÒNG (PNL)"
                  large
                  value="+$12,450.00"
                />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>TÀI KHOẢN & BẢO MẬT</Text>

            <View
              style={[
                styles.menuCard,
                {
                  backgroundColor: isPro ? "#1a1d22" : "#1f2a3a",
                  borderColor: isPro ? "#202832" : "#2b384d"
                }
              ]}
            >
              {menuItems.map((item, index) => (
                <MenuRow
                  key={item.label}
                  item={item}
                  last={index === menuItems.length - 1}
                />
              ))}
            </View>

            <Pressable
              onPress={signOut}
              style={[
                styles.logoutButton,
                {
                  borderColor: isPro ? "#27303a" : "rgba(246, 70, 93, 0.35)"
                }
              ]}
            >
              <Ionicons color={theme.colors.danger} name="log-out-outline" size={22} />
              <Text style={[styles.logoutText, { color: theme.colors.danger }]}>
                {isPro ? "Đăng xuất" : "Đăng xuất tài khoản"}
              </Text>
            </Pressable>

            <View style={styles.versionWrap}>
              <Text style={[styles.version, { color: isPro ? "#5f656d" : "#304052" }]}>
                {isPro ? "Phiên bản v4.8.2 (2023)" : "Phiên bản Pro v4.8.2 (Stable)"}
              </Text>
              {!isPro ? (
                <Text style={[styles.versionCode, { color: "#243448" }]}>
                  SECURE ENTERPRISE MODE: EC-02
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function MetricCard({
  accent,
  icon,
  label,
  large,
  value
}: {
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  large?: boolean;
  value: string;
}) {
  const { theme } = useLayoutMode();
  const isPro = theme.mode === "default";

  return (
    <View
      style={[
        styles.metricCard,
        large && styles.metricCardLarge,
        {
          backgroundColor: isPro ? "#1a1d22" : "#1f2a3a",
          borderColor: isPro ? "#202832" : "#2b384d"
        }
      ]}
    >
      <View style={large ? styles.metricLargeContent : undefined}>
        <View style={large ? styles.metricCopyLarge : undefined}>
          <Text style={[styles.metricLabel, { color: theme.colors.muted }]}>{label}</Text>
          <Text
            style={[
              styles.metricValue,
              large && styles.metricValueLarge,
              { color: large ? theme.colors.text : accent }
            ]}
          >
            {value}
          </Text>
        </View>
        {large ? (
          <View
            style={[
              styles.pnlIcon,
              { backgroundColor: isPro ? "rgba(252, 213, 53, 0.1)" : "rgba(56, 189, 248, 0.12)" }
            ]}
          >
            <Ionicons color={accent} name={icon} size={isPro ? 36 : 32} />
          </View>
        ) : null}
      </View>
      {!large ? (
        <Ionicons color={accent} name={icon} size={22} style={styles.metricIcon} />
      ) : null}
    </View>
  );
}

function MenuRow({ item, last }: { item: MenuItem; last: boolean }) {
  const { theme } = useLayoutMode();
  const isPro = theme.mode === "default";

  return (
    <Pressable
      onPress={item.onPress}
      style={[
        styles.menuRow,
        !last && {
          borderBottomColor: isPro ? "#282d34" : "#2b384d",
          borderBottomWidth: 1
        }
      ]}
    >
      <View style={styles.menuLeft}>
        <View
          style={[
            styles.menuIconBox,
            { backgroundColor: isPro ? "#252932" : "#334255" }
          ]}
        >
          <Ionicons color={isPro ? "#d7ceb9" : "#9badc2"} name={item.icon} size={23} />
        </View>
        <Text style={[styles.menuText, { color: theme.colors.text }]}>{item.label}</Text>
      </View>
      <View style={styles.menuRight}>
        {item.badge ? (
          <Text
            style={[
              styles.menuBadge,
              {
                color: item.badge === "CAO" ? theme.colors.danger : theme.colors.success
              }
            ]}
          >
            {item.badge}
          </Text>
        ) : null}
        <Ionicons color={theme.colors.muted} name="chevron-forward" size={21} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: "100%"
  },
  topBar: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 62,
    justifyContent: "space-between",
    paddingHorizontal: 20
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 16
  },
  notificationDot: {
    backgroundColor: "#f6465d",
    borderRadius: 3,
    height: 6,
    position: "absolute",
    right: -1,
    top: 1,
    width: 6
  },
  content: {
    gap: 24,
    padding: 20,
    paddingBottom: 52
  },
  profileCard: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 18,
    minHeight: 112,
    padding: 16
  },
  avatar: {
    alignItems: "center",
    borderRadius: 38,
    borderWidth: 2,
    height: 76,
    justifyContent: "center",
    position: "relative",
    width: 76
  },
  logoText: {
    fontSize: 7,
    fontWeight: "900",
    marginTop: 1
  },
  kycPill: {
    alignItems: "center",
    borderRadius: 999,
    bottom: -8,
    flexDirection: "row",
    gap: 3,
    justifyContent: "center",
    minHeight: 22,
    paddingHorizontal: 8,
    position: "absolute"
  },
  kycText: {
    fontSize: 10,
    fontWeight: "900"
  },
  identity: {
    flex: 1
  },
  name: {
    fontSize: 19,
    fontWeight: "800"
  },
  uidRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  uidLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.8
  },
  uidValue: {
    fontSize: 13,
    letterSpacing: 1.4
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  metricCard: {
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 90,
    minWidth: "45%",
    padding: 16,
    position: "relative"
  },
  metricCardLarge: {
    flexBasis: "100%",
    minHeight: 96
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4
  },
  metricValue: {
    fontSize: 25,
    fontWeight: "900",
    marginTop: 10
  },
  metricValueLarge: {
    fontSize: 29,
    marginTop: 8
  },
  metricIcon: {
    bottom: 18,
    position: "absolute",
    right: 18
  },
  metricLargeContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16
  },
  metricCopyLarge: {
    flex: 1
  },
  pnlIcon: {
    alignItems: "center",
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  pnlFull: {
    width: "100%"
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: -8,
    marginLeft: 4
  },
  menuCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden"
  },
  menuRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 72,
    paddingHorizontal: 16
  },
  menuLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  menuIconBox: {
    alignItems: "center",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  menuText: {
    fontSize: 16,
    fontWeight: "700"
  },
  menuRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  menuBadge: {
    fontSize: 10,
    fontWeight: "900"
  },
  logoutButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    height: 58,
    justifyContent: "center",
    marginTop: 18
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "900"
  },
  versionWrap: {
    alignItems: "center",
    gap: 4,
    marginTop: 2
  },
  version: {
    fontSize: 12
  },
  versionCode: {
    fontSize: 9,
    letterSpacing: 1
  }
});
