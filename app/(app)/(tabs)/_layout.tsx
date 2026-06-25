import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RoleGuard } from "@/components/RoleGuard";
import { appFonts } from "@/libs/typography";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <RoleGuard allowedRoles={["customer"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#950100",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopColor: "#f3f4f6",
            height: 56 + bottomInset,
            paddingBottom: bottomInset,
            paddingHorizontal: 24,
            paddingTop: 9
          },
          tabBarLabelStyle: {
            fontFamily: appFonts.regular,
            fontSize: 10,
            lineHeight: 15,
            marginTop: 4
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Trang chủ",
            tabBarIcon: ({ color }) => (
              <Ionicons color={color} name="home-outline" size={22} />
            )
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Tin tức",
            tabBarIcon: ({ color }) => (
              <Ionicons color={color} name="newspaper-outline" size={24} />
            )
          }}
        />
        <Tabs.Screen
          name="legal"
          options={{
            title: "Pháp lý",
            tabBarIcon: ({ color }) => (
              <Ionicons color={color} name="shield-checkmark-outline" size={24} />
            )
          }}
        />
        <Tabs.Screen
          name="inquiries"
          options={{
            title: "Quy hoạch",
            tabBarIcon: ({ color }) => (
              <Ionicons color={color} name="map-outline" size={24} />
            )
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Liên hệ",
            tabBarIcon: ({ color }) => (
              <Ionicons color={color} name="call-outline" size={24} />
            )
          }}
        />
      </Tabs>
    </RoleGuard>
  );
}
