import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";

type StatusBadgeProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  const theme = useAppTheme();
  const colorMap = {
    neutral: theme.colors.muted,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    primary: theme.colors.primary
  };
  const color = colorMap[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: color,
          backgroundColor: `${color}1f`,
          borderRadius: theme.radius.full
        }
      ]}
    >
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  label: {
    fontSize: 12,
    fontWeight: "800"
  }
});
