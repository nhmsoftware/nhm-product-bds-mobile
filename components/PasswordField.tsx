import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View
} from "react-native";

import { useAppTheme } from "@/libs/layout-mode";

type PasswordFieldProps = Omit<TextInputProps, "secureTextEntry"> & {
  label: string;
  error?: string;
};

export function PasswordField({
  label,
  error,
  style,
  onFocus,
  onBlur,
  ...props
}: PasswordFieldProps) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.colors.muted }]}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.colors.surfaceDark,
            borderColor: focused ? theme.colors.primary : theme.colors.border,
            borderRadius: theme.radius.md,
            minHeight: theme.compact ? 44 : 48
          },
          error && { borderColor: theme.colors.danger }
        ]}
      >
        <TextInput
          placeholderTextColor="#6b7a70"
          secureTextEntry={!visible}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              minHeight: theme.compact ? 44 : 48
            },
            style
          ]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        <Pressable
          accessibilityLabel={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          hitSlop={10}
          onPress={() => setVisible((value) => !value)}
          style={styles.eyeButton}
        >
          <Ionicons
            color={focused ? theme.colors.primary : theme.colors.muted}
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
          />
        </Pressable>
      </View>
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
  inputWrap: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 48
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingLeft: 14,
    paddingRight: 8
  },
  eyeButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48
  },
  error: {
    fontSize: 12
  }
});
