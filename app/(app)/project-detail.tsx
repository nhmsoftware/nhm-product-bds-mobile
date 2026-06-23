import {
  Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { router,
  useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect,
  useMemo,
  useState } from "react";
import { ActivityIndicator,
  Image,
  Linking,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";

import WebView from "react-native-webview";

import { CustomerAccountMenu } from "@/components/CustomerAccountMenu";
import { appLogger } from "@/libs/logger";
import { mediaSource } from "@/libs/media";
import { notifyError, notifySuccess } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { normalizeAccessRole } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";
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

const imageNotFound = require("@/assets/images/placeholders/image_not_found.png");

const projectDetailImages = {
  hero: imageNotFound,
  logo: require("@/assets/images/customer/project-detail/kn-logo.png"),
  planningMap: imageNotFound,
  locationMap: imageNotFound
};

const amenities = [
  { icon: "water-outline", label: "Bể bơi vô cực" },
  { icon: "barbell-outline", label: "Phòng Gym 5 sao" },
  { icon: "trail-sign-outline", label: "Công viên trung\ntâm" },
  { icon: "shield-half-outline", label: "An ninh 24/7" }
] as const;

export default function ProjectDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { width: windowWidth } = useWindowDimensions();
  const { session } = useAuth();
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [project, setProject] = useState<PublicProject | null>(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [brochureLoading, setBrochureLoading] = useState(false);
  const [consultLoading, setConsultLoading] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    let active = true;

    customerPublicApi
      .projectDetail(params.id)
      .then((response) => {
        if (active) setProject(response.data);
      })
      .catch((error) => {
        appLogger.warn("customer.projectDetail", "Không thể tải chi tiết khu đất.", { error, id: params.id });
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  const projectAmenities = arrayFromUnknown(project?.amenities).slice(0, 4);
  const heroSlides = useMemo(() => projectHeroImages(project), [project]);
  const renderedHeroSlides = heroSlides.length > 0 ? heroSlides : [""];

  useEffect(() => {
    if (heroSlides.length > 0 && activeHeroIndex >= heroSlides.length) {
      setActiveHeroIndex(0);
    }
  }, [activeHeroIndex, heroSlides.length]);

  function handleHeroScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (heroSlides.length === 0) return;

    const slideWidth = event.nativeEvent.layoutMeasurement.width;
    if (slideWidth <= 0) return;

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    const nextActiveIndex = Math.min(heroSlides.length - 1, Math.max(0, nextIndex));
    setActiveHeroIndex((currentIndex) => currentIndex === nextActiveIndex ? currentIndex : nextActiveIndex);
  }

  async function handleDownloadBrochure() {
    const projectId = params.id;

    if (!projectId) {
      notifyError("Không tìm thấy khu đất để tải brochure.");
      return;
    }

    if (normalizeAccessRole(session?.user.role) !== "customer") {
      notifyError("Vui lòng đăng nhập bằng tài khoản khách hàng để tải brochure.");
      return;
    }

    setBrochureLoading(true);
    try {
      const response = await customerPublicApi.projectBrochure(projectId);
      const brochureUrl = response.data?.url;

      if (!brochureUrl) {
        notifyError("Brochure đang được cập nhật.");
        return;
      }

      try {
        const fileName = await saveProjectBrochureToDevice(
          brochureUrl,
          response.data?.project_name || project?.name || "Brochure khu đất"
        );

        notifySuccess({
          description: fileName,
          message: response.message || "Tải brochure thành công."
        });
      } catch (downloadError) {
        appLogger.warn("customer.projectBrochure", "Không thể tải file brochure về thiết bị.", {
          downloadError,
          id: projectId,
          url: brochureUrl
        });
        notifyError("Không thể tải brochure. Vui lòng thử lại.");
      }
    } catch (error) {
      notifyError(error, "Không thể tải brochure. Vui lòng thử lại.");
    } finally {
      setBrochureLoading(false);
    }
  }

  async function handleConsult() {
    const projectId = params.id;

    if (!projectId) {
      notifyError("Không tìm thấy khu đất để tư vấn.");
      return;
    }

    setConsultLoading(true);
    try {
      const response = await customerPublicApi.projectHotline(projectId);
      const hotline = response.data?.hotline?.trim();

      if (!hotline) {
        notifyError("Hotline tư vấn hiện chưa khả dụng.");
        return;
      }

      const phoneUrl = `tel:${hotline.replace(/[^+\d#*,;]/g, "")}`;
      const supported = await Linking.canOpenURL(phoneUrl);

      if (!supported) {
        notifyError("Thiết bị không hỗ trợ chức năng gọi điện.");
        return;
      }

      await Linking.openURL(phoneUrl);
    } catch (error) {
      notifyError(error, "Không thể mở chức năng gọi điện. Vui lòng thử lại.");
    } finally {
      setConsultLoading(false);
    }
  }

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
          <ScrollView
            alwaysBounceHorizontal={renderedHeroSlides.length > 1}
            bounces={renderedHeroSlides.length > 1}
            contentContainerStyle={styles.heroSliderContent}
            decelerationRate="fast"
            directionalLockEnabled
            horizontal
            nestedScrollEnabled
            onMomentumScrollEnd={handleHeroScroll}
            onScroll={handleHeroScroll}
            overScrollMode="always"
            pagingEnabled
            scrollEventThrottle={16}
            scrollEnabled={renderedHeroSlides.length > 1}
            showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
          >
            {renderedHeroSlides.map((slide, index) => (
              <View key={`${slide}-${index}`} style={[styles.heroSlide, { width: windowWidth }]}>
                <Image source={mediaSource(slide, projectDetailImages.hero)} style={styles.heroImage} />
              </View>
            ))}
          </ScrollView>
          <View pointerEvents="none" style={styles.heroOverlay} />
          <View pointerEvents="none" style={styles.heroCopy}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
            <Text style={styles.statusText}>{projectStatusLabel(project?.status)}</Text>
            </View>
            <Text style={styles.heroTitle}>{project?.name || "The Grand\nHorizon Estates"}</Text>
            <Text style={styles.heroSubtitle}>
              {project?.location || "A new paradigm of luxury living\nnestled in the heart of the capital\ndistrict."}
            </Text>
          </View>
          {heroSlides.length > 0 ? (
            <View pointerEvents="none" style={styles.dots}>
              {heroSlides.map((slide, index) => (
                <View key={`dot-${slide}-${index}`} style={index === activeHeroIndex ? styles.dotActive : styles.dot} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.ctaBar}>
          <Pressable
            accessibilityRole="button"
            disabled={brochureLoading}
            onPress={handleDownloadBrochure}
            style={[styles.brochureButton, brochureLoading && styles.actionButtonDisabled]}
          >
            {brochureLoading ? (
              <ActivityIndicator color={palette.darkRed} size="small" />
            ) : (
              <Ionicons name="download-outline" size={16} color={palette.darkRed} />
            )}
            <Text style={styles.brochureText}>{brochureLoading ? "Đang tải" : "Tải Brochure"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={consultLoading}
            onPress={handleConsult}
            style={[styles.consultButton, consultLoading && styles.actionButtonDisabled]}
          >
            {consultLoading ? (
              <ActivityIndicator color={palette.white} size="small" />
            ) : (
              <Ionicons name="call" size={15} color={palette.white} />
            )}
            <Text style={styles.consultText}>{consultLoading ? "Đang gọi" : "Tư vấn"}</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Về khu đất</Text>
            <View style={styles.descriptionCard}>
              {projectDescriptionParagraphs(project).map((paragraph) => (
                <Text key={paragraph} style={styles.bodyText}>
                  {paragraph}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quy hoạch</Text>
            {projectPlanningUrl(project) ? (
              <View style={styles.planningWebCard}>
                <WebView
                  source={{ uri: projectPlanningUrl(project) }}
                  style={styles.planningWebView}
                  containerStyle={styles.planningWebContainer}
                  javaScriptEnabled
                  domStorageEnabled
                  startInLoadingState
                  onError={(event) => {
                    appLogger.warn("customer.project.planningWebView", "Không thể mở bản đồ quy hoạch khu đất.", {
                      error: event.nativeEvent,
                      id: project?.id,
                      url: projectPlanningUrl(project)
                    });
                    notifyError("Không thể mở trang kiểm tra quy hoạch. Vui lòng thử lại.");
                  }}
                />
              </View>
            ) : (
              <Image source={mediaSource(projectPlanningImage(project), projectDetailImages.planningMap)} style={styles.planningMap} />
            )}
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
            <Text style={styles.sectionTitle}>Vị trí khu đất</Text>
            <Pressable
              accessibilityRole="button"
              disabled={!project?.google_maps_url}
              onPress={() => {
                if (project?.google_maps_url) Linking.openURL(project.google_maps_url).catch((error) => {
                  appLogger.warn("customer.projectLocation", "Không thể mở bản đồ khu đất.", { error, id: project?.id });
                  notifyError("Không thể mở bản đồ khu đất. Vui lòng thử lại.");
                });
              }}
              style={styles.locationCard}
            >
              <Image source={mediaSource(project?.location_image, projectDetailImages.locationMap)} style={styles.locationMap} />
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
            </Pressable>
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

function projectPlanningRecord(project: PublicProject | null) {
  return project?.planning_info && typeof project.planning_info === "object" && !Array.isArray(project.planning_info)
    ? project.planning_info as Record<string, unknown>
    : {};
}

function projectPlanningUrl(project: PublicProject | null) {
  const record = projectPlanningRecord(project);
  const values = [
    record["Link tra cứu quy hoạch"],
    record.planning_check_url,
    record.url,
    record.link
  ];

  const candidate = values.find((value) => typeof value === "string" && /^https?:\/\//i.test(value.trim()));
  return typeof candidate === "string" ? candidate.trim() : "";
}

function projectPlanningImage(project: PublicProject | null) {
  const record = projectPlanningRecord(project);
  const candidate = record["Ảnh quy hoạch"] ?? record.map_image ?? record.image;

  return typeof candidate === "string" ? candidate : firstFromUnknown(project?.planning_info);
}

function projectDescriptionParagraphs(project: PublicProject | null) {
  const fallback = [
    "Thông tin tổng quan khu đất đang được cập nhật.",
    "Đội ngũ tư vấn sẽ bổ sung thêm dữ liệu chi tiết khi chủ đầu tư công bố tài liệu mới."
  ];

  if (!project?.description) return fallback;

  const paragraphs = project.description
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.length > 0 ? paragraphs : fallback;
}

function uniqueStrings(values: unknown[]) {
  return Array.from(new Set(values.map((value) => typeof value === "string" ? value.trim() : "").filter(Boolean)));
}

function imageStringsFromUnknown(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const image = item as Record<string, unknown>;
        const candidate = image.url ?? image.image ?? image.src ?? image.path ?? image.banner;
        return typeof candidate === "string" ? candidate : "";
      }

      return "";
    })
    .filter(Boolean);
}

function projectHeroImages(project: PublicProject | null) {
  if (!project) return [];

  return uniqueStrings(imageStringsFromUnknown(project.banner)).slice(0, 8);
}

function projectStatusLabel(status?: string | number | null) {
  if (status === 1 || status === "1" || status === "available") return "OPENING";
  if (status === 2 || status === "2" || status === "reserved") return "RESERVING";
  if (status === 3 || status === "3" || status === "sold_out") return "SOLD OUT";
  return "OPENING SOON";
}

function projectDocumentExtension(source?: string | null) {
  if (!source) return "";
  const cleanSource = source.split("?")[0]?.split("#")[0] ?? source;
  return cleanSource.split(".").pop()?.trim().toLowerCase() || "";
}

function safeProjectBrochureFileName(title: string, url?: string | null) {
  const urlPath = url?.split("?")[0]?.split("#")[0] ?? "";
  const urlName = urlPath.split("/").pop() || "";
  let decodedUrlName = urlName;

  try {
    decodedUrlName = decodeURIComponent(urlName);
  } catch {
    decodedUrlName = urlName;
  }

  const rawName = decodedUrlName || `${title}.pdf`;
  const cleaned = rawName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
  const extension = projectDocumentExtension(cleaned || url) || "pdf";

  if (!cleaned) return `Brochure khu đất-${Date.now()}.${extension}`;
  if (cleaned.includes(".")) return cleaned;
  return `${cleaned}.${extension}`;
}

function uniqueProjectBrochureFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  const suffix = `${Date.now()}-${Math.round(Math.random() * 10000)}`;

  if (dotIndex <= 0) {
    return `${fileName}-${suffix}`;
  }

  return `${fileName.slice(0, dotIndex)}-${suffix}${fileName.slice(dotIndex)}`;
}

function deleteProjectBrochureFile(file: FileSystem.File) {
  const writableFile = file as unknown as { exists?: boolean; delete?: () => void };

  try {
    if (writableFile.exists && writableFile.delete) {
      writableFile.delete();
    }
  } catch {
    // Nếu file không tồn tại hoặc hệ điều hành không cho xóa, download sẽ báo lỗi chi tiết.
  }
}

async function saveProjectBrochureToDevice(url: string, title: string) {
  const fileName = uniqueProjectBrochureFileName(safeProjectBrochureFileName(title, url));
  const target = new FileSystem.File(FileSystem.Paths.cache, fileName);

  deleteProjectBrochureFile(target);

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
    backgroundColor: palette.background,
    paddingBottom: 48
  },
  hero: {
    height: 530,
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative"
  },
  heroSliderContent: {
    height: "100%"
  },
  heroSlide: {
    height: "100%",
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
    lineHeight: 48,
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
  actionButtonDisabled: {
    opacity: 0.68
  },
  brochureText: {
    color: palette.darkRed,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
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
    lineHeight: 20
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
  planningWebCard: {
    borderColor: palette.line,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden"
  },
  planningWebHeader: {
    alignItems: "center",
    backgroundColor: palette.white,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  planningWebTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 14,
    lineHeight: 20
  },
  planningWebUrl: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 285
  },
  planningWebContainer: {
    backgroundColor: palette.white,
    borderRadius: 22,
    height: 420,
    overflow: "hidden"
  },
  planningWebView: {
    backgroundColor: palette.white,
    flex: 1
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
