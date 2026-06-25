import {
  Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect,
  useState,
  useMemo,
  useCallback } from "react";
import { Image,
  ScrollView,
  StyleSheet,
  RefreshControl,
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
  logo: require("@/assets/images/customer/project-detail/kn-logo.png")
};

const imageNotFound = require("@/assets/images/placeholders/image_not_found.png");

const filters = ["Tất cả khu vực", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"] as const;

type PlanningSection = {
  city: string;
  items: PublicPlanning[];
};

export default function PlanningListScreen() {
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [apiPlannings, setApiPlannings] = useState<PublicPlanning[]>([]);
  const [apiCities, setApiCities] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("Tất cả khu vực");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setVisibleCount(6);
  }, [searchKeyword, selectedFilter]);

  const fetchData = useCallback(async () => {
    try {
      const [planningResponse, cityResponse] = await Promise.all([
        customerPublicApi.plannings({ per_page: 50 }),
        customerPublicApi.planningCities()
      ]);
      setApiPlannings(planningResponse.data.data ?? []);
      setApiCities(cityResponse.data ?? []);
    } catch (error) {
      appLogger.warn("customer.plannings", "Không thể tải danh sách quy hoạch.", { error });
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchData().then(() => {
        if (!active) return;
      });
      return () => {
        active = false;
      };
    }, [fetchData])
  );

  const displayFilters = apiCities.length > 0 ? ["Tất cả khu vực", ...apiCities] : [...filters];
  const sourceSections: PlanningSection[] = groupPlannings(apiPlannings);
  const cityFilteredSections = selectedFilter === "Tất cả khu vực"
    ? sourceSections
    : sourceSections.filter((section) => planningCityMatchesFilter(section.city, selectedFilter));
  const displaySections = filterPlanningSections(cityFilteredSections, searchKeyword);

  const totalItemsCount = useMemo(() => {
    return displaySections.reduce((sum, section) => sum + section.items.length, 0);
  }, [displaySections]);

  const displayedSections = useMemo(() => {
    let count = 0;
    const result: PlanningSection[] = [];
    for (const section of displaySections) {
      if (count >= visibleCount) break;
      const remaining = visibleCount - count;
      if (section.items.length <= remaining) {
        result.push(section);
        count += section.items.length;
      } else {
        result.push({
          ...section,
          items: section.items.slice(0, remaining)
        });
        count += remaining;
      }
    }
    return result;
  }, [displaySections, visibleCount]);

  const hasMoreToShow = visibleCount < totalItemsCount;

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

      <ScrollView
        bounces
        contentContainerStyle={styles.scroll}
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.darkRed]} />
        }
      >
        <View style={styles.intro}>
          <Text style={styles.pageTitle}>Bản đồ Quy hoạch</Text>
          <Text style={styles.pageDescription}>
            Tra cứu thông tin quy hoạch phân khu, quy hoạch chung và các định hướng phát triển đô thị mới nhất tại các tỉnh thành trọng điểm.
          </Text>
          <View style={styles.searchBox}>
            <TextInput
              autoCapitalize="none"
              clearButtonMode="while-editing"
              onChangeText={setSearchKeyword}
              placeholder="Tìm kiếm khu vực..."
              placeholderTextColor={palette.muted}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchKeyword}
            />
            <Ionicons name="search-outline" size={20} color={palette.brown} />
          </View>
          <ScrollView horizontal contentContainerStyle={styles.filterList} showsHorizontalScrollIndicator={false}>
            {displayFilters.map((filter) => {
              const isActive = selectedFilter === filter;

              return (
              <Pressable
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterButton, isActive ? styles.filterActive : styles.filterInactive]}
              >
                <Text style={[styles.filterText, isActive ? styles.filterTextActive : styles.filterTextInactive]}>
                  {filter}
                </Text>
              </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {apiPlannings.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có thông tin quy hoạch.</Text>
        ) : displayedSections.length === 0 ? (
          <Text style={styles.emptyText}>Không tìm thấy quy hoạch phù hợp.</Text>
        ) : null}

        {displayedSections.map((section) => (
          <View key={section.city} style={styles.section}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>{section.city}</Text>
            </View>
            <View style={styles.cardList}>
              {section.items.map((item) => {
                return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardImageWrap}>
                    <Image
                      source={mediaSource(item.map_image, imageNotFound)}
                      style={styles.cardImage}
                    />
                    <View style={[styles.statusBadge, planningStatusLabel(item.status) === "ĐANG ĐIỀU CHỈNH" && styles.statusBadgeGold]}>
                      <Text style={styles.statusBadgeText}>{planningStatusLabel(item.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{item.title || "Quy hoạch đang cập nhật"}</Text>
                      <Text style={styles.cardYear}>{item.updated_year || "Chưa cập nhật"}</Text>
                    </View>
                    <Text numberOfLines={2} style={styles.cardDescription}>{item.description}</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({ pathname: "/(app)/planning-detail", params: { id: item.id } })
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

        {hasMoreToShow && (
          <View style={styles.loadMoreWrap}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setVisibleCount((prev) => prev + 6)}
              style={({ pressed }) => [styles.loadMoreButton, pressed && styles.loadMoreButtonPressed]}
            >
              <Text style={styles.loadMoreText}>Xem thêm quy hoạch</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function groupPlannings(items: PublicPlanning[]): PlanningSection[] {
  const groups = new Map<string, PublicPlanning[]>();
  items.forEach((item) => {
    const city = item.city || "Khác";
    groups.set(city, [...(groups.get(city) ?? []), item]);
  });

  return Array.from(groups.entries()).map(([city, groupItems]) => ({ city, items: groupItems }));
}

function filterPlanningSections(sections: PlanningSection[], keyword: string) {
  const normalizedKeyword = normalizePlanningSearchText(keyword);
  if (!normalizedKeyword) return sections;

  return sections
    .map((section) => {
      if (normalizePlanningSearchText(section.city).includes(normalizedKeyword)) return section;

      return {
        ...section,
        items: section.items.filter((item) => planningItemMatchesSearch(item, normalizedKeyword))
      };
    })
    .filter((section) => section.items.length > 0);
}

function planningItemMatchesSearch(item: PublicPlanning, normalizedKeyword: string) {
  return normalizePlanningSearchText([
    item.title,
    item.description,
    item.city,
    item.district,
    item.sub_area
  ].filter(Boolean).join(" ")).includes(normalizedKeyword);
}

function planningStatusLabel(status?: string | number | null) {
  if (status === 2 || status === "2" || status === "approved") return "ĐÃ PHÊ DUYỆT";
  if (status === 1 || status === "1" || status === "draft") return "ĐANG ĐIỀU CHỈNH";
  return typeof status === "string" && status ? status.toUpperCase() : "ĐANG CẬP NHẬT";
}

function planningCityMatchesFilter(city: string, filter: string) {
  return normalizePlanningCity(city) === normalizePlanningCity(filter)
    || normalizePlanningCity(city).includes(normalizePlanningCity(filter))
    || normalizePlanningCity(filter).includes(normalizePlanningCity(city));
}

function normalizePlanningCity(value: string) {
  return normalizePlanningSearchText(value)
    .replace(/^tp\s+/, "")
    .replace(/\bthanh pho\b\s*/, "")
    .trim();
}

function normalizePlanningSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  searchInput: {
    color: palette.muted,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 0
  },
  emptyText: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center"
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
    lineHeight: 16
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
    lineHeight: 16,
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
    lineHeight: 20
  },
  loadMoreWrap: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 8
  },
  loadMoreButton: {
    alignItems: "center",
    borderColor: palette.darkRed,
    borderRadius: 12,
    borderWidth: 2,
    height: 54,
    justifyContent: "center",
    paddingHorizontal: 40,
    width: "100%"
  },
  loadMoreButtonPressed: {
    opacity: 0.6
  },
  loadMoreText: {
    color: palette.darkRed,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  }
});
