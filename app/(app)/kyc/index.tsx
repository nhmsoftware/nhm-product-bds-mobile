import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { USER_GENDER, USER_GENDER_OPTIONS } from "@/libs/gender";
import { notifyError, notifySuccess } from "@/libs/notify";
import { colors, radius } from "@/libs/theme";
import { profileApi } from "@/services/profile/api";
import type { SubmitKycInput } from "@/services/profile/types";

type PickedImage = NonNullable<SubmitKycInput["cccdFrontImage"]>;
type Step = 1 | 2 | 3;

export default function KycScreen() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<SubmitKycInput>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: USER_GENDER.male,
    phoneNumber: "",
    address: "",
    binBank: "",
    accountBank: "",
    accountBankName: "",
    cccdFrontImage: null,
    cccdBackImage: null
  });
  const [loading, setLoading] = useState(false);

  const pickImage = async (target: "front" | "back") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const image: PickedImage = {
      uri: asset.uri,
      name: asset.fileName ?? `${target}-cccd.jpg`,
      type: asset.mimeType ?? "image/jpeg"
    };
    setForm((s) =>
      target === "front" ? { ...s, cccdFrontImage: image } : { ...s, cccdBackImage: image }
    );
  };

  const submit = async () => {
    // Validate Step 3
    if (!form.cccdFrontImage || !form.cccdBackImage) {
      notifyError("Vui lòng tải lên cả hai mặt của CCCD/Hộ chiếu.");
      return;
    }

    setLoading(true);
    try {
      const response = await profileApi.submitKyc(form);
      notifySuccess({
        message: response.message || "Gửi hồ sơ xác minh thành công.",
        description: "Vui lòng chờ phê duyệt từ Ban quản trị."
      });
    } catch (error) {
      notifyError(error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.phoneNumber) {
        notifyError("Vui lòng nhập đầy đủ các trường thông tin bắt buộc (*).");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.binBank || !form.accountBank || !form.accountBankName) {
        notifyError("Vui lòng hoàn thành thông tin tài khoản ngân hàng liên kết.");
        return;
      }
      setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  return (
    <Screen>
      <PageTitle
        title="Xác minh tài khoản"
        subtitle="Tiến hành xác thực KYC cấp độ 2 để bảo mật tài khoản và nâng giới hạn nạp rút tiền."
      />

      {/* Elegant Stepper Panel */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepItem}>
          <View style={[styles.stepDot, step >= 1 ? styles.stepActive : styles.stepInactive]}>
            <Text style={[styles.stepNum, step >= 1 && styles.stepNumActive]}>1</Text>
          </View>
          <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Cá nhân</Text>
        </View>
        <View style={[styles.stepLine, step >= 2 ? styles.lineActive : styles.lineInactive]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepDot, step >= 2 ? styles.stepActive : styles.stepInactive]}>
            <Text style={[styles.stepNum, step >= 2 && styles.stepNumActive]}>2</Text>
          </View>
          <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Ngân hàng</Text>
        </View>
        <View style={[styles.stepLine, step >= 3 ? styles.lineActive : styles.lineInactive]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepDot, step >= 3 ? styles.stepActive : styles.stepInactive]}>
            <Text style={[styles.stepNum, step >= 3 && styles.stepNumActive]}>3</Text>
          </View>
          <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>Tải ảnh</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard} variant="glass">
          {step === 1 && (
            // STEP 1: Personal Info
            <View style={styles.stepForm}>
              <Text style={styles.sectionTitle}>Thông tin cá nhân cơ bản</Text>
              
              <View style={styles.rowGrid}>
                <View style={styles.flexHalf}>
                  <TextField
                    label="Họ *"
                    onChangeText={(lastName) => setForm((s) => ({ ...s, lastName }))}
                    placeholder="Nguyễn"
                    value={form.lastName}
                  />
                </View>
                <View style={styles.flexHalf}>
                  <TextField
                    label="Tên *"
                    onChangeText={(firstName) => setForm((s) => ({ ...s, firstName }))}
                    placeholder="Văn A"
                    value={form.firstName}
                  />
                </View>
              </View>

              <TextField
                label="Ngày sinh * (YYYY-MM-DD)"
                onChangeText={(dateOfBirth) => setForm((s) => ({ ...s, dateOfBirth }))}
                placeholder="Ví dụ: 1995-10-15"
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
                label="Số điện thoại di động *"
                onChangeText={(phoneNumber) => setForm((s) => ({ ...s, phoneNumber }))}
                placeholder="Ví dụ: 0912345678"
                value={form.phoneNumber}
              />

              <TextField
                label="Địa chỉ thường trú"
                onChangeText={(address) => setForm((s) => ({ ...s, address }))}
                placeholder="Số nhà, Tên đường, Quận, Thành phố..."
                value={form.address}
              />

              <Button onPress={nextStep} title="TIẾP THEO: THÔNG TIN NGÂN HÀNG" variant="primary" style={styles.navBtn} />
            </View>
          )}

          {step === 2 && (
            // STEP 2: Bank Linked Info
            <View style={styles.stepForm}>
              <Text style={styles.sectionTitle}>Liên kết tài khoản Ngân hàng</Text>
              <Text style={styles.subtext}>
                Tài khoản ngân hàng dùng để thực hiện rút tiền từ hệ thống về. Vui lòng nhập chính xác để tránh sai sót giao dịch.
              </Text>

              <TextField
                label="Mã ngân hàng (BIN Bank) *"
                onChangeText={(binBank) => setForm((s) => ({ ...s, binBank }))}
                placeholder="Ví dụ: VCB, MB, TCB..."
                value={form.binBank}
              />

              <TextField
                keyboardType="number-pad"
                label="Số tài khoản ngân hàng *"
                onChangeText={(accountBank) => setForm((s) => ({ ...s, accountBank }))}
                placeholder="Nhập số tài khoản"
                value={form.accountBank}
              />

              <TextField
                label="Tên chủ tài khoản (Viết hoa không dấu) *"
                onChangeText={(accountBankName) => setForm((s) => ({ ...s, accountBankName }))}
                placeholder="Ví dụ: NGUYEN VAN A"
                value={form.accountBankName}
              />

              <View style={styles.btnRow}>
                <Button onPress={prevStep} title="QUAY LẠI" variant="secondary" style={styles.flexOne} />
                <Button onPress={nextStep} title="TIẾP THEO" variant="primary" style={styles.flexOne} />
              </View>
            </View>
          )}

          {step === 3 && (
            // STEP 3: CCCD photo upload
            <View style={styles.stepForm}>
              <Text style={styles.sectionTitle}>Tải lên tài liệu định danh (CCCD/Hộ chiếu)</Text>
              <Text style={styles.subtext}>
                Chụp ảnh rõ nét CCCD/Hộ chiếu của bạn để xác minh tính chính danh. Không được mờ, lóa hoặc mất góc.
              </Text>

              <View style={styles.images}>
                <ImagePickerBox
                  image={form.cccdFrontImage}
                  label="CCCD mặt trước"
                  onPress={() => pickImage("front")}
                />
                <ImagePickerBox
                  image={form.cccdBackImage}
                  label="CCCD mặt sau"
                  onPress={() => pickImage("back")}
                />
              </View>

              <View style={styles.btnRow}>
                <Button onPress={prevStep} title="QUAY LẠI" variant="secondary" style={styles.flexOne} />
                <Button loading={loading} onPress={submit} title="GỬI HỒ SƠ KYC" variant="primary" style={styles.flexOne} />
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function ImagePickerBox({
  image,
  label,
  onPress
}: {
  image?: PickedImage | null;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.picker}>
      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image.uri }} style={styles.preview} />
          <View style={styles.uploadedIndicator}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.uploadedText}>{label}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.pickerPlaceholder}>
          <Ionicons name="camera-outline" size={32} color={colors.primary} />
          <Text style={styles.pickerText}>{`Tải lên ${label}`}</Text>
          <Text style={styles.pickerSubText}>Chấp nhận JPEG, PNG tối đa 5MB</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8
  },
  stepItem: {
    alignItems: "center",
    gap: 6
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  stepActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(252, 213, 53, 0.15)"
  },
  stepInactive: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceDark
  },
  stepNum: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  stepNumActive: {
    color: colors.primary
  },
  stepLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700"
  },
  stepLabelActive: {
    color: colors.text
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: -16
  },
  lineActive: {
    backgroundColor: colors.primary
  },
  lineInactive: {
    backgroundColor: colors.border
  },
  scrollContent: {
    paddingBottom: 24
  },
  formCard: {
    padding: 16
  },
  stepForm: {
    gap: 16
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8
  },
  subtext: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16
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
  images: {
    gap: 16
  },
  picker: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: "dashed",
    borderWidth: 1.5,
    minHeight: 120,
    justifyContent: "center",
    overflow: "hidden"
  },
  previewContainer: {
    width: "100%",
    height: 120,
    position: "relative"
  },
  preview: {
    height: "100%",
    width: "100%",
    resizeMode: "cover"
  },
  uploadedIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(11, 14, 20, 0.85)",
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  uploadedText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "800"
  },
  pickerPlaceholder: {
    alignItems: "center",
    padding: 16,
    gap: 4
  },
  pickerText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4
  },
  pickerSubText: {
    color: colors.muted,
    fontSize: 10
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10
  },
  navBtn: {
    marginTop: 8
  }
});
