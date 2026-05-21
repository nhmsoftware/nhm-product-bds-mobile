import { Link, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { colors } from "@/libs/theme";
import { notifyError, notifySuccess } from "@/libs/notify";
import { authApi } from "@/services/auth/api";

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ autoResend?: string; email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const autoResendHandled = useRef(false);

  const resend = useCallback(async () => {
    if (!email) {
      notifyError("Vui lòng nhập Email để nhận lại mã xác thực.");
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.resendVerificationEmail({ email });
      notifySuccess({
        message: response.message || "Đã gửi lại mã kích hoạt.",
        description: "Vui lòng kiểm tra email và nhập mã OTP mới."
      });
    } catch (error) {
      notifyError(error);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (params.autoResend !== "1" || autoResendHandled.current || !email) {
      return;
    }

    autoResendHandled.current = true;
    void resend();
  }, [email, params.autoResend, resend]);

  const verify = async () => {
    if (!email || !code) {
      notifyError("Vui lòng điền đầy đủ Email và Mã xác thực.");
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.verifyEmail({ email, code });
      notifySuccess({ message: response.message || "Kích hoạt tài khoản thành công." });
      // Thay thế để quay lại trang đăng nhập sau khi xác thực thành công
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
        title="Kích hoạt tài khoản"
        subtitle="Vui lòng nhập mã OTP 6 số được gửi tới địa chỉ Email của bạn để hoàn tất việc đăng ký."
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
        <TextField
          keyboardType="number-pad"
          label="Mã kích hoạt OTP"
          maxLength={6}
          onChangeText={setCode}
          placeholder="Nhập 6 chữ số"
          value={code}
        />
        <Button 
          loading={loading} 
          onPress={verify} 
          title="KÍCH HOẠT TÀI KHOẢN" 
          variant="primary"
          style={styles.submitBtn}
        />
        <Button
          loading={loading}
          onPress={resend}
          title="GỬI LẠI MÃ KÍCH HOẠT"
          variant="secondary"
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
