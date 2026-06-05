import {
  Ionicons } from "@expo/vector-icons";
import { router,
  useLocalSearchParams } from "expo-router";
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
import { appLogger } from "@/libs/logger";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, type PublicPlanning } from "@/services/customer/api";

const palette = {
  background: "#f8f9fa",
  brown: "#5b403c",
  darkRed: "#6a0100",
  goldDark: "#795900",
  pale: "#f3f4f5",
  text: "#191c1d",
  white: "#ffffff"
};

const logo = require("@/assets/images/customer/project-detail/kn-logo.png");

const stats = [
  { label: "MẬT ĐỘ XD", value: "65%" },
  { label: "TẦNG CAO TỐI ĐA", value: "88" },
  { label: "HỆ SỐ SDĐ", value: "12.5" },
  { label: "KHOẢNG LÙI", value: "6-10m" }
] as const;

const legends = [
  { color: "#6a0100", label: "Đất trung tâm thương mại" },
  { color: "#efc15c", label: "Đất ở cao tầng" },
  { color: "#795900", label: "Đất ở biệt thự thấp tầng" },
  { color: "#484747", label: "Hạ tầng kỹ thuật" },
  { color: "#e3beb8", label: "Công viên cây xanh" }
] as const;

export default function PlanningDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [planning, setPlanning] = useState<PublicPlanning | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let active = true;

    customerPublicApi
      .planningDetail(params.id)
      .then((response) => {
        if (active) setPlanning(response.data);
      })
      .catch((error) => {
        appLogger.warn("customer.planningDetail", "Không thể tải chi tiết quy hoạch.", { error, id: params.id });
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  const displayStats = planning
    ? [
        { label: "MẬT ĐỘ XD", value: planning.density || "N/A" },
        { label: "TẦNG CAO TỐI ĐA", value: planning.max_height || "N/A" },
        { label: "HỆ SỐ SDĐ", value: planning.land_use_ratio || "N/A" },
        { label: "KHOẢNG LÙI", value: planning.setback || "N/A" }
      ]
    : stats;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/(tabs)")} style={styles.brandRow}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.brandText}>KHỞI NGUYÊN LAND</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setAccountMenuVisible(true)} style={styles.accountButton}>
          <Ionicons name="person-circle-outline" size={20} color={palette.brown} />
        </Pressable>
      </View>
      <CustomerAccountMenu onClose={() => setAccountMenuVisible(false)} visible={accountMenuVisible} />

      <ScrollView bounces contentContainerStyle={styles.scroll} overScrollMode="always" showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.eyebrow}>{planning?.city || "VỊ TRÍ ĐANG CHỌN"}</Text>
            <Text style={styles.title}>{planning?.title || "Khu đô thị Thủ Thiêm"}</Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={28} color={palette.brown} />
          </Pressable>
        </View>

        <View style={styles.zoneCard}>
          <View style={styles.zoneHeader}>
            <View style={styles.zoneColor} />
            <Text style={styles.zoneTitle}>KHU TRUNG TÂM TÀI CHÍNH</Text>
          </View>
          <Text style={styles.zoneDescription}>
            {planning?.description || "Ký hiệu: C1-Z1. Quy hoạch chi tiết 1/2000 phục vụ phát triển kinh tế vùng."}
          </Text>
          <View style={styles.statsGrid}>
            {displayStats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.legendSection}>
          <Text style={styles.legendTitle}>CHÚ GIẢI LOẠI ĐẤT</Text>
          <View style={styles.legendList}>
            {(planning?.land_type_notes ? [{ color: "#6a0100", label: planning.land_type_notes }] : legends).map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable accessibilityRole="button" style={styles.downloadButton}>
          <Ionicons name="document-text-outline" size={24} color={palette.white} />
          <Text style={styles.downloadText}>TẢI HỒ SƠ QUY HOẠCH (PDF)</Text>
        </Pressable>

        <View style={styles.updatedWrap}>
          <Text style={styles.updatedText}>Cập nhật lần cuối: {formatUpdatedDate(planning?.updated_at) || "15/10/2023"}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatUpdatedDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("vi-VN");
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
    backgroundColor: palette.white,
    paddingBottom: 80,
    paddingHorizontal: 24,
    paddingTop: 24
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  titleCopy: {
    flex: 1,
    paddingRight: 20
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
    fontFamily: appFonts.semiBold,
    fontSize: 30,
    letterSpacing: -0.48,
    lineHeight: 38,
    marginTop: 8
  },
  shareButton: {
    alignItems: "center",
    backgroundColor: palette.pale,
    borderRadius: 999,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  zoneCard: {
    backgroundColor: palette.background,
    borderColor: "rgba(227, 190, 184, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    marginTop: 24,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  zoneHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  zoneColor: {
    backgroundColor: palette.darkRed,
    borderRadius: 2,
    height: 32,
    width: 32
  },
  zoneTitle: {
    color: palette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: 1.2,
    lineHeight: 24
  },
  zoneDescription: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 30
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 8
  },
  statCard: {
    backgroundColor: palette.pale,
    borderRadius: 8,
    minHeight: 88,
    padding: 16,
    width: "48.7%"
  },
  statLabel: {
    color: palette.brown,
    fontFamily: appFonts.bold,
    fontSize: 12,
    lineHeight: 18
  },
  statValue: {
    color: palette.darkRed,
    fontFamily: appFonts.regular,
    fontSize: 30,
    lineHeight: 38
  },
  legendSection: {
    gap: 16,
    marginTop: 32
  },
  legendTitle: {
    color: palette.brown,
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: 1.2,
    lineHeight: 24
  },
  legendList: {
    gap: 8
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16
  },
  legendSwatch: {
    borderRadius: 2,
    height: 48,
    width: 48
  },
  legendText: {
    color: palette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 24,
    lineHeight: 34
  },
  downloadButton: {
    alignItems: "center",
    backgroundColor: palette.darkRed,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 32,
    minHeight: 64,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
  },
  downloadText: {
    color: palette.white,
    flexShrink: 1,
    fontFamily: appFonts.regular,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center"
  },
  updatedWrap: {
    alignItems: "center",
    borderTopColor: "rgba(227, 190, 184, 0.3)",
    borderTopWidth: 1,
    marginHorizontal: -24,
    marginTop: 80,
    paddingBottom: 24,
    paddingTop: 25
  },
  updatedText: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.7
  }
});
