import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageTitle } from "@/components/PageTitle";
import { PasswordField } from "@/components/PasswordField";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { ApiRequestError } from "@/libs/api";
import { colors } from "@/libs/theme";
import { notifyError } from "@/libs/notify";
import { authApi } from "@/services/auth/api";
import { useAuth } from "@/services/auth/store";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const showVerifyEmailPrompt = () => {
    setTimeout(() => {
      Alert.alert("Thông báo", "Tài khoản chưa được xác minh.", [
        {
          text: "Xác minh lại",
          onPress: () => {
            router.push({
              pathname: "/(auth)/verify-email",
              params: { autoResend: "1", email: email.trim() }
            });
          }
        }
      ]);
    }, 350);
  };

  const submit = async () => {
    if (!email || !password) {
      notifyError("Vui lòng điền đầy đủ Email và Mật khẩu.");
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      await signIn(response.data);
      router.replace("/(app)/(tabs)");
    } catch (error) {
      notifyError(error);
      if (isUnverifiedEmailError(error)) {
        showVerifyEmailPrompt();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brandLogo}>ZENTRIX</Text>
      </View>
      
      <PageTitle
        title="Đăng nhập"
        subtitle="Truy cập hệ thống Zentrix Pro Terminal để theo dõi ví, KYC và bắt đầu giao dịch."
      />
      
      <Card style={styles.card} variant="glass">
        <TextField
          autoCapitalize="none"
          keyboardType="email-address"
          label="Địa chỉ Email"
          onChangeText={setEmail}
          placeholder="yourname@domain.com"
          value={email}
        />
        <PasswordField
          autoCapitalize="none"
          autoComplete="current-password"
          autoCorrect={false}
          label="Mật khẩu"
          onChangeText={setPassword}
          placeholder="Nhập mật khẩu của bạn"
          textContentType="password"
          value={password}
        />
        <Button 
          loading={loading} 
          onPress={submit} 
          title="ĐĂNG NHẬP TERM" 
          variant="primary"
          style={styles.submitBtn}
        />
      </Card>
      
      <View style={styles.links}>
        <Link href="/(auth)/forgot-password" style={styles.link}>
          Quên mật khẩu?
        </Link>
        <View style={styles.row}>
          <Text style={styles.muted}>Chưa có tài khoản?</Text>
          <Link href="/(auth)/register" style={styles.linkHighlight}>
            Đăng ký ngay
          </Link>
        </View>
      </View>
    </Screen>
  );
}

function isUnverifiedEmailError(error: unknown) {
  if (!(error instanceof ApiRequestError)) {
    return false;
  }

  return /email.*chưa.*xác minh|chưa.*xác minh.*email/i.test(error.message);
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginVertical: 24
  },
  brandLogo: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 4
  },
  card: {
    gap: 16,
    padding: 24
  },
  submitBtn: {
    marginTop: 8
  },
  links: {
    alignItems: "center",
    gap: 16,
    marginTop: 32
  },
  row: {
    flexDirection: "row",
    gap: 6
  },
  link: {
    color: colors.muted,
    fontWeight: "500",
    fontSize: 14
  },
  linkHighlight: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14
  },
  muted: {
    color: colors.muted,
    fontSize: 14
  }
});
