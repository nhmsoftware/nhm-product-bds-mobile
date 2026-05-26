import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { RoleGuard } from "@/components/RoleGuard";
import { appFonts } from "@/libs/typography";

export default function TabsLayout() {
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
            height: 68,
            paddingBottom: 12,
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
            title: "HOME",
            tabBarLabelStyle: {
              color: "#950100",
              fontFamily: appFonts.semiBold,
              fontSize: 10,
              lineHeight: 15,
              marginTop: 4
            },
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
          name="saved"
          options={{
            title: "Dự án",
            tabBarIcon: ({ color }) => (
              <Ionicons color={color} name="business-outline" size={24} />
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
