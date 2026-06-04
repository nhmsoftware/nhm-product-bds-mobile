import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppFlashMessage } from "@/components/AppFlashMessage";
import { LanguageProvider } from "@/libs/i18n";
import { LayoutModeProvider } from "@/libs/layout-mode";
import { AuthProvider } from "@/services/auth/store";
import { NotificationProvider } from "@/services/notifications/provider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "BeVietnamPro-Regular": require("@/assets/fonts/BeVietnamPro-Regular.ttf"),
    "BeVietnamPro-SemiBold": require("@/assets/fonts/BeVietnamPro-SemiBold.ttf"),
    "BeVietnamPro-Bold": require("@/assets/fonts/BeVietnamPro-Bold.ttf")
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LayoutModeProvider>
          <LanguageProvider>
            <AuthProvider>
              <NotificationProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(app)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <AppFlashMessage />
              </NotificationProvider>
            </AuthProvider>
          </LanguageProvider>
        </LayoutModeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
