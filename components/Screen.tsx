import type { ComponentProps, PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/libs/layout-mode";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  edges?: ComponentProps<typeof SafeAreaView>["edges"];
  safeBackgroundColor?: string;
}>;

export function Screen({ children, scroll = true, padded = true, edges, safeBackgroundColor }: ScreenProps) {
  const theme = useAppTheme();
  const content = (
    <View
      style={[
        styles.content,
        padded && { padding: theme.spacing.screenPadding }
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: safeBackgroundColor || theme.colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  flex: {
    flex: 1
  },
  scroll: {
    flexGrow: 1
  },
  content: {
    flex: 1
  }
});
