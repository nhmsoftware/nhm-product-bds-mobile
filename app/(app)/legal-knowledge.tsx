import {
  Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect,
  useState } from "react";
import { Image,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomerAccountMenu } from "@/components/CustomerAccountMenu";
import { appLogger } from "@/libs/logger";
import { mediaSource } from "@/libs/media";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, type LegalVideo } from "@/services/customer/api";

const palette = {
  background: "#f8f9fa",
  brown: "#5b403c",
  darkRed: "#6a0100",
  goldDark: "#795900",
  muted: "#6b7280",
  red: "#950100",
  text: "#191c1d",
  white: "#ffffff"
};

const legalImages = {
  logo: require("@/assets/images/customer/project-detail/kn-logo.png"),
  thumbnail: require("@/assets/images/customer/legal/video-thumbnail.png")
};

const videos = [
  {
    category: "PHÁP LÝ DỰ ÁN",
    description: "Luật sư Nguyễn Văn A phân tích chi tiết về quyền sở hữu và các chứng nhận pháp lý của dự án.",
    duration: "12:45",
    time: "2 ngày trước",
    title: "Tổng quan Pháp lý dự án Estate Elite &\nLộ trình bàn giao"
  },
  {
    category: "HỢP ĐỒNG",
    description: "Hướng dẫn từng bước thực hiện thủ tục pháp lý khi giao dịch tại Estate Elite.",
    duration: "08:20",
    time: "1 tuần trước",
    title: "Quy trình ký kết hợp đồng mua bán &\nLưu ý quan trọng"
  },
  {
    category: "QUY HOẠCH",
    description: "Tìm hiểu sâu về hạ tầng kỹ thuật và các tiện ích công cộng trong quy hoạch dự án.",
    duration: "15:10",
    time: "2 tuần trước",
    title: "Giải mã quy hoạch 1/500 và tiềm năng\ntăng giá"
  },
  {
    category: "TƯ VẤN THUẾ",
    description: "Cập nhật quy định mới nhất về thuế thu nhập cá nhân và lệ phí trước bạ.",
    duration: "05:40",
    time: "1 tháng trước",
    title: "Các loại thuế và phí khi chuyển nhượng\ncăn hộ"
  }
] as const;

export default function LegalKnowledgeScreen() {
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [apiVideos, setApiVideos] = useState<LegalVideo[]>([]);

  useEffect(() => {
    let active = true;

    customerPublicApi
      .legalVideos({ per_page: 20 })
      .then((response) => {
        if (active) setApiVideos(response.data.list ?? []);
      })
      .catch((error) => {
        appLogger.warn("customer.legalVideos", "Không thể tải video pháp lý.", { error });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(tabs)")} style={styles.brandRow}>
          <Image source={legalImages.logo} style={styles.logo} />
          <Text style={styles.brandText}>KHỞI NGUYÊN LAND</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setAccountMenuVisible(true)} style={styles.accountButton}>
          <Ionicons name="person-circle-outline" size={20} color={palette.brown} />
        </Pressable>
      </View>
      <CustomerAccountMenu onClose={() => setAccountMenuVisible(false)} visible={accountMenuVisible} />

      <ScrollView bounces contentContainerStyle={styles.scroll} overScrollMode="always" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>VIDEO LIBRARY</Text>
          <Text style={styles.title}>Kiến thức & Pháp lý</Text>
          <Text style={styles.description}>
            Chuỗi video tư vấn chuyên sâu về pháp lý bất động sản và quy hoạch từ đội ngũ chuyên gia.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={palette.brown} />
          <Text style={styles.searchText}>Tìm kiếm video tư vấn...</Text>
        </View>

        <View style={styles.videoList}>
          {(apiVideos.length > 0 ? apiVideos : videos).map((video) => {
            const isApiVideo = "id" in video;
            return (
            <Pressable accessibilityRole="button" key={isApiVideo ? video.id : video.title} style={styles.videoCard}>
              <View style={styles.thumbnailWrap}>
                <Image source={isApiVideo ? mediaSource(video.thumbnail, legalImages.thumbnail) : legalImages.thumbnail} style={styles.thumbnail} />
                <View style={styles.thumbnailOverlay} />
                <View style={styles.playButton}>
                  <Ionicons name="play" size={28} color={palette.darkRed} />
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
                </View>
              </View>
              <View style={styles.videoBody}>
                <View style={styles.metaRow}>
                  <Text style={styles.category}>{formatCategory(video.category)}</Text>
                  <Text style={styles.time}>{isApiVideo ? formatDate(video.published_at ?? video.created_at) : video.time}</Text>
                </View>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <Text style={styles.videoDescription}>
                  {isApiVideo ? video.short_description || video.description || "Đang cập nhật nội dung video." : video.description}
                </Text>
              </View>
            </Pressable>
            );
          })}
        </View>

        <View style={styles.helpBox}>
          <View style={styles.helpIcon}>
            <Ionicons name="information" size={22} color={palette.red} />
          </View>
          <View style={styles.helpCopy}>
            <Text style={styles.helpTitle}>Bạn cần giải thích thêm?</Text>
            <Text style={styles.helpText}>
              Đặt lịch hẹn tư vấn 1:1 với chuyên gia luật của chúng tôi để được giải đáp mọi thắc mắc riêng biệt.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatCategory(value?: string | null) {
  const labels: Record<string, string> = {
    project_legal: "PHÁP LÝ DỰ ÁN",
    contract: "HỢP ĐỒNG",
    planning: "QUY HOẠCH",
    transaction_process: "QUY TRÌNH GIAO DỊCH",
    other: "KHÁC"
  };
  return value ? labels[value] ?? value.toUpperCase() : "PHÁP LÝ";
}

function formatDuration(value?: string | number | null) {
  return value ? String(value) : "--:--";
}

function formatDate(value?: string | null) {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return date.toLocaleDateString("vi-VN");
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
    gap: 24,
    paddingBottom: 128,
    paddingHorizontal: 20,
    paddingTop: 32
  },
  hero: {
    gap: 5
  },
  eyebrow: {
    color: palette.goldDark,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  title: {
    color: palette.darkRed,
    fontFamily: appFonts.bold,
    fontSize: 32,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  description: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: palette.white,
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 12
  },
  searchText: {
    color: palette.muted,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  videoList: {
    gap: 16
  },
  videoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    borderColor: "rgba(225, 227, 228, 0.5)",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  thumbnailWrap: {
    backgroundColor: "#e1e3e4",
    height: 196,
    overflow: "hidden",
    position: "relative"
  },
  thumbnail: {
    height: "182%",
    resizeMode: "cover",
    top: "-41%",
    width: "100%"
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)"
  },
  playButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    left: "50%",
    marginLeft: -28,
    marginTop: -28,
    position: "absolute",
    top: "50%",
    width: 56
  },
  durationBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 4,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: 8
  },
  durationText: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 10,
    lineHeight: 15
  },
  videoBody: {
    gap: 4,
    padding: 16
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  category: {
    color: palette.goldDark,
    fontFamily: appFonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    lineHeight: 15
  },
  time: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  videoTitle: {
    color: palette.text,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 20
  },
  videoDescription: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16
  },
  helpBox: {
    alignItems: "center",
    backgroundColor: palette.red,
    borderRadius: 12,
    flexDirection: "row",
    gap: 16,
    padding: 24
  },
  helpIcon: {
    alignItems: "center",
    backgroundColor: "#ffb7aa",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  helpCopy: {
    flex: 1
  },
  helpTitle: {
    color: "#ff9c8d",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  helpText: {
    color: "#ff9c8d",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8
  }
});
