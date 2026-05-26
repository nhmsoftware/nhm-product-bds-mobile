import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { router, type Href } from "expo-router";
import type { ComponentProps } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appFonts } from "@/libs/typography";

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

const homeImages = {
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
  { icon: "document-text-outline", label: "Hỗ trợ\npháp lý", destination: "/(app)/(tabs)/profile" },
  { icon: "images-outline", label: "Điểm đến", destination: "/(app)/(tabs)/saved" },
  { icon: "cash-outline", label: "Cơ hội\nđầu tư", destination: "/(app)/(tabs)/saved" }
];

const projects = [
  { image: homeImages.riverside, name: "KN Riverside", location: "Hòa Lạc, Hà Nội", price: "28 - 45 Tỷ" },
  { image: homeImages.centralPoint, name: "KN Central Point", location: "Phạm Hùng, Hà Nội", price: "35 - 60 Tỷ" }
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

export default function CustomerHomeScreen() {
  return (
    <View style={styles.safe}>
      <StatusBar backgroundColor={palette.red} style="light" />
      <SafeAreaView edges={["top"]} style={styles.topSafeArea} />
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scroll}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.headerLayer}>
          <View style={styles.header}>
            <View style={styles.headerWarmOverlay} />
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.logo}>KN</Text>
                <Text style={styles.brand}>KHỞI NGUYÊN LAND</Text>
              </View>
              <Pressable accessibilityRole="button" style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={24} color={palette.white} />
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" style={styles.search}>
              <Ionicons name="search-outline" size={21} color={palette.lightMuted} />
              <Text style={styles.searchPlaceholder}>Tìm kiếm dự án, khu vực, tin tức...</Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Image source={homeImages.hero} style={styles.heroImage} />
            <View style={styles.heroOverlay} />
            <View style={styles.heroCopy}>
              <View style={styles.heroBrandRow}>
                <Text style={styles.heroBrand}>KN</Text>
                <Text style={styles.heroBrand}>KHỞI NGUYÊN LAND</Text>
              </View>
              <Text style={styles.heroTitle}>KIẾN TẠO GIÁ TRỊ{"\n"}KHỞI NGUỒN TƯƠNG LAI</Text>
              <Pressable accessibilityRole="button" style={styles.heroButton}>
                <Text style={styles.heroButtonText}>KHÁM PHÁ NGAY</Text>
              </Pressable>
            </View>
            <View style={styles.pagination}>
              <View style={styles.paginationActive} />
              <View style={styles.paginationDot} />
              <View style={styles.paginationDot} />
              <View style={styles.paginationDot} />
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
          <View style={styles.projectGrid}>
            {projects.map((project) => (
              <Pressable key={project.name} accessibilityRole="button" style={styles.projectCard}>
                <Image source={project.image} style={styles.projectImage} />
                <Text style={styles.projectTitle}>{project.name}</Text>
                <Text style={styles.projectLocation}>{project.location}</Text>
                <Text style={styles.projectPrice}>{project.price}</Text>
              </Pressable>
            ))}
          </View>

          <HomeSectionHeader title="TIN TỨC THỊ TRƯỜNG" link="Xem thêm" onPress={() => router.push("/(app)/(tabs)/search")} />
          <View style={styles.newsList}>
            {newsItems.map((item) => (
              <Pressable key={item.title} accessibilityRole="button" style={styles.newsCard}>
                <Image source={item.image} style={styles.newsImage} />
                <View style={styles.newsCopy}>
                  <Text style={styles.newsTitle}>{item.title}</Text>
                  <Text style={styles.newsDate}>24 Tháng 5, 2024</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
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
  topSafeArea: {
    backgroundColor: palette.red
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
    paddingTop: 11
  },
  headerWarmOverlay: {
    backgroundColor: "#a33f00",
    bottom: 0,
    height: 118,
    left: 0,
    opacity: 0.82,
    position: "absolute",
    right: 0
  },
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    height: 35,
    justifyContent: "space-between",
    marginHorizontal: 16
  },
  logo: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 20,
    letterSpacing: 1,
    lineHeight: 20
  },
  brand: {
    color: palette.white,
    fontFamily: appFonts.semiBold,
    fontSize: 10,
    letterSpacing: 2,
    lineHeight: 15
  },
  notificationButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  search: {
    alignItems: "center",
    backgroundColor: palette.white,
    borderRadius: 999,
    flexDirection: "row",
    gap: 10,
    height: 36,
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 12
  },
  searchPlaceholder: {
    color: palette.lightMuted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  hero: {
    borderRadius: 16,
    height: 192,
    left: "50%",
    marginLeft: -179,
    overflow: "hidden",
    padding: 20,
    position: "absolute",
    top: 144,
    width: 358
  },
  heroImage: {
    height: 265,
    left: 0,
    position: "absolute",
    resizeMode: "cover",
    top: -36,
    width: 358
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
    borderColor: palette.gold,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 17,
    paddingVertical: 7,
    width: 135
  },
  heroButtonText: {
    color: palette.white,
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    lineHeight: 16
  },
  pagination: {
    bottom: 12,
    flexDirection: "row",
    gap: 4,
    left: "45%",
    position: "absolute"
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
  projectGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: -16,
    paddingHorizontal: 16
  },
  projectCard: {
    flex: 1
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
