import { router } from "expo-router";
import { StyleSheet } from "react-native";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { useI18n } from "@/libs/i18n";

export default function NotFoundScreen() {
  const { t } = useI18n();

  return (
    <Screen scroll={false}>
      <EmptyState
        title={t("notFound.title")}
        description={t("notFound.description")}
        icon="alert-circle-outline"
      />
      <Button title={t("notFound.action")} onPress={() => router.replace("/")} style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: 24
  }
});
