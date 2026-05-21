import { PropsWithChildren } from "react";
import { View, ViewStyle, StyleProp } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  variant?: "solid" | "glass";
}>;

export function Card({
  children,
  style,
  variant = "glass"
}: CardProps) {
  const theme = useAppTheme();
  const variantStyle =
    variant === "glass"
      ? {
          backgroundColor: theme.colors.glassBackground,
          borderColor: theme.colors.glassBorder,
          ...theme.shadow
        }
      : {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          ...theme.shadow
        };

  return (
    <View style={[
      {
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        padding: theme.spacing.md
      },
      variantStyle,
      style
    ]}>
      {children}
    </View>
  );
}
