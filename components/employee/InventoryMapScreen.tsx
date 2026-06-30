import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { VideoView, useVideoPlayer } from "expo-video";
import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator, AppState, Alert, BackHandler, Clipboard, Image, Linking, Modal,
  KeyboardAvoidingView, Platform, Pressable as RNPressable, RefreshControl, ScrollView, Share,
  StyleSheet, Text, TextInput, useWindowDimensions,
  type GestureResponderEvent, type ImageSourcePropType, type LayoutChangeEvent,
  type NativeScrollEvent, type NativeSyntheticEvent, type TextLayoutEventData, View
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { Path, Svg, SvgUri } from "react-native-svg";
import {
  EMPLOYEE_HEADER_HEIGHT, EmployeeAvatarButton, EmployeeBadge, EmployeeButton, EmployeeCard,
  EmployeeInputPreview, EmployeeListRow, EmployeeMetric, EmployeeNotificationButton,
  EmployeePage, EmployeeSectionTitle
} from "@/components/EmployeeUI";
import { employeePalette } from "@/libs/employee-theme";
import { API_URL, STORAGE_KEYS } from "@/libs/env";
import { useI18n } from "@/libs/i18n";
import { appLogger } from "@/libs/logger";
import { mediaSource, mediaUrl } from "@/libs/media";
import { notifyError, notifySuccess } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { ApiRequestError } from "@/libs/api";
import { isBaseEmployeeRole, isDepartmentTransferApproverRole, isExecutiveAdminRole, isManagerAccessRole, isRecruitmentApproverRole } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";
import type { AuthSession, AuthUser } from "@/services/auth/types";
import { employeeApi } from "@/services/employee/api";
import { useNotificationState, useRealtimeEvent, useRealtimeRoom } from "@/services/notifications/provider";
import type { LearningLessonAttachment, LearningLessonDetail, LearningLessonProgressUpdate, MandatoryLearningCourse, MandatoryLearningLesson, MandatoryLearningQuiz } from "@/services/employee/types";
import WebView from "react-native-webview";
import { RichText, Toolbar, DEFAULT_TOOLBAR_ITEMS, useEditorBridge, useBridgeState, ImageBridge, TenTapStartKit } from "@10play/tentap-editor";
import RenderHtml from "react-native-render-html";
import { styles } from "@/components/employee/utils/styles";
import { useEmployeeApiData } from "./hooks/useEmployeeApiData";
import { useRealtimeAreaComments } from "./hooks/useRealtimeAreaComments";
import { apiList, apiNumber, apiText, directionUrlFromRecord, isApiObject } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { defaultInventoryInfoTabs, inventoryImages, inventoryLotCellSize, inventoryLotGridColumns, inventoryLotGridHorizontalPadding } from "./utils/constants";
import type { InventoryInfoTabKey } from "./utils/constants";
import { inventoryLotCode, inventoryLotStatus, inventoryLotStatusLabel, sortInventoryLots } from "./utils/inventoryLotUtils";
import { back } from "./utils/navigation";

import { commentInitials, formatApiDateTime } from "./utils/formatters";
function normalizeAreaComment(value: unknown, fallbackAreaId = "") {
  if (!isApiObject(value)) {
    return null;
  }

  const commentSource = isApiObject(value.comment) ? value.comment : value;
  const areaId = apiText(value.area_id ?? value.areaId ?? commentSource.area_id ?? commentSource.areaId, fallbackAreaId).trim();
  const content = apiText(commentSource.content ?? commentSource.text, "").trim();

  if (!areaId || !content) {
    return null;
  }

  return {
    areaId,
    comment: {
      ...commentSource,
      area_id: areaId
    }
  };
}
// ---- Local helpers ----

function CommentRow({
  initials,
  name,
  text,
  time,
  tone
}: {
  initials: string;
  name: string;
  text: string;
  time: string;
  tone: "red" | "gold";
}) {
  return (
    <View style={styles.inventoryCommentRow}>
      <View style={[styles.inventoryCommentAvatar, tone === "gold" && styles.inventoryCommentAvatarGold]}>
        <Text style={[styles.inventoryCommentInitials, tone === "gold" && styles.inventoryCommentInitialsGold]}>{initials}</Text>
      </View>
      <View style={styles.flex}>
        <View style={styles.inventoryCommentMeta}>
          <Text style={styles.inventoryCommentName}>{name}</Text>
          <Text style={styles.inventoryCommentTime}>{time}</Text>
        </View>
        <Text style={styles.inventoryCommentText}>{text}</Text>
      </View>
    </View>
  );
}






const inventoryInfoTabs: { icon: ComponentProps<typeof Ionicons>["name"]; key: InventoryInfoTabKey; label: string }[] = [
  { icon: "location-outline", key: "location", label: "Vị trí" },
  { icon: "shield-checkmark-outline", key: "legal", label: "Pháp lý" },
  { icon: "map-outline", key: "floor_plan", label: "Mặt bằng" },
  { icon: "folder-open-outline", key: "documents", label: "Tài liệu" }
];



function inventoryInfoTabsFromRecord(value: unknown): InventoryInfoTab[] {
  const rows = apiList(value);
  if (rows.length === 0) return defaultInventoryInfoTabs;

  const tabs = rows
    .map((row): InventoryInfoTab | null => {
      const key = apiText(row.key, "") as InventoryInfoTabKey;
      if (!["location", "legal", "floor_plan", "documents"].includes(key)) return null;

      return {
        actionLabel: apiText(row.action_label ?? row.actionLabel, ""),
        actionUrl: apiText(row.action_url ?? row.actionUrl, ""),
        content: apiText(row.content, defaultInventoryInfoTabs.find((tab) => tab.key === key)?.content ?? "Đang cập nhật."),
        imageUrl: apiText(row.image_url ?? row.imageUrl, ""),
        key,
        label: apiText(row.label, defaultInventoryInfoTabs.find((tab) => tab.key === key)?.label ?? "Thông tin"),
        title: apiText(row.title, defaultInventoryInfoTabs.find((tab) => tab.key === key)?.title ?? "Thông tin")
      };
    })
    .filter((tab): tab is InventoryInfoTab => Boolean(tab));

  return tabs.length > 0 ? tabs : defaultInventoryInfoTabs;
}



function inventoryIntroArticleFromRecord(value: unknown, areaName: string) {
  const article = isApiObject(value) ? value : {};

  return {
    body: apiText(article.body, "Chưa thiết lập."),
    summary: apiText(article.summary, "Chưa thiết lập."),
    title: apiText(article.title, areaName || "Giới thiệu khu đất")
  };
}



function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.inventoryLegendItem}>
      <View style={[styles.inventoryLegendDot, { backgroundColor: color }]} />
      <Text style={styles.inventoryLegendText}>{label}</Text>
    </View>
  );
}



function MapControl({
  disabled,
  highlight,
  icon,
  onPress
}: {
  disabled?: boolean;
  highlight?: boolean;
  icon: ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.inventoryMapControl, (pressed || disabled) && styles.pressed]}
    >
      <Ionicons name={icon} size={highlight ? 22 : 24} color={highlight ? employeePalette.red : "#111111"} />
    </Pressable>
  );
}



function AreaCommentsSection({
  comments,
  currentPage,
  disabled,
  draft,
  emptyText,
  loadingPage,
  onChangeDraft,
  onSelectPage,
  onSubmit,
  pageCount,
  submitting,
  totalCount
}: {
  comments: ApiObject[];
  currentPage?: number;
  disabled?: boolean;
  draft: string;
  emptyText: string;
  loadingPage?: number | null;
  onChangeDraft: (value: string) => void;
  onSelectPage?: (page: number) => void;
  onSubmit: () => void;
  pageCount?: number;
  submitting?: boolean;
  totalCount?: number;
}) {
  const displayCount = totalCount ?? comments.length;
  const safeCurrentPage = Math.max(1, currentPage ?? 1);
  const safePageCount = Math.max(1, pageCount ?? 1);
  const pageNumbers = Array.from({ length: safePageCount }, (_, index) => index + 1);

  return (
    <View style={styles.inventoryComments}>
      <View style={styles.inventoryCommentsHeader}>
        <Text style={styles.inventoryCommentsTitle}>BÌNH LUẬN & THẢO LUẬN</Text>
        <View style={styles.inventoryCommentsCount}>
          <Text style={styles.inventoryCommentsCountText}>{displayCount}</Text>
        </View>
      </View>
      {comments.length > 0 ? (
        comments.map((comment, index) => {
          const commentUser = isApiObject(comment.user) ? comment.user : {};
          const name = apiText(comment.user_name ?? comment.userName ?? commentUser.name, "Nhân viên hệ thống");

          return (
            <CommentRow
              key={apiText(comment.id, `${name}-${index}`)}
              initials={commentInitials(name)}
              name={name}
              text={apiText(comment.content ?? comment.text, "")}
              time={formatApiDateTime(comment.created_at ?? comment.createdAt, "Vừa xong")}
              tone={index % 2 === 0 ? "red" : "gold"}
            />
          );
        })
      ) : (
        <Text style={styles.inventoryCommentText}>{emptyText}</Text>
      )}
      {safePageCount > 1 ? (
        <View style={styles.inventoryCommentsPagination}>
          {pageNumbers.map((page) => {
            const active = page === safeCurrentPage;

            return (
              <Pressable
                accessibilityRole="button"
                disabled={Boolean(loadingPage) || active}
                key={page}
                onPress={() => onSelectPage?.(page)}
                style={({ pressed }) => [
                  styles.inventoryCommentsPageButton,
                  active && styles.inventoryCommentsPageButtonActive,
                  pressed && styles.pressed
                ]}
              >
                <Text style={[styles.inventoryCommentsPageText, active && styles.inventoryCommentsPageTextActive]}>
                  {page}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={styles.inventoryCommentInput}>
        <TextInput
          editable={!disabled && !submitting}
          onChangeText={onChangeDraft}
          placeholder="Nhập nội dung trao đổi..."
          placeholderTextColor="#8f706b"
          style={styles.inventoryCommentTextInput}
          value={draft}
        />
        <Pressable
          accessibilityRole="button"
          disabled={disabled || submitting || !draft.trim()}
          onPress={onSubmit}
          style={({ pressed }) => [styles.inventoryCommentSendButton, (pressed || submitting) && styles.pressed]}
        >
          <Ionicons name="send" size={22} color="#990100" />
        </Pressable>
      </View>
    </View>
  );
}



export function InventoryMapScreen() {
  const commentsPerPage = 10;
  const mapZoomMin = 1;
  const mapZoomMax = 2.5;
  const mapZoomStep = 0.25;
  const { width: viewportWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ areaId?: string; lotId?: string }>();
  const rawAreaId = params.areaId;
  const rawLotId = params.lotId;
  const areaId = Array.isArray(rawAreaId) ? rawAreaId[0] : rawAreaId;
  const routeLotId = Array.isArray(rawLotId) ? rawLotId[0] : rawLotId;
  const [selectedLotId, setSelectedLotId] = useState(routeLotId ?? "");
  const [mapCommentDraft, setMapCommentDraft] = useState("");
  const [mapCommentSubmitting, setMapCommentSubmitting] = useState(false);
  const [pagedAreaComments, setPagedAreaComments] = useState<ApiObject[]>([]);
  const [commentsPagination, setCommentsPagination] = useState<ApiObject>({});
  const [commentsLoadingPage, setCommentsLoadingPage] = useState<number | null>(null);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [selectedInfoTab, setSelectedInfoTab] = useState<InventoryInfoTabKey>("location");
  const [lotGridWidth, setLotGridWidth] = useState(viewportWidth);
  const [mapZoom, setMapZoom] = useState(mapZoomMin);
  const inventoryFocusedAreaIdRef = useRef<string | undefined>(undefined);
  const { data, failed, loading } = useEmployeeApiData(
    () => areaId ? employeeApi.inventoryMap(areaId, { comments_per_page: commentsPerPage, page: 1 }) : Promise.resolve({ data: {} }),
    [areaId, inventoryRefreshKey]
  );
  const inventoryMapData = isApiObject(data) ? data : {};
  const apiLots = useMemo(() => apiList(inventoryMapData.lots ?? inventoryMapData.lot_list ?? inventoryMapData.lotList ?? data), [data, inventoryMapData.lotList, inventoryMapData.lot_list, inventoryMapData.lots]);
  const salesBoardImageUri = mediaUrl(
    inventoryMapData.sales_board_image ??
      inventoryMapData.salesBoardImage ??
      inventoryMapData.map_image ??
      inventoryMapData.mapImage ??
      inventoryMapData.image_url ??
      inventoryMapData.imageUrl
  );
  const salesBoardEmbed = apiText(
    inventoryMapData.sales_board_iframe ??
      inventoryMapData.salesBoardIframe ??
      inventoryMapData.iframe ??
      inventoryMapData.iframe_url ??
      inventoryMapData.iframeUrl ??
      inventoryMapData.embed_url ??
      inventoryMapData.embedUrl,
    ""
  ).trim();
  const salesBoardEmbedSource = salesBoardEmbed
    ? salesBoardEmbed.startsWith("<")
      ? { html: `<meta name="viewport" content="width=device-width, initial-scale=1" /><style>html,body,iframe{height:100%;margin:0;width:100%;} iframe{border:0;}</style>${salesBoardEmbed}` }
      : { uri: salesBoardEmbed }
    : null;
  const lotItems = useMemo(
    () =>
      sortInventoryLots(apiLots).map((lot, index) => ({
        code: inventoryLotCode(lot, `L${index + 1}`),
        id: apiText(lot.id ?? lot.lot_id ?? lot.lotId, ""),
        status: inventoryLotStatus(lot)
      })),
    [apiLots]
  );
  const activeLotId = selectedLotId || lotItems.find((lot) => lot.id)?.id || "";
  const { data: activeLotData } = useEmployeeApiData(
    () => activeLotId ? employeeApi.lotDetail(activeLotId) : Promise.resolve({ data: {} }),
    [activeLotId, inventoryRefreshKey]
  );
  const activeLot = isApiObject(activeLotData) ? activeLotData : {};
  const fetchedAreaComments = useMemo(() => apiList(inventoryMapData.comments), [inventoryMapData.comments]);
  const fetchedCommentsPagination = useMemo(
    () => isApiObject(inventoryMapData.comments) ? inventoryMapData.comments : {},
    [inventoryMapData.comments]
  );
  const { appendComment: appendAreaComment, comments: areaComments } = useRealtimeAreaComments(areaId ?? "", pagedAreaComments);
  const commentsCurrentPage = apiNumber(commentsPagination.current_page, 1);
  const commentsLastPage = apiNumber(commentsPagination.last_page, 1);
  const commentsTotal = Math.max(apiNumber(commentsPagination.total, areaComments.length), areaComments.length);
  const activeLotAreaObject = isApiObject(activeLot.area) ? activeLot.area : null;
  const activeLotArea = apiText(
    activeLot.area_name ?? activeLotAreaObject?.name ?? activeLot.location ?? inventoryMapData.area_name,
    ""
  );
  const activeLotStatus = inventoryLotStatus(activeLot, lotItems.find((lot) => lot.id === activeLotId)?.status);
  const backendInfoTabs = useMemo(() => inventoryInfoTabsFromRecord(inventoryMapData.info_tabs ?? inventoryMapData.infoTabs), [inventoryMapData.infoTabs, inventoryMapData.info_tabs]);
  const activeInfoTab = backendInfoTabs.find((tab) => tab.key === selectedInfoTab) ?? backendInfoTabs[0] ?? defaultInventoryInfoTabs[0];
  const introArticle = useMemo(
    () => inventoryIntroArticleFromRecord(inventoryMapData.intro_article ?? inventoryMapData.introArticle, activeLotArea),
    [activeLotArea, inventoryMapData.introArticle, inventoryMapData.intro_article]
  );
  const directionUrl = directionUrlFromRecord(activeLot) || directionUrlFromRecord(inventoryMapData);
  const mapZoomStyle = useMemo(() => ({ transform: [{ scale: mapZoom }] }), [mapZoom]);
  const lotGridColumnGap = useMemo(() => {
    const contentWidth = lotGridWidth - inventoryLotGridHorizontalPadding * 2;
    const gapSlots = inventoryLotGridColumns - 1;

    if (contentWidth <= 0 || gapSlots <= 0) {
      return 0;
    }

    return Math.max(0, (contentWidth - inventoryLotGridColumns * inventoryLotCellSize) / gapSlots);
  }, [lotGridWidth]);

  const handleLotGridLayout = useCallback((event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    setLotGridWidth((current) => current === width ? current : width);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!areaId) {
        return undefined;
      }

      if (inventoryFocusedAreaIdRef.current !== areaId) {
        inventoryFocusedAreaIdRef.current = areaId;
        return undefined;
      }

      setInventoryRefreshKey((value) => value + 1);

      return undefined;
    }, [areaId])
  );

  useEffect(() => {
    if (routeLotId) {
      setSelectedLotId(routeLotId);
    }
  }, [routeLotId]);

  useEffect(() => {
    if (!selectedLotId) return;
    if (lotItems.some((lot) => lot.id === selectedLotId)) return;
    setSelectedLotId("");
  }, [lotItems, selectedLotId]);

  useEffect(() => {
    setPagedAreaComments(fetchedAreaComments);
    setCommentsPagination(fetchedCommentsPagination);
  }, [areaId, fetchedAreaComments, fetchedCommentsPagination]);

  useEffect(() => {
    setMapZoom(mapZoomMin);
  }, [areaId, salesBoardEmbed, salesBoardImageUri]);

  useEffect(() => {
    if (backendInfoTabs.some((tab) => tab.key === selectedInfoTab)) return;
    setSelectedInfoTab(backendInfoTabs[0]?.key ?? "location");
  }, [backendInfoTabs, selectedInfoTab]);

  function changeMapZoom(direction: 1 | -1) {
    setMapZoom((current) => {
      const nextZoom = current + direction * mapZoomStep;
      return Math.min(mapZoomMax, Math.max(mapZoomMin, Number(nextZoom.toFixed(2))));
    });
  }

  async function loadAreaCommentsPage(page: number) {
    if (!areaId || commentsLoadingPage || page === commentsCurrentPage) return;

    setCommentsLoadingPage(page);
    try {
      const response = await employeeApi.inventoryMap(areaId, {
        comments_per_page: apiNumber(commentsPagination.per_page, commentsPerPage),
        page
      });
      const nextData = isApiObject(response.data) ? response.data : {};
      const nextCommentsPayload = isApiObject(nextData.comments) ? nextData.comments : {};
      const nextComments = apiList(nextData.comments);

      setPagedAreaComments(nextComments);
      setCommentsPagination(nextCommentsPayload);
    } catch (error) {
      appLogger.warn("employee.inventory-map.comments", "Không thể tải trang bình luận khu đất.", { areaId, page, error });
      notifyError(error, "Không thể tải trang bình luận.");
    } finally {
      setCommentsLoadingPage(null);
    }
  }

  async function submitMapLotComment() {
    const content = mapCommentDraft.trim();
    if (!areaId || !content) return;

    setMapCommentSubmitting(true);
    try {
      const response = await employeeApi.addAreaComment(areaId, content);
      const createdComment = normalizeAreaComment(response.data, areaId);
      if (createdComment) {
        appendAreaComment(createdComment.comment);
        setCommentsPagination((current) => ({
          ...current,
          total: apiNumber(current.total, areaComments.length) + 1
        }));
      }
      setMapCommentDraft("");
    } catch (error) {
      appLogger.warn("employee.inventory-map.comment", "Không thể gửi bình luận khu đất.", { areaId, error });
      notifyError(error, "Không thể gửi bình luận.");
    } finally {
      setMapCommentSubmitting(false);
    }
  }

  async function openInventoryDirections() {
    if (!directionUrl) {
      Alert.alert("Chưa có chỉ đường", "Khu đất này chưa có link Google Maps hoặc tọa độ điều hướng.");
      return;
    }

    try {
      await Linking.openURL(directionUrl);
    } catch (error) {
      appLogger.warn("employee.inventory-map.direction", "Không thể mở chỉ đường Google Maps.", {
        areaId,
        directionUrl,
        error
      });
      Alert.alert("Không thể mở chỉ đường", "Vui lòng thử lại sau.");
    }
  }

  return (
    <SafeAreaView style={styles.inventoryMapSafe}>
      <View style={styles.inventoryMapHeader}>
        <Pressable accessibilityRole="button" onPress={() => back()} style={styles.inventoryMapBackButton}>
          <Ionicons name="arrow-back" size={24} color={employeePalette.text} />
        </Pressable>
        <EmployeeNotificationButton color={employeePalette.text} returnTo="/employee/inventory-map" />
      </View>

      <ScrollView
        contentContainerStyle={styles.inventoryMapScroll}
        refreshControl={
          <RefreshControl
            colors={[employeePalette.red]}
            onRefresh={() => setInventoryRefreshKey((value) => value + 1)}
            refreshing={loading && Boolean(data)}
            tintColor={employeePalette.red}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.inventoryMapRoot}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inventoryMapLegendWrap}>
          <View style={styles.inventoryMapLegend}>
            <LegendItem color="#eec05b" label="Còn hàng" />
            <LegendItem color={employeePalette.red} label="Đã bán" />
            <LegendItem color="#2e7d32" label="Đang giữ chỗ" />
            <LegendItem color="#c8c6c5" label="Không bán" />
          </View>
        </ScrollView>

        <View style={styles.inventoryMapCanvas}>
          {salesBoardEmbedSource ? (
            <WebView
              originWhitelist={["*"]}
              source={salesBoardEmbedSource}
              style={[styles.inventoryMapWebView, mapZoomStyle]}
            />
          ) : (
            <Image
              source={salesBoardImageUri ? { uri: salesBoardImageUri } : inventoryImages.mapOverview}
              style={[styles.inventoryMapOverview, mapZoomStyle]}
            />
          )}
          <View style={styles.inventoryMapControls}>
            <MapControl
              disabled={mapZoom >= mapZoomMax}
              icon="add"
              onPress={() => changeMapZoom(1)}
            />
            <MapControl
              disabled={mapZoom <= mapZoomMin}
              icon="remove"
              onPress={() => changeMapZoom(-1)}
            />
            <MapControl
              disabled={!directionUrl}
              highlight
              icon="locate-outline"
              onPress={openInventoryDirections}
            />
          </View>
        </View>

        <View onLayout={handleLotGridLayout} style={[styles.inventoryLotGrid, { columnGap: lotGridColumnGap }]}>
          {loading && areaId && lotItems.length === 0 ? <Text style={styles.bodyText}>Đang tải lô đất...</Text> : null}
          {failed ? <Text style={styles.bodyText}>Không thể tải danh sách lô đất.</Text> : null}
          {!loading && areaId && lotItems.length === 0 ? <Text style={styles.bodyText}>Khu vực này chưa có lô đất.</Text> : null}
          {lotItems.map((lot, index) => (
            <Pressable
              key={lot.id || `${lot.code}-${index}`}
              accessibilityRole="button"
              onPress={() => {
                if (!lot.id) return;
                router.push({ pathname: "/employee/lot-detail", params: { lotId: lot.id } });
              }}
              style={[
                styles.inventoryLotCell,
                lot.id === activeLotId && styles.inventoryLotSelected,
                lot.status === "held" && styles.inventoryLotHeld,
                lot.status === "sold" && styles.inventoryLotSold,
                lot.status === "unavailable" && styles.inventoryLotUnavailable
              ]}
            >
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                numberOfLines={1}
                style={[styles.inventoryLotText, lot.status !== "available" && styles.inventoryLotTextLight]}
              >
                {lot.code}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inventoryMapSheet}>
          <View style={styles.inventorySaleBadge}>
            <Text style={styles.inventorySaleBadgeText}>{inventoryLotStatusLabel(activeLotStatus, activeLot.is_locked)}</Text>
          </View>
          <Text style={styles.inventorySheetTitle}>{activeLotArea}</Text>

          <View style={styles.inventoryInfoTabs}>
            {inventoryInfoTabs.map((tab) => {
              const active = selectedInfoTab === tab.key;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={tab.key}
                  onPress={() => setSelectedInfoTab(tab.key)}
                  style={[styles.inventoryInfoTab, active && styles.inventoryInfoTabActive]}
                >
                  <Ionicons name={tab.icon} size={18} color={active ? "#ffffff" : employeePalette.text} />
                  <Text style={[styles.inventoryInfoTabText, active && styles.inventoryInfoTabTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.inventoryInfoArticle}>
            <Text style={styles.inventoryInfoArticleEyebrow}>{activeInfoTab.label.toUpperCase()}</Text>
            <Text style={styles.inventoryInfoArticleTitle}>{activeInfoTab.title}</Text>
            <Text style={styles.inventoryInfoArticleBody}>{activeInfoTab.content}</Text>
            {activeInfoTab.actionLabel && activeInfoTab.actionUrl ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL(activeInfoTab.actionUrl || "").catch((error) => {
                  appLogger.warn("employee.inventory-map.info-tab", "Không thể mở liên kết thông tin bảng hàng.", {
                    error,
                    tab: activeInfoTab.key,
                    url: activeInfoTab.actionUrl
                  });
                  notifyError("Không thể mở liên kết. Vui lòng thử lại.");
                })}
                style={styles.inventoryInfoArticleAction}
              >
                <Text style={styles.inventoryInfoArticleActionText}>{activeInfoTab.actionLabel}</Text>
                <Ionicons name="open-outline" size={16} color={employeePalette.red} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.inventoryInfoArticle}>
            <Text style={styles.inventoryInfoArticleEyebrow}>GIỚI THIỆU</Text>
            <Text style={styles.inventoryInfoArticleTitle}>{introArticle.title}</Text>
            <Text style={styles.inventoryInfoArticleBody}>{introArticle.summary}</Text>
            <Text style={styles.inventoryInfoArticleBody}>{introArticle.body}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!directionUrl}
            onPress={openInventoryDirections}
            style={({ pressed }) => [
              styles.inventoryRouteButton,
              (pressed || !directionUrl) && styles.pressed
            ]}
          >
            <Text style={styles.inventoryActionText}>Xem chỉ đường</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/employee/planning-check",
                params: { url: apiText(inventoryMapData.planning_check_url ?? inventoryMapData.planningCheckUrl, "https://quyhoach24h.vn?ref=C5WA63ND") }
              })
            }
            style={styles.inventoryPlanningButton}
          >
            <Text style={styles.inventoryActionText}>Kiểm tra quy hoạch</Text>
          </Pressable>

          <Image source={inventoryImages.planningArea} style={styles.inventoryPlanningMap} />
          <AreaCommentsSection
            comments={areaComments}
            currentPage={commentsCurrentPage}
            disabled={!areaId}
            draft={mapCommentDraft}
            emptyText={areaId ? "Chưa có bình luận nào." : "Chọn một khu đất để trao đổi."}
            loadingPage={commentsLoadingPage}
            onChangeDraft={setMapCommentDraft}
            onSelectPage={loadAreaCommentsPage}
            onSubmit={submitMapLotComment}
            pageCount={commentsLastPage}
            submitting={mapCommentSubmitting}
            totalCount={commentsTotal}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

