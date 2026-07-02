import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Defs, LinearGradient, Path, Rect, Stop, Svg } from "react-native-svg";

import { Screen } from "@/components/Screen";
import { Pressable } from "@/components/SafePressable";
import { EMPLOYEE_HEADER_HEIGHT, EmployeeAvatarButton, EmployeeNotificationButton } from "@/components/EmployeeUI";
import { employeePalette } from "@/libs/employee-theme";
import { useI18n, type TranslationKey } from "@/libs/i18n";
import { appLogger } from "@/libs/logger";
import { mediaUrl } from "@/libs/media";
import { appFonts } from "@/libs/typography";
import { isBaseEmployeeRole, isExecutiveAdminRole } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";
import { employeeApi } from "@/services/employee/api";

const kpiCopy: { labelKey: TranslationKey; helperKey: TranslationKey }[] = [
  { labelKey: "employee.kpi.news.label", helperKey: "employee.kpi.news.helper" },
  { labelKey: "employee.kpi.points.label", helperKey: "employee.kpi.points.helper" }
];

const actionCopy: { titleKey: TranslationKey; descriptionKey: TranslationKey }[] = [
  {
    titleKey: "employee.action.news.title",
    descriptionKey: "employee.action.news.description"
  },
  {
    titleKey: "employee.action.inventory.title",
    descriptionKey: "employee.action.inventory.description"
  },
  {
    titleKey: "employee.action.learning.title",
    descriptionKey: "employee.action.learning.description"
  }
];

const fallbackNewsCount = "0";
const fallbackPointTotal = "0";
const fallbackPointRank = "";

type DashboardRecord = Record<string, unknown>;

type EmployeeHomeRoute =
  | "/employee/check-in"
  | "/employee/inventory"
  | "/employee/inventory-list"
  | "/employee/learning"
  | "/employee/news"
  | "/employee/news-feed"
  | "/employee/notifications"
  | "/employee/point-history"
  | "/employee/required-learning";

type HomeActionRow = {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  target: EmployeeHomeRoute;
  title: string;
};

type EmployeeHomeButtonProps = {
  title: string;
  color: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

function EmployeeHomeButton({ title, color, icon, onPress }: EmployeeHomeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.homeButton,
        { backgroundColor: color, borderColor: color },
        pressed && styles.pressed
      ]}
    >
      <View style={styles.homeButtonContent}>
        {icon ? <Ionicons name={icon} size={20} color="#ffffff" /> : null}
        <Text style={styles.homeButtonText}>{title}</Text>
      </View>
    </Pressable>
  );
}

function StatCardBackground({ tone }: { tone: "red" | "gold" }) {
  const color = tone === "gold" ? "#ffdf9f" : "#ffdad4";

  return (
    <View pointerEvents="none" style={styles.statCardBackground}>
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 180 146" width="100%">
        <Defs>
          <LinearGradient id={`employee-home-stat-${tone}`} x1="0" x2="1" y1="0" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0" />
            <Stop offset="0.55" stopColor={color} stopOpacity="0.18" />
            <Stop offset="1" stopColor={color} stopOpacity="0.58" />
          </LinearGradient>
        </Defs>
        <Rect fill={`url(#employee-home-stat-${tone})`} height="146" width="180" x="0" y="0" />
      </Svg>
    </View>
  );
}

function NewsCardIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M7 2.75C7 2.34 7.34 2 7.75 2C8.16 2 8.5 2.34 8.5 2.75V4H15.5V2.75C15.5 2.34 15.84 2 16.25 2C16.66 2 17 2.34 17 2.75V4H19C20.1 4 21 4.9 21 6V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V6C3 4.9 3.9 4 5 4H7V2.75ZM5 9V19H19V9H5ZM7 11H12.25V16.25H7V11ZM14 11H17V12.75H14V11ZM14 14.5H17V16.25H14V14.5Z"
        fill={color}
      />
    </Svg>
  );
}

function isDashboardRecord(value: unknown): value is DashboardRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function dashboardText(value: unknown, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function dashboardList(value: unknown): DashboardRecord[] {
  return Array.isArray(value) ? value.filter(isDashboardRecord) : [];
}

function formatDashboardNumber(value: unknown, fallback: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-US") : fallback;
}

function formatDashboardRank(value: unknown, fallback: string) {
  const rank = dashboardText(value).replace(/^hạng[:\s]*/i, "").trim();
  if (!rank) {
    return fallback;
  }

  return rank.toLowerCase() === "vàng" ? "Hạng Vàng (Gold Tier)" : `Hạng ${rank}`;
}

function formatRewardRank(value: unknown, fallback: string) {
  const rankValue = isDashboardRecord(value) ? value.label : value;
  const rankId = isDashboardRecord(value) ? dashboardText(value.id) : "";
  if (rankId) {
    const normalizedId = rankId.toLowerCase();
    if (normalizedId === "4" || normalizedId === "platinum") return "Hạng Bạch Kim (Platinum Tier)";
    if (normalizedId === "3" || normalizedId === "gold") return "Hạng Vàng (Gold Tier)";
    if (normalizedId === "2" || normalizedId === "silver") return "Hạng Bạc (Silver Tier)";
    if (normalizedId === "1" || normalizedId === "bronze") return "Hạng Đồng (Bronze Tier)";
  }

  const rank = dashboardText(rankValue).trim();
  if (!rank) {
    return fallback;
  }

  const normalized = rank.toLowerCase();
  if (normalized.includes("platinum") || normalized.includes("bạch kim")) return "Hạng Bạch Kim (Platinum Tier)";
  if (normalized.includes("gold") || normalized.includes("vàng")) return "Hạng Vàng (Gold Tier)";
  if (normalized.includes("silver") || normalized.includes("bạc")) return "Hạng Bạc (Silver Tier)";
  if (normalized.includes("bronze") || normalized.includes("đồng")) return "Hạng Đồng (Bronze Tier)";

  return /^hạng\b/i.test(rank) ? rank : `Hạng ${rank}`;
}

function formatKpiPoints(value: unknown) {
  const points = Number(value);
  return Number.isFinite(points) ? `${points.toLocaleString("en-US")} điểm KPI` : "";
}

function normalizeDashboardModuleKind(module: DashboardRecord) {
  const marker = `${dashboardText(module.icon)} ${dashboardText(module.title)}`.toLowerCase();

  if (marker.includes("academic") || marker.includes("khóa") || marker.includes("hoc") || marker.includes("học")) {
    return "learning";
  }

  if (marker.includes("home") || marker.includes("kho") || marker.includes("sản phẩm") || marker.includes("bất động sản")) {
    return "inventory";
  }

  if (marker.includes("bell") || marker.includes("thông báo")) {
    return "notifications";
  }

  if (marker.includes("tin")) {
    return "news";
  }

  if (marker.includes("location") || marker.includes("chấm công") || marker.includes("điểm danh")) {
    return "attendance";
  }

  if (marker.includes("chart") || marker.includes("kpi")) {
    return "kpi";
  }

  return "unknown";
}

function dashboardModuleIcon(kind: string): keyof typeof Ionicons.glyphMap {
  if (kind === "news") return "newspaper-outline";
  if (kind === "learning") return "school-outline";
  if (kind === "inventory") return "business-outline";
  if (kind === "notifications") return "notifications-outline";
  if (kind === "attendance") return "location-outline";
  if (kind === "kpi") return "stats-chart-outline";
  return "calendar-outline";
}

function dashboardModuleTarget(kind: string, learningTarget: EmployeeHomeRoute): EmployeeHomeRoute {
  if (kind === "learning") return learningTarget;
  if (kind === "inventory") return "/employee/inventory-list";
  if (kind === "notifications") return "/employee/notifications";
  if (kind === "attendance") return "/employee/check-in";
  if (kind === "kpi") return "/employee/point-history";
  // news kind → standalone news-feed route (không phải tab khu đất)
  return "/employee/news-feed";
}

function dashboardModulesToActions(modules: DashboardRecord[], learningTarget: EmployeeHomeRoute): HomeActionRow[] {
  const byKind = new Map<string, DashboardRecord>();

  modules.forEach((module) => {
    const kind = normalizeDashboardModuleKind(module);
    if (!byKind.has(kind)) {
      byKind.set(kind, module);
    }
  });

  // Ưu tiên hiển thị: thông báo, kho hàng, học tập
  return ["notifications", "inventory", "learning"]
    .map((kind) => {
      const module = byKind.get(kind);
      if (!module) return null;

      return {
        description: dashboardText(module.description, ""),
        icon: dashboardModuleIcon(kind),
        target: dashboardModuleTarget(kind, learningTarget),
        title: dashboardText(module.title, "")
      } satisfies HomeActionRow;
    })
    .filter((item): item is HomeActionRow => Boolean(item && item.title));
}

function learningTargetFromCoursePayload(value: unknown): EmployeeHomeRoute {
  const payload = isDashboardRecord(value) ? value : {};
  const course = isDashboardRecord(payload.course) ? payload.course : null;

  if (!course) {
    return "/employee/required-learning";
  }

  const progress = isDashboardRecord(course.progress) ? course.progress : {};
  const status = dashboardText(progress.status ?? course.status, "").toLowerCase();
  const percent = Number(progress.percent ?? course.progress_percent ?? course.progressPercent ?? 0);

  return status === "completed"
    ? "/employee/learning"
    : "/employee/required-learning";
}

function openHomeTarget(target: EmployeeHomeRoute) {
  if (target === "/employee/notifications") {
    router.push({
      pathname: "/employee/notifications",
      params: { returnTo: "/employee" }
    });
    return;
  }

  router.push(target);
}

export default function EmployeeHomeScreen() {
  const { t } = useI18n();
  const { session } = useAuth();
  const [dashboardName, setDashboardName] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [newsCount, setNewsCount] = useState(fallbackNewsCount);
  const [pointTotal, setPointTotal] = useState(fallbackPointTotal);
  const [pointRank, setPointRank] = useState(fallbackPointRank);
  const [dashboardModules, setDashboardModules] = useState<DashboardRecord[]>([]);
  const [learningTarget, setLearningTarget] = useState<EmployeeHomeRoute>("/employee/required-learning");
  const fullName = dashboardName || session?.user.fullName || t("employee.home.fallbackName");
  const currentAvatarUri = mediaUrl(session?.user.avatar) || avatarUri;
  const roleKnown = session?.user.role !== undefined && session.user.role !== null;
  const hidePersonalAchievementSections = isExecutiveAdminRole(session?.user.role);
  const visibleKpiCopy = hidePersonalAchievementSections ? kpiCopy.slice(0, 1) : kpiCopy;
  const approvedEmployeeProfile = !isBaseEmployeeRole(session?.user.role) || Boolean(session?.user.isActive && session?.user.jobPosition?.trim());
  // Fallback cứng — luôn hiện đủ 3 card dù API có hay không có modules
  const fallbackActions: HomeActionRow[] = [
    {
      description: t("employee.action.news.description"),
      icon: "notifications-outline",
      target: "/employee/notifications",
      title: t("employee.action.news.title")
    },
    {
      description: t("employee.action.inventory.description"),
      icon: "business-outline",
      target: "/employee/inventory-list",
      title: t("employee.action.inventory.title")
    },
    {
      description: t("employee.action.learning.description"),
      icon: "school-outline",
      target: learningTarget,
      title: t("employee.action.learning.title")
    }
  ];
  const apiActions = dashboardModules.length > 0
    ? dashboardModulesToActions(dashboardModules, learningTarget)
    : [];
  // Nếu API trả về đủ 3 card thì dùng API, ngược lại dùng fallback
  const actionRows = apiActions.length >= 3 ? apiActions : fallbackActions;

  useEffect(() => {
    let mounted = true;

    employeeApi
      .dashboard()
      .then((response) => {
        if (!mounted) return;

        const dashboard = isDashboardRecord(response.data) ? response.data : {};
        const user = isDashboardRecord(dashboard.user) ? dashboard.user : {};
        const overview = isDashboardRecord(dashboard.overview) ? dashboard.overview : {};
        const kpi = isDashboardRecord(overview.kpi) ? overview.kpi : {};
        const modules = dashboardList(dashboard.modules);
        const latestNews = dashboardList(overview.latest_news);
        const newsModule = modules.find((module) => normalizeDashboardModuleKind(module) === "news");

        setDashboardName(dashboardText(user.name, ""));
        setAvatarUri(mediaUrl(user.avatar) || null);
        const apiNewsCount = Array.isArray(overview.latest_news) ? latestNews.length : newsModule?.count;

        setNewsCount(formatDashboardNumber(apiNewsCount, fallbackNewsCount));
        setPointTotal(formatDashboardNumber(kpi.points, fallbackPointTotal));
        setPointRank(formatDashboardRank(kpi.ranking, fallbackPointRank));
        setDashboardModules(modules);
      })
      .catch((error) => {
        appLogger.warn("employee.dashboard", "Không thể tải dashboard employee.", { error });
      });

    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      employeeApi
        .courses()
        .then((response) => {
          if (mounted) {
            setLearningTarget(learningTargetFromCoursePayload(response.data));
          }
        })
        .catch((error) => {
          appLogger.warn("employee.learning_target", "Không thể tải tiến độ khóa học bắt buộc.", { error });
        });

      return () => {
        mounted = false;
      };
    }, [])
  );

  useEffect(() => {
    if (!roleKnown || hidePersonalAchievementSections) {
      setPointTotal(fallbackPointTotal);
      setPointRank(fallbackPointRank);
      return;
    }

    let mounted = true;

    employeeApi
      .rewardPointOverview()
      .then((response) => {
        if (!mounted) return;

        const overview = isDashboardRecord(response.data) ? response.data : {};
        const totalPoints = overview.total_points ?? overview.reward_points ?? overview.points ?? overview.balance;
        const rank = overview.rank ?? overview.rank_label ?? overview.tier;
        const kpiPoints = formatKpiPoints(overview.kpi_points ?? overview.kpi_stars ?? overview.points ?? overview.kpiPoints);

        setPointTotal(formatDashboardNumber(totalPoints, fallbackPointTotal));
        setPointRank(rank ? formatRewardRank(rank, fallbackPointRank) : kpiPoints || fallbackPointRank);
      })
      .catch((error) => {
        appLogger.warn("employee.reward_points", "Không thể tải điểm tích lũy.", { error });
      });

    return () => {
      mounted = false;
    };
  }, [hidePersonalAchievementSections, roleKnown]);

  return (
    <Screen edges={["top", "left", "right"]} padded={false} safeBackgroundColor="#ffffff">
      <View style={styles.topBar}>
        <EmployeeAvatarButton imageUri={currentAvatarUri} label={fullName} />
        <EmployeeNotificationButton returnTo="/employee" />
      </View>

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{t("employee.home.greeting")}</Text>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.subtitle}>{t("employee.home.subtitle")}</Text>
        </View>

        <View style={styles.stats}>
          {visibleKpiCopy.map((copy) => {
            const isPointCard = copy.labelKey === "employee.kpi.points.label";
            const primaryColor = isPointCard ? employeePalette.goldDark : employeePalette.red;
            const softColor = isPointCard ? employeePalette.goldSoft : employeePalette.redSoft;
            const hintColor = isPointCard ? employeePalette.goldDark : employeePalette.gold;
            const target = isPointCard ? "/employee/point-history" : "/employee/news-feed";


            return (
              <Pressable
                key={copy.labelKey}
                accessibilityRole="button"
                onPress={() => router.push(target)}
                style={({ pressed }) => [
                  styles.statCard,
                  isPointCard ? styles.statCardGold : styles.statCardRed,
                  pressed && styles.pressed
                ]}
              >
                <StatCardBackground tone={isPointCard ? "gold" : "red"} />
                <View style={styles.statCopy}>
                  <Text style={styles.statLabel}>{t(copy.labelKey)}</Text>
                  <Text style={[styles.statValue, { color: primaryColor }]}>
                    {isPointCard ? pointTotal : newsCount}
                  </Text>
                  <Text style={[styles.statHint, { color: hintColor }]}>
                    {isPointCard ? "Xem chi tiết" : t(copy.helperKey)}
                  </Text>
                </View>
                <View style={[styles.statIcon, { backgroundColor: softColor }]}>
                  {isPointCard ? <Ionicons color={primaryColor} name="star" size={20} /> : <NewsCardIcon color={primaryColor} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.buttons}>
          <EmployeeHomeButton
            title={t("employee.home.checkIn")}
            color={employeePalette.red}
            icon="qr-code-outline"
            onPress={() => router.push("/employee/check-in")}
          />
          {approvedEmployeeProfile ? null : (
            <EmployeeHomeButton
              title={t("employee.home.apply")}
              color={employeePalette.gold}
              onPress={() => router.push("/(app)/employee/application" as Href)}
            />
          )}
        </View>

        <View style={styles.actions}>
          {actionRows.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => openHomeTarget(item.target)}
              style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
            >
              <View style={styles.actionIcon}>
                <Ionicons color={employeePalette.muted} name={item.icon} size={27} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionDescription} numberOfLines={2}>{item.description}</Text>
              </View>
              <Ionicons color="#b49e9b" name="chevron-forward" size={18} />
            </Pressable>
          ))}
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
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingHorizontal: 20
  },
  body: {
    backgroundColor: employeePalette.bg,
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24
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
  avatarImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  notificationButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  header: {
    paddingBottom: 48
  },
  greeting: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 40,
    fontWeight: "900",
    lineHeight: 44
  },
  name: {
    color: employeePalette.redDark,
    fontFamily: appFonts.bold,
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38.4
  },
  subtitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6,
    paddingTop: 3
  },
  stats: {
    gap: 16,
    paddingBottom: 48
  },
  statCard: {
    alignItems: "center",
    backgroundColor: employeePalette.bg,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 146,
    overflow: "hidden",
    paddingHorizontal: 25,
    paddingVertical: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.04,
    shadowRadius: 22,
    elevation: 2
  },
  statCardRed: {
    borderColor: employeePalette.border
  },
  statCardGold: {
    borderColor: "rgba(253, 206, 103, 0.3)"
  },
  statCardBackground: {
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "52%"
  },
  statCopy: {
    flex: 1,
    minWidth: 0,
    zIndex: 1
  },
  statLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    lineHeight: 16
  },
  statValue: {
    fontFamily: appFonts.bold,
    fontSize: 40,
    fontWeight: "900",
    lineHeight: 44,
    paddingTop: 4
  },
  statHint: {
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 17
  },
  statIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48,
    zIndex: 1
  },
  buttons: {
    gap: 48,
    paddingBottom: 48
  },
  homeButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingVertical: 12,
    shadowColor: "#7b1000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 21,
    elevation: 4
  },
  homeButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 24
  },
  homeButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.32,
    lineHeight: 24,
    paddingTop: 1,
    textAlignVertical: "center"
  },
  actions: {
    gap: 16,
    paddingBottom: 32
  },
  actionCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 106.8,
    paddingHorizontal: 17,
    paddingVertical: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2
  },
  actionIcon: {
    alignItems: "center",
    backgroundColor: "#edf0ee",
    borderRadius: 8,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  actionText: {
    flex: 1,
    gap: 7
  },
  actionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28.8
  },
  actionDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  pressed: {
    opacity: 0.85
  }
});
