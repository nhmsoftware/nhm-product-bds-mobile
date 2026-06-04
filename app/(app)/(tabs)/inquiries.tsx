import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomerAccountMenu } from "@/components/CustomerAccountMenu";
import { appLogger } from "@/libs/logger";
import { mediaSource } from "@/libs/media";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, type PublicPlanning } from "@/services/customer/api";

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

const planningImages = {
  logo: require("@/assets/images/customer/project-detail/kn-logo.png"),
  hcmQuan2: require("@/assets/images/customer/planning/hcm-quan-2.png"),
  hcmThuDuc: require("@/assets/images/customer/planning/hcm-thu-duc.png"),
  hcmQuan7: require("@/assets/images/customer/planning/hcm-quan-7.png"),
  haNoiTayHo: require("@/assets/images/customer/planning/ha-noi-tay-ho.png"),
  haNoiLongBien: require("@/assets/images/customer/planning/ha-noi-long-bien.png"),
  daNangSonTra: require("@/assets/images/customer/planning/da-nang-son-tra.png")
};

const filters = ["Tất cả khu vực", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"] as const;

const planningSections = [
  {
    city: "TP. Hồ Chí Minh",
    items: [
      {
        description: "Quy hoạch phân khu tỷ lệ 1/2000 khu đô thị mới Thủ Thiêm và các vùng phụ",
        image: planningImages.hcmQuan2,
        status: "ĐÃ PHÊ DUYỆT",
        title: "Quy hoạch Quận 2",
        year: "2024"
      },
      {
        description: "Quy hoạch chung thành phố Thủ Đức tầm nhìn đến năm 2040, tập trung vào",
        image: planningImages.hcmThuDuc,
        status: "ĐANG ĐIỀU CHỈNH",
        title: "TP. Thủ Đức",
        year: "2023"
      },
      {
        description: "Điều chỉnh quy hoạch chi tiết 1/500 khu đô thị Phú Mỹ Hưng và các phường",
        image: planningImages.hcmQuan7,
        status: "ĐÃ PHÊ DUYỆT",
        title: "Quy hoạch Quận 7",
        year: "2022"
      }
    ]
  },
  {
    city: "Hà Nội",
    items: [
      {
        description: "Phát triển đô thị ven hồ Tây và các dự án trục Nhật Tân - Nội Bài.",
        image: planningImages.haNoiTayHo,
        status: "ĐÃ PHÊ DUYỆT",
        title: "Quy hoạch Tây Hồ",
        year: "2024"
      },
      {
        description: "Mở rộng hạ tầng giao thông và khu dân cư phía Đông sông Hồng.",
        image: planningImages.haNoiLongBien,
        status: "ĐÃ PHÊ DUYỆT",
        title: "Quy hoạch Long Biên",
        year: "2023"
      }
    ]
  },
  {
    city: "Đà Nẵng",
    items: [
      {
        description: "Phát triển hạ tầng du lịch biển và bảo tồn đa dạng sinh học bán đảo Sơn Trà.",
        image: planningImages.daNangSonTra,
        status: "ĐÃ PHÊ DUYỆT",
        title: "Quy hoạch Sơn Trà",
        year: "2024"
      }
    ]
  }
] as const;

export default function PlanningListScreen() {
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [apiPlannings, setApiPlannings] = useState<PublicPlanning[]>([]);
  const [apiCities, setApiCities] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    Promise.all([
      customerPublicApi.plannings({ per_page: 30 }),
      customerPublicApi.planningCities()
    ])
      .then(([planningResponse, cityResponse]) => {
        if (!active) return;
        setApiPlannings(planningResponse.data.data ?? []);
        setApiCities(cityResponse.data ?? []);
      })
      .catch((error) => {
        appLogger.warn("customer.plannings", "Không thể tải danh sách quy hoạch.", { error });
      });

    return () => {
      active = false;
    };
  }, []);

  const displayFilters = apiCities.length > 0 ? ["Tất cả khu vực", ...apiCities] : [...filters];
  const displaySections = apiPlannings.length > 0 ? groupPlannings(apiPlannings) : planningSections;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(tabs)")} style={styles.brandRow}>
          <Image source={planningImages.logo} style={styles.logo} />
          <Text style={styles.brandText}>KHỞI NGUYÊN LAND</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setAccountMenuVisible(true)} style={styles.accountButton}>
          <Ionicons name="person-circle-outline" size={20} color={palette.brown} />
        </Pressable>
      </View>
      <CustomerAccountMenu onClose={() => setAccountMenuVisible(false)} visible={accountMenuVisible} />

      <ScrollView bounces contentContainerStyle={styles.scroll} overScrollMode="always" showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.pageTitle}>Bản đồ Quy hoạch</Text>
          <Text style={styles.pageDescription}>
            Tra cứu thông tin quy hoạch phân khu, quy hoạch chung và các định hướng phát triển đô thị mới nhất tại các tỉnh thành trọng điểm.
          </Text>
          <View style={styles.searchBox}>
            <Text style={styles.searchPlaceholder}>Tìm kiếm khu vực...</Text>
            <Ionicons name="search-outline" size={20} color={palette.brown} />
          </View>
          <ScrollView horizontal contentContainerStyle={styles.filterList} showsHorizontalScrollIndicator={false}>
            {displayFilters.map((filter, index) => (
              <Pressable key={filter} style={[styles.filterButton, index === 0 ? styles.filterActive : styles.filterInactive]}>
                <Text style={[styles.filterText, index === 0 ? styles.filterTextActive : styles.filterTextInactive]}>
                  {filter}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {displaySections.map((section) => (
          <View key={section.city} style={styles.section}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>{section.city}</Text>
            </View>
            <View style={styles.cardList}>
              {section.items.map((item, index) => {
                const isApiPlanning = "id" in item;
                return (
                <View key={isApiPlanning ? item.id : item.title} style={styles.card}>
                  <View style={styles.cardImageWrap}>
                    <Image
                      source={
                        isApiPlanning
                          ? mediaSource(item.map_image, planningSections[0].items[index % planningSections[0].items.length].image)
                          : item.image
                      }
                      style={styles.cardImage}
                    />
                    <View style={[styles.statusBadge, planningStatusLabel(item.status) === "ĐANG ĐIỀU CHỈNH" && styles.statusBadgeGold]}>
                      <Text style={styles.statusBadgeText}>{planningStatusLabel(item.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{item.title || "Quy hoạch đang cập nhật"}</Text>
                      <Text style={styles.cardYear}>{isApiPlanning ? item.updated_year || "N/A" : item.year}</Text>
                    </View>
                    <Text numberOfLines={2} style={styles.cardDescription}>{item.description}</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        isApiPlanning
                          ? router.push({ pathname: "/(app)/planning-detail", params: { id: item.id } })
                          : router.push("/(app)/planning-detail")
                      }
                      style={styles.detailButton}
                    >
                      <Ionicons name="eye-outline" size={16} color={palette.darkRed} />
                      <Text style={styles.detailButtonText}>Xem chi tiết</Text>
                    </Pressable>
                  </View>
                </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function groupPlannings(items: PublicPlanning[]) {
  const groups = new Map<string, PublicPlanning[]>();
  items.forEach((item) => {
    const city = item.city || "Khác";
    groups.set(city, [...(groups.get(city) ?? []), item]);
  });

  return Array.from(groups.entries()).map(([city, groupItems]) => ({ city, items: groupItems }));
}

function planningStatusLabel(status?: string | number | null) {
  if (status === 2 || status === "2" || status === "approved") return "ĐÃ PHÊ DUYỆT";
  if (status === 1 || status === "1" || status === "draft") return "ĐANG ĐIỀU CHỈNH";
  return typeof status === "string" && status ? status.toUpperCase() : "ĐANG CẬP NHẬT";
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
    gap: 48,
    paddingBottom: 128,
    paddingHorizontal: 20,
    paddingTop: 32
  },
  intro: {
    gap: 12
  },
  pageTitle: {
    color: palette.darkRed,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -1.6,
    lineHeight: 44
  },
  pageDescription: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
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
    minHeight: 44,
    paddingHorizontal: 16
  },
  searchPlaceholder: {
    color: palette.muted,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  filterList: {
    gap: 12,
    paddingRight: 20
  },
  filterButton: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 8
  },
  filterActive: {
    backgroundColor: palette.darkRed
  },
  filterInactive: {
    backgroundColor: "#e7e8e9"
  },
  filterText: {
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12
  },
  filterTextActive: {
    color: palette.white
  },
  filterTextInactive: {
    color: palette.brown
  },
  section: {
    gap: 24
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16
  },
  sectionLine: {
    backgroundColor: palette.darkRed,
    borderRadius: 999,
    height: 32,
    width: 4
  },
  sectionTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 32,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  cardList: {
    gap: 24
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  cardImageWrap: {
    height: 192,
    overflow: "hidden",
    position: "relative"
  },
  cardImage: {
    height: "182%",
    resizeMode: "cover",
    top: "-41%",
    width: "100%"
  },
  statusBadge: {
    backgroundColor: "rgba(106, 1, 0, 0.9)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 4,
    position: "absolute",
    right: 16,
    top: 16
  },
  statusBadgeGold: {
    backgroundColor: palette.goldDark
  },
  statusBadgeText: {
    color: palette.white,
    fontFamily: appFonts.regular,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 15
  },
  cardBody: {
    gap: 8,
    padding: 24
  },
  cardTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  cardTitle: {
    color: palette.text,
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  cardYear: {
    color: palette.goldDark,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 12,
    marginLeft: 12,
    marginTop: 8
  },
  cardDescription: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  detailButton: {
    alignItems: "center",
    borderColor: palette.darkRed,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 9
  },
  detailButtonText: {
    color: palette.darkRed,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  }
});
