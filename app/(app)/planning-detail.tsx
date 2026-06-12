import {
  Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { router,
  useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect,
  useState } from "react";
import { ActivityIndicator,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomerAccountMenu } from "@/components/CustomerAccountMenu";
import { appLogger } from "@/libs/logger";
import { notifyError, notifySuccess } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { normalizeAccessRole } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";
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
  const { session } = useAuth();
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [planning, setPlanning] = useState<PublicPlanning | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

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
  const zoneTitle = planning?.sub_area || "KHU TRUNG TÂM TÀI CHÍNH";
  const zoneDescription = planningZoneDescription(planning);
  const displayLegends = planningLandLegends(planning?.land_type_notes);

  async function handleShare() {
    await Share.share({
      message: planning?.title || "Khu đô thị Thủ Thiêm",
      title: planning?.title || "Chi tiết quy hoạch"
    });
  }

  async function handleDownloadPdf() {
    if (!params.id) {
      notifyError("Không tìm thấy quy hoạch để tải hồ sơ.");
      return;
    }

    if (normalizeAccessRole(session?.user.role) !== "customer") {
      notifyError("Vui lòng đăng nhập bằng tài khoản khách hàng để tải hồ sơ quy hoạch.");
      return;
    }

    const pdfUrl = planning?.pdf_url?.trim();
    if (!pdfUrl || !/^https?:\/\//i.test(pdfUrl)) {
      notifyError("Hồ sơ quy hoạch PDF đang được cập nhật.");
      return;
    }

    setPdfLoading(true);
    try {
      const fileName = await savePlanningPdfToDevice(pdfUrl, planning?.title || "Hồ sơ quy hoạch");
      notifySuccess({
        description: fileName,
        message: "Tải hồ sơ quy hoạch thành công."
      });
    } catch (error) {
      appLogger.warn("customer.planningPdf", "Không thể tải file quy hoạch về thiết bị.", {
        error,
        id: params.id,
        url: pdfUrl
      });
      notifyError("Không thể tải hồ sơ quy hoạch. Vui lòng thử lại.");
    } finally {
      setPdfLoading(false);
    }
  }

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
            <Text style={styles.eyebrow}>VỊ TRÍ ĐANG CHỌN</Text>
            <Text style={styles.title}>{planning?.title || "Khu đô thị Thủ Thiêm"}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={20} color={palette.brown} />
          </Pressable>
        </View>

        <View style={styles.zoneCard}>
          <View style={styles.zoneHeader}>
            <View style={styles.zoneColor} />
            <Text style={styles.zoneTitle}>{zoneTitle.toUpperCase()}</Text>
          </View>
          <Text style={styles.zoneDescription}>{zoneDescription}</Text>
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
            {displayLegends.map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={pdfLoading}
          onPress={handleDownloadPdf}
          style={[styles.downloadButton, pdfLoading && styles.downloadButtonDisabled]}
        >
          {pdfLoading ? (
            <ActivityIndicator color={palette.white} size="small" />
          ) : (
            <Ionicons name="download-outline" size={20} color={palette.white} />
          )}
          <Text style={styles.downloadText}>{pdfLoading ? "Đang tải" : "TẢI HỒ SƠ QUY HOẠCH (PDF)"}</Text>
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

function planningZoneDescription(planning: PublicPlanning | null) {
  if (!planning) return "Ký hiệu: C1-Z1. Quy hoạch chi tiết 1/2000 phục vụ phát triển kinh tế vùng.";

  const parts = [planning.symbol ? `Ký hiệu: ${planning.symbol}.` : "", planning.description || ""].filter(Boolean);
  return parts.join(" ") || "Thông tin quy hoạch đang được cập nhật.";
}

function planningLandLegends(notes?: string | null) {
  if (!notes?.trim()) return legends;

  const labels = notes
    .split(/[\n;,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (labels.length === 0) return legends;

  return labels.map((label, index) => ({
    color: legends[index % legends.length].color,
    label
  }));
}

function safePlanningPdfFileName(title: string, url: string) {
  const extensionMatch = url.match(/\.([a-z0-9]{2,5})(?:[?#].*)?$/i);
  const extension = extensionMatch?.[1] ? `.${extensionMatch[1].toLowerCase()}` : ".pdf";
  const baseName = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "ho-so-quy-hoach";

  return `${baseName}${extension}`;
}

function uniquePlanningPdfFileName(fileName: string) {
  const suffix = Date.now();
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex <= 0) return `${fileName}-${suffix}`;
  return `${fileName.slice(0, dotIndex)}-${suffix}${fileName.slice(dotIndex)}`;
}

function deletePlanningPdfFile(file: FileSystem.File) {
  const writableFile = file as unknown as { exists?: boolean; delete?: () => void };

  try {
    if (writableFile.exists && writableFile.delete) writableFile.delete();
  } catch {
    // Nếu file không tồn tại hoặc hệ điều hành không cho xóa, download sẽ báo lỗi chi tiết.
  }
}

async function savePlanningPdfToDevice(url: string, title: string) {
  const fileName = uniquePlanningPdfFileName(safePlanningPdfFileName(title, url));
  const target = new FileSystem.File(FileSystem.Paths.cache, fileName);

  deletePlanningPdfFile(target);

  const file = await FileSystem.File.downloadFileAsync(url, target, { idempotent: true });

  await Share.share({
    message: fileName,
    title: fileName,
    url: file.uri
  });

  return fileName;
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
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    marginTop: 4
  },
  shareButton: {
    alignItems: "center",
    backgroundColor: palette.pale,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  zoneCard: {
    backgroundColor: palette.background,
    borderColor: "rgba(227, 190, 184, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  zoneHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  zoneColor: {
    backgroundColor: palette.darkRed,
    borderRadius: 2,
    height: 16,
    width: 16
  },
  zoneTitle: {
    color: palette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  zoneDescription: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  statsGrid: {
    gap: 8,
    paddingTop: 8
  },
  statCard: {
    backgroundColor: palette.pale,
    borderRadius: 8,
    padding: 8,
    width: "100%"
  },
  statLabel: {
    color: palette.brown,
    fontFamily: appFonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    lineHeight: 15,
    textTransform: "uppercase"
  },
  statValue: {
    color: palette.darkRed,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  legendSection: {
    gap: 16,
    marginTop: 32
  },
  legendTitle: {
    color: palette.brown,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
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
    height: 24,
    width: 24
  },
  legendText: {
    color: palette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  downloadButton: {
    alignItems: "center",
    backgroundColor: palette.darkRed,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 32,
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
  },
  downloadButtonDisabled: {
    opacity: 0.7
  },
  downloadText: {
    color: palette.white,
    flexShrink: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
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
