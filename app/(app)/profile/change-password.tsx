import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageTitle } from "@/components/PageTitle";
import { PasswordField } from "@/components/PasswordField";
import { Screen } from "@/components/Screen";
import { notifyError, notifySuccess } from "@/libs/notify";
import { authApi } from "@/services/auth/api";
import { useAuth } from "@/services/auth/store";

export default function ChangePasswordScreen() {
  const { signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordMismatch =
    confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

  const submit = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      notifyError("Vui lòng nhập đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu.");
      return;
    }
    if (newPassword.length < 8) {
      notifyError("Mật khẩu mới phải chứa ít nhất 8 ký tự, bao gồm số và ký tự đặc biệt.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      notifyError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirmation: confirmNewPassword
      });
      notifySuccess({ message: response.message || "Cập nhật mật khẩu thành công." });
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      notifyError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <PageTitle
        title="Đổi mật khẩu"
        subtitle="Cập nhật thông tin mật khẩu đăng nhập bảo mật. Sau khi đổi mật khẩu, hệ thống sẽ yêu cầu bạn đăng nhập lại."
      />
      <Card style={styles.card}>
        <View style={styles.formCol}>
          <PasswordField
            autoCapitalize="none"
            autoComplete="current-password"
            autoCorrect={false}
            label="Mật khẩu hiện tại *"
            onChangeText={setCurrentPassword}
            placeholder="Nhập mật khẩu đang sử dụng"
            textContentType="password"
            value={currentPassword}
          />
          <PasswordField
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            importantForAutofill="no"
            label="Mật khẩu mới *"
            onChangeText={setNewPassword}
            placeholder="Tối thiểu 6 ký tự bảo mật"
            textContentType="none"
            value={newPassword}
          />
          <PasswordField
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            error={passwordMismatch ? "Mật khẩu xác nhận không khớp." : undefined}
            importantForAutofill="no"
            label="Xác nhận mật khẩu mới *"
            onChangeText={setConfirmNewPassword}
            placeholder="Nhập lại mật khẩu mới"
            textContentType="none"
            value={confirmNewPassword}
          />
          
          <View style={styles.btnRow}>
            <Button onPress={() => router.back()} title="QUAY LẠI" variant="secondary" style={styles.flexOne} />
            <Button loading={loading} onPress={submit} title="CẬP NHẬT" variant="danger" style={[styles.flexOne, styles.brandButton]} />
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16
  },
  formCol: {
    gap: 16
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10
  },
  flexOne: {
    flex: 1
  },
  brandButton: {
    backgroundColor: "#6a0100",
    borderColor: "#6a0100"
  }
});
