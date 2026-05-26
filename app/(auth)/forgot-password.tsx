import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

import {
  AuthButton,
  AuthField,
  AuthMethodTabs,
  AuthPasswordField,
  AuthScreen,
  type AuthContactMethod
} from "@/components/AuthChrome";
import { useI18n } from "@/libs/i18n";
import { notifyError, notifySuccess } from "@/libs/notify";
import { authApi } from "@/services/auth/api";

export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const [method, setMethod] = useState<AuthContactMethod>("email");
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await authApi.resetPassword({
        username: identity,
        otp: code,
        password,
        passwordConfirmation: password
      });
      notifySuccess({
        message: t("notifications.forgotPasswordSuccess")
      });
      router.replace("/(auth)/login");
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      brandGap={96}
      scrollTopPadding={46}
      onBackPress={() => router.replace("/(auth)/login")}
    >
      <AuthMethodTabs value={method} onChange={setMethod} />

      <AuthField
        label={method === "email" ? t("auth.label.emailAddress") : t("auth.label.phone")}
        icon={method === "email" ? "mail-outline" : "call-outline"}
        autoCapitalize="none"
        keyboardType={method === "email" ? "email-address" : "phone-pad"}
        value={identity}
        onChangeText={setIdentity}
        placeholder={method === "email" ? t("auth.placeholder.email") : t("auth.placeholder.phone")}
      />
      <AuthPasswordField
        label={t("auth.reset.newPassword")}
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        placeholder={t("auth.placeholder.password")}
      />
      <AuthField
        label={t("auth.label.code")}
        icon="lock-closed-outline"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        placeholder={t("auth.placeholder.code")}
      />

      <AuthButton
        title={t("auth.reset.submit")}
        rightIcon="arrow-forward"
        loading={submitting}
        disabled={!identity || !password || !code}
        onPress={handleSubmit}
        style={styles.primaryButton}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    marginTop: 0
  }
});
