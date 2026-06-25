import { useCallback,
  useEffect,
  useState } from "react";
import { Image,
  RefreshControl,
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
import { mediaSource } from "@/libs/media";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, type LegalVideo } from "@/services/customer/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";

const palette = {
  background: "#f8f9fa",
  brown: "#5b403c",
  darkRed: "#6a0100",
  goldDark: "#795900",
  red: "#950100",
  text: "#191c1d",
  white: "#ffffff",
  muted: "#6b7280"
} as const;

const legalImages = {
  thumbnail: require("@/assets/images/customer/legal/video-thumbnail.png")
};

const videos = [
  {
    category: "Pháp lý dự án",
    duration: "10:15",
    id: "1",
    thumbnail: legalImages.thumbnail,
    time: "2 giờ trước",
    title: "Quy trình kiểm tra tính pháp lý của một dự án bất động sản"
  },
  {
    category: "Hợp đồng",
    duration: "15:30",
    id: "2",
    thumbnail: legalImages.thumbnail,
    time: "1 ngày trước",
    title: "Những điều khoản quan trọng cần lưu ý trong hợp đồng đặt cọc"
  },
  {
    category: "Quy hoạch",
    duration: "12:45",
    id: "3",
    thumbnail: legalImages.thumbnail,
    time: "3 ngày trước",
    title: "Cách đọc bản đồ quy hoạch và tránh mua phải đất dính quy hoạch"
  }
] as const;

const categories = [
  { key: "all", label: "Tất cả" },
  { key: "project_legal", label: "Pháp lý dự án" },
  { key: "contract", label: "Hợp đồng" },
  { key: "planning", label: "Quy hoạch" },
  { key: "transaction_process", label: "Quy trình giao dịch" },
  { key: "other", label: "Khác" }
] as const;


function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "Đang cập nhật";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "Vừa xong";

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return diffMins <= 0 ? "Vừa xong" : `${diffMins} phút trước`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks} tuần trước`;
  }

  return date.toLocaleDateString("vi-VN");
}

function openLegalVideo(video: LegalVideo | typeof videos[number]) {
  if ("id" in video) {
    router.push({
      pathname: "/(app)/legal-video-detail",
      params: { id: video.id }
    });
  } else {
    router.push("/(app)/legal-video-detail");
  }
}

export default function CustomerLegalScreen() {
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [apiVideos, setApiVideos] = useState<LegalVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchVideos = useCallback(async () => {
    try {
      const response = await customerPublicApi.legalVideos({ per_page: 20 });
      setApiVideos(response.data.list ?? []);
    } catch (error) {
      appLogger.warn("customer.legalVideos", "Không thể tải video pháp lý.", { error });
      setApiVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVideos();
    setRefreshing(false);
  }, [fetchVideos]);

  const displayedVideos = apiVideos.filter((video) => {
    // Tạm ẩn bộ lọc category theo yêu cầu khách hàng
    /*
    if (selectedCategory !== "all" && video.category !== selectedCategory) {
      return false;
    }
    */
    if (searchKeyword.trim() !== "") {
      const query = searchKeyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const titleMatch = video.title?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query);
      const descMatch = (video.description || video.short_description || "")
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query);
      return titleMatch || descMatch;
    }
    return true;
  });

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(tabs)")} style={styles.brandRow}>
          <Text style={styles.logo}>KN</Text>
          <Text style={styles.brand}>KHỞI NGUYÊN LAND</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setAccountMenuVisible(true)}
          style={styles.accountButton}
        >
          <Ionicons name="person-circle-outline" size={20} color={palette.darkRed} />
        </Pressable>
      </View>
      <CustomerAccountMenu onClose={() => setAccountMenuVisible(false)} visible={accountMenuVisible} />

      <ScrollView
        bounces
        contentContainerStyle={styles.scroll}
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            colors={[palette.darkRed]}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>VIDEO LIBRARY</Text>
          <Text style={styles.title}>Kiến thức & Pháp lý</Text>
          <Text style={styles.subtitle}>
            Trang bị kiến thức pháp lý vững chắc trước khi giao dịch. Video tư vấn chuyên sâu từ đội ngũ luật sư của Khởi Nguyên Land.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            autoCapitalize="none"
            clearButtonMode="while-editing"
            onChangeText={setSearchKeyword}
            placeholder="Tìm kiếm video tư vấn..."
            placeholderTextColor={palette.muted}
            returnKeyType="search"
            style={styles.searchInput}
            value={searchKeyword}
          />
          <Ionicons name="search-outline" size={20} color={palette.brown} />
        </View>

        {/* Tạm ẩn bộ lọc chọn chủ đề theo yêu cầu khách hàng
        <ScrollView horizontal contentContainerStyle={styles.filterList} showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;

            return (
              <Pressable
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key)}
                style={[styles.filterButton, isActive ? styles.filterActive : styles.filterInactive]}
              >
                <Text style={[styles.filterText, isActive ? styles.filterTextActive : styles.filterTextInactive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        */}

        <View style={styles.videoList}>
          {loadingVideos ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Đang tải video...</Text>
            </View>
          ) : displayedVideos.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="videocam-outline" size={28} color={palette.goldDark} />
              <Text style={styles.emptyTitle}>Không tìm thấy video phù hợp</Text>
              <Text style={styles.emptyText}>Vui lòng thử lại với từ khóa hoặc danh mục khác.</Text>
            </View>
          ) : displayedVideos.map((video) => (
            <Pressable accessibilityRole="button" key={video.id} onPress={() => openLegalVideo(video)} style={({ pressed }) => [styles.videoCard, pressed && styles.pressed]}>
              <View style={styles.thumbnailWrap}>
                <Image source={mediaSource(video.thumbnail_url ?? video.thumbnail, legalImages.thumbnail)} style={styles.thumbnail} />
                <View style={styles.thumbnailOverlay} />
                <View style={styles.playButton}>
                  <Ionicons name="play" size={28} color={palette.darkRed} style={{ marginLeft: 3 }} />
                </View>
                {video.duration ? (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{video.duration}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.videoBody}>
                <View style={styles.metaRow}>
                  <Text style={styles.category}>{video.legal_topic?.name || video.category_label || "BẤT ĐỘNG SẢN"}</Text>
                  <Text style={styles.time}>{formatRelativeTime(video.updated_at || video.published_at || video.created_at)}</Text>
                </View>
                <Text numberOfLines={2} style={styles.videoTitle}>
                  {video.title}
                </Text>
                {video.description || video.short_description ? (
                  <Text numberOfLines={2} style={styles.videoDescription}>
                    {video.short_description || video.description}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
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

const styles = StyleSheet.create({
  safe: {
    backgroundColor: palette.background,
    flex: 1
  },
  topBar: {
    alignItems: "center",
    backgroundColor: palette.background,
    borderBottomColor: "rgba(227, 190, 184, 0.15)",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: 20
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  logo: {
    color: palette.darkRed,
    fontFamily: appFonts.bold,
    fontSize: 20,
    letterSpacing: 1,
    lineHeight: 24
  },
  brand: {
    color: palette.darkRed,
    fontFamily: appFonts.regular,
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 2,
    lineHeight: 15
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
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 32
  },
  hero: {
    gap: 4
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
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  subtitle: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6,
    opacity: 0.9
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: palette.white,
    borderColor: "rgba(227, 190, 184, 0.5)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 12
  },
  searchInput: {
    color: palette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 0
  },
  emptyBox: { alignItems: "center", backgroundColor: palette.white, borderColor: "rgba(225,227,228,0.8)", borderRadius: 12, borderWidth: 1, gap: 8, padding: 24 },
  emptyTitle: { color: palette.darkRed, fontFamily: appFonts.bold, fontSize: 16, lineHeight: 22, textAlign: "center" },
  emptyText: { color: palette.brown, fontFamily: appFonts.regular, fontSize: 14, lineHeight: 20, textAlign: "center" },
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
    fontFamily: appFonts.semiBold,
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
  },
  pressed: { opacity: 0.78 }
});
