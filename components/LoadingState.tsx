import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";
import { useI18n } from "@/libs/i18n";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label }: LoadingStateProps) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const displayLabel = label ?? t("common.loading");

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.muted }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    padding: 24
  },
  text: {
    fontSize: 14,
    fontWeight: "600"
  }
});
