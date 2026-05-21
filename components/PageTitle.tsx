import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";

export function PageTitle({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.wrap, { marginBottom: theme.compact ? 14 : 18 }]}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.compact ? 24 : 28
          }
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6
  },
  title: {
    fontWeight: "800"
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20
  }
});
