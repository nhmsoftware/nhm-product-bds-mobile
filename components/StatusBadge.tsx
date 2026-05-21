import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";

type Tone = "success" | "warning" | "danger" | "neutral";

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const theme = useAppTheme();
  const toneColors = {
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    neutral: theme.colors.muted
  };
  const color = toneColors[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: tone === "neutral" ? theme.colors.surfaceAlt : `${color}26`,
          borderColor: tone === "neutral" ? theme.colors.border : `${color}4d`,
          borderRadius: theme.radius.sm
        }
      ]}
    >
      <Text style={[
        styles.text,
        {
          color,
          fontSize: theme.compact ? 11 : 12
        }
      ]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  text: {
    fontWeight: "700"
  }
});
