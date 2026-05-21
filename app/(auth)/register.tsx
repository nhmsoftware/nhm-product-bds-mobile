import { Link, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageTitle } from "@/components/PageTitle";
import { PasswordField } from "@/components/PasswordField";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { notifyError } from "@/libs/notify";
import { colors } from "@/libs/theme";
import { authApi } from "@/services/auth/api";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const submit = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      notifyError("Vui lòng điền đầy đủ Họ tên, Email, Mật khẩu và Xác nhận mật khẩu.");
      return;
    }

    if (password !== confirmPassword) {
      notifyError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        fullName,
        email,
        password,
        referralCode: referralCode || undefined
      });
      router.push({
        pathname: "/(auth)/verify-email",
        params: {
          email
        }
      });
    } catch (error) {
      notifyError(error);
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
        title="Tạo tài khoản"
        subtitle="Đăng ký tài khoản khách hàng mới và kích hoạt xác thực email để bảo mật."
      />

      <Card style={styles.card} variant="glass">
        <TextField
          label="Họ và tên"
          onChangeText={setFullName}
          placeholder="Nhập tên đầy đủ của bạn"
          value={fullName}
        />
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
          autoComplete="off"
          autoCorrect={false}
          importantForAutofill="no"
          label="Mật khẩu"
          onChangeText={setPassword}
          placeholder="Tối thiểu 6 ký tự"
          textContentType="none"
          value={password}
        />
        <PasswordField
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          error={passwordMismatch ? "Mật khẩu xác nhận không khớp." : undefined}
          importantForAutofill="no"
          label="Xác nhận mật khẩu"
          onChangeText={setConfirmPassword}
          placeholder="Nhập lại mật khẩu"
          textContentType="none"
          value={confirmPassword}
        />
        <TextField
          autoCapitalize="characters"
          label="Mã giới thiệu (Nếu có)"
          onChangeText={setReferralCode}
          placeholder="Nhập mã giới thiệu giới hạn"
          value={referralCode}
        />
        <Button
          loading={loading}
          onPress={submit}
          title="ĐĂNG KÝ TÀI KHOẢN"
          variant="primary"
          style={styles.submitBtn}
        />
      </Card>

      <View style={styles.footer}>
        <View style={styles.row}>
          <Text style={styles.muted}>Đã có tài khoản?</Text>
          <Link href="/(auth)/login" style={styles.link}>
            Đăng nhập ngay
          </Link>
        </View>
      </View>
    </Screen>
  );
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
  footer: {
    alignItems: "center",
    marginTop: 32
  },
  row: {
    flexDirection: "row",
    gap: 6
  },
  muted: {
    color: colors.muted,
    fontSize: 14
  },
  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700"
  }
});
