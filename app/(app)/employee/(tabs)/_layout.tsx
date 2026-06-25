import { Ionicons } from "@expo/vector-icons";
import { router, Tabs, usePathname } from "expo-router";
import { useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { employeePalette } from "@/libs/employee-theme";
import { appFonts } from "@/libs/typography";
import { canUseDemoLearning } from "@/services/auth/demo";
import { useAuth } from "@/services/auth/store";
import { employeeApi } from "@/services/employee/api";

export default function EmployeeTabsLayout() {
  const { session } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const checkingLearningAccess = useRef(false);
  const bottomInset = Math.max(insets.bottom, 10);
  const learningReturnTo = pathname && pathname !== "/employee/learning" ? pathname : "/employee";

  function openRequiredLearning() {
    router.push({
      pathname: "/employee/required-learning",
      params: { returnTo: learningReturnTo }
    });
  }

  async function openLearningTab() {
    if (canUseDemoLearning(session)) {
      router.navigate("/employee/learning");
      return;
    }

    if (checkingLearningAccess.current) {
      return;
    }

    checkingLearningAccess.current = true;
    try {
      const access = await employeeApi.learningAccess();

      if (access.mandatoryLearningCompleted) {
        router.navigate("/employee/learning");
        return;
      }

      openRequiredLearning();
    } catch {
      openRequiredLearning();
    } finally {
      checkingLearningAccess.current = false;
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: employeePalette.red,
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          borderTopColor: "#f1f5f9",
          height: 70 + bottomInset,
          paddingBottom: bottomInset,
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
          lineHeight: 16
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} />
        }}
      />
      <Tabs.Screen
        name="learning"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            void openLearningTab();
          }
        }}
        options={{
          title: "Học tập",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="school-outline" size={size} />
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: "Check-in",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="location-outline" size={size} />
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "Điểm đến",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="calendar-outline" size={size} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-outline" size={size} />
        }}
      />
      <Tabs.Screen name="inventory" options={{ href: null }} />
    </Tabs>
  );
}
