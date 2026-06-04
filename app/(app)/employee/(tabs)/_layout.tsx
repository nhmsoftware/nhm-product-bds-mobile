import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { employeePalette } from "@/libs/employee-theme";
import { appFonts } from "@/libs/typography";
import { canUseDemoLearning } from "@/services/auth/demo";
import { useAuth } from "@/services/auth/store";
import { employeeApi } from "@/services/employee/api";

export default function EmployeeTabsLayout() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const checkingLearningAccess = useRef(false);
  const bottomInset = Math.max(insets.bottom, 10);

  async function openLearningTab() {
    if (canUseDemoLearning(session)) {
      router.navigate("/employee/learning");
      return;
    }

    checkingLearningAccess.current = true;
    try {
      const access = await employeeApi.learningAccess();

      if (access.mandatoryLearningCompleted) {
        router.navigate("/employee/learning");
        return;
      }

      router.replace("/employee");
      setTimeout(() => {
        router.push("/employee/required-learning");
      }, 0);
    } catch {
      router.replace("/employee");
      setTimeout(() => {
        router.push("/employee/required-learning");
      }, 0);
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
          lineHeight: 16,
          textTransform: "uppercase"
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "HOME",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} />
        }}
      />
      <Tabs.Screen
        name="learning"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            if (checkingLearningAccess.current) return;
            void openLearningTab();
          }
        }}
        options={{
          title: "LEARNING",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="school-outline" size={size} />
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: "CHECK-IN",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="location-outline" size={size} />
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "NEWS",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="calendar-outline" size={size} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "PROFILE",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-outline" size={size} />
        }}
      />
      <Tabs.Screen name="inventory" options={{ href: null }} />
    </Tabs>
  );
}
