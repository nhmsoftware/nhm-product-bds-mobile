import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { employeePalette } from "@/libs/employee-theme";
import { useI18n, type TranslationKey } from "@/libs/i18n";
import { appFonts } from "@/libs/typography";
import { useAuth } from "@/services/auth/store";
import { employeeHomeActions, employeeKpis } from "@/services/employee/mock-data";

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

export default function EmployeeHomeScreen() {
  const { t } = useI18n();
  const { session } = useAuth();
  const fullName = session?.user.fullName || t("employee.home.fallbackName");

  return (
    <Screen edges={["top", "left", "right"]} padded={false}>
      <View style={styles.topBar}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{fullName.slice(0, 1)}</Text>
        </View>
        <Ionicons name="notifications-outline" size={20} color={employeePalette.text} />
      </View>

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{t("employee.home.greeting")}</Text>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.subtitle}>{t("employee.home.subtitle")}</Text>
        </View>

        <View style={styles.stats}>
          {employeeKpis.map((item, index) => {
            const isGold = item.tone === "gold";
            const primaryColor = isGold ? employeePalette.goldDark : employeePalette.red;
            const softColor = isGold ? employeePalette.goldSoft : employeePalette.redSoft;
            const copy = kpiCopy[index];

            return (
              <View
                key={item.label}
                style={[
                  styles.statCard,
                  isGold ? styles.statCardGold : styles.statCardRed
                ]}
              >
                <View>
                  <Text style={styles.statLabel}>{copy ? t(copy.labelKey) : item.label}</Text>
                  <Text style={[styles.statValue, { color: primaryColor }]}>{item.value}</Text>
                  <Text style={[styles.statHint, { color: primaryColor }]}>
                    {copy ? t(copy.helperKey) : item.helper}
                  </Text>
                </View>
                <View style={[styles.statIcon, { backgroundColor: softColor }]}>
                  <Ionicons color={primaryColor} name={item.icon} size={20} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.buttons}>
          <EmployeeHomeButton
            title={t("employee.home.checkIn")}
            color={employeePalette.red}
            icon="qr-code-outline"
            onPress={() => router.push("/(app)/employee/check-in")}
          />
          <EmployeeHomeButton
            title={t("employee.home.apply")}
            color={employeePalette.gold}
            onPress={() => router.push("/(app)/employee/referral-qr")}
          />
        </View>

        <View style={styles.actions}>
          {employeeHomeActions.map((item, index) => {
            const copy = actionCopy[index];
            const target =
              index === 0
                ? "/(app)/employee/news"
                : index === 1
                  ? "/(app)/employee/inventory"
                  : "/(app)/employee/learning";

            return (
              <Pressable
                key={item.title}
                onPress={() => router.push(target)}
                style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
              >
                <View style={styles.actionIcon}>
                  <Ionicons color={employeePalette.muted} name={item.icon} size={27} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>
                    {copy ? t(copy.titleKey) : item.title}
                  </Text>
                  <Text style={styles.actionDescription} numberOfLines={2}>
                    {copy ? t(copy.descriptionKey) : item.description}
                  </Text>
                </View>
                <Ionicons color="#b49e9b" name="chevron-forward" size={18} />
              </Pressable>
            );
          })}
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
    minHeight: 60,
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
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 146,
    paddingHorizontal: 25,
    paddingVertical: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.04,
    shadowRadius: 22,
    elevation: 2
  },
  statCardRed: {
    borderColor: "#eadfdf"
  },
  statCardGold: {
    borderColor: "#ffdfa1"
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
    width: 48
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
