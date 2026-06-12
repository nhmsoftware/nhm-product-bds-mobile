import {
  Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect,
  useMemo,
  useRef,
  useState } from "react";
import { Image,
  type ImageSourcePropType,
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
import { customerPublicApi, type PublicProject } from "@/services/customer/api";

const palette = {
  background: "#f8f9fa",
  brown: "#5b403c",
  darkRed: "#6a0100",
  gold: "#fdce67",
  goldText: "#5c4300",
  line: "rgba(227, 190, 184, 0.2)",
  muted: "#6b7280",
  neutralBadge: "#e1e3e4",
  text: "#191c1d",
  white: "#ffffff"
};

const projectImages = {
  grandHeritage: require("@/assets/images/customer/projects/the-grand-heritage.png"),
  coastalAzure: require("@/assets/images/customer/projects/coastal-azure-villas.png"),
  silkRoad: require("@/assets/images/customer/projects/the-silk-road-residences.png"),
  urbanGold: require("@/assets/images/customer/projects/urban-gold-shophouse.png")
};

const filters = ["Tất cả", "Căn hộ", "Biệt thự", "Shophouse"] as const;

const filterTypeMap: Record<string, string | undefined> = {
  "Tất cả": undefined,
  "Căn hộ": "Căn hộ dịch vụ",
  "Biệt thự": "Biệt thự nghỉ dưỡng đồi thông",
  "Shophouse": "Shophouse ven sông",
};

type FallbackProject = {
  badge: string;
  image: ImageSourcePropType;
  location: string;
  price: string;
  title: string;
  tone: "gold" | "neutral";
};

const projects: FallbackProject[] = [
  {
    badge: "MỞ BÁN",
    image: projectImages.grandHeritage,
    location: "Phường Bãi Cháy, Quảng Ninh",
    price: "5.2 Tỷ",
    title: "The Solaria",
    tone: "gold"
  },
  {
    badge: "MỞ BÁN",
    image: projectImages.coastalAzure,
    location: "Xã Đông Dư, Gia Lâm, Hà Nội",
    price: "3.9 Tỷ",
    title: "Eco Garden",
    tone: "gold"
  },
  {
    badge: "MỞ BÁN",
    image: projectImages.silkRoad,
    location: "Phường Thảo Điền, TP. Hồ Chí Minh",
    price: "7.6 Tỷ",
    title: "Riverfront City",
    tone: "gold"
  },
  {
    badge: "MỞ BÁN",
    image: projectImages.urbanGold,
    location: "Phường Mũi Né, Phan Thiết, Bình Thuận",
    price: "12.2 Tỷ",
    title: "Coastal Bay",
    tone: "gold"
  }
];

export default function CustomerProjectsScreen() {
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [apiProjects, setApiProjects] = useState<PublicProject[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<typeof filters[number]>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  const params = useLocalSearchParams<{ focus?: string }>();

  const visibleApiProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const selectedType = filterTypeMap[selectedFilter];

    return apiProjects.filter((project) => {
      const name = (project.name || "").toLowerCase();
      const location = (project.location || "").toLowerCase();
      const type = (project.type || "").toLowerCase();
      const queryMatch = !query || name.includes(query) || location.includes(query) || type.includes(query);
      const typeMatch = !selectedType || type.includes(selectedType.toLowerCase());

      return queryMatch && typeMatch;
    });
  }, [apiProjects, searchQuery, selectedFilter]);

  const visibleProjects = projectsLoaded
    ? visibleApiProjects
    : (apiProjects.length > 0 ? visibleApiProjects : projects);

  useEffect(() => {
    customerPublicApi.projects({ per_page: 50 })
      .then((response) => {
        setApiProjects(response.data.data ?? []);
      })
      .catch((error) => {
        appLogger.warn("customer.projects", "Không thể tải danh sách dự án.", { error });
      })
      .finally(() => {
        setProjectsLoaded(true);
      });

    if (params.focus === "true") {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [params.focus]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(tabs)")} style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="business" size={17} color={palette.white} />
          </View>
          <Text style={styles.brandText}>LUXE REALTY</Text>
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

      <ScrollView bounces contentContainerStyle={styles.scroll} overScrollMode="always" showsVerticalScrollIndicator={false}>
        <View style={styles.searchAndFilters}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={22} color={palette.brown} />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm kiếm dự án, vị trí..."
              placeholderTextColor={palette.muted}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable
                accessibilityLabel="Xóa từ khóa"
                accessibilityRole="button"
                onPress={() => {
                  setSearchQuery("");
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={palette.muted} />
              </Pressable>
            )}
          </View>

          <View style={styles.filterWrap}>
            {filters.map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={filter}
                  onPress={() => {
                    setSelectedFilter(filter);
                  }}
                  style={[styles.filterButton, isActive ? styles.filterActive : styles.filterInactive]}
                >
                  <Text style={[styles.filterText, isActive ? styles.filterTextActive : styles.filterTextInactive]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.projectList}>
          {visibleProjects.length > 0 ? visibleProjects.map((project, index) => {
            const isApiProject = "id" in project;
            return (
            <View key={isApiProject ? project.id : project.title} style={styles.projectCard}>
              <View style={styles.projectImageWrap}>
                <Image
                  source={
                    isApiProject
                      ? mediaSource(project.image ?? project.banner, projects[index % projects.length].image)
                      : project.image
                  }
                  style={styles.projectImage}
                />
                <View style={[styles.badge, isApiProject ? styles.badgeNeutral : project.tone === "neutral" && styles.badgeNeutral]}>
                  <Text style={[styles.badgeText, isApiProject ? styles.badgeTextNeutral : project.tone === "neutral" && styles.badgeTextNeutral]}>
                    {isApiProject ? projectStatusLabel(project.status) : project.badge}
                  </Text>
                </View>
              </View>

              <View style={styles.projectBody}>
                <Text style={styles.projectTitle}>{isApiProject ? project.name || "Dự án đang cập nhật" : project.title}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={palette.brown} />
                  <Text numberOfLines={2} style={styles.location}>{isApiProject ? project.location || "Đang cập nhật" : project.location}</Text>
                </View>
                <View style={styles.projectFooter}>
                  <View>
                    <Text style={styles.priceLabel}>GIÁ TỪ</Text>
                    <Text style={styles.price}>{isApiProject ? formatProjectPrice(project.price) : project.price}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      isApiProject
                        ? router.push({ pathname: "/(app)/project-detail", params: { id: project.id } })
                        : router.push("/(app)/project-detail")
                    }
                    style={styles.detailButton}
                  >
                    <Text style={styles.detailButtonText}>View Details</Text>
                  </Pressable>
                </View>
              </View>
            </View>
            );
          }) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={28} color={palette.muted} />
              <Text style={styles.emptyTitle}>Không tìm thấy dự án phù hợp</Text>
              <Text style={styles.emptyText}>Đổi từ khóa hoặc bỏ lọc để xem lại danh sách.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatProjectPrice(price?: string | number | null) {
  const value = Number(price ?? 0);
  if (!Number.isFinite(value) || value <= 0) return "Liên hệ";
  return value >= 1_000_000_000 ? `${Math.round(value / 1_000_000_000)} Tỷ` : `${Math.round(value / 1_000_000)} Triệu`;
}

function projectStatusLabel(status?: string | number | null) {
  if (status === 1 || status === "1" || status === "available") return "MỞ BÁN";
  if (status === 2 || status === "2" || status === "reserved") return "ĐANG NHẬN CỌC";
  if (status === 3 || status === "3" || status === "sold_out") return "HẾT HÀNG";
  return "ĐANG CẬP NHẬT";
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
    elevation: 1
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  brandIcon: {
    alignItems: "center",
    backgroundColor: palette.darkRed,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 32
  },
  searchAndFilters: {
    gap: 24
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: palette.white,
    borderRadius: 12,
    flexDirection: "row",
    gap: 14,
    height: 62,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  searchInput: {
    color: palette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    height: "100%",
    paddingVertical: 0
  },
  clearButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  filterButton: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 92,
    paddingHorizontal: 24,
    paddingVertical: 9
  },
  filterActive: {
    backgroundColor: palette.darkRed,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2
  },
  filterInactive: {
    backgroundColor: palette.white,
    borderColor: "rgba(227, 190, 184, 0.3)",
    borderWidth: 1
  },
  filterText: {
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  },
  filterTextActive: {
    color: palette.white
  },
  filterTextInactive: {
    color: palette.brown
  },
  projectList: {
    gap: 24,
    paddingTop: 48
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingBottom: 20,
    paddingTop: 12
  },
  emptyTitle: {
    color: palette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center"
  },
  emptyText: {
    color: palette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  projectCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  projectImageWrap: {
    height: 256,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  projectImage: {
    height: "136%",
    resizeMode: "cover",
    top: "-18%",
    width: "100%"
  },
  badge: {
    backgroundColor: "rgba(253, 206, 103, 0.9)",
    borderRadius: 8,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: "absolute",
    top: 10
  },
  badgeNeutral: {
    backgroundColor: "rgba(225, 227, 228, 0.9)"
  },
  badgeText: {
    color: palette.goldText,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  badgeTextNeutral: {
    color: palette.brown
  },
  projectBody: {
    gap: 8,
    padding: 24
  },
  projectTitle: {
    color: palette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  locationRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 4
  },
  location: {
    color: palette.brown,
    flex: 1,
    flexShrink: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  projectFooter: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8
  },
  priceLabel: {
    color: palette.brown,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  price: {
    color: palette.darkRed,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 32
  },
  detailButton: {
    alignItems: "center",
    backgroundColor: palette.darkRed,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 20
  },
  detailButtonText: {
    color: palette.white,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  }
});
