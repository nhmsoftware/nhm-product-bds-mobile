import {
  Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect,
  useState } from "react";
import { Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomerAccountMenu } from "@/components/CustomerAccountMenu";
import { appLogger } from "@/libs/logger";
import { notifyError, notifySuccess } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, type ConsultationSetting, type PublicProject } from "@/services/customer/api";

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

export default function ContactScreen() {
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);
  const [setting, setSetting] = useState<ConsultationSetting | null>(null);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [content, setContent] = useState("");

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

    setProjectsLoading(true);
    customerPublicApi
      .projects({ per_page: 50 })
      .then((response) => {
        if (active) setProjects(response.data.data ?? response.data.list ?? []);
      })
      .catch((error) => {
        appLogger.warn("customer.consultationProjects", "Không thể tải danh sách dự án tư vấn.", { error });
      })
      .finally(() => {
        if (active) setProjectsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmitConsultation() {
    const normalizedPhone = phone.replace(/\s/g, "");
    if (!fullName.trim()) {
      notifyError(new Error("Vui lòng nhập họ tên."));
      return;
    }
    if (!normalizedPhone) {
      notifyError(new Error("Vui lòng nhập số điện thoại."));
      return;
    }

    setSubmitting(true);
    try {
      const response = await customerPublicApi.submitConsultation({
        full_name: fullName.trim(),
        phone: normalizedPhone,
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(selectedProject?.id ? { project_id: selectedProject.id } : {}),
        ...(selectedProject?.name ? { project_name: selectedProject.name } : {}),
        ...(content.trim() ? { content: content.trim() } : {})
      });
      notifySuccess({ message: response.message || "Gửi yêu cầu tư vấn thành công." });
      setFullName("");
      setPhone("");
      setEmail("");
      setSelectedProject(null);
      setContent("");
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
      <ConsultationProjectPicker
        loading={projectsLoading}
        onClose={() => setProjectPickerVisible(false)}
        onSelect={(project) => {
          setSelectedProject(project);
          setProjectPickerVisible(false);
        }}
        options={projects}
        selectedProjectId={selectedProject?.id}
        visible={projectPickerVisible}
      />

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
            <View style={styles.field}>
              <Text style={styles.label}>HỌ VÀ TÊN</Text>
              <View style={styles.inputBox}>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setFullName}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor={palette.muted}
                  returnKeyType="next"
                  style={styles.inputText}
                  value={fullName}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>SỐ ĐIỆN THOẠI</Text>
              <View style={styles.inputBox}>
                <TextInput
                  keyboardType="phone-pad"
                  onChangeText={setPhone}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor={palette.muted}
                  style={styles.inputText}
                  value={phone}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputBox}>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Nhập email nếu có"
                  placeholderTextColor={palette.muted}
                  style={styles.inputText}
                  value={email}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>DỰ ÁN QUAN TÂM</Text>
              <Pressable accessibilityRole="button" onPress={() => setProjectPickerVisible(true)} style={styles.selectBox}>
                <Text style={[styles.selectText, !selectedProject?.name && styles.placeholderText]}>
                  {selectedProject?.name || "Chọn dự án quan tâm"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={palette.muted} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>NỘI DUNG</Text>
              <View style={styles.textarea}>
                <TextInput
                  multiline
                  onChangeText={setContent}
                  placeholder="Tôi muốn tìm hiểu thêm về..."
                  placeholderTextColor={palette.muted}
                  style={styles.textareaInput}
                  textAlignVertical="top"
                  value={content}
                />
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

function ConsultationProjectPicker({
  loading,
  onClose,
  onSelect,
  options,
  selectedProjectId,
  visible
}: {
  loading: boolean;
  onClose: () => void;
  onSelect: (project: PublicProject) => void;
  options: PublicProject[];
  selectedProjectId?: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.projectModalBackdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.projectModal}>
          <View style={styles.projectModalHeader}>
            <Text style={styles.projectModalTitle}>Chọn dự án quan tâm</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.projectModalClose}>
              <Ionicons color={palette.text} name="close" size={20} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.projectModalList} showsVerticalScrollIndicator={false}>
            {loading ? <Text style={styles.projectModalState}>Đang tải danh sách dự án...</Text> : null}
            {!loading && options.length === 0 ? (
              <Text style={styles.projectModalState}>Hiện chưa có dự án để chọn.</Text>
            ) : null}
            {!loading
              ? options.map((project) => {
                  const active = project.id === selectedProjectId;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={project.id}
                      onPress={() => onSelect(project)}
                      style={[styles.projectModalOption, active && styles.projectModalOptionActive]}
                    >
                      <View style={styles.projectModalOptionBody}>
                        <Text style={[styles.projectModalOptionText, active && styles.projectModalOptionTextActive]}>
                          {project.name || "Dự án chưa đặt tên"}
                        </Text>
                        {project.location ? <Text style={styles.projectModalOptionMeta}>{project.location}</Text> : null}
                      </View>
                      {active ? <Ionicons color={palette.goldDark} name="checkmark" size={20} /> : null}
                    </Pressable>
                  );
                })
              : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
    lineHeight: 20
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
    lineHeight: 20
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
    lineHeight: 16
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
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    padding: 0
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
  placeholderText: {
    color: palette.muted
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
  textareaInput: {
    color: palette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 96,
    padding: 0
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
    lineHeight: 20
  },
  projectModalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  projectModal: {
    backgroundColor: palette.white,
    borderRadius: 12,
    maxHeight: "70%",
    overflow: "hidden",
    width: "100%"
  },
  projectModalHeader: {
    alignItems: "center",
    borderBottomColor: "rgba(227, 190, 184, 0.45)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  projectModalTitle: {
    color: palette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 22
  },
  projectModalClose: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  projectModalList: {
    padding: 12
  },
  projectModalState: {
    color: palette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    textAlign: "center"
  },
  projectModalOption: {
    alignItems: "center",
    borderColor: "rgba(227, 190, 184, 0.5)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  projectModalOptionActive: {
    backgroundColor: "rgba(249, 209, 92, 0.16)",
    borderColor: "#f5c14b"
  },
  projectModalOptionBody: {
    flex: 1,
    paddingRight: 10
  },
  projectModalOptionText: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 14,
    lineHeight: 20
  },
  projectModalOptionTextActive: {
    color: palette.goldDark
  },
  projectModalOptionMeta: {
    color: palette.muted,
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2
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
