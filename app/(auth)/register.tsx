import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import {
  AuthButton,
  AuthCheckbox,
  AuthField,
  AuthFooterCta,
  AuthPasswordField,
  AuthScreen
} from "@/components/AuthChrome";
import { ApiRequestError } from "@/libs/api";
import { employeePalette } from "@/libs/employee-theme";
import { useI18n } from "@/libs/i18n";
import { notifyError, notifySuccess } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { authApi } from "@/services/auth/api";

type RegisterField = "fullName" | "referralCode" | "email" | "phone" | "password" | "acceptedTerms";
type RegisterErrors = Partial<Record<RegisterField, string>>;

const fieldErrorMap: Record<string, RegisterField> = {
  agree_terms: "acceptedTerms",
  email: "email",
  name: "fullName",
  password: "password",
  phone: "phone",
  referral_code: "referralCode"
};

function firstError(error?: string[]) {
  return error?.find(Boolean);
}

export default function RegisterScreen() {
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function clearFieldError(field: RegisterField) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function setValidationErrors(error: unknown) {
    if (!(error instanceof ApiRequestError) || !error.errors) {
      return false;
    }

    const nextErrors: RegisterErrors = {};

    Object.entries(error.errors).forEach(([backendField, messages]) => {
      const field = fieldErrorMap[backendField];
      const message = firstError(messages);

      if (field && message) {
        nextErrors[field] = message;
      }
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length > 0;
  }

  async function handleRegister() {
    setFieldErrors({});
    setSubmitting(true);
    try {
      const response = await authApi.register({
        fullName,
        email,
        phone,
        password,
        referralCode,
        agreeTerms: acceptedTerms
      });
      notifySuccess({ message: response.message || t("notifications.registerSuccess") });
      router.replace("/(auth)/login");
    } catch (error) {
      if (!setValidationErrors(error)) {
        notifyError(error, t("notifications.registerError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      variant="register"
      brandGap={60}
      footerMode="bar"
      footer={
        <AuthFooterCta
          prompt={t("auth.footer.haveAccount")}
          action={t("auth.action.loginNow")}
          onPress={() => router.replace("/(auth)/login")}
        />
      }
    >
      <AuthField
        label={t("auth.label.fullName")}
        icon="person-outline"
        value={fullName}
        onChangeText={(value) => {
          setFullName(value);
          clearFieldError("fullName");
        }}
        placeholder={t("auth.placeholder.fullName")}
        error={fieldErrors.fullName}
      />
      <AuthField
        label={t("auth.label.referralCode")}
        icon="id-card-outline"
        autoCapitalize="characters"
        value={referralCode}
        onChangeText={(value) => {
          setReferralCode(value);
          clearFieldError("referralCode");
        }}
        placeholder={t("auth.placeholder.referralCode")}
        error={fieldErrors.referralCode}
      />
      <AuthField
        label={t("auth.label.email")}
        icon="mail-outline"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          clearFieldError("email");
        }}
        placeholder={t("auth.placeholder.personalEmail")}
        error={fieldErrors.email}
      />
      <AuthField
        label={t("auth.label.phone")}
        icon="call-outline"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          clearFieldError("phone");
        }}
        placeholder={t("auth.placeholder.phone")}
        error={fieldErrors.phone}
      />
      <AuthPasswordField
        label={t("auth.label.password")}
        icon="lock-closed-outline"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          clearFieldError("password");
        }}
        placeholder={t("auth.placeholder.password")}
        error={fieldErrors.password}
      />

      <AuthCheckbox
        checked={acceptedTerms}
        onChange={(value) => {
          setAcceptedTerms(value);
          clearFieldError("acceptedTerms");
        }}
        style={styles.termsRow}
      >
        <Text style={styles.termsText}>
          {t("auth.register.termsPrefix")}
          <Text style={styles.termsLink}>{t("auth.register.termsService")}</Text>
          {t("auth.register.termsAnd")}
          <Text style={styles.termsLink}>{t("auth.register.termsPrivacy")}</Text>
        </Text>
      </AuthCheckbox>
      {fieldErrors.acceptedTerms ? (
        <Text style={styles.checkboxError}>{fieldErrors.acceptedTerms}</Text>
      ) : null}

      <AuthButton
        title={t("auth.action.register")}
        loading={submitting}
        disabled={!fullName || !email || !phone || !password || !acceptedTerms}
        onPress={handleRegister}
        style={styles.primaryButton}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  termsRow: {
    marginTop: -2
  },
  termsText: {
    color: employeePalette.muted,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  termsLink: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontWeight: "900"
  },
  checkboxError: {
    color: "#d14343",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -10
  },
  primaryButton: {
    marginTop: 0
  }
});
