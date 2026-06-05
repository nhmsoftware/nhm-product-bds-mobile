import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/components/SafePressable";

import { useI18n, type TranslationKey } from "@/libs/i18n";
import { useAppTheme, useLayoutMode } from "@/libs/layout-mode";
import type { LayoutMode } from "@/libs/theme";

const modes: { value: LayoutMode; labelKey: TranslationKey }[] = [
  { value: "default", labelKey: "common.defaultMode" },
  { value: "pro", labelKey: "common.proMode" }
];

export function LayoutModeSelector() {
  const theme = useAppTheme();
  const { mode, setMode } = useLayoutMode();
  const { t } = useI18n();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md
        }
      ]}
    >
      {modes.map((item) => {
        const active = item.value === mode;
        return (
          <Pressable
            key={item.value}
            onPress={() => setMode(item.value)}
            style={[
              styles.option,
              active && {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.sm
              }
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? theme.colors.ink : theme.colors.muted }
              ]}
            >
              {t(item.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    flexDirection: "row",
    padding: 3
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  label: {
    fontSize: 12,
    fontWeight: "800"
  }
});
