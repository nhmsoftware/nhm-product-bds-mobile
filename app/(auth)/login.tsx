import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  AuthButton,
  AuthCheckbox,
  AuthField,
  AuthFooterCta,
  AuthMethodTabs,
  AuthPasswordField,
  AuthScreen,
  type AuthContactMethod
} from "@/components/AuthChrome";
import { Pressable } from "@/components/SafePressable";
import { employeePalette } from "@/libs/employee-theme";
import { useI18n } from "@/libs/i18n";
import { notifyError, notifySuccess } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { authApi } from "@/services/auth/api";
import {
  DEMO_AUTH_ENABLED,
  DEMO_LOGIN_OPTIONS,
  type DemoLoginRole
} from "@/services/auth/demo";
import { getHomeHrefForRole } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";

const apiDemoCredentials: Partial<Record<DemoLoginRole, { username: string; password: string }>> = {
  customer: {
    username: "customer@test.com",
    password: "password123"
  },
  employee: {
    username: "employee@test.com",
    password: "password123"
  },
  candidate: {
    username: "candidate@test.com",
    password: "password123"
  },
  employee2: {
    username: "employee2@test.com",
    password: "password123"
  },
  manager: {
    username: "manager@test.com",
    password: "password123"
  },
  director: {
    username: "director@test.com",
    password: "password123"
  },
  ceo: {
    username: "ceo@test.com",
    password: "password123"
  },
  super_admin: {
    username: "superadmin@test.com",
    password: "password123"
  }
};

export default function LoginScreen() {
  const { t } = useI18n();
  const { signIn, signInWithDemo } = useAuth();
  const [method, setMethod] = useState<AuthContactMethod>("email");
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoRole, setDemoRole] = useState<DemoLoginRole | null>(null);

  async function handleLogin() {
    setSubmitting(true);
    try {
      const response = await authApi.login({ username: identity, password, remember });
      await signIn(response.data);
      notifySuccess({ message: response.message || t("notifications.loginSuccess") });
      router.replace(getHomeHrefForRole(response.data.user.role));
    } catch (error) {
      notifyError(error, t("notifications.loginError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin(role: DemoLoginRole) {
    setDemoRole(role);
    try {
      const credentials = apiDemoCredentials[role];

      if (credentials) {
        const response = await authApi.login({
          ...credentials,
          remember: true
        });
        await signIn(response.data);
        notifySuccess({ message: response.message || t("notifications.loginSuccess") });
        router.replace(getHomeHrefForRole(response.data.user.role));
        return;
      }

      await signInWithDemo(role);
    } catch (error) {
      notifyError(error, t("notifications.loginError"));
    } finally {
      setDemoRole(null);
    }
  }

  return (
    <AuthScreen
      title={t("auth.login.title")}
      brandGap={20}
      footerMode="bar"
      footer={
        <AuthFooterCta
          prompt={t("auth.footer.noAccount")}
          action={t("auth.action.registerNow")}
          onPress={() => router.replace("/(auth)/register")}
        />
      }
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
        label={t("auth.label.password")}
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        placeholder={t("auth.placeholder.password")}
      />

      <View style={styles.optionRow}>
        <AuthCheckbox
          checked={remember}
          onChange={setRemember}
          label={t("auth.login.remember")}
          style={styles.remember}
        />
        <Pressable onPress={() => router.push("/(auth)/forgot-password-otp")}>
          <Text style={styles.forgotText}>{t("auth.action.forgotPassword")}</Text>
        </Pressable>
      </View>

      <AuthButton
        title={t("auth.login.submit")}
        rightIcon="arrow-forward"
        loading={submitting}
        disabled={!identity || !password || demoRole !== null}
        onPress={handleLogin}
        style={styles.primaryButton}
      />

      {DEMO_AUTH_ENABLED ? (
        <View style={styles.demoActions}>
          {DEMO_LOGIN_OPTIONS.map((option) => (
            <AuthButton
              key={option.role}
              title={t(option.labelKey)}
              variant="secondary"
              loading={demoRole === option.role}
              disabled={submitting || demoRole !== null}
              onPress={() => handleDemoLogin(option.role)}
            />
          ))}
        </View>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  remember: {
    flex: 1
  },
  forgotText: {
    color: employeePalette.red,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  primaryButton: {
    marginTop: 0
  },
  demoActions: {
    gap: 10,
    marginTop: -10
  }
});
