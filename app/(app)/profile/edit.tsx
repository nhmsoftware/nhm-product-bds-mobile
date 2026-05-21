import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingState } from "@/components/LoadingState";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { normalizeGenderValue, USER_GENDER_OPTIONS } from "@/libs/gender";
import { notifyError, notifySuccess } from "@/libs/notify";
import { colors, radius } from "@/libs/theme";
import { profileApi } from "@/services/profile/api";
import type { UpdateProfileInput } from "@/services/profile/types";

export default function EditProfileScreen() {
  const [form, setForm] = useState<UpdateProfileInput>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: 1,
    phoneNumber: "",
    address: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileApi
      .getProfile()
      .then((response) => {
        const profile = response.data;
        setForm({
          firstName: profile.firstName ?? "",
          lastName: profile.lastName ?? "",
          dateOfBirth: profile.dateOfBirth ?? "",
          gender: normalizeGenderValue(profile.genderValue),
          phoneNumber: profile.phoneNumber ?? "",
          address: profile.address ?? ""
        });
      })
      .catch((error) => notifyError(error))
      .finally(() => setLoading(false));
  }, []);

  const update = async () => {
    if (!form.firstName || !form.lastName || !form.phoneNumber) {
      notifyError("Vui lòng điền các thông tin bắt buộc (*).");
      return;
    }

    setSaving(true);
    try {
      const response = await profileApi.updateProfile(form);
      notifySuccess({ message: response.message || "Cập nhật hồ sơ thành công." });
      router.back();
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <PageTitle title="Sửa hồ sơ" subtitle="Cập nhật thông tin định danh cá nhân liên lạc chính xác." />
      <Card style={styles.card} variant="glass">
        {loading ? (
          <LoadingState />
        ) : (
          <View style={styles.formContent}>
            <View style={styles.rowGrid}>
              <View style={styles.flexHalf}>
                <TextField
                  label="Họ *"
                  onChangeText={(lastName) => setForm((s) => ({ ...s, lastName }))}
                  value={form.lastName}
                />
              </View>
              <View style={styles.flexHalf}>
                <TextField
                  label="Tên *"
                  onChangeText={(firstName) => setForm((s) => ({ ...s, firstName }))}
                  value={form.firstName}
                />
              </View>
            </View>

            <TextField
              label="Ngày sinh (YYYY-MM-DD)"
              onChangeText={(dateOfBirth) => setForm((s) => ({ ...s, dateOfBirth }))}
              placeholder="1995-10-25"
              value={form.dateOfBirth}
            />

            <Text style={styles.fieldLabel}>Giới tính</Text>
            <View style={styles.genderRow}>
              {USER_GENDER_OPTIONS.map((option) => {
                const isSel = form.gender === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setForm((s) => ({ ...s, gender: option.value }))}
                    style={[styles.genderBtn, isSel && styles.genderBtnActive]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={16}
                      color={isSel ? colors.primary : colors.muted}
                    />
                    <Text style={[styles.genderText, isSel && styles.genderTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextField
              keyboardType="phone-pad"
              label="Số điện thoại *"
              onChangeText={(phoneNumber) => setForm((s) => ({ ...s, phoneNumber }))}
              value={form.phoneNumber}
            />

            <TextField
              label="Địa chỉ cư trú"
              onChangeText={(address) => setForm((s) => ({ ...s, address }))}
              value={form.address}
            />

            <View style={styles.btnRow}>
              <Button onPress={() => router.back()} title="HỦY BỎ" variant="secondary" style={styles.flexOne} />
              <Button loading={saving} onPress={update} title="LƯU THAY ĐỔI" variant="primary" style={styles.flexOne} />
            </View>
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16
  },
  formContent: {
    gap: 16
  },
  rowGrid: {
    flexDirection: "row",
    gap: 12
  },
  flexHalf: {
    flex: 1
  },
  flexOne: {
    flex: 1
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: -4
  },
  genderRow: {
    flexDirection: "row",
    gap: 12
  },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 10
  },
  genderBtnActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(252, 213, 53, 0.05)"
  },
  genderText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  genderTextActive: {
    color: colors.primary
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10
  }
});
