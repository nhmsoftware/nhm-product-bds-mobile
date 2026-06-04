import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

import {
  AuthButton,
  AuthField,
  AuthMethodTabs,
  AuthScreen,
  type AuthContactMethod
} from "@/components/AuthChrome";
import { useI18n } from "@/libs/i18n";
import { notifyError, notifySuccess } from "@/libs/notify";
import { authApi } from "@/services/auth/api";

export default function ForgotPasswordOtpScreen() {
  const { t } = useI18n();
  const [method, setMethod] = useState<AuthContactMethod>("email");
  const [identity, setIdentity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(auth)/login");
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await authApi.forgotPassword({ username: identity });
      notifySuccess({
        message: t("notifications.otpSent")
      });
      router.push({
        pathname: "/(auth)/forgot-password",
        params: {
          identity,
          method
        }
      });
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
      onBackPress={handleBack}
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

      <AuthButton
        title={t("auth.reset.sendOtp")}
        rightIcon="arrow-forward"
        loading={submitting}
        disabled={!identity}
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
