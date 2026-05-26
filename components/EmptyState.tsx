import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function EmptyState({ title, description, icon = "home-outline" }: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={34} color={theme.colors.muted} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.colors.muted }]}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 8,
    padding: 26
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center"
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  }
});
