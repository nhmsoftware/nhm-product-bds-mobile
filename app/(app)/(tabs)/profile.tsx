import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { InfoRow } from "@/components/InfoRow";
import { LayoutModeSelector } from "@/components/LayoutModeSelector";
import { LoadingState } from "@/components/LoadingState";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { useI18n } from "@/libs/i18n";
import { useAppTheme } from "@/libs/layout-mode";
import { notifyError } from "@/libs/notify";
import { useAuth } from "@/services/auth/store";
import { profileApi } from "@/services/profile/api";
import type { CustomerProfile } from "@/services/profile/types";

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileApi
      .getProfile()
      .then((response) => setProfile(response.data))
      .catch((error) => notifyError(error, t("profile.error.load")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading || !profile) {
    return (
      <Screen edges={["top", "left", "right"]} scroll={false}>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen edges={["top", "left", "right"]}>
      <PageTitle
        title={t("profile.title")}
        subtitle={t("profile.subtitle")}
      />

      <Card style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.avatarText, { color: theme.colors.ink }]}>
            {profile.fullName.slice(0, 1)}
          </Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{profile.fullName}</Text>
          <Text style={[styles.email, { color: theme.colors.muted }]}>{profile.email}</Text>
        </View>
      </Card>

      <Card>
        <InfoRow label={t("profile.phone")} value={profile.phone} />
        <InfoRow label={t("profile.city")} value={profile.preferredCity} />
        <InfoRow label={t("profile.budget")} value={profile.budgetLabel} />
        <InfoRow label={t("profile.demand")} value={t(`demand.${profile.demand}`)} />
      </Card>

      <Card style={styles.settingsCard}>
        <View style={styles.settingHeader}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            {t("layout.title")}
          </Text>
          <Text style={[styles.settingText, { color: theme.colors.muted }]}>
            {t("layout.description")}
          </Text>
        </View>
        <LayoutModeSelector />
      </Card>

      <View style={styles.actions}>
        <Button title={t("common.editProfile")} onPress={() => router.push("/(app)/profile/edit")} />
        <Button title={t("common.logout")} variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginBottom: 12
  },
  avatar: {
    alignItems: "center",
    borderRadius: 9999,
    height: 54,
    justifyContent: "center",
    width: 54
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "900"
  },
  profileCopy: {
    flex: 1,
    gap: 4
  },
  name: {
    fontSize: 18,
    fontWeight: "900"
  },
  email: {
    fontSize: 14
  },
  settingsCard: {
    gap: 14,
    marginTop: 12
  },
  settingHeader: {
    gap: 4
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "900"
  },
  settingText: {
    fontSize: 13,
    lineHeight: 19
  },
  actions: {
    gap: 12,
    paddingVertical: 18
  }
});
