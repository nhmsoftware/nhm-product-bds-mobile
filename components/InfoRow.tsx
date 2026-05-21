import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";

export function InfoRow({
  label,
  value
}: {
  label: string;
  value?: string | number | null;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
      <Text style={[styles.label, { color: theme.colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 10
  },
  label: {
    fontSize: 12,
    fontWeight: "700"
  },
  value: {
    fontSize: 15,
    fontWeight: "600"
  }
});
