import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";

type PageTitleProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function PageTitle({ title, subtitle, right }: PageTitleProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={[styles.title, theme.compact && styles.titleCompact, { color: theme.colors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.colors.muted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 18
  },
  copy: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 28,
    fontWeight: "900"
  },
  titleCompact: {
    fontSize: 22
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20
  }
});
