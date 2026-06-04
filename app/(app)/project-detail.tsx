import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  pale: "#f3f4f5",
  text: "#191c1d",
  white: "#ffffff"
};

const projectDetailImages = {
  hero: require("@/assets/images/customer/project-detail/hero-estates.png"),
  logo: require("@/assets/images/customer/project-detail/kn-logo.png"),
  planningMap: require("@/assets/images/customer/project-detail/planning-map.png"),
  locationMap: require("@/assets/images/customer/project-detail/location-map.png")
};

const amenities = [
  { icon: "water-outline", label: "Bể bơi vô cực" },
  { icon: "barbell-outline", label: "Phòng Gym 5 sao" },
  { icon: "trail-sign-outline", label: "Công viên trung\ntâm" },
  { icon: "shield-half-outline", label: "An ninh 24/7" }
] as const;

export default function ProjectDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [project, setProject] = useState<PublicProject | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let active = true;

    customerPublicApi
      .projectDetail(params.id)
      .then((response) => {
        if (active) setProject(response.data);
      })
      .catch((error) => {
        appLogger.warn("customer.projectDetail", "Không thể tải chi tiết dự án.", { error, id: params.id });
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  const projectAmenities = arrayFromUnknown(project?.amenities).slice(0, 4);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(tabs)")} style={styles.brandRow}>
          <Image source={projectDetailImages.logo} style={styles.logo} />
          <Text style={styles.brandText}>KHỞI NGUYÊN LAND</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setAccountMenuVisible(true)}
          style={styles.accountButton}
        >
          <Ionicons name="person-circle-outline" size={20} color={palette.brown} />
        </Pressable>
      </View>
      <CustomerAccountMenu onClose={() => setAccountMenuVisible(false)} visible={accountMenuVisible} />

      <ScrollView bounces contentContainerStyle={styles.scroll} overScrollMode="always" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={mediaSource(project?.banner ?? project?.image, projectDetailImages.hero)} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroCopy}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
            <Text style={styles.statusText}>{projectStatusLabel(project?.status)}</Text>
            </View>
            <Text style={styles.heroTitle}>{project?.name || "The Grand\nHorizon Estates"}</Text>
            <Text style={styles.heroSubtitle}>
              {project?.location || "A new paradigm of luxury living\nnestled in the heart of the capital\ndistrict."}
            </Text>
          </View>
          <View style={styles.dots}>
            <View style={styles.dotActive} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        <View style={styles.ctaBar}>
          <Pressable accessibilityRole="button" style={styles.brochureButton}>
            <Ionicons name="download-outline" size={16} color={palette.darkRed} />
            <Text style={styles.brochureText}>Tải Brochure</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.consultButton}>
            <Ionicons name="call" size={15} color={palette.white} />
            <Text style={styles.consultText}>Tư vấn</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Về dự án</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.bodyText}>
                {project?.description || "Trải nghiệm đỉnh cao của sự sang trọng tại The Grand Horizon Estates. Tọa lạc tại vị trí đắc địa nhất, dự án kết hợp hoàn mỹ giữa kiến trúc đương đại và không gian xanh yên bình. Với cam kết mang lại chất lượng sống vượt trội, mỗi căn hộ được thiết kế tỉ mỉ để tận dụng tối đa ánh sáng tự nhiên và tầm nhìn toàn cảnh thành phố."}
              </Text>
              <Text style={styles.bodyText}>
                Chúng tôi không chỉ xây dựng nhà ở, chúng tôi kiến tạo một phong cách sống đẳng cấp cho những chủ nhân xứng tầm. Hãy là một trong những người đầu tiên sở hữu tấm vé bước vào thế giới đặc quyền này.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quy hoạch</Text>
            <Image source={mediaSource(firstFromUnknown(project?.planning_info), projectDetailImages.planningMap)} style={styles.planningMap} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiện ích đặc quyền</Text>
            <View style={styles.amenitiesGrid}>
              {(projectAmenities.length > 0 ? projectAmenities : amenities).map((item, index) => {
                const label = typeof item === "string" ? item : item.label;
                const icon = typeof item === "string" ? amenities[index % amenities.length].icon : item.icon;
                return (
                <View key={label} style={styles.amenityCard}>
                  <Ionicons name={icon} size={30} color={palette.darkRed} />
                  <Text style={styles.amenityLabel}>{label}</Text>
                </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vị trí dự án</Text>
            <View style={styles.locationCard}>
              <Image source={projectDetailImages.locationMap} style={styles.locationMap} />
              <View style={styles.locationTint} />
              <View style={styles.mapPin}>
                <Ionicons name="location" size={24} color={palette.white} />
              </View>
              <View style={styles.locationInfo}>
                <View style={styles.locationIcon}>
                  <Ionicons name="navigate-circle-outline" size={22} color={palette.darkRed} />
                </View>
                <View style={styles.locationCopy}>
                  <Text style={styles.locationTitle}>{project?.name || "Khu đô thị mới Thủ Thiêm"}</Text>
                  <Text style={styles.locationText}>{project?.location || "Quận 2, Thành phố Hồ Chí\nMinh, Việt Nam"}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function arrayFromUnknown(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value && typeof value === "object") return Object.values(value).map(String).filter(Boolean);
  return [];
}

function firstFromUnknown(value: unknown) {
  return arrayFromUnknown(value)[0];
}

function projectStatusLabel(status?: string | number | null) {
  if (status === 1 || status === "1" || status === "available") return "OPENING";
  if (status === 2 || status === "2" || status === "reserved") return "RESERVING";
  if (status === 3 || status === "3" || status === "sold_out") return "SOLD OUT";
  return "OPENING SOON";
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
    backgroundColor: palette.background,
    paddingBottom: 48
  },
  hero: {
    height: 530,
    justifyContent: "flex-end",
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
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.26)"
  },
  heroCopy: {
    gap: 12,
    paddingBottom: 48,
    paddingHorizontal: 48
  },
  statusPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: palette.gold,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  statusDot: {
    backgroundColor: palette.darkRed,
    borderRadius: 999,
    height: 8,
    width: 8
  },
  statusText: {
    color: palette.goldText,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  heroTitle: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 38,
    letterSpacing: -1.6,
    lineHeight: 44,
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 4
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 30.6,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  dots: {
    bottom: 16,
    flexDirection: "row",
    gap: 8,
    left: 0,
    justifyContent: "center",
    position: "absolute",
    right: 0
  },
  dotActive: {
    backgroundColor: palette.white,
    borderRadius: 999,
    height: 8,
    width: 8
  },
  dot: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 999,
    height: 8,
    width: 8
  },
  ctaBar: {
    alignItems: "center",
    backgroundColor: palette.white,
    flexDirection: "row",
    gap: 16,
    height: 80,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8
  },
  brochureButton: {
    alignItems: "center",
    borderColor: palette.darkRed,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    width: 165
  },
  brochureText: {
    color: palette.darkRed,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  consultButton: {
    alignItems: "center",
    backgroundColor: palette.darkRed,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    shadowColor: palette.darkRed,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
    width: 159
  },
  consultText: {
    color: palette.white,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  content: {
    gap: 48,
    paddingHorizontal: 20,
    paddingTop: 24
  },
  section: {
    gap: 16
  },
  sectionTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 32,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  descriptionCard: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  bodyText: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 26
  },
  planningMap: {
    borderRadius: 12,
    height: 400,
    resizeMode: "cover",
    width: "100%"
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  amenityCard: {
    alignItems: "center",
    backgroundColor: palette.pale,
    borderRadius: 12,
    height: 128,
    justifyContent: "center",
    width: "47.7%"
  },
  amenityLabel: {
    color: palette.brown,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    marginTop: 16,
    textAlign: "center"
  },
  locationCard: {
    borderRadius: 12,
    height: 487,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  locationMap: {
    height: "100%",
    left: "-36%",
    position: "absolute",
    resizeMode: "cover",
    top: 0,
    width: "172%"
  },
  locationTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(106, 1, 0, 0.05)"
  },
  mapPin: {
    alignItems: "center",
    backgroundColor: palette.darkRed,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    left: "43%",
    position: "absolute",
    top: "43%",
    width: 40
  },
  locationInfo: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: palette.white,
    borderRadius: 8,
    borderWidth: 1,
    bottom: 24,
    flexDirection: "row",
    gap: 16,
    left: 24,
    padding: 17,
    position: "absolute",
    right: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 6
  },
  locationIcon: {
    alignItems: "center",
    backgroundColor: "rgba(106, 1, 0, 0.08)",
    borderRadius: 999,
    height: 35,
    justifyContent: "center",
    width: 35
  },
  locationCopy: {
    flex: 1
  },
  locationTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 24
  },
  locationText: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  }
});
