import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageTitle } from "@/components/PageTitle";
import { PasswordField } from "@/components/PasswordField";
import { Screen } from "@/components/Screen";
import { colors } from "@/libs/theme";
import { notifyError, notifySuccess } from "@/libs/notify";
import { authApi } from "@/services/auth/api";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; resetToken?: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const submit = async () => {
    if (!newPassword || !confirmPassword || newPassword.length < 6) {
      notifyError("Mật khẩu mới phải tối thiểu 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      notifyError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword({
        resetToken: params.resetToken ?? "",
        password: newPassword
      });
      notifySuccess({ message: response.message || "Đặt lại mật khẩu thành công." });
      router.replace("/(auth)/login");
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
        title="Đặt mật khẩu mới" 
        subtitle="Thiết lập mật khẩu mới cho tài khoản Zentrix của bạn. Vui lòng ghi nhớ mật khẩu này." 
      />
      
      <Card style={styles.card} variant="glass">
        <PasswordField
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          importantForAutofill="no"
          label="Mật khẩu mới"
          onChangeText={setNewPassword}
          placeholder="Tối thiểu 6 ký tự"
          textContentType="none"
          value={newPassword}
        />
        <PasswordField
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          error={passwordMismatch ? "Mật khẩu xác nhận không khớp." : undefined}
          importantForAutofill="no"
          label="Xác nhận mật khẩu mới"
          onChangeText={setConfirmPassword}
          placeholder="Nhập lại mật khẩu mới"
          textContentType="none"
          value={confirmPassword}
        />
        <Button 
          loading={loading} 
          onPress={submit} 
          title="XÁC NHẬN MẬT KHẨU MỚI" 
          variant="primary"
          style={styles.submitBtn}
        />
      </Card>

      <View style={styles.footer}>
        <Link href="/(auth)/login" style={styles.link}>
          Quay lại Đăng nhập
        </Link>
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
  link: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14
  }
});
