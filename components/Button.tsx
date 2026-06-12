import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle
} from "react-native";
import { Pressable } from "@/components/SafePressable";

import { useAppTheme } from "@/libs/layout-mode";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "brand";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  loading,
  variant = "primary",
  disabled,
  style
}: ButtonProps) {
  const theme = useAppTheme();
  const isPrimary = variant === "primary";
  const isBrand = variant === "brand";
  const isDanger = variant === "danger";

  let indicatorColor = theme.colors.ink;
  if (!isPrimary && !isBrand) {
    indicatorColor = isDanger ? theme.colors.danger : theme.colors.primary;
  }

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      ...theme.shadow
    },
    brand: {
      backgroundColor: theme.colors.brandPrimary,
      borderColor: theme.colors.brandPrimary,
      ...theme.shadow
    },
    secondary: {
      backgroundColor: "transparent",
      borderColor: theme.colors.border
    },
    danger: {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger,
      ...theme.shadow
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent"
    }
  };

  const textStyles = {
    primary: { color: theme.colors.ink },
    brand: { color: theme.colors.ink },
    secondary: { color: theme.colors.text },
    danger: { color: "#ffffff" },
    ghost: { color: theme.colors.muted }
  };

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: theme.radius.md,
          minHeight: theme.compact ? 42 : 48
        },
        variantStyles[variant],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <Text
          style={[
            styles.text,
            theme.compact && styles.textCompact,
            textStyles[variant]
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  disabled: {
    opacity: 0.45
  },
  pressed: {
    opacity: 0.82
  },
  text: {
    fontSize: 15,
    fontWeight: "700"
  },
  textCompact: {
    fontSize: 14
  }
});
