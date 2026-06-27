import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

import {
  AuthButton,
  AuthField,
  AuthPasswordField,
  AuthScreen,
  type AuthContactMethod
} from "@/components/AuthChrome";
import { useI18n } from "@/libs/i18n";
import { notifyError, notifySuccess } from "@/libs/notify";
import { validatePasswordStrength, getPasswordErrorMessage } from "@/libs/password-validation";
import { authApi } from "@/services/auth/api";

export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ identity?: string; method?: AuthContactMethod }>();
  const method = params.method === "phone" ? "phone" : "email";
  const identity = typeof params.identity === "string" ? params.identity : "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(auth)/forgot-password-otp");
  }

  async function handleSubmit() {
    if (password !== confirmPassword) {
      notifyError(new Error(t("validation.passwordMismatch")));
      return;
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      notifyError(new Error(getPasswordErrorMessage(passwordError)));
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword({
        username: identity,
        otp: code,
        password,
        passwordConfirmation: confirmPassword
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
      onBackPress={handleBack}
    >
      <AuthField
        label={method === "email" ? t("auth.label.emailAddress") : t("auth.label.phone")}
        icon={method === "email" ? "mail-outline" : "call-outline"}
        autoCapitalize="none"
        keyboardType={method === "email" ? "email-address" : "phone-pad"}
        value={identity}
        editable={false}
        selectTextOnFocus={false}
        placeholder={method === "email" ? t("auth.placeholder.email") : t("auth.placeholder.phone")}
        frameStyle={styles.disabledField}
      />
      <AuthField
        label={t("auth.label.code")}
        icon="lock-closed-outline"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        placeholder={t("auth.placeholder.code")}
      />
      <AuthPasswordField
        label={t("auth.reset.newPassword")}
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        placeholder={t("auth.placeholder.password")}
      />
      <AuthPasswordField
        label={t("auth.label.confirmPassword")}
        icon="lock-closed-outline"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={t("auth.placeholder.confirmPassword")}
      />

      <AuthButton
        title={t("auth.reset.submit")}
        rightIcon="arrow-forward"
        loading={submitting}
        disabled={!identity || !password || !confirmPassword || !code}
        onPress={handleSubmit}
        style={styles.primaryButton}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  disabledField: {
    opacity: 0.72
  },
  primaryButton: {
    marginTop: 0
  }
});
