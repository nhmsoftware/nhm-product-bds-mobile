import { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, onFocus, onBlur, ...props }: TextFieldProps) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.colors.muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor="#6b7a70"
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceDark,
            borderColor: focused ? theme.colors.primary : theme.colors.border,
            borderRadius: theme.radius.md,
            color: theme.colors.text,
            minHeight: theme.compact ? 44 : 48
          },
          error && { borderColor: theme.colors.danger },
          style
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6
  },
  label: {
    fontSize: 13,
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 14
  },
  error: {
    fontSize: 12
  }
});
