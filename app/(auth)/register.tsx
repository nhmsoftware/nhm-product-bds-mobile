import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { StyleSheet, Text, View, Clipboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
import { validatePasswordStrength, getPasswordErrorMessage } from "@/libs/password-validation";
import { isValidVietnamesePhone, isValidEmail } from "@/libs/validation";
import { appFonts } from "@/libs/typography";
import { authApi } from "@/services/auth/api";
import { Pressable } from "@/components/SafePressable";

type RegisterField = "fullName" | "referralCode" | "accountType" | "email" | "phone" | "password" | "confirmPassword" | "acceptedTerms";
type RegisterErrors = Partial<Record<RegisterField, string>>;

const fieldErrorMap: Record<string, RegisterField> = {
  agree_terms: "acceptedTerms",
  email: "email",
  name: "fullName",
  password: "password",
  phone: "phone",
  referral_code: "referralCode",
  account_type: "accountType"
};

function firstError(error?: string[]) {
  return error?.find(Boolean);
}

export default function RegisterScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ ref?: string; type?: string }>();
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [accountType, setAccountType] = useState<"investor" | "broker">("investor");
  const [isReferralForced, setIsReferralForced] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({});
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (params.ref) {
      const code = params.ref.trim();
      setReferralCode(code);
      if (params.type === "customer") {
        setAccountType("investor");
        setIsReferralForced(true);
      } else if (params.type === "recruitment") {
        setAccountType("broker");
        setIsReferralForced(true);
      } else {
        if (code.toUpperCase().startsWith("CUS-")) {
          setAccountType("investor");
          setIsReferralForced(true);
        } else if (code.toUpperCase().startsWith("REC-")) {
          setAccountType("broker");
          setIsReferralForced(true);
        } else {
          setIsReferralForced(false);
        }
      }
    } else {
      const checkClipboard = async () => {
        try {
          const content = await Clipboard.getString();
          if (content) {
            const trimmed = content.trim();
            const isWordCode = /^[A-Z0-9]{6}$/.test(trimmed.toUpperCase());
            const isPhoneCode = /^(0[3|5|7|8|9])[0-9]{8}$/.test(trimmed);
            if (isWordCode || isPhoneCode) {
              setReferralCode(trimmed);
              if (trimmed.toUpperCase().startsWith("CUS-")) {
                setAccountType("investor");
                setIsReferralForced(true);
              } else if (trimmed.toUpperCase().startsWith("REC-")) {
                setAccountType("broker");
                setIsReferralForced(true);
              } else {
                setIsReferralForced(false);
              }
              notifySuccess({ message: `Đã tự động điền mã giới thiệu: ${trimmed}` });
            }
          }
        } catch {
          // Ignore clipboard access errors
        }
      };
      checkClipboard();
    }
  }, [params.ref, params.type]);

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

    if (!isValidVietnamesePhone(phone)) {
      setFieldErrors({ phone: "Số điện thoại không hợp lệ." });
      return;
    }

    if (!isValidEmail(email)) {
      setFieldErrors({ email: "Email không hợp lệ." });
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({
        confirmPassword: "Mật khẩu xác nhận không khớp."
      });
      return;
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      setFieldErrors({
        password: getPasswordErrorMessage(passwordError)
      });
      return;
    }
    setSubmitting(true);
    try {
      const response = await authApi.register({
        fullName,
        email,
        phone,
        password,
        accountType,
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

          const trimmed = value.trim();
          if (trimmed !== "") {
            if (trimmed.toUpperCase().startsWith("CUS-")) {
              setAccountType("investor");
              setIsReferralForced(true);
            } else if (trimmed.toUpperCase().startsWith("REC-")) {
              setAccountType("broker");
              setIsReferralForced(true);
            } else {
              setIsReferralForced(false);
            }
          } else {
            setIsReferralForced(false);
          }
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
      <AuthPasswordField
        label={t("auth.label.confirmPassword")}
        icon="lock-closed-outline"
        value={confirmPassword}
        onChangeText={(value) => {
          setConfirmPassword(value);
          clearFieldError("confirmPassword");
        }}
        placeholder={t("auth.placeholder.confirmPassword")}
        error={fieldErrors.confirmPassword}
      />

      <View style={styles.accountTypeContainer}>
        <Text style={styles.fieldLabel}>LOẠI TÀI KHOẢN</Text>
        <View style={styles.accountTypeRow}>
          <Pressable
            disabled={isReferralForced}
            onPress={() => {
              setAccountType("investor");
              clearFieldError("accountType");
            }}
            style={[
              styles.accountTypeButton,
              accountType === "investor" && styles.accountTypeButtonActive,
              isReferralForced && accountType !== "investor" && styles.accountTypeButtonDisabled
            ]}
          >
            <Ionicons
              name="cash-outline"
              size={18}
              color={accountType === "investor" ? "#ffffff" : employeePalette.red}
            />
            <Text
              style={[
                styles.accountTypeButtonText,
                accountType === "investor" && styles.accountTypeButtonTextActive
              ]}
            >
              Nhà đầu tư
            </Text>
          </Pressable>
          <Pressable
            disabled={isReferralForced}
            onPress={() => {
              setAccountType("broker");
              clearFieldError("accountType");
            }}
            style={[
              styles.accountTypeButton,
              accountType === "broker" && styles.accountTypeButtonActive,
              isReferralForced && accountType !== "broker" && styles.accountTypeButtonDisabled
            ]}
          >
            <Ionicons
              name="business-outline"
              size={18}
              color={accountType === "broker" ? "#ffffff" : employeePalette.red}
            />
            <Text
              style={[
                styles.accountTypeButtonText,
                accountType === "broker" && styles.accountTypeButtonTextActive
              ]}
            >
              Môi giới
            </Text>
          </Pressable>
        </View>
        {isReferralForced && (
          <Text style={styles.referralForcedMessage}>
            * Loại tài khoản được chọn tự động theo mã giới thiệu
          </Text>
        )}
        {fieldErrors.accountType ? (
          <Text style={styles.checkboxError}>{fieldErrors.accountType}</Text>
        ) : null}
      </View>

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
        disabled={!fullName || !email || !phone || !password || !confirmPassword || !acceptedTerms}
        onPress={handleRegister}
        style={styles.primaryButton}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  accountTypeContainer: {
    gap: 8,
    marginBottom: 8
  },
  fieldLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    lineHeight: 16
  },
  accountTypeRow: {
    flexDirection: "row",
    gap: 12
  },
  accountTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#e3beb8",
    borderWidth: 1,
    borderRadius: 6,
    height: 48,
    backgroundColor: employeePalette.bg,
    gap: 8
  },
  accountTypeButtonActive: {
    backgroundColor: employeePalette.red,
    borderColor: employeePalette.red
  },
  accountTypeButtonDisabled: {
    opacity: 0.4
  },
  accountTypeButtonText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16
  },
  accountTypeButtonTextActive: {
    color: "#ffffff"
  },
  referralForcedMessage: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    fontStyle: "italic",
    marginTop: -2
  },
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

