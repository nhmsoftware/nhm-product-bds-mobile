import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";

export function LoadingState({ label = "Đang tải..." }: { label?: string }) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 10,
    padding: 24
  },
  text: {
    fontSize: 14
  }
});
