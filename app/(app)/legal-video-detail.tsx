import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useMemo, useState } from "react";
import { Image, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Pressable } from "@/components/SafePressable";
import { appLogger } from "@/libs/logger";
import { mediaSource, mediaUrl } from "@/libs/media";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, type LegalVideo } from "@/services/customer/api";

const palette = {
  background: "#f8f9fa",
  border: "#e3beb8",
  brown: "#5b403c",
  darkRed: "#6a0100",
  goldDark: "#795900",
  muted: "#6b7280",
  red: "#950100",
  text: "#191c1d",
  white: "#ffffff"
};

const fallbackThumbnail = require("@/assets/images/customer/legal/video-thumbnail.png");

export default function LegalVideoDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    category?: string;
    description?: string;
    duration?: string;
  }>();
  const [video, setVideo] = useState<LegalVideo | null>(null);
  const [loading, setLoading] = useState(Boolean(params.id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) {
      setVideo({
        id: "local-preview",
        title: params.title,
        category: params.category,
        description: params.description,
        duration: params.duration,
        thumbnail: null,
        video_url: null
      });
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    customerPublicApi
      .legalVideoDetail(String(params.id))
      .then((response) => {
        if (active) setVideo(response.data.detail ?? null);
      })
      .catch((requestError) => {
        appLogger.warn("customer.legalVideoDetail", "Không thể tải chi tiết video pháp lý.", { error: requestError });
        if (active) setError("Không thể tải video. Vui lòng thử lại.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.category, params.description, params.duration, params.id, params.title]);

  const videoUrl = mediaUrl(video?.video_url);
  const title = video?.title || "Video pháp lý";
  const description = stripHtml(video?.description || video?.short_description || "Thông tin chi tiết đang được cập nhật.");
  const thumbnail = mediaSource(video?.thumbnail_url ?? video?.thumbnail, fallbackThumbnail);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={palette.darkRed} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>Chi tiết pháp lý</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Đang tải video...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : (
          <>
            <LegalVideoPlayer thumbnail={thumbnail} title={title} videoUrl={videoUrl} />

            <View style={styles.metaRow}>
              <Text style={styles.category}>{video?.legal_topic?.name || formatCategory(video?.category)}</Text>
              <Text style={styles.metaText}>{formatDuration(video?.duration ?? video?.duration_seconds)}</Text>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.dateText}>{formatDate(video?.updated_at || video?.published_at || video?.created_at)}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LegalVideoPlayer({ thumbnail, title, videoUrl }: { thumbnail: ReturnType<typeof mediaSource>; title: string; videoUrl?: string }) {
  const [playing, setPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const player = useVideoPlayer(videoUrl ? { uri: videoUrl, contentType: "progressive" } : null, (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.volume = 1;
  });

  useEffect(() => {
    const statusSubscription = player.addListener("statusChange", (event) => {
      setHasError(event.status === "error");
    });
    const playingSubscription = player.addListener("playingChange", (event) => {
      setPlaying(event.isPlaying);
    });

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
      try {
        player.pause();
      } catch {
        // ignore native disposal race
      }
    };
  }, [player]);

  const toggle = () => {
    if (!videoUrl || hasError) {
      if (videoUrl) Linking.openURL(videoUrl);
      return;
    }

    try {
      if (playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      setHasError(true);
      appLogger.warn("customer.legalVideoPlayer", "Không thể phát video pháp lý.", { error });
    }
  };

  return (
    <View style={styles.playerWrap}>
      {videoUrl ? <VideoView nativeControls player={player} style={styles.videoView} /> : <Image source={thumbnail} style={styles.videoView} />}
      {!playing ? (
        <Pressable accessibilityLabel={`Phát ${title}`} accessibilityRole="button" onPress={toggle} style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name={videoUrl ? "play" : "open-outline"} size={30} color={palette.darkRed} />
          </View>
        </Pressable>
      ) : null}
      {hasError ? (
        <Pressable accessibilityRole="button" onPress={() => videoUrl && Linking.openURL(videoUrl)} style={styles.errorOverlay}>
          <Ionicons name="open-outline" size={18} color={palette.white} />
          <Text style={styles.errorText}>Không thể phát video. Mở liên kết</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function formatCategory(value?: string | null) {
  const labels: Record<string, string> = {
    project_legal: "PHÁP LÝ DỰ ÁN",
    contract: "HỢP ĐỒNG",
    planning: "QUY HOẠCH",
    transaction_process: "QUY TRÌNH GIAO DỊCH",
    other: "KHÁC"
  };
  return value ? labels[value] ?? value.toUpperCase() : "PHÁP LÝ";
}

function formatDuration(value?: string | number | null) {
  if (typeof value === "number") {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return value ? String(value) : "--:--";
}

function formatDate(value?: string | null) {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return date.toLocaleDateString("vi-VN");
}

function stripHtml(content: string) {
  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.background, flex: 1 },
  topBar: {
    alignItems: "center",
    backgroundColor: palette.background,
    borderBottomColor: "rgba(227, 190, 184, 0.28)",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 58,
    justifyContent: "space-between",
    paddingHorizontal: 12
  },
  backButton: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  headerTitle: { color: palette.darkRed, flex: 1, fontFamily: appFonts.bold, fontSize: 18, lineHeight: 24, textAlign: "center" },
  scroll: { gap: 18, paddingBottom: 112, paddingHorizontal: 20, paddingTop: 20 },
  playerWrap: { backgroundColor: "#111827", borderRadius: 16, height: 220, overflow: "hidden", position: "relative" },
  videoView: { height: "100%", width: "100%" },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", backgroundColor: "rgba(0,0,0,0.16)", justifyContent: "center" },
  playButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 999, height: 62, justifyContent: "center", width: 62 },
  errorOverlay: { alignItems: "center", backgroundColor: "rgba(106,1,0,0.86)", bottom: 12, borderRadius: 999, flexDirection: "row", gap: 8, left: 12, paddingHorizontal: 12, paddingVertical: 8, position: "absolute" },
  errorText: { color: palette.white, fontFamily: appFonts.bold, fontSize: 12, lineHeight: 16 },
  metaRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  category: { color: palette.goldDark, fontFamily: appFonts.bold, fontSize: 11, letterSpacing: 0.7, lineHeight: 16 },
  metaText: { color: palette.brown, fontFamily: appFonts.bold, fontSize: 12, lineHeight: 16 },
  title: { color: palette.text, fontFamily: appFonts.bold, fontSize: 24, lineHeight: 31 },
  dateText: { color: palette.muted, fontFamily: appFonts.regular, fontSize: 13, lineHeight: 18 },
  section: { backgroundColor: palette.white, borderColor: "rgba(225, 227, 228, 0.7)", borderRadius: 12, borderWidth: 1, gap: 10, padding: 16 },
  sectionTitle: { color: palette.darkRed, fontFamily: appFonts.bold, fontSize: 16, lineHeight: 22 },
  description: { color: palette.brown, fontFamily: appFonts.regular, fontSize: 15, lineHeight: 23 },
  stateBox: { alignItems: "center", backgroundColor: palette.white, borderColor: palette.border, borderRadius: 12, borderWidth: 1, minHeight: 140, justifyContent: "center", padding: 20 },
  stateText: { color: palette.brown, fontFamily: appFonts.regular, fontSize: 15, lineHeight: 22, textAlign: "center" }
});
