import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";

type InfoRowProps = {
  label: string;
  value: string;
};

export function InfoRow({ label, value }: InfoRowProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
      <Text style={[styles.label, { color: theme.colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    paddingVertical: 12
  },
  label: {
    flex: 1,
    fontSize: 14
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right"
  }
});
