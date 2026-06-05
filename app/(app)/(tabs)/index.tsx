import {
  Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { router,
  type Href } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect,
  useRef,
  useState } from "react";
import { Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { mediaSource } from "@/libs/media";
import { appLogger } from "@/libs/logger";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, publicNewsDetailParams, type PublicNews, type PublicProject } from "@/services/customer/api";

const palette = {
  background: "#f8f9fa",
  red: "#950100",
  text: "#111827",
  muted: "#6b7280",
  lightMuted: "#9ca3af",
  blush: "#fbeaea",
  gold: "#c5a059",
  white: "#ffffff"
};

const heroHeight = 192;
const heroHorizontalMargin = 16;
const heroAutoplayMs = 4000;

const homeImages = {
  headerBackground: require("@/assets/images/customer/home/main-header-bg.png"),
  hero: require("@/assets/images/customer/home/hero-slider.png"),
  riverside: require("@/assets/images/customer/home/kn-riverside.png"),
  centralPoint: require("@/assets/images/customer/home/kn-central-point.png"),
  marketNews: require("@/assets/images/customer/home/news-market.png"),
  luxuryNews: require("@/assets/images/customer/home/news-luxury.png"),
  interestNews: require("@/assets/images/customer/home/news-interest.png")
};

const quickActions: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  destination: Href;
}[] = [
  { icon: "map-outline", label: "Check\nQuy hoạch", destination: "/(app)/(tabs)/inquiries" },
  { icon: "document-text-outline", label: "Hỗ trợ\npháp lý", destination: "/(app)/legal-knowledge" },
  { icon: "images-outline", label: "Điểm đến", destination: "/(app)/(tabs)/saved" },
  { icon: "cash-outline", label: "Cơ hội\nđầu tư", destination: "/(app)/(tabs)/saved" }
];

const projects = [
  { image: homeImages.riverside, name: "KN Riverside", location: "Hòa Lạc, Hà Nội", price: "28 - 45 Tỷ" },
  { image: homeImages.centralPoint, name: "KN Central Point", location: "Phạm Hùng, Hà Nội", price: "35 - 60 Tỷ" },
  { image: homeImages.riverside, name: "KN Garden City", location: "Thạch Thất, Hà Nội", price: "12 - 25 Tỷ" }
] as const;

const newsItems = [
  {
    image: homeImages.marketNews,
    title: "Xu hướng bất động sản 2024:\nDòng tiền dịch chuyển về đâu?"
  },
  {
    image: homeImages.luxuryNews,
    title: "Cập nhật xu hướng bất động sản\ncao cấp động sản cao cấp"
  },
  {
    image: homeImages.interestNews,
    title: "Dự báo lãi suất vay mua nhà\ntrong quý 3 năm nay"
  }
] as const;

const heroSlides = [
  {
    brand: "KHỞI NGUYÊN LAND",
    cta: "KHÁM PHÁ NGAY",
    image: homeImages.hero,
    title: "KIẾN TẠO GIÁ TRỊ\nKHỞI NGUỒN TƯƠNG LAI"
  },
  {
    brand: "KHỞI NGUYÊN LAND",
    cta: "KHÁM PHÁ NGAY",
    image: homeImages.hero,
    title: "DỰ ÁN ĐẲNG CẤP\nKẾT NỐI TƯƠNG LAI"
  },
  {
    brand: "KHỞI NGUYÊN LAND",
    cta: "KHÁM PHÁ NGAY",
    image: homeImages.hero,
    title: "KHÔNG GIAN SỐNG\nDÀNH CHO NHÀ ĐẦU TƯ"
  },
  {
    brand: "KHỞI NGUYÊN LAND",
    cta: "KHÁM PHÁ NGAY",
    image: homeImages.hero,
    title: "KIẾN TẠO GIÁ TRỊ\nKHỞI NGUỒN TƯƠNG LAI"
  }
] as const;

export default function CustomerHomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const heroSlideWidth = width - heroHorizontalMargin * 2;
  const heroScrollRef = useRef<ScrollView>(null);
  const activeHeroIndexRef = useRef(0);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [featuredProjects, setFeaturedProjects] = useState<PublicProject[]>([]);
  const [latestNews, setLatestNews] = useState<PublicNews[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeHeroIndexRef.current + 1) % heroSlides.length;
      activeHeroIndexRef.current = nextIndex;
      setActiveHeroIndex(nextIndex);
      heroScrollRef.current?.scrollTo({ animated: true, x: nextIndex * heroSlideWidth, y: 0 });
    }, heroAutoplayMs);

    return () => clearInterval(timer);
  }, [heroSlideWidth]);

  useEffect(() => {
    let active = true;

    Promise.all([
      customerPublicApi.projects({ per_page: 6 }),
      customerPublicApi.news({ page: 1, per_page: 3 })
    ])
      .then(([projectResponse, newsResponse]) => {
        if (!active) return;
        setFeaturedProjects(projectResponse.data.data ?? []);
        setLatestNews([...(newsResponse.data.featured ?? []), ...(newsResponse.data.list ?? [])].slice(0, 3));
      })
      .catch((error) => {
        appLogger.warn("customer.home", "Không thể tải dữ liệu trang chủ khách hàng.", { error });
      });

    return () => {
      active = false;
    };
  }, []);

  function handleHeroMomentumEnd(offsetX: number) {
    const nextIndex = Math.round(offsetX / heroSlideWidth);
    activeHeroIndexRef.current = nextIndex;
    setActiveHeroIndex(nextIndex);
  }

  return (
    <View style={styles.safe}>
      <StatusBar backgroundColor={palette.red} style="light" />
      <ScrollView
        bounces
        contentContainerStyle={styles.scroll}
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={[styles.headerLayer, { height: 368 + insets.top }]}>
          <View style={[styles.header, { height: 242 + insets.top, paddingTop: 11 + insets.top }]}>
            <Image source={homeImages.headerBackground} style={styles.headerBackground} />
            <View style={styles.headerTop}>
              <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(tabs)")} style={styles.logoBlock}>
                <Text style={styles.logo}>KN</Text>
                <Text style={styles.brand}>KHỞI NGUYÊN LAND</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Thông báo"
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/(app)/notifications",
                    params: { audience: "customer", returnTo: "/(app)/(tabs)" }
                  })
                }
                style={styles.notificationButton}
              >
                <Ionicons name="notifications-outline" size={24} color={palette.white} />
              </Pressable>
            </View>
            <Pressable
              accessibilityLabel="Tìm kiếm dự án, khu vực, tin tức"
              accessibilityRole="button"
              onPress={() => router.push("/(app)/(tabs)/search")}
              style={styles.search}
            >
              <Ionicons name="search-outline" size={20} color={palette.lightMuted} />
              <Text style={styles.searchPlaceholder}>Tìm kiếm dự án, khu vực, tin tức...</Text>
            </Pressable>
          </View>

          <View style={[styles.hero, { top: 144 + insets.top }]}> 
            <ScrollView
              ref={heroScrollRef}
              bounces={false}
              decelerationRate="fast"
              directionalLockEnabled
              horizontal
              nestedScrollEnabled
              onMomentumScrollEnd={(event) => handleHeroMomentumEnd(event.nativeEvent.contentOffset.x)}
              overScrollMode="never"
              pagingEnabled
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
            >
              {heroSlides.map((slide, index) => (
                <View key={`${slide.title}-${index}`} style={[styles.heroSlide, { width: heroSlideWidth }]}> 
                  <Image source={slide.image} style={[styles.heroImage, { width: heroSlideWidth }]} />
                  <View style={styles.heroOverlay} />
                  <View style={styles.heroCopy}>
                    <View style={styles.heroBrandRow}>
                      <Text allowFontScaling={false} style={styles.heroBrand}>KN</Text>
                      <Text allowFontScaling={false} style={styles.heroBrand}>{slide.brand}</Text>
                    </View>
                    <Text allowFontScaling={false} style={styles.heroTitle}>{slide.title}</Text>
                    <Pressable accessibilityRole="button" style={styles.heroButton}>
                      <Text allowFontScaling={false} numberOfLines={1} style={styles.heroButtonText}>{slide.cta}</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.pagination}>
              {heroSlides.map((slide, index) => (
                <View
                  key={`${slide.cta}-${index}`}
                  style={index === activeHeroIndex ? styles.paginationActive : styles.paginationDot}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.main}>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                onPress={() => router.push(action.destination)}
                style={styles.quickAction}
              >
                <View style={styles.quickIcon}>
                  <Ionicons name={action.icon} size={24} color={palette.red} />
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <HomeSectionHeader title="DỰ ÁN NỔI BẬT" link="Xem tất cả" onPress={() => router.push("/(app)/(tabs)/saved")} />
          <ScrollView
            alwaysBounceVertical={false}
            alwaysBounceHorizontal
            bounces
            horizontal
            contentContainerStyle={styles.projectSliderContent}
            directionalLockEnabled
            overScrollMode="always"
            showsHorizontalScrollIndicator={false}
            style={styles.projectSlider}
          >
            {(featuredProjects.length > 0 ? featuredProjects : projects).map((project, index) => {
              const isApiProject = "id" in project;
              return (
              <Pressable
                key={isApiProject ? project.id : project.name}
                accessibilityRole="button"
                onPress={() =>
                  isApiProject
                    ? router.push({ pathname: "/(app)/project-detail", params: { id: project.id } })
                    : undefined
                }
                style={styles.projectCard}
              >
                <Image
                  source={
                    isApiProject
                      ? mediaSource(project.image ?? project.banner, projects[index % projects.length].image)
                      : project.image
                  }
                  style={styles.projectImage}
                />
                <Text style={styles.projectTitle}>{isApiProject ? project.name || "Dự án đang cập nhật" : project.name}</Text>
                <Text style={styles.projectLocation}>{isApiProject ? project.location || "Đang cập nhật" : project.location}</Text>
                <Text style={styles.projectPrice}>{isApiProject ? formatProjectPrice(project.price) : project.price}</Text>
              </Pressable>
              );
            })}
          </ScrollView>

          <HomeSectionHeader title="TIN TỨC THỊ TRƯỜNG" link="Xem thêm" onPress={() => router.push("/(app)/(tabs)/search")} />
          <View style={styles.newsList}>
            {(latestNews.length > 0 ? latestNews : newsItems).map((item, index) => {
              const isApiNews = "id" in item;
              return (
              <Pressable
                key={isApiNews ? item.id : item.title}
                accessibilityRole="button"
                onPress={() =>
                  isApiNews
                    ? router.push({ pathname: "/(app)/news-detail", params: publicNewsDetailParams(item) })
                    : undefined
                }
                style={styles.newsCard}
              >
                <Image
                  source={isApiNews ? mediaSource(item.thumbnail, newsItems[index % newsItems.length].image) : item.image}
                  style={styles.newsImage}
                />
                <View style={styles.newsCopy}>
                  <Text style={styles.newsTitle}>{isApiNews ? item.title || "Tin tức đang cập nhật" : item.title}</Text>
                  <Text style={styles.newsDate}>{isApiNews ? formatDate(item.published_at) : "24 Tháng 5, 2024"}</Text>
                </View>
              </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function formatProjectPrice(price?: string | number | null) {
  const value = Number(price ?? 0);
  if (!Number.isFinite(value) || value <= 0) return "Liên hệ";
  return value >= 1_000_000_000 ? `${Math.round(value / 1_000_000_000)} Tỷ` : `${Math.round(value / 1_000_000)} Triệu`;
}

function formatDate(value?: string | null) {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
}

function HomeSectionHeader({
  link,
  onPress,
  title
}: {
  link: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.sectionLink}>
        <Text style={styles.sectionLinkText}>{link}</Text>
        <Ionicons name="chevron-forward" size={16} color={palette.red} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: palette.background,
    flex: 1
  },
  scrollView: {
    backgroundColor: palette.background,
    flex: 1
  },
  scroll: {
    backgroundColor: palette.background,
    paddingBottom: 8
  },
  headerLayer: {
    backgroundColor: palette.background,
    height: 368
  },
  header: {
    backgroundColor: palette.red,
    height: 242,
    overflow: "hidden",
    paddingTop: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    height: 35,
    justifyContent: "space-between",
    marginHorizontal: 16
  },
  logoBlock: {
    height: 35,
    justifyContent: "center"
  },
  logo: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 20,
    letterSpacing: 1,
    lineHeight: 24
  },
  brand: {
    color: palette.white,
    fontFamily: appFonts.regular,
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 2,
    lineHeight: 15
  },
  notificationButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  search: {
    alignItems: "center",
    backgroundColor: palette.white,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    height: 36,
    marginLeft: 12,
    marginRight: 20,
    marginTop: 12,
    paddingLeft: 12,
    paddingRight: 12
  },
  searchPlaceholder: {
    color: palette.lightMuted,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 18
  },
  hero: {
    borderRadius: 16,
    height: heroHeight,
    left: heroHorizontalMargin,
    overflow: "hidden",
    position: "absolute",
    right: heroHorizontalMargin,
    top: 144
  },
  heroSlide: {
    height: heroHeight,
    justifyContent: "flex-end",
    overflow: "hidden",
    padding: 20,
    position: "relative"
  },
  heroImage: {
    height: 264.86,
    left: 0,
    position: "absolute",
    resizeMode: "cover",
    top: -36.44
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)"
  },
  heroCopy: {
    flex: 1,
    justifyContent: "flex-end"
  },
  heroBrandRow: {
    flexDirection: "row",
    gap: 8
  },
  heroBrand: {
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: appFonts.semiBold,
    fontSize: 10,
    lineHeight: 15
  },
  heroTitle: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 22.5,
    marginBottom: 9
  },
  heroButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: palette.gold,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 17,
    paddingVertical: 7
  },
  heroButtonText: {
    color: palette.white,
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    lineHeight: 16
  },
  pagination: {
    alignItems: "center",
    bottom: 12,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0
  },
  paginationActive: {
    backgroundColor: palette.white,
    borderRadius: 999,
    height: 6,
    width: 6
  },
  paginationDot: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 999,
    height: 6,
    width: 6
  },
  main: {
    backgroundColor: palette.background,
    gap: 32,
    paddingBottom: 0
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  quickAction: {
    alignItems: "center",
    minHeight: 92,
    width: 83.5
  },
  quickIcon: {
    alignItems: "center",
    backgroundColor: palette.blush,
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    marginBottom: 7,
    width: 56
  },
  quickLabel: {
    color: "#374151",
    fontFamily: appFonts.regular,
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center"
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  sectionTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 24
  },
  sectionLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  sectionLinkText: {
    color: palette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    lineHeight: 16
  },
  projectSlider: {
    height: 247,
    marginTop: -16
  },
  projectSliderContent: {
    gap: 16,
    paddingHorizontal: 16,
    paddingRight: 32
  },
  projectCard: {
    height: 247,
    width: 176
  },
  projectImage: {
    borderRadius: 12,
    height: 177,
    resizeMode: "cover",
    width: "100%"
  },
  projectTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  projectLocation: {
    color: palette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  projectPrice: {
    color: palette.red,
    fontFamily: appFonts.bold,
    fontSize: 14,
    lineHeight: 20
  },
  newsList: {
    gap: 16,
    marginTop: -16,
    paddingHorizontal: 16
  },
  newsCard: {
    alignItems: "center",
    backgroundColor: palette.white,
    borderRadius: 12,
    flexDirection: "row",
    gap: 16,
    minHeight: 120,
    padding: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  newsImage: {
    borderRadius: 8,
    height: 96,
    resizeMode: "cover",
    width: 96
  },
  newsCopy: {
    flex: 1,
    justifyContent: "center"
  },
  newsTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 14,
    lineHeight: 18
  },
  newsDate: {
    color: palette.lightMuted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8
  }
});
