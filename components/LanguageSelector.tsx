import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/components/SafePressable";

import { useI18n, type Language } from "@/libs/i18n";
import { useAppTheme } from "@/libs/layout-mode";

const languages: { value: Language; label: string }[] = [
  { value: "vi", label: "VI" },
  { value: "en", label: "EN" }
];

type LanguageSelectorProps = {
  activeColor?: string;
  activeTextColor?: string;
};

export function LanguageSelector({ activeColor, activeTextColor }: LanguageSelectorProps) {
  const theme = useAppTheme();
  const { language, setLanguage } = useI18n();
  const selectedColor = activeColor ?? theme.colors.primary;
  const selectedTextColor = activeTextColor ?? theme.colors.ink;

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
      {languages.map((item) => {
        const active = item.value === language;
        return (
          <Pressable
            key={item.value}
            onPress={() => setLanguage(item.value)}
            style={[
              styles.option,
              active && {
                backgroundColor: selectedColor,
                borderRadius: theme.radius.sm
              }
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? selectedTextColor : theme.colors.muted }
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    borderWidth: 1,
    flexDirection: "row",
    padding: 3
  },
  option: {
    minWidth: 42,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  }
});
