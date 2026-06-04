import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomerAccountMenu } from "@/components/CustomerAccountMenu";
import { appLogger } from "@/libs/logger";
import { notifyError, notifySuccess } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, type ConsultationSetting } from "@/services/customer/api";

const palette = {
  background: "#f8f9fa",
  brown: "#5b403c",
  darkRed: "#6a0100",
  goldDark: "#795900",
  line: "rgba(227, 190, 184, 0.3)",
  muted: "#6b7280",
  pale: "#f3f4f5",
  text: "#191c1d",
  white: "#ffffff"
};

const contactImages = {
  logo: require("@/assets/images/customer/project-detail/kn-logo.png"),
  office: require("@/assets/images/customer/contact/saigon-office.png")
};

const formFields = [
  { label: "HỌ VÀ TÊN", value: "Nguyễn Văn A" },
  { label: "SỐ ĐIỆN THOẠI", value: "0901 234 567" },
  { label: "EMAIL", value: "example@email.com (Nếu có)" }
] as const;

export default function ContactScreen() {
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [setting, setSetting] = useState<ConsultationSetting | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    customerPublicApi
      .consultationSetting()
      .then((response) => {
        if (active) setSetting(response.data);
      })
      .catch((error) => {
        appLogger.warn("customer.consultationSetting", "Không thể tải cấu hình tư vấn.", { error });
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmitConsultation() {
    setSubmitting(true);
    try {
      const response = await customerPublicApi.submitConsultation({
        full_name: "Nguyễn Văn A",
        phone: "0901234567",
        email: "example@email.com",
        project_name: "Grand Riverside Luxury",
        content: "Tôi muốn tìm hiểu thêm về dự án."
      });
      notifySuccess({ message: response.message || "Gửi yêu cầu tư vấn thành công." });
    } catch (error) {
      notifyError(error, "Không thể gửi yêu cầu tư vấn.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(tabs)")} style={styles.brandRow}>
          <Image source={contactImages.logo} style={styles.logo} />
          <Text style={styles.brandText}>KHỞI NGUYÊN LAND</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setAccountMenuVisible(true)} style={styles.accountButton}>
          <Ionicons name="person-circle-outline" size={20} color={palette.brown} />
        </Pressable>
      </View>
      <CustomerAccountMenu onClose={() => setAccountMenuVisible(false)} visible={accountMenuVisible} />

      <ScrollView bounces contentContainerStyle={styles.scroll} overScrollMode="always" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.pageTitle}>Liên Hệ Với Chúng Tôi</Text>
          <Text style={styles.pageDescription}>
            Đội ngũ chuyên gia của Luxe Realty{"\n"}luôn sẵn sàng hỗ trợ bạn tìm kiếm{"\n"}những giải pháp bất động sản thượng{"\n"}lưu và đẳng cấp nhất.
          </Text>
        </View>

        <View style={styles.contactOptions}>
          <View style={styles.optionCard}>
            <View style={styles.hotlineIcon}>
              <Ionicons name="call-outline" size={20} color={palette.darkRed} />
            </View>
            <Text style={styles.hotlineTitle}>Hotline 24/7</Text>
            <Text style={styles.optionText}>Hỗ trợ tư vấn trực tiếp ngay lập tức</Text>
            <Pressable accessibilityRole="button" style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>GỌI NGAY: {setting?.hotline || "1800 6868"}</Text>
            </Pressable>
          </View>

          <View style={styles.optionCard}>
            <View style={styles.callbackIcon}>
              <Ionicons name="headset-outline" size={20} color="#313131" />
            </View>
            <Text style={styles.callbackTitle}>{setting?.callback_title || "Yêu Cầu Gọi Lại"}</Text>
            <Text style={styles.optionText}>{setting?.callback_description || "Để lại thông tin, chúng tôi sẽ gọi lại"}</Text>
            <Pressable accessibilityRole="button" style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>ĐẶT LỊCH HẸN</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{setting?.form_title || "Gửi Tin Nhắn"}</Text>
          <View style={styles.formFields}>
            {formFields.map((field) => (
              <View key={field.label} style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.inputText}>{field.value}</Text>
                </View>
              </View>
            ))}

            <View style={styles.field}>
              <Text style={styles.label}>DỰ ÁN QUAN TÂM</Text>
              <View style={styles.selectBox}>
                <Text style={styles.selectText}>Grand Riverside Luxury</Text>
                <Ionicons name="chevron-down" size={20} color={palette.muted} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>NỘI DUNG</Text>
              <View style={styles.textarea}>
                <Text style={styles.inputText}>Tôi muốn tìm hiểu thêm về...</Text>
              </View>
            </View>
          </View>

          <Pressable accessibilityRole="button" disabled={submitting} onPress={handleSubmitConsultation} style={styles.submitButton}>
            <Text style={styles.submitText}>{submitting ? "ĐANG GỬI..." : "GỬI YÊU CẦU TƯ VẤN"}</Text>
          </Pressable>
        </View>

        <View style={styles.officeSection}>
          <Text style={styles.officeHeading}>Văn Phòng Đại Diện</Text>
          <View style={styles.officeCard}>
            <View style={styles.officeImageWrap}>
              <Image source={contactImages.office} style={styles.officeImage} />
              <View style={styles.officeBadge}>
                <Text style={styles.officeBadgeText}>TRỤ SỞ CHÍNH</Text>
              </View>
            </View>
            <View style={styles.officeBody}>
              <Text style={styles.officeTitle}>{setting?.office_name || "Văn phòng Hà Nội"}</Text>
              <View style={styles.officeRow}>
                <Ionicons name="location-outline" size={22} color={palette.brown} />
                <Text style={styles.officeText}>{setting?.office_address || "Vinhomes Westpoint, Phạm Hùng\nTừ Liêm, Thành phố Hà Nội"}</Text>
              </View>
              <View style={styles.officeRow}>
                <Ionicons name="time-outline" size={22} color={palette.brown} />
                <Text style={styles.officeText}>{setting?.working_hours || "Thứ 2 - Thứ 7: 08:00 - 20:00"}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: palette.background,
    flex: 1
  },
  topBar: {
    alignItems: "center",
    backgroundColor: palette.background,
    borderBottomColor: "rgba(227, 190, 184, 0.1)",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  logo: {
    height: 39,
    resizeMode: "contain",
    width: 80
  },
  brandText: {
    color: palette.darkRed,
    fontFamily: appFonts.bold,
    fontSize: 20,
    letterSpacing: -0.6,
    lineHeight: 28.8
  },
  accountButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  scroll: {
    paddingBottom: 48,
    paddingHorizontal: 20,
    paddingTop: 64
  },
  hero: {
    alignItems: "center",
    gap: 7
  },
  pageTitle: {
    color: palette.darkRed,
    fontFamily: appFonts.bold,
    fontSize: 32,
    letterSpacing: -0.96,
    lineHeight: 38.4,
    textAlign: "center"
  },
  pageDescription: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 30.6,
    textAlign: "center"
  },
  contactOptions: {
    gap: 16,
    marginTop: 16
  },
  optionCard: {
    alignItems: "center",
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: 12,
    borderWidth: 1,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  hotlineIcon: {
    alignItems: "center",
    backgroundColor: "rgba(149, 1, 0, 0.1)",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    marginBottom: 16,
    width: 48
  },
  callbackIcon: {
    alignItems: "center",
    backgroundColor: "rgba(72, 71, 71, 0.1)",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    marginBottom: 16,
    width: 48
  },
  hotlineTitle: {
    color: palette.darkRed,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    marginBottom: 4
  },
  callbackTitle: {
    color: "#313131",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    marginBottom: 4
  },
  optionText: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6,
    marginBottom: 16,
    textAlign: "center"
  },
  primaryButton: {
    backgroundColor: palette.darkRed,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16
  },
  primaryButtonText: {
    color: palette.white,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  secondaryButton: {
    borderColor: "#313131",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 25,
    paddingVertical: 17
  },
  secondaryButtonText: {
    color: "#313131",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  formCard: {
    backgroundColor: palette.white,
    borderColor: "rgba(227, 190, 184, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 36,
    paddingHorizontal: 18,
    paddingVertical: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  formTitle: {
    color: palette.darkRed,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  formFields: {
    gap: 16,
    marginTop: 24
  },
  field: {
    gap: 4
  },
  label: {
    color: palette.brown,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  inputBox: {
    backgroundColor: palette.background,
    borderColor: "rgba(227, 190, 184, 0.5)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 17
  },
  inputText: {
    color: palette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  selectBox: {
    alignItems: "center",
    backgroundColor: palette.background,
    borderColor: "rgba(227, 190, 184, 0.5)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 58,
    paddingHorizontal: 17
  },
  selectText: {
    color: palette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  textarea: {
    backgroundColor: palette.background,
    borderColor: "rgba(227, 190, 184, 0.5)",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 130,
    paddingHorizontal: 17,
    paddingTop: 17
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: palette.darkRed,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 64,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4
  },
  submitText: {
    color: palette.white,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  officeSection: {
    gap: 24,
    marginTop: 48
  },
  officeHeading: {
    color: palette.darkRed,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  officeCard: {
    backgroundColor: palette.white,
    borderColor: "rgba(227, 190, 184, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  officeImageWrap: {
    height: 160,
    overflow: "hidden",
    position: "relative"
  },
  officeImage: {
    height: "218%",
    resizeMode: "cover",
    top: "-59%",
    width: "100%"
  },
  officeBadge: {
    backgroundColor: palette.darkRed,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 4,
    position: "absolute",
    right: 16,
    top: 16
  },
  officeBadgeText: {
    color: palette.white,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  officeBody: {
    gap: 4,
    padding: 24
  },
  officeTitle: {
    color: palette.goldDark,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  officeRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  officeText: {
    color: palette.brown,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  }
});
