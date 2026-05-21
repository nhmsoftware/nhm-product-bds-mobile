import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "@/libs/theme";

export function MessageBox({
  message,
  tone = "neutral"
}: {
  message?: string | null;
  tone?: "neutral" | "error" | "success";
}) {
  if (!message) return null;

  return (
    <View style={[
      styles.box,
      tone === "error" && styles.error,
      tone === "success" && styles.success,
      tone === "neutral" && styles.neutral
    ]}>
      <Text style={[
        styles.text,
        tone === "error" && styles.textError,
        tone === "success" && styles.textSuccess
      ]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12
  },
  neutral: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border
  },
  error: {
    backgroundColor: "rgba(246, 70, 93, 0.15)",
    borderColor: "rgba(246, 70, 93, 0.3)"
  },
  success: {
    backgroundColor: "rgba(14, 203, 129, 0.15)",
    borderColor: "rgba(14, 203, 129, 0.3)"
  },
  text: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500"
  },
  textError: {
    color: colors.danger
  },
  textSuccess: {
    color: colors.success
  }
});
