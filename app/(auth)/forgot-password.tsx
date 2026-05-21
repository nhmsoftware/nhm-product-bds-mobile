import { Link, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { colors } from "@/libs/theme";
import { notifyError, notifySuccess } from "@/libs/notify";
import { authApi } from "@/services/auth/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email) {
      notifyError("Vui lòng nhập địa chỉ Email.");
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.forgotPassword({ email });
      notifySuccess({
        message: response.message || "Đã gửi mã khôi phục.",
        description: "Vui lòng kiểm tra email và nhập mã OTP."
      });
      router.push({
        pathname: "/(auth)/verify-reset-code",
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
        title="Quên mật khẩu"
        subtitle="Vui lòng nhập địa chỉ Email đăng ký tài khoản. Chúng tôi sẽ gửi mã OTP bảo mật để thiết lập lại mật khẩu."
      />
      
      <Card style={styles.card} variant="glass">
        <TextField
          autoCapitalize="none"
          keyboardType="email-address"
          label="Địa chỉ Email khôi phục"
          onChangeText={setEmail}
          placeholder="yourname@domain.com"
          value={email}
        />
        <Button 
          loading={loading} 
          onPress={submit} 
          title="GỬI MÃ KHÔI PHỤC OTP" 
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
