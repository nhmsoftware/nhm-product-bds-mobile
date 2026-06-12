import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingState } from "@/components/LoadingState";
import { RoleGuard } from "@/components/RoleGuard";
import { Screen } from "@/components/Screen";
import { Pressable } from "@/components/SafePressable";
import { TextField } from "@/components/TextField";
import { useI18n } from "@/libs/i18n";
import { useAppTheme } from "@/libs/layout-mode";
import { notifyError, notifySuccess } from "@/libs/notify";
import { profileApi } from "@/services/profile/api";
import type { CustomerProfile } from "@/services/profile/types";

export default function EditProfileScreen() {
  return (
    <RoleGuard allowedRoles={["customer"]}>
      <EditProfileContent />
    </RoleGuard>
  );
}

function EditProfileContent() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    profileApi
      .getProfile()
      .then((response) => {
        const data = response.data;
        setProfile(data);
        setFullName(data.fullName);
        setPhone(data.phone);
        setEmail(data.email);
        setAddress(data.address);
      })
      .catch((error) => notifyError(error, t("profile.edit.error.load")))
      .finally(() => setLoading(false));
  }, [t]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const response = await profileApi.updateProfile({
        fullName,
        phone,
        email,
        address
      });
      notifySuccess({ message: response.message });
      router.back();
    } catch (error) {
      notifyError(error, t("profile.edit.error.update"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !profile) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.colors.primary }]}>{t("common.back")}</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t("profile.edit.title")}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
          {t("profile.edit.subtitle")}
        </Text>
      </View>

      <Card style={styles.form}>
        <TextField label={t("profile.fullName")} value={fullName} onChangeText={setFullName} />
        <TextField
          label={t("profile.phone")}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextField
          label={t("profile.email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField label="Địa chỉ" value={address} onChangeText={setAddress} />

        <Button
          title={t("common.saveChanges")}
          loading={submitting}
          disabled={!fullName || !phone || !email}
          onPress={handleSubmit}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 18
  },
  back: {
    fontSize: 14,
    fontWeight: "800"
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20
  },
  form: {
    gap: 14
  }
});
