import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { colors } from "@/libs/theme";
import { notifyError } from "@/libs/notify";
import { authApi } from "@/services/auth/api";

export default function VerifyResetCodeScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !code) {
      notifyError("Vui lòng điền đầy đủ Email và Mã khôi phục.");
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.verifyResetCode({ email, code });
      router.push({
        pathname: "/(auth)/reset-password",
        params: {
          email,
          resetToken: response.data.resetToken
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
        title="Xác thực OTP"
        subtitle="Chúng tôi đã gửi mã khôi phục đến Email của bạn. Mã hợp lệ sẽ cho phép thiết lập lại mật khẩu mới."
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
          label="Mã khôi phục (OTP)"
          maxLength={6}
          onChangeText={setCode}
          placeholder="Nhập 6 chữ số"
          value={code}
        />
        <Button 
          loading={loading} 
          onPress={submit} 
          title="XÁC THỰC MÃ OTP" 
          variant="primary"
          style={styles.submitBtn}
        />
      </Card>

      <View style={styles.footer}>
        <Link href="/(auth)/forgot-password" style={styles.link}>
          Gửi lại mã OTP
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
