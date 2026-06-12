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
  TextInput,
  View
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomerAccountMenu } from "@/components/CustomerAccountMenu";
import { appLogger } from "@/libs/logger";
import { mediaSource } from "@/libs/media";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, publicNewsDetailParams, type PublicNews } from "@/services/customer/api";

const palette = {
  background: "#f8f9fa",
  brown: "#5b403c",
  darkRed: "#6a0100",
  goldDark: "#795900",
  muted: "#6b7280",
  pale: "#f3f4f5",
  text: "#191c1d",
  white: "#ffffff"
};

const marketImages = {
  logo: require("@/assets/images/customer/news/logo-header.png"),
  hot: require("@/assets/images/customer/market-news/hot-luxury.png"),
  planning: require("@/assets/images/customer/market-news/coastal-planning.png"),
  interest: require("@/assets/images/customer/market-news/interest-tower.png")
};

type NewsCategory = { id: string; name: string };

const DEFAULT_CATEGORIES: NewsCategory[] = [
  { id: "all", name: "Tất cả" },
  { id: "market", name: "Tin thị trường" },
  { id: "project", name: "Dự án" },
  { id: "investment", name: "Đầu tư" },
  { id: "legal", name: "Pháp lý" },
  { id: "other", name: "Khác" },
];

const sideArticles = [
  {
    badge: "MỚI",
    date: "18 Tháng 5, 2024",
    image: marketImages.planning,
    title: "Quy hoạch trục đô thị ven biển miền Trung có gì mới?"
  },
  {
    badge: undefined,
    date: "12 Tháng 5, 2024",
    image: marketImages.interest,
    title: "Dự báo lãi suất vay mua nhà trong quý 3 năm nay"
  }
] as const;

type ApiRecord = Record<string, unknown>;

function isApiRecord(value: unknown): value is ApiRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export default function MarketNewsScreen() {
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [featuredNewsParams, setFeaturedNewsParams] = useState<Record<string, string>>({});
  const [allNewsItems, setAllNewsItems] = useState<PublicNews[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>(DEFAULT_CATEGORIES);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(3);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    // Tải toàn bộ tin tức 1 lần, lọc local như màn Quy hoạch
    customerPublicApi
      .news({ page: 1, per_page: 50 })
      .then((response) => {
        if (!active || !isApiRecord(response.data)) return;

        const featured = Array.isArray(response.data.featured)
          ? (response.data.featured.filter(isApiRecord) as PublicNews[])
          : [];
        const list = Array.isArray(response.data.list) ? (response.data.list.filter(isApiRecord) as PublicNews[]) : [];

        // Deduplicate: ưu tiên featured, bổ sung từ list nếu id chưa xuất hiện
        const featuredIds = new Set(featured.map((n) => n.id));
        const extra = list.filter((n) => !featuredIds.has(n.id));
        const merged = [...featured, ...extra];

        setAllNewsItems(merged);
        setIsLoaded(true);

        if (merged[0]?.id) {
          setFeaturedNewsParams(publicNewsDetailParams(merged[0]));
        }

        // Cập nhật categories từ API
        if (Array.isArray(response.data.categories)) {
          const apiCats = (response.data.categories as unknown[]).filter(
            (c): c is NewsCategory => isApiRecord(c as unknown) && typeof (c as Record<string, unknown>).id === "string"
          );
          if (apiCats.length > 0) setCategories(apiCats);
        }
      })
      .catch((error) => {
        appLogger.warn("customer.news", "Không thể tải tin tức.", { error });
        setIsLoaded(true);
      });

    return () => { active = false; };
  }, []);

  // Lọc local tức thì (không cần API call, không cần debounce)
  const normalizedSearch = normalizeNewsText(searchQuery);
  const filteredItems = allNewsItems.filter((article) => {
    const categoryMatch = activeFilter === "all" || article.category === activeFilter;
    const searchMatch = !normalizedSearch
      || normalizeNewsText(`${article.title ?? ""} ${article.summary ?? ""}`).includes(normalizedSearch);
    return categoryMatch && searchMatch;
  });

  // Reset visibleCount khi filter/search thay đổi
  useEffect(() => {
    setVisibleCount(3);
  }, [activeFilter, searchQuery]);

  function handleLoadMore() {
    setVisibleCount((prev) => prev + 3);
  }

  const hasMoreToShow = visibleCount < filteredItems.length;
  const featuredArticle = filteredItems[0];
  const displaySideArticles = isLoaded ? filteredItems.slice(1, visibleCount) : sideArticles;

  function openFeaturedNews() {
    if (featuredNewsParams.id) {
      router.push({
        pathname: "/(app)/news-detail",
        params: featuredNewsParams
      });
      return;
    }

    router.push("/(app)/news-detail");
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(tabs)")} style={styles.brandRow}>
          <Image source={marketImages.logo} style={styles.logoImage} />
          <Text style={styles.brandText}>KHỞI NGUYÊN LAND</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setAccountMenuVisible(true)}
          style={styles.accountButton}
        >
          <Ionicons name="person-circle-outline" size={19} color={palette.brown} />
        </Pressable>
      </View>
      <CustomerAccountMenu onClose={() => setAccountMenuVisible(false)} visible={accountMenuVisible} />

      <ScrollView
        bounces
        contentContainerStyle={styles.scroll}
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Tin Tức Thị Trường</Text>

          <View style={styles.searchBox}>
            <TextInput
              autoCapitalize="none"
              onChangeText={setSearchQuery}
              placeholder="Tìm kiếm tin tức..."
              placeholderTextColor={palette.muted}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchQuery}
            />
            <Ionicons name="search-outline" size={20} color={palette.brown} />
          </View>

          <ScrollView
            horizontal
            contentContainerStyle={styles.filterList}
            showsHorizontalScrollIndicator={false}
          >
            {categories.map((cat) => {
              const isActive = cat.id === activeFilter;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={cat.id}
                  onPress={() => setActiveFilter(cat.id)}
                  style={[styles.filterButton, isActive ? styles.filterButtonActive : styles.filterButtonInactive]}
                >
                  <Text style={[styles.filterText, isActive ? styles.filterTextActive : styles.filterTextInactive]}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {isLoaded && filteredItems.length === 0 ? (
          <Text style={styles.emptyText}>Không tìm thấy bài viết phù hợp.</Text>
        ) : (
          <View style={styles.newsGrid}>
            {(featuredArticle || !isLoaded) ? (
              <View style={styles.featuredArticle}>
                <Pressable
                  accessibilityLabel="Mở chi tiết tin tức bất động sản hạng sang"
                  accessibilityRole="button"
                  onPress={openFeaturedNews}
                  style={styles.featuredImageWrap}
                >
                  <Image source={mediaSource(featuredArticle?.thumbnail, marketImages.hot)} style={styles.articleImage} />
                  <View style={styles.hotBadge}>
                    <Text style={styles.badgeText}>HOT</Text>
                  </View>
                </Pressable>

                <Pressable
                  accessibilityLabel="Mở chi tiết tin tức bất động sản hạng sang"
                  accessibilityRole="button"
                  onPress={openFeaturedNews}
                  style={styles.featuredCopy}
                >
                  <View style={styles.metaRow}>
                    <Text style={styles.categoryText}>{newsCategoryLabel(featuredArticle?.category).toUpperCase()}</Text>
                    <View style={styles.metaDot} />
                    <Text style={styles.featuredDate}>{formatNewsDate(featuredArticle?.published_at) || "24 Tháng 5, 2024"}</Text>
                  </View>
                  <Text style={styles.featuredTitle}>{featuredArticle?.title || "Bất động sản hạng sang: Xu hướng đầu tư bền vững năm 2024"}</Text>
                  <Text ellipsizeMode="tail" numberOfLines={2} style={styles.featuredExcerpt}>{featuredArticle?.summary || "Phân khúc bất động sản cao cấp đang chứng kiến sự chuyển dịch mạnh mẽ..."}</Text>
                </Pressable>
              </View>
            ) : null}

            {displaySideArticles.length > 0 ? (
              <View style={styles.sideFeed}>
                {displaySideArticles.map((article, index) => {
                  const isApiNews = "id" in article;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={isApiNews ? article.id : article.title}
                      onPress={() =>
                        isApiNews
                          ? router.push({ pathname: "/(app)/news-detail", params: publicNewsDetailParams(article) })
                          : undefined
                      }
                      style={styles.article}
                    >
                      <View style={styles.articleImageWrap}>
                        <Image
                          source={isApiNews ? mediaSource(article.thumbnail, sideArticles[index % sideArticles.length].image) : article.image}
                          style={styles.articleImage}
                        />
                        {(!isApiNews && article.badge) ? (
                          <View style={styles.newBadge}>
                            <Text style={styles.badgeText}>{article.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.articleDate}>{isApiNews ? formatNewsDate(article.published_at) || "Đang cập nhật" : article.date}</Text>
                      <Text style={styles.articleTitle}>{isApiNews ? article.title || "Tin tức đang cập nhật" : article.title}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        )}

        {hasMoreToShow ? (
          <View style={styles.loadMoreWrap}>
            <Pressable
              accessibilityRole="button"
              onPress={handleLoadMore}
              style={({ pressed }) => [styles.loadMoreButton, pressed && styles.loadMoreButtonPressed]}
            >
              <Text style={styles.loadMoreText}>Xem thêm tin tức</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizeNewsText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatNewsDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
}

function newsCategoryLabel(value?: string | null) {
  switch (value) {
    case "market":
      return "Tin tức thị trường";
    case "project":
      return "Dự án";
    case "investment":
      return "Đầu tư";
    case "legal":
      return "Pháp lý";
    case "other":
      return "Khác";
    default:
      return value?.trim() || "Tin tức thị trường";
  }
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
  logoImage: {
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
    paddingBottom: 72,
    paddingTop: 24
  },
  headerSection: {
    gap: 16,
    paddingHorizontal: 20
  },
  pageTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -1.6,
    lineHeight: 44
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: palette.pale,
    borderBottomColor: "#e3beb8",
    borderBottomWidth: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16
  },
  searchInput: {
    color: palette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 0
  },
  filterList: {
    gap: 12,
    paddingRight: 20
  },
  filterButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 24
  },
  filterButtonActive: {
    backgroundColor: palette.darkRed
  },
  filterButtonInactive: {
    backgroundColor: "#e7e8e9"
  },
  filterText: {
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  filterTextActive: {
    color: palette.white
  },
  filterTextInactive: {
    color: palette.brown
  },
  newsGrid: {
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 48
  },
  featuredArticle: {
    gap: 16
  },
  featuredImageWrap: {
    backgroundColor: palette.pale,
    borderRadius: 12,
    height: 197,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  articleImageWrap: {
    backgroundColor: palette.pale,
    borderRadius: 12,
    height: 197,
    overflow: "hidden",
    position: "relative"
  },
  articleImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  hotBadge: {
    backgroundColor: palette.darkRed,
    borderRadius: 999,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    position: "absolute",
    top: 16
  },
  newBadge: {
    backgroundColor: palette.goldDark,
    borderRadius: 999,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: "absolute",
    top: 6
  },
  badgeText: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  featuredCopy: {
    gap: 7
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  categoryText: {
    color: palette.goldDark,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  metaDot: {
    backgroundColor: "#e3beb8",
    borderRadius: 999,
    height: 4,
    width: 4
  },
  featuredDate: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  featuredTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 25,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  featuredExcerpt: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 30.6
  },
  sideFeed: {
    gap: 24
  },
  article: {
    gap: 4
  },
  articleDate: {
    color: palette.brown,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    paddingTop: 5
  },
  articleTitle: {
    color: palette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    letterSpacing: -0.36,
    lineHeight: 22.5
  },
  loadMoreWrap: {
    alignItems: "center",
    paddingTop: 48
  },
  loadMoreButton: {
    alignItems: "center",
    borderColor: palette.darkRed,
    borderRadius: 12,
    borderWidth: 2,
    height: 64,
    justifyContent: "center",
    paddingHorizontal: 50
  },
  loadMoreButtonPressed: {
    opacity: 0.6
  },
  loadMoreText: {
    color: palette.darkRed,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  emptyText: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 48
  }
});
