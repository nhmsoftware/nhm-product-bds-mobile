import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { Href } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { Screen } from "@/components/Screen";
import { useLayoutMode } from "@/libs/layout-mode";
import { notifyError, notifyInfo, notifySuccess } from "@/libs/notify";
import { supportApi } from "@/services/support/api";

type FaqItem = {
  icon: keyof typeof Ionicons.glyphMap;
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    answer: "Vào Ví, chọn Nạp tiền, nhập số tiền và làm theo hướng dẫn chuyển khoản/duyệt giao dịch.",
    icon: "wallet-outline",
    question: "Làm thế nào để nạp tiền?"
  },
  {
    answer: "KYC thường mất vài phút đến vài giờ tùy chất lượng giấy tờ và khối lượng hồ sơ đang chờ duyệt.",
    icon: "shield-checkmark-outline",
    question: "Quy trình KYC mất bao lâu?"
  },
  {
    answer: "Phí giao dịch phụ thuộc cặp tiền, loại tài khoản và cấu hình phí hiện hành của hệ thống.",
    icon: "sync-outline",
    question: "Phí giao dịch là bao nhiêu?"
  }
];

export default function SupportScreen() {
  const { mode } = useLayoutMode();
  const isProfessionalLayout = mode === "default";
  const [search, setSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const palette = isProfessionalLayout ? professionalPalette : defaultPalette;
  const filteredFaq = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return faqItems;

    return faqItems.filter((item) => item.question.toLowerCase().includes(keyword));
  }, [search]);

  const openTicketModal = () => {
    setTicketModalVisible(true);
  };

  const createTicket = async () => {
    if (!ticketMessage.trim()) {
      notifyError("Vui lòng nhập nội dung yêu cầu hỗ trợ.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await supportApi.create({
        message: ticketMessage.trim(),
        priority: 2,
        type: 2
      });
      setTicketMessage("");
      setTicketModalVisible(false);
      notifySuccess({
        description: "Đội hỗ trợ sẽ phản hồi trong thời gian sớm nhất.",
        message: response.message || "Gửi ticket thành công."
      });
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded={false} scroll={false}>
      <View style={[styles.page, { backgroundColor: palette.bg }]}>
        <View style={[styles.header, { borderBottomColor: palette.line }]}>
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Ionicons color={palette.text} name="arrow-back" size={28} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: palette.headerText }]}>Trung tâm hỗ trợ</Text>
          <Pressable hitSlop={10} onPress={() => notifyInfo({ message: "Không có thông báo hỗ trợ mới." })}>
            <Ionicons color={palette.headerText} name="notifications-outline" size={27} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.searchBox, { backgroundColor: palette.bg }]}>
            <Ionicons color={palette.muted} name="search-outline" size={28} />
            <TextInput
              onChangeText={setSearch}
              placeholder="Tìm kiếm hướng dẫn..."
              placeholderTextColor={palette.placeholder}
              style={[styles.searchInput, { color: palette.text }]}
              value={search}
            />
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.heroTextCol}>
              <Text style={[styles.heroEyebrow, { color: palette.accent }]}>Chào mừng bạn</Text>
              <Text style={[styles.heroTitle, { color: palette.text }]}>Chúng tôi có thể giúp gì cho bạn?</Text>
            </View>
            <View style={styles.heroVisual}>
              <View style={styles.heroGridLine} />
              <View style={styles.heroGlow} />
              <View style={styles.botHead}>
                <Ionicons color={palette.muted} name="hardware-chip-outline" size={54} />
              </View>
              <View style={styles.heroWaveOne} />
              <View style={styles.heroWaveTwo} />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: palette.text }]}>Kênh hỗ trợ</Text>

          <Pressable
            onPress={() => notifyInfo({ message: "Live Chat sẽ được kết nối khi kênh hỗ trợ realtime được bật." })}
            style={[styles.liveChatCard, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <View style={[styles.liveIcon, { backgroundColor: palette.accent }]}>
              <Ionicons color="#111827" name="chatbox-outline" size={31} />
            </View>
            <View style={styles.liveContent}>
              <Text style={[styles.liveTitle, { color: palette.text }]}>Trực tuyến 24/7</Text>
              <Text style={[styles.liveSub, { color: palette.subText }]}>Hỗ trợ Live Chat tức thì</Text>
            </View>
            <Ionicons color={palette.accent} name="chevron-forward" size={34} />
          </Pressable>

          <View style={styles.supportGrid}>
            <Pressable
              onPress={openTicketModal}
              style={[styles.supportTile, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <Ionicons color={palette.success} name="ticket-outline" size={34} />
              <Text style={[styles.tileTitle, { color: palette.text }]}>Gửi Ticket</Text>
              <Text style={[styles.tileSub, { color: palette.subText }]}>Yêu cầu hỗ trợ</Text>
            </Pressable>

            <Pressable
              onPress={() => notifyInfo({ message: "Email hỗ trợ: support@tradenex.com" })}
              style={[styles.supportTile, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <Ionicons color={palette.accent} name="mail-outline" size={34} />
              <Text style={[styles.tileTitle, { color: palette.text }]}>Email</Text>
              <Text style={[styles.tileSub, { color: palette.subText }]}>support@tradenex.com</Text>
            </Pressable>
          </View>

          <View style={styles.faqHeader}>
            <Text style={[styles.sectionTitle, styles.faqTitle, { color: palette.text }]}>Câu hỏi thường gặp</Text>
            <Pressable onPress={() => setExpandedFaq(null)}>
              <Text style={[styles.viewAll, { color: palette.accent }]}>Xem tất cả</Text>
            </Pressable>
          </View>

          <View style={styles.faqList}>
            {filteredFaq.map((item) => {
              const expanded = expandedFaq === item.question;

              return (
                <Pressable
                  key={item.question}
                  onPress={() => setExpandedFaq(expanded ? null : item.question)}
                  style={[styles.faqItem, { backgroundColor: palette.card, borderColor: palette.border }]}
                >
                  <View style={styles.faqTop}>
                    <Ionicons color={palette.headerText} name={item.icon} size={28} />
                    <Text style={[styles.faqQuestion, { color: palette.text }]}>{item.question}</Text>
                    <Ionicons color={palette.headerText} name={expanded ? "chevron-up" : "chevron-down"} size={22} />
                  </View>
                  {expanded ? <Text style={[styles.faqAnswer, { color: palette.subText }]}>{item.answer}</Text> : null}
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.communityDivider, { backgroundColor: palette.line }]} />
          <Text style={[styles.communityTitle, { color: palette.headerText }]}>THAM GIA CỘNG ĐỒNG</Text>
          <View style={styles.socialRow}>
            <SocialButton icon="paper-plane" palette={palette} />
            <SocialButton icon="logo-facebook" palette={palette} />
            <SocialButton icon="logo-instagram" palette={palette} />
          </View>
        </ScrollView>

        <Pressable onPress={openTicketModal} style={[styles.floatingHelp, { backgroundColor: palette.accent }]}>
          <Ionicons color="#111827" name="headset-outline" size={34} />
        </Pressable>

        <SupportBottomNav palette={palette} />

        <TicketModal
          message={ticketMessage}
          onChangeMessage={setTicketMessage}
          onClose={() => setTicketModalVisible(false)}
          onSubmit={createTicket}
          palette={palette}
          submitting={submitting}
          visible={ticketModalVisible}
        />
      </View>
    </Screen>
  );
}

function SocialButton({
  icon,
  palette
}: {
  icon: keyof typeof Ionicons.glyphMap;
  palette: SupportPalette;
}) {
  return (
    <Pressable
      onPress={() => notifyInfo({ message: "Kênh cộng đồng sẽ được cấu hình sau." })}
      style={[styles.socialButton, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      <Ionicons color={palette.accent} name={icon} size={25} />
    </Pressable>
  );
}

function SupportBottomNav({ palette }: { palette: SupportPalette }) {
  const items: {
    href: Href;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }[] = [
    { href: "/(app)/(tabs)", icon: "home-outline", label: "Trang chủ" },
    { href: "/(app)/(tabs)/market", icon: "bar-chart-outline", label: "Thị trường" },
    { href: "/(app)/(tabs)/trade", icon: "sync-circle-outline", label: "Giao dịch" },
    { href: "/(app)/(tabs)/wallet", icon: "wallet-outline", label: "Ví" },
    { href: "/(app)/(tabs)/profile", icon: "person-outline", label: "Hồ sơ" }
  ];

  return (
    <View style={[styles.bottomNav, { backgroundColor: palette.nav, borderTopColor: palette.border }]}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={() => router.replace(item.href)} style={styles.navItem}>
          <Ionicons color={palette.headerText} name={item.icon} size={25} />
          <Text style={[styles.navText, { color: palette.headerText }]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function TicketModal({
  message,
  onChangeMessage,
  onClose,
  onSubmit,
  palette,
  submitting,
  visible
}: {
  message: string;
  onChangeMessage: (message: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  palette: SupportPalette;
  submitting: boolean;
  visible: boolean;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Gửi Ticket hỗ trợ</Text>
            <Pressable hitSlop={10} onPress={onClose}>
              <Ionicons color={palette.text} name="close-outline" size={26} />
            </Pressable>
          </View>

          <Text style={[styles.modalLabel, { color: palette.subText }]}>Nội dung yêu cầu</Text>
          <TextInput
            multiline
            onChangeText={onChangeMessage}
            placeholder="Mô tả vấn đề bạn đang gặp..."
            placeholderTextColor={palette.placeholder}
            style={[styles.modalInput, { borderColor: palette.border, color: palette.text }]}
            textAlignVertical="top"
            value={message}
          />

          <Pressable disabled={submitting} onPress={onSubmit} style={[styles.submitButton, { backgroundColor: palette.accent }]}>
            <Text style={styles.submitText}>{submitting ? "Đang gửi..." : "Gửi yêu cầu"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type SupportPalette = {
  accent: string;
  bg: string;
  border: string;
  card: string;
  headerText: string;
  line: string;
  muted: string;
  nav: string;
  placeholder: string;
  subText: string;
  success: string;
  text: string;
};

const professionalPalette: SupportPalette = {
  accent: "#fcd535",
  bg: "#090d12",
  border: "rgba(255, 255, 255, 0.07)",
  card: "#151a20",
  headerText: "#f2e8cb",
  line: "#242a31",
  muted: "#9c927a",
  nav: "#171b20",
  placeholder: "#6f706b",
  subText: "#d9d2bc",
  success: "#43e09a",
  text: "#f4f6fb"
};

const defaultPalette: SupportPalette = {
  accent: "#fcd535",
  bg: "#0f172a",
  border: "rgba(148, 163, 184, 0.12)",
  card: "#172133",
  headerText: "#f8fafc",
  line: "#263349",
  muted: "#94a3b8",
  nav: "#111827",
  placeholder: "#64748b",
  subText: "#cbd5e1",
  success: "#43e09a",
  text: "#f8fafc"
};

const styles = StyleSheet.create({
  page: {
    flex: 1
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: 22
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: "900"
  },
  scrollContent: {
    paddingBottom: 132,
    paddingHorizontal: 22,
    paddingTop: 34
  },
  searchBox: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    height: 48,
    marginBottom: 30
  },
  searchInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600"
  },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    height: 215,
    marginBottom: 40,
    overflow: "hidden"
  },
  heroTextCol: {
    flex: 1.1,
    justifyContent: "center",
    paddingHorizontal: 32
  },
  heroEyebrow: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 36
  },
  heroVisual: {
    backgroundColor: "#0f1318",
    flex: 1,
    overflow: "hidden"
  },
  heroGridLine: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    height: 1,
    left: 20,
    position: "absolute",
    right: 20,
    top: 52
  },
  heroGlow: {
    backgroundColor: "rgba(252, 213, 53, 0.13)",
    borderRadius: 70,
    height: 140,
    position: "absolute",
    right: 42,
    top: 40,
    width: 140
  },
  botHead: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 44,
    borderWidth: 1,
    height: 88,
    justifyContent: "center",
    position: "absolute",
    right: 58,
    top: 54,
    width: 88
  },
  heroWaveOne: {
    borderColor: "rgba(252, 213, 53, 0.24)",
    borderRadius: 100,
    borderWidth: 1,
    height: 130,
    position: "absolute",
    right: 18,
    top: 34,
    width: 130
  },
  heroWaveTwo: {
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 120,
    borderWidth: 1,
    height: 174,
    position: "absolute",
    right: -4,
    top: 12,
    width: 174
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 24
  },
  liveChatCard: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 24,
    minHeight: 128,
    paddingHorizontal: 32,
    paddingVertical: 24
  },
  liveIcon: {
    alignItems: "center",
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    width: 68
  },
  liveContent: {
    flex: 1
  },
  liveTitle: {
    fontSize: 27,
    fontWeight: "900"
  },
  liveSub: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 3
  },
  supportGrid: {
    flexDirection: "row",
    gap: 22,
    marginBottom: 44,
    marginTop: 22
  },
  supportTile: {
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 146,
    padding: 22
  },
  tileTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 28
  },
  tileSub: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 3
  },
  faqHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  faqTitle: {
    marginBottom: 22
  },
  viewAll: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 22
  },
  faqList: {
    gap: 12
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 22
  },
  faqTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16
  },
  faqQuestion: {
    flex: 1,
    fontSize: 19,
    fontWeight: "700"
  },
  faqAnswer: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginLeft: 44,
    marginTop: 14
  },
  communityDivider: {
    height: 1,
    marginBottom: 34,
    marginTop: 42
  },
  communityTitle: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 2.2,
    marginBottom: 26,
    textAlign: "center"
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 44
  },
  socialButton: {
    alignItems: "center",
    borderRadius: 26,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  floatingHelp: {
    alignItems: "center",
    borderRadius: 38,
    bottom: 92,
    height: 76,
    justifyContent: "center",
    position: "absolute",
    right: 24,
    shadowColor: "#fcd535",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    width: 76,
    elevation: 10
  },
  bottomNav: {
    alignItems: "center",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    height: 74,
    justifyContent: "space-around",
    left: 0,
    paddingBottom: 8,
    paddingTop: 8,
    position: "absolute",
    right: 0
  },
  navItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 58
  },
  navText: {
    fontSize: 13,
    fontWeight: "700"
  },
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    flex: 1,
    justifyContent: "flex-end"
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: "900"
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: "600",
    minHeight: 118,
    padding: 14
  },
  submitButton: {
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 50
  },
  submitText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900"
  }
});
