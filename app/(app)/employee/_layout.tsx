import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { RoleGuard } from "@/components/RoleGuard";
import { employeePalette } from "@/libs/employee-theme";
import { useI18n } from "@/libs/i18n";
import { appFonts } from "@/libs/typography";

const hiddenScreens = [
  "meet-client",
  "showing-client",
  "point-history",
  "personal-info",
  "referral-qr",
  "leave-requests",
  "transfer-requests",
  "department-staff",
  "lesson-detail",
  "required-learning",
  "quiz",
  "quiz-result",
  "certificates",
  "inventory",
  "inventory-map",
  "lot-detail",
  "notifications",
  "comments",
  "manager-profile"
] as const;

export default function EmployeeLayout() {
  const { t } = useI18n();

  return (
    <RoleGuard allowedRoles={["employee"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: employeePalette.red,
          tabBarInactiveTintColor: "#94a3b8",
          tabBarStyle: {
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            borderTopColor: "#f1f5f9",
            height: 80,
            paddingBottom: 10,
            paddingTop: 8,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 14,
            elevation: 8
          },
          tabBarLabelStyle: {
            fontFamily: appFonts.semiBold,
            fontSize: 10,
            fontWeight: "600",
            letterSpacing: 0.5,
            lineHeight: 16,
            textTransform: "uppercase"
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("employee.tabs.home"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons color={color} name="home" size={size} />
            )
          }}
        />
        <Tabs.Screen
          name="learning"
          options={{
            title: t("employee.tabs.learning"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons color={color} name="school-outline" size={size} />
            )
          }}
        />
        <Tabs.Screen
          name="check-in"
          options={{
            title: t("employee.tabs.checkIn"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons color={color} name="location-outline" size={size} />
            )
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: t("employee.tabs.news"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons color={color} name="newspaper-outline" size={size} />
            )
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("employee.tabs.profile"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons color={color} name="person-outline" size={size} />
            )
          }}
        />
        {hiddenScreens.map((name) => (
          <Tabs.Screen key={name} name={name} options={{ href: null, tabBarStyle: { display: "none" } }} />
        ))}
      </Tabs>
    </RoleGuard>
  );
}
