import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appLogger } from "@/libs/logger";
import { mediaSource } from "@/libs/media";
import { notifyError } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, type PublicNews } from "@/services/customer/api";

const palette = {
  background: "#f8f9fa",
  brown: "#5b403c",
  darkRed: "#6a0100",
  goldDark: "#795900",
  line: "rgba(227, 190, 184, 0.3)",
  pale: "#f3f4f5",
  text: "#191c1d",
  white: "#ffffff"
};

const detailImages = {
  hero: require("@/assets/images/customer/news-detail/luxury-real-estate-hero.png"),
  interior: require("@/assets/images/customer/news-detail/luxury-interior-design.png"),
  pool: require("@/assets/images/customer/news-detail/luxury-pool-area.png"),
  cityscape: require("@/assets/images/customer/news-detail/cityscape.png"),
  consultation: require("@/assets/images/customer/news-detail/consultation.png"),
  villa: require("@/assets/images/customer/news-detail/villa-detail.png")
};

const relatedArticles = [
  {
    category: "QUY HOẠCH",
    excerpt: "Những thay đổi mới nhất về hạ tầng giao thông sẽ thúc đẩy giá trị bất động sản...",
    image: detailImages.cityscape,
    title: "Điều chỉnh quy hoạch hạ tầng phía Tây Thủ Đô"
  },
  {
    category: "TƯ VẤN",
    excerpt: "Làm sao để nhận diện một dự án thực sự tiềm năng giữa hàng nghìn lựa chọn...",
    image: detailImages.consultation,
    title: "Cẩm nang đầu tư căn hộ hạng sang cho người mới"
  },
  {
    category: "KIẾN TRÚC",
    excerpt: "Sử dụng vật liệu tự nhiên không chỉ là xu hướng mà còn là cam kết bảo vệ môi...",
    image: detailImages.villa,
    title: "Vật liệu bền vững: Tương lai của kiến trúc cao cấp"
  }
] as const;

const leadParagraph =
  "Thị trường bất động sản nghỉ dưỡng đang chứng kiến một cuộc chuyển mình mạnh mẽ trong năm 2024. Không còn đơn thuần là những căn biệt thự xa hoa, giới thượng lưu hiện nay đang tìm kiếm những giá trị bền vững và trải nghiệm cá nhân hóa sâu sắc trong không gian sống của họ.";
const wellnessParagraph =
  'Theo báo cáo mới nhất từ các tổ chức nghiên cứu thị trường hàng đầu, sự lên ngôi của phân khúc "Wellness Real Estate" (Bất động sản chăm sóc sức khỏe) đang dẫn đầu xu hướng. Các dự án tích hợp hệ thống lọc không khí tiêu chuẩn y tế, không gian thiền định riêng biệt và kiến trúc xanh đang thu hút sự quan tâm đặc biệt.';
const quote =
  '"Sự sang trọng ngày nay không đo lường bằng khối lượng vàng bạc, mà bằng sự tĩnh lặng và chất lượng không khí mà bạn hít thở mỗi ngày."';
const infrastructureParagraph =
  'Bên cạnh yếu tố thiết kế, hạ tầng giao thông vẫn là "đòn bẩy" quyết định giá trị của các dự án. Việc hoàn thiện các tuyến cao tốc huyết mạch và sân bay quốc tế mới đã rút ngắn khoảng cách giữa các trung tâm kinh tế và các vùng ven biển, tạo điều kiện thuận lợi cho xu hướng "Second Home" bùng nổ.';

function paramText(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function NewsDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    is_liked?: string;
    liked?: string;
    likes_count?: string;
    news_id?: string;
  }>();
  const newsId = paramText(params.news_id) ?? paramText(params.id);
  const initialLiked = paramText(params.is_liked) === "true" || paramText(params.liked) === "true";
  const initialLikesCount = Number(paramText(params.likes_count) ?? 0);
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(Number.isFinite(initialLikesCount) ? initialLikesCount : 0);
  const [liking, setLiking] = useState(false);
  const [detail, setDetail] = useState<PublicNews | null>(null);
  const [related, setRelated] = useState<PublicNews[]>([]);

  useEffect(() => {
    if (!newsId) return;
    let active = true;

    customerPublicApi
      .newsDetail(newsId)
      .then((response) => {
        if (!active) return;
        setDetail(response.data.detail ?? null);
        setRelated(response.data.related ?? []);
        if (typeof response.data.detail?.likes_count === "number") {
          setLikesCount(response.data.detail.likes_count);
        }
        const apiLiked = response.data.detail?.is_liked ?? response.data.detail?.liked;
        if (typeof apiLiked === "boolean") {
          setLiked(apiLiked);
        }
      })
      .catch((error) => {
        appLogger.warn("customer.newsDetail", "Không thể tải chi tiết bài viết.", { error, newsId });
      });

    return () => {
      active = false;
    };
  }, [newsId]);

  async function toggleLike() {
    if (!newsId) {
      notifyError("Không tìm thấy mã bài viết để thích.");
      return;
    }

    const previousLiked = liked;
    const previousLikesCount = likesCount;
    setLiked(!previousLiked);
    setLikesCount((value) => Math.max(0, value + (previousLiked ? -1 : 1)));
    setLiking(true);

    try {
      const response = await customerPublicApi.likeNews(newsId);
      const apiLiked = response.data.is_liked ?? response.data.liked;
      if (typeof apiLiked === "boolean") {
        setLiked(apiLiked);
      }
      if (typeof response.data.likes_count === "number") {
        setLikesCount(response.data.likes_count);
      }
    } catch (error) {
      setLiked(previousLiked);
      setLikesCount(previousLikesCount);
      notifyError(error, "Không thể cập nhật lượt thích bài viết.");
    } finally {
      setLiking(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <Text style={styles.brandText}>LUXE REALTY</Text>
        <Pressable accessibilityRole="button" style={styles.accountButton}>
          <Ionicons name="person-circle-outline" size={18} color="#5b403c" />
        </Pressable>
      </View>

      <ScrollView bounces contentContainerStyle={styles.scroll} overScrollMode="always" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={mediaSource(detail?.thumbnail, detailImages.hero)} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroCopy}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{detail?.category || "THỊ TRƯỜNG"}</Text>
            </View>
            <Text style={styles.heroTitle}>{detail?.title || "Xu Hướng Bất\nĐộng Sản Nghỉ\nDưỡng Cao Cấp\nNăm 2024"}</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-clear-outline" size={14} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.heroDate}>{formatNewsDate(detail?.published_at) || "24 Tháng 5, 2024"}</Text>
              <View style={styles.heroDot} />
            </View>
          </View>
        </View>

        <View style={styles.articleContent}>
          <Text style={styles.leadText}>{detail?.summary || leadParagraph}</Text>
          <Text style={styles.bodyText}>{stripText(detail?.content) || wellnessParagraph}</Text>

          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>{quote}</Text>
            <Text style={styles.quoteAuthor}>- Giám đốc Thiết kế Luxe Realty</Text>
          </View>

          <Text style={styles.heading}>Kết nối hạ tầng và giá trị gia tăng</Text>
          <Text style={styles.bodyText}>{infrastructureParagraph}</Text>

          <View style={styles.imageStack}>
            <Image source={detailImages.interior} style={styles.contentImage} />
            <Image source={detailImages.pool} style={styles.contentImage} />
          </View>

          <Text style={styles.bodyText}>
            Luxe Realty tự hào là đơn vị tiên phong trong việc cung cấp các giải pháp quản lý và phân phối các sản phẩm bất động sản cao cấp, đảm bảo mỗi giao dịch không chỉ là một sự đầu tư tài chính mà còn là sự nâng tầm phong cách sống cho khách hàng.
          </Text>

          <View style={styles.actions}>
            <View style={styles.buttonRow}>
              <Pressable accessibilityRole="button" style={styles.shareButton}>
                <Ionicons name="share-social" size={15} color={palette.white} />
                <Text style={styles.shareButtonText}>Chia sẻ</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={liking}
                onPress={toggleLike}
                style={({ pressed }) => [
                  styles.favoriteButton,
                  liked && styles.favoriteButtonActive,
                  (pressed || liking) && styles.pressed
                ]}
              >
                <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? palette.white : "#8f706b"} />
                {likesCount > 0 ? (
                  <Text style={[styles.favoriteCount, liked && styles.favoriteCountActive]}>{likesCount}</Text>
                ) : null}
              </Pressable>
            </View>
            <View style={styles.tagRow}>
              <Text style={styles.tagLabel}>TAGS:</Text>
              <Text style={styles.tag}>XU HƯỚNG</Text>
              <Text style={styles.tag}>ĐẦU TƯ</Text>
            </View>
          </View>
        </View>

        <View style={styles.relatedSection}>
          <Text style={styles.relatedEyebrow}>KHÁM PHÁ THÊM</Text>
          <Text style={styles.relatedTitle}>Bài viết liên quan</Text>
          <View style={styles.relatedList}>
            {(related.length > 0 ? related : relatedArticles).map((article, index) => {
              const isApiNews = "id" in article;
              return (
              <Pressable accessibilityRole="button" key={isApiNews ? article.id : article.title} style={styles.relatedCard}>
                <Image
                  source={isApiNews ? mediaSource(article.thumbnail, relatedArticles[index % relatedArticles.length].image) : article.image}
                  style={styles.relatedImage}
                />
                <View style={styles.relatedCopy}>
                  <Text style={styles.relatedCategory}>{isApiNews ? article.category || "TIN TỨC" : article.category}</Text>
                  <Text style={styles.relatedCardTitle}>{isApiNews ? article.title || "Tin tức đang cập nhật" : article.title}</Text>
                  <Text numberOfLines={2} style={styles.relatedExcerpt}>{isApiNews ? article.summary || "" : article.excerpt}</Text>
                </View>
              </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function stripText(value?: string | null) {
  return value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatNewsDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: palette.background,
    flex: 1
  },
  topBar: {
    alignItems: "center",
    backgroundColor: palette.background,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    zIndex: 2
  },
  brandText: {
    color: palette.darkRed,
    fontFamily: appFonts.bold,
    fontSize: 24,
    letterSpacing: -0.48,
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
    backgroundColor: palette.background,
    paddingBottom: 0
  },
  hero: {
    height: 442,
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative"
  },
  heroImage: {
    height: "100%",
    left: "-6.7%",
    position: "absolute",
    resizeMode: "cover",
    top: 0,
    width: "113.4%"
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.42)"
  },
  heroCopy: {
    gap: 16,
    paddingBottom: 48,
    paddingHorizontal: 20
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: palette.darkRed,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  categoryPillText: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  heroTitle: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 39,
    letterSpacing: -1.6,
    lineHeight: 50
  },
  dateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  heroDate: {
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  heroDot: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 999,
    height: 4,
    marginLeft: 12,
    width: 4
  },
  articleContent: {
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 48
  },
  leadText: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 29.25
  },
  bodyText: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 26
  },
  quoteBox: {
    backgroundColor: palette.pale,
    borderBottomRightRadius: 12,
    borderLeftColor: palette.goldDark,
    borderLeftWidth: 4,
    borderTopRightRadius: 12,
    gap: 8,
    paddingBottom: 48,
    paddingLeft: 52,
    paddingRight: 32,
    paddingTop: 48
  },
  quoteText: {
    color: palette.darkRed,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    fontStyle: "italic",
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  quoteAuthor: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontStyle: "italic",
    letterSpacing: 1.2,
    lineHeight: 16
  },
  heading: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 25,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  imageStack: {
    gap: 16
  },
  contentImage: {
    borderRadius: 12,
    height: 256,
    resizeMode: "cover",
    width: "100%"
  },
  actions: {
    borderTopColor: palette.line,
    borderTopWidth: 1,
    gap: 16,
    paddingTop: 25
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12
  },
  shareButton: {
    alignItems: "center",
    backgroundColor: palette.darkRed,
    borderRadius: 12,
    flexDirection: "row",
    gap: 4,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 22
  },
  shareButtonText: {
    color: palette.white,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  favoriteButton: {
    alignItems: "center",
    borderColor: "#8f706b",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    height: 48,
    justifyContent: "center",
    minWidth: 48,
    paddingHorizontal: 13
  },
  favoriteButtonActive: {
    backgroundColor: palette.darkRed,
    borderColor: palette.darkRed
  },
  favoriteCount: {
    color: "#8f706b",
    fontFamily: appFonts.bold,
    fontSize: 13,
    lineHeight: 16
  },
  favoriteCountActive: {
    color: palette.white
  },
  pressed: {
    opacity: 0.82
  },
  tagRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16
  },
  tagLabel: {
    color: palette.brown,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  tag: {
    color: palette.darkRed,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  relatedSection: {
    backgroundColor: palette.pale,
    marginTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 20,
    paddingTop: 48
  },
  relatedEyebrow: {
    color: palette.goldDark,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  relatedTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 32,
    letterSpacing: -0.96,
    lineHeight: 38.4,
    marginTop: 4
  },
  relatedList: {
    gap: 24,
    marginTop: 24
  },
  relatedCard: {
    backgroundColor: palette.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  relatedImage: {
    height: 192,
    resizeMode: "cover",
    width: "100%"
  },
  relatedCopy: {
    gap: 4,
    paddingBottom: 32,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  relatedCategory: {
    color: palette.darkRed,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  relatedCardTitle: {
    color: palette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  relatedExcerpt: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  }
});
