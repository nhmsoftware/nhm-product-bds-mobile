import { Pressable, StyleSheet, Text, View } from "react-native";

import { useLayoutMode } from "@/libs/layout-mode";
import { appThemes, LayoutMode } from "@/libs/theme";

const modes: LayoutMode[] = ["default", "pro"];

export function LayoutModeSelector() {
  const { mode, setMode, theme } = useLayoutMode();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.colors.muted }]}>CHẾ ĐỘ GIAO DIỆN</Text>
        <Text style={[styles.current, { color: theme.colors.primary }]}>
          {appThemes[mode].label}
        </Text>
      </View>
      <View
        style={[
          styles.segment,
          {
            backgroundColor: theme.colors.surfaceDark,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md
          }
        ]}
      >
        {modes.map((item) => {
          const selected = mode === item;
          const itemTheme = appThemes[item];

          return (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              style={[
                styles.option,
                {
                  borderRadius: theme.radius.sm
                },
                selected && {
                  backgroundColor: theme.colors.primary
                }
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: selected ? theme.colors.ink : theme.colors.text
                  }
                ]}
              >
                {itemTheme.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.description, { color: theme.colors.muted }]}>
        {theme.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8
  },
  current: {
    fontSize: 12,
    fontWeight: "800"
  },
  segment: {
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    padding: 4
  },
  option: {
    alignItems: "center",
    flex: 1,
    minHeight: 36,
    justifyContent: "center"
  },
  optionText: {
    fontSize: 13,
    fontWeight: "800"
  },
  description: {
    fontSize: 12,
    lineHeight: 18
  }
});
