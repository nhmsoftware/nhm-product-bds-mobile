import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { APP_NAME } from "@/libs/env";
import { colors } from "@/libs/theme";
import { useAuth } from "@/services/auth/store";

export default function Index() {
  const { loading, signedIn } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(signedIn ? "/(app)/(tabs)" : "/(auth)/login");
  }, [loading, signedIn]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.logo}>{APP_NAME}</Text>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    backgroundColor: colors.bg,
    flex: 1,
    gap: 18,
    justifyContent: "center"
  },
  logo: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900"
  }
});
