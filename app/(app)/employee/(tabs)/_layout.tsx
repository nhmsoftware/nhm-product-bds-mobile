import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Path, Svg } from "react-native-svg";

import { employeePalette } from "@/libs/employee-theme";
import { appFonts } from "@/libs/typography";
import { useAuth } from "@/services/auth/store";

/** Icon khu đất — hình bản đồ vị trí + đất nền */
function LandAreaTabIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Khung đất / lô */}
      <Path
        d="M3 20L7 4H17L21 20H3Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        fill="none"
      />
      {/* Đường phân chia lô */}
      <Path
        d="M3 13H21M10 4L8 20M14 4L16 20"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function EmployeeTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);
  const { session } = useAuth();

  const permissions = session?.user?.permissions || [];
  const isSuperAdmin = permissions.includes("manage_all");

  const hasLearning = isSuperAdmin || permissions.includes("mobile_learning");
  const hasCheckIn = isSuperAdmin || permissions.includes("mobile_checkin");
  const hasWarehouse = isSuperAdmin || permissions.includes("mobile_warehouse");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
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
        options={{
          title: "Học tập",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="school-outline" size={size} />,
          href: hasLearning ? undefined : null
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: "Check-in",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="location-outline" size={size} />,
          href: hasCheckIn ? undefined : null
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "Khu đất",
          tabBarIcon: ({ color, size }) => <LandAreaTabIcon color={color} size={size} />,
          href: hasWarehouse ? undefined : null
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
