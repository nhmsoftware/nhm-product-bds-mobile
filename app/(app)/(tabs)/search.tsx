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
import { FallbackImage } from "@/components/FallbackImage";
import { appLogger } from "@/libs/logger";
import { mediaSource } from "@/libs/media";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, publicNewsDetailParams, type PublicNews, type PublicProject } from "@/services/customer/api";

const palette = {
  background: "#f8f9fa",
  brown: "#5b403c",
  darkRed: "#6a0100",
  gold: "#ffdf9f",
  goldDark: "#795900",
  red: "#950100",
  text: "#191c1d",
  white: "#ffffff"
};

const newsImages = {
  hero: require("@/assets/images/customer/news/hero-banner.png"),
  logo: require("@/assets/images/customer/news/logo-header.png"),
  news: require("@/assets/images/customer/news/news-section.png"),
  planning: require("@/assets/images/customer/news/planning-map.png"),
  heritage: require("@/assets/images/customer/news/project-heritage.png"),
  coastal: require("@/assets/images/customer/news/project-coastal.png"),
  skyline: require("@/assets/images/customer/news/project-skyline.png")
};

const projects = [
  {
    badge: "MỞ BÁN",
    badgeTone: "gold",
    image: newsImages.heritage,
    location: "Quận 1, TP. Hồ Chí Minh",
    title: "The Grand Heritage"
  },
  {
    badge: "SẮP RA MẮT",
    badgeTone: "neutral",
    image: newsImages.coastal,
    location: "Phú Quốc, Kiên Giang",
    title: "Coastal Azure Villas"
  },
  {
    badge: "CÒN 5 CĂN",
    badgeTone: "red",
    image: newsImages.skyline,
    location: "Nam Từ Liêm, Hà Nội",
    title: "Skyline Elite Tower"
  }
] as const;

export default function CustomerNewsScreen() {
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [apiNews, setApiNews] = useState<PublicNews[]>([]);
  const [apiProjects, setApiProjects] = useState<PublicProject[]>([]);

  useEffect(() => {
    let active = true;
    appLogger.info("customer.search", "Bắt đầu tải dữ liệu tin tức/khu đất cho màn hình Tin tức...");

    Promise.all([
      customerPublicApi.news({ page: 1, per_page: 3 }),
      customerPublicApi.projects({ per_page: 3 })
    ])
      .then(([newsResponse, projectResponse]) => {
        if (!active) return;
        appLogger.info("customer.search", "Tải thành công dữ liệu tin tức/khu đất.", {
          newsCount: (newsResponse.data.featured?.length ?? 0) + (newsResponse.data.list?.length ?? 0),
          projectsCount: projectResponse.data.data?.length ?? 0
        });
        setApiNews([...(newsResponse.data.featured ?? []), ...(newsResponse.data.list ?? [])].slice(0, 3));
        setApiProjects(projectResponse.data.data ?? []);
      })
      .catch((error) => {
        appLogger.warn("customer.search", "Lỗi tải dữ liệu tin tức/khu đất hoặc xử lý response.", { error });
      });

    return () => {
      active = false;
    };
  }, []);

  const featuredNews = apiNews[0];

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(tabs)")} style={styles.brandRow}>
          <Image source={newsImages.logo} style={styles.logoImage} />
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
        <View style={styles.hero}>
          <FallbackImage source={mediaSource(featuredNews?.thumbnail, newsImages.hero)} fallback={newsImages.hero} style={styles.heroImage} />
          <View style={styles.heroGradient} />
          <View style={styles.heroCopy}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{newsCategoryLabel(featuredNews?.category).toUpperCase()}</Text>
            </View>
            <Text numberOfLines={2} style={styles.heroTitle}>{featuredNews?.title || "Bài viết nổi bật đang cập nhật"}</Text>
            <Text numberOfLines={2} style={styles.heroDescription}>
              {featuredNews?.summary || "Xem nhanh nội dung nổi bật nhất trong dòng tin thị trường hôm nay."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                featuredNews
                  ? router.push({ pathname: "/(app)/news-detail", params: publicNewsDetailParams(featuredNews) })
                  : undefined
              }
              style={styles.heroButton}
            >
              <Text style={styles.heroButtonText}>Khám Phá Ngay</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <Text style={styles.sectionTitle}>Tin tức mới nhất</Text>
            <View style={styles.titleUnderline} />
          </View>

          <View style={styles.newsCard}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                featuredNews
                  ? router.push({ pathname: "/(app)/news-detail", params: publicNewsDetailParams(featuredNews) })
                  : undefined
              }
            >
              <FallbackImage source={mediaSource(featuredNews?.thumbnail, newsImages.news)} fallback={newsImages.news} style={styles.newsImage} />
              <View style={[styles.newsBody, { paddingBottom: 0 }]}>
                <View style={styles.newsCategory}>
                  <Ionicons name="newspaper-outline" size={13} color={palette.darkRed} />
                  <Text style={styles.newsCategoryText}>TIN TỨC THỊ TRƯỜNG</Text>
                </View>
                <Text style={styles.newsTitle}>{featuredNews?.title || "Cập nhật xu hướng bất\nđộng sản cao cấp"}</Text>
                <Text style={styles.newsDescription}>
                  {featuredNews?.summary || "Phân tích chuyên sâu về sự biến động của phân khúc biệt thự nghỉ dưỡng và căn hộ hạng sang tại các đô thị lớn."}
                </Text>
              </View>
            </Pressable>
            <View style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(app)/market-news")}
                style={styles.readMore}
              >
                <Text style={styles.readMoreText}>Xem tất cả bài viết</Text>
                <Ionicons name="arrow-forward" size={15} color={palette.darkRed} />
              </Pressable>
            </View>
          </View>

          <View style={styles.planningCard}>
            <Image source={newsImages.planning} style={styles.planningImage} />
            <View style={styles.planningOverlay} />
            <View style={styles.planningContent}>
              <Ionicons name="map-outline" size={24} color={palette.white} />
              <Text style={styles.planningTitle}>Quy hoạch</Text>
              <Text style={styles.planningText}>Tra cứu bản đồ quy hoạch chi tiết các{"\n"}vùng kinh tế trọng điểm.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(app)/(tabs)/inquiries")}
                style={styles.planningButton}
              >
                <Text style={styles.planningButtonText}>Truy cập</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.projectsCard}>
            <View style={styles.projectsHeader}>
              <View style={styles.projectsLabel}>
                <Ionicons name="business-outline" size={15} color={palette.goldDark} />
                <Text style={styles.projectsLabelText}>KHU ĐẤT TIÊU BIỂU</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(app)/(tabs)/saved")}
              >
                <Text style={styles.projectsLink}>Xem tất cả</Text>
              </Pressable>
            </View>
            <View style={styles.projectList}>
              {(apiProjects.length > 0 ? apiProjects : projects).map((project, index) => {
                const isApiProject = "id" in project;
                return (
                <Pressable
                  accessibilityRole="button"
                  key={isApiProject ? project.id : project.title}
                  onPress={() =>
                    isApiProject
                      ? router.push({ pathname: "/(app)/project-detail", params: { id: project.id } })
                      : undefined
                  }
                  style={styles.projectItem}
                >
                  <View style={styles.projectImageWrap}>
                   <FallbackImage
                      source={isApiProject ? mediaSource(project.image ?? project.banner, projects[index % projects.length].image) : project.image}
                      fallback={projects[index % projects.length].image}
                      style={styles.projectImage}
                    />
                    <View
                      style={[
                        styles.projectBadge,
                        !isApiProject && project.badgeTone === "red" && styles.projectBadgeRed,
                        (isApiProject || project.badgeTone === "neutral") && styles.projectBadgeNeutral
                      ]}
                    >
                      <Text
                        style={[
                          styles.projectBadgeText,
                          !isApiProject && project.badgeTone === "red" && styles.projectBadgeTextLight,
                          (isApiProject || project.badgeTone === "neutral") && styles.projectBadgeTextNeutral
                        ]}
                      >
                        {isApiProject ? projectStatusLabel(project.status) : project.badge}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.projectTitle}>{isApiProject ? project.name || "Khu đất đang cập nhật" : project.title}</Text>
                  <Text style={styles.projectLocation}>{isApiProject ? project.location || "Đang cập nhật" : project.location}</Text>
                </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function projectStatusLabel(status?: string | number | null) {
  if (status === 1 || status === "1" || status === "available") return "MỞ BÁN";
  if (status === 2 || status === "2" || status === "reserved") return "ĐANG NHẬN CỌC";
  if (status === 3 || status === "3" || status === "sold_out") return "HẾT HÀNG";
  return "ĐANG CẬP NHẬT";
}

function newsCategoryLabel(value?: string | null) {
  switch (value) {
    case "market":
      return "Tin tức thị trường";
    case "project":
      return "Khu đất";
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
    paddingHorizontal: 20
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
    paddingBottom: 24
  },
  hero: {
    height: 530,
    overflow: "hidden",
    position: "relative"
  },
  heroImage: {
    height: "100%",
    left: "-18%",
    position: "absolute",
    resizeMode: "cover",
    top: 0,
    width: "136%"
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(25, 28, 29, 0.22)"
  },
  heroCopy: {
    bottom: 48,
    left: 20,
    position: "absolute",
    right: 20
  },
  heroPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(106, 1, 0, 0.2)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  heroPillText: {
    color: palette.gold,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  heroTitle: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -1.6,
    lineHeight: 38,
    marginTop: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10
  },
  heroDescription: {
    color: "rgba(255, 255, 255, 0.84)",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8
  },
  heroButton: {
    alignItems: "center",
    backgroundColor: palette.darkRed,
    borderRadius: 12,
    height: 43,
    justifyContent: "center",
    marginTop: 9,
    width: 160
  },
  heroButtonText: {
    color: palette.white,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 48
  },
  titleBlock: {
    gap: 4
  },
  sectionTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  titleUnderline: {
    backgroundColor: palette.darkRed,
    borderRadius: 999,
    height: 4,
    width: 64
  },
  newsCard: {
    backgroundColor: palette.white,
    borderColor: "rgba(227, 190, 184, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  newsImage: {
    height: 348,
    resizeMode: "cover",
    width: "100%"
  },
  newsBody: {
    gap: 8,
    padding: 24
  },
  newsCategory: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  newsCategoryText: {
    color: palette.darkRed,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  newsTitle: {
    color: palette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 20,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  newsDescription: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  readMore: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingTop: 8
  },
  readMoreText: {
    color: palette.darkRed,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  },
  planningCard: {
    backgroundColor: palette.darkRed,
    borderRadius: 12,
    height: 320,
    justifyContent: "flex-end",
    overflow: "hidden",
    padding: 24
  },
  planningImage: {
    ...StyleSheet.absoluteFillObject,
    height: "110%",
    opacity: 0.4,
    resizeMode: "cover",
    width: "100%"
  },
  planningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(106, 1, 0, 0.72)"
  },
  planningContent: {
    gap: 3
  },
  planningTitle: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  planningText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  planningButton: {
    alignItems: "center",
    backgroundColor: palette.white,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    marginTop: 8
  },
  planningButtonText: {
    color: palette.darkRed,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  },
  projectsCard: {
    backgroundColor: palette.white,
    borderColor: "rgba(227, 190, 184, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 24,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  projectsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  projectsLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  projectsLabelText: {
    color: palette.goldDark,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  projectsLink: {
    color: palette.brown,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20,
    textDecorationLine: "underline"
  },
  projectList: {
    gap: 24
  },
  projectItem: {
    gap: 7
  },
  projectImageWrap: {
    borderRadius: 8,
    height: 187.5,
    overflow: "hidden",
    position: "relative"
  },
  projectImage: {
    height: "160%",
    resizeMode: "cover",
    top: "-30%",
    width: "100%"
  },
  projectBadge: {
    backgroundColor: "rgba(253, 206, 103, 0.9)",
    borderRadius: 999,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    position: "absolute",
    top: 12
  },
  projectBadgeRed: {
    backgroundColor: palette.red
  },
  projectBadgeNeutral: {
    backgroundColor: "rgba(225, 227, 228, 0.9)"
  },
  projectBadgeText: {
    color: "#755700",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  projectBadgeTextLight: {
    color: palette.white
  },
  projectBadgeTextNeutral: {
    color: palette.brown
  },
  projectTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 30.6
  },
  projectLocation: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  }
});
