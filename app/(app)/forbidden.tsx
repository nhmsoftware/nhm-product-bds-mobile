import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { useI18n } from "@/libs/i18n";
import { useAppTheme } from "@/libs/layout-mode";
import { useAuth } from "@/services/auth/store";

export default function ForbiddenScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const { signOut } = useAuth();

  return (
    <Screen scroll={false}>
      <View style={styles.wrap}>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t("forbidden.title")}</Text>
          <Text style={[styles.message, { color: theme.colors.muted }]}>
            {t("forbidden.message")}
          </Text>
          <Button title={t("common.logout")} variant="danger" onPress={signOut} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center"
  },
  card: {
    gap: 14
  },
  title: {
    fontSize: 22,
    fontWeight: "900"
  },
  message: {
    fontSize: 15,
    lineHeight: 22
  }
});
