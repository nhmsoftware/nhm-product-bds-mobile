import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useAppTheme } from "@/libs/layout-mode";

export default function TabsLayout() {
  const theme = useAppTheme();
  const isProfessionalLayout = theme.mode === "default";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: isProfessionalLayout ? "#181b20" : "#101827",
          borderTopColor: theme.colors.border,
          borderTopLeftRadius: isProfessionalLayout ? 8 : 0,
          borderTopRightRadius: isProfessionalLayout ? 8 : 0,
          height: isProfessionalLayout ? 70 : 72,
          paddingBottom: isProfessionalLayout ? 10 : 12,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 10,
          elevation: 8
        },
        tabBarLabelStyle: {
          fontSize: theme.compact ? 10 : 11,
          fontWeight: "700",
          marginTop: 2
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name={isProfessionalLayout ? "home-outline" : "grid-outline"} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: "Thị trường",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name={isProfessionalLayout ? "bar-chart-outline" : "options-outline"} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          href: null,
          title: "Tài khoản",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="shield-outline" size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: "Giao dịch",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name={isProfessionalLayout ? "sync-circle-outline" : "swap-horizontal-outline"} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Ví",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="wallet-outline" size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="person" size={size} />
          )
        }}
      />
    </Tabs>
  );
}
