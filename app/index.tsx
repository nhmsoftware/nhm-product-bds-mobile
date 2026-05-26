import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { APP_NAME } from "@/libs/env";
import { useAppTheme } from "@/libs/layout-mode";
import { getHomeHrefForSession } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";

export default function Index() {
  const theme = useAppTheme();
  const { loading, session, signedIn } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(signedIn ? getHomeHrefForSession(session) : "/(auth)/login");
  }, [loading, session, signedIn]);

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.logo, { color: theme.colors.text }]}>{APP_NAME}</Text>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flex: 1,
    gap: 18,
    justifyContent: "center"
  },
  logo: {
    fontSize: 34,
    fontWeight: "900"
  }
});
