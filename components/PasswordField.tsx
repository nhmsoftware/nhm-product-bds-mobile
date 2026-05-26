import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { TextField } from "@/components/TextField";
import { useI18n } from "@/libs/i18n";
import { useAppTheme } from "@/libs/layout-mode";

type PasswordFieldProps = React.ComponentProps<typeof TextField>;

export function PasswordField(props: PasswordFieldProps) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <TextField
        {...props}
        secureTextEntry={!visible}
        style={[styles.input, props.style]}
      />
      <Pressable
        accessibilityLabel={
          visible
            ? t("auth.accessibility.hidePassword")
            : t("auth.accessibility.showPassword")
        }
        onPress={() => setVisible((value) => !value)}
        style={styles.toggle}
      >
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={20}
          color={theme.colors.muted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    paddingRight: 44
  },
  toggle: {
    alignItems: "center",
    bottom: 0,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    width: 42
  }
});
