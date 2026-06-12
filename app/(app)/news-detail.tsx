import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiRequestError } from "@/libs/api";
import { appLogger } from "@/libs/logger";
import { mediaUrl } from "@/libs/media";
import { notifyError } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { customerPublicApi, publicNewsDetailParams, type NewsAttachment, type NewsContentBlock, type PublicNews } from "@/services/customer/api";

const palette = {
  background: "#f8f9fa",
  brown: "#5b403c",
  darkRed: "#6a0100",
  goldDark: "#795900",
  line: "rgba(227, 190, 184, 0.3)",
  pale: "#f3f4f5",
  text: "#191c1d",
  muted: "#6b7280",
  white: "#ffffff"
};

function paramText(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stripRichText(value?: string | null) {
  return value
    ?.replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<br\s*\/?>(\n)?/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

function toParagraphs(value?: string | null) {
  const text = stripRichText(value);
  if (!text) return [];

  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function categoryLabel(value?: string | null) {
  switch (value) {
    case "market":
      return "Tin tức thị trường";
    case "project":
      return "Dự án";
    case "investment":
      return "Đầu tư";
    case "legal":
      return "Pháp lý";
    case "other":
      return "Khác";
    default:
      return value?.trim() || null;
  }
}

function getFallbackTags(category?: string | null): string[] {
  switch (category) {
    case "market":
      return ["Xu hướng", "Đầu tư"];
    case "project":
      return ["Dự án", "Quy hoạch"];
    case "investment":
      return ["Đầu tư", "Sinh lời"];
    case "legal":
      return ["Pháp lý", "Thủ tục"];
    default:
      return ["Tin tức", "Thị trường"];
  }
}

function normalizeTags(value?: string[] | string | null) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function isImageAttachment(attachment: NewsAttachment) {
  const mime = attachment.mime_type?.toLowerCase();
  if (mime) {
    return mime.startsWith("image/");
  }

  const url = attachment.url?.toLowerCase() || "";
  return /\.(png|jpe?g|gif|webp|bmp|avif)(\?|#|$)/.test(url);
}

function normalizeImageUrls(attachments?: NewsAttachment[] | null) {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .filter((attachment) => Boolean(attachment?.url) && isImageAttachment(attachment))
    .map((attachment) => mediaUrl(attachment.url))
    .filter((url): url is string => Boolean(url));
}

type NormalizedContentBlock =
  | { type: "heading" | "paragraph"; text: string }
  | { type: "image"; url: string; caption?: string | null }
  | { type: "quote"; text: string; author?: string | null };

function normalizeContentBlocks(value?: NewsContentBlock[] | null): NormalizedContentBlock[] {
  if (!Array.isArray(value)) return [];

  const blocks: NormalizedContentBlock[] = [];

  value.forEach((block) => {
    const type = String(block?.type || "paragraph").toLowerCase();

    if (type === "image") {
      const url = mediaUrl(block.url);
      if (url) {
        blocks.push({
          type: "image",
          url,
          caption: block.caption?.trim() || null
        });
      }
      return;
    }

    const text = block.text?.trim();
    if (!text) return;

    if (type === "heading") {
      blocks.push({ type: "heading", text });
      return;
    }

    if (type === "quote") {
      blocks.push({ type: "quote", text, author: block.author?.trim() || null });
      return;
    }

    if (type === "paragraph") {
      blocks.push({ type: "paragraph", text });
    }
  });

  return blocks;
}

function formatNewsDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
}

export default function NewsDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    is_liked?: string;
    liked?: string;
    likes_count?: string;
    news_id?: string;
  }>();

  const newsId = paramText(params.news_id) ?? paramText(params.id);
  const initialLiked = paramText(params.is_liked) === "true" || paramText(params.liked) === "true";
  const initialLikesCount = Number(paramText(params.likes_count) ?? 0);

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(Number.isFinite(initialLikesCount) ? initialLikesCount : 0);
  const [liking, setLiking] = useState(false);
  const [loading, setLoading] = useState(Boolean(newsId));
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [detail, setDetail] = useState<PublicNews | null>(null);
  const [related, setRelated] = useState<PublicNews[]>([]);

  useEffect(() => {
    let active = true;

    async function loadNewsDetail() {
      if (!newsId) {
        setDetail(null);
        setRelated([]);
        setError("Bài viết không tồn tại hoặc đã bị xóa.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await customerPublicApi.newsDetail(newsId);
        if (!active) return;

        const nextDetail = response.data.detail ?? null;
        const nextRelated = Array.isArray(response.data.related) ? response.data.related.filter(Boolean) : [];

        if (!nextDetail) {
          setDetail(null);
          setRelated([]);
          setError("Bài viết không tồn tại hoặc đã bị xóa.");
          return;
        }

        setDetail(nextDetail);
        setRelated(nextRelated as PublicNews[]);

        if (typeof nextDetail.likes_count === "number") {
          setLikesCount(nextDetail.likes_count);
        }

        const apiLiked = nextDetail.is_liked ?? nextDetail.liked;
        if (typeof apiLiked === "boolean") {
          setLiked(apiLiked);
        }
      } catch (error) {
        if (!active) return;

        let message = "Không thể tải nội dung bài viết. Vui lòng thử lại.";
        if (error instanceof ApiRequestError) {
          if (error.status === 404) {
            message = "Bài viết không tồn tại hoặc đã bị xóa.";
          } else if (error.status === 403) {
            message = "Bạn không có quyền truy cập bài viết này.";
          }
        }

        appLogger.warn("customer.newsDetail", "Không thể tải chi tiết bài viết.", { error, newsId });
        setDetail(null);
        setRelated([]);
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadNewsDetail();

    return () => {
      active = false;
    };
  }, [newsId, reloadToken]);

  async function toggleLike() {
    const targetId = detail?.id ?? newsId;
    if (!targetId) {
      notifyError("Không tìm thấy mã bài viết để thích.");
      return;
    }

    const previousLiked = liked;
    const previousLikesCount = likesCount;
    setLiked(!previousLiked);
    setLikesCount((value) => Math.max(0, value + (previousLiked ? -1 : 1)));
    setLiking(true);

    try {
      const response = await customerPublicApi.likeNews(targetId);
      const apiLiked = response.data.is_liked ?? response.data.liked;
      if (typeof apiLiked === "boolean") {
        setLiked(apiLiked);
      }
      if (typeof response.data.likes_count === "number") {
        setLikesCount(response.data.likes_count);
      }
    } catch (error) {
      setLiked(previousLiked);
      setLikesCount(previousLikesCount);
      notifyError(error, "Không thể cập nhật lượt thích bài viết.");
    } finally {
      setLiking(false);
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        message: detail?.title || "Tin tức thị trường",
        title: detail?.title || "Tin tức thị trường"
      });
    } catch (error) {
      appLogger.warn("customer.newsShare", "Không thể chia sẻ bài viết.", { error });
    }
  }

  const imageUrls = normalizeImageUrls(detail?.attachments);
  const heroImage = mediaUrl(detail?.thumbnail) || imageUrls[0] || null;
  const extraImages = heroImage ? imageUrls.filter((url) => url !== heroImage) : imageUrls;
  const contentBlocks = normalizeContentBlocks(detail?.content_blocks ?? detail?.contentBlocks);
  const hasContentBlocks = contentBlocks.length > 0;
  const paragraphs = toParagraphs(detail?.content);
  const parsedTags = normalizeTags(detail?.tags);
  const tags = parsedTags.length > 0 ? parsedTags : getFallbackTags(detail?.category);
  const quoteText = detail?.quote?.text?.trim();
  const quoteAuthor = detail?.quote?.author?.trim();
  const category = categoryLabel(detail?.category);
  const publishedAt = formatNewsDate(detail?.published_at);

  function renderErrorState() {
    return (
      <View style={styles.stateWrap}>
        <View style={styles.stateIcon}>
          <Ionicons name="alert-circle-outline" size={28} color={palette.darkRed} />
        </View>
        <Text style={styles.stateTitle}>Không thể tải nội dung bài viết</Text>
        <Text style={styles.stateText}>{error || "Vui lòng thử lại."}</Text>
        <View style={styles.stateActions}>
          <Pressable accessibilityRole="button" onPress={() => setReloadToken((value) => value + 1)} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Thử lại</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.replace("/(app)/market-news")} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Về danh sách tin tức</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar backgroundColor={palette.background} style="dark" />
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={20} color={palette.brown} />
          </Pressable>
          <Text style={styles.brandText}>KHỞI NGUYÊN LAND</Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.accountButton}>
          <Ionicons name="person-circle-outline" size={18} color={palette.brown} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator color={palette.darkRed} size="small" />
          <Text style={[styles.stateText, styles.loadingText]}>Đang tải bài viết...</Text>
        </View>
      ) : error ? (
        renderErrorState()
      ) : detail ? (
        <ScrollView bounces contentContainerStyle={styles.scroll} overScrollMode="always" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            {heroImage ? (
              <Image source={{ uri: heroImage }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="image-outline" size={38} color="rgba(255, 255, 255, 0.75)" />
                <Text style={styles.heroPlaceholderText}>Chưa có ảnh đại diện</Text>
              </View>
            )}
            <View style={styles.heroOverlay} />
            <View style={styles.heroCopy}>
              {category ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{category.toUpperCase()}</Text>
                </View>
              ) : null}
              <Text style={styles.heroTitle}>{detail.title || "Bài viết chưa có tiêu đề"}</Text>
              {publishedAt ? (
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-clear-outline" size={14} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.heroDate}>{publishedAt}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.articleContent}>
            {detail.summary ? <Text style={styles.leadText}>{detail.summary}</Text> : null}

            {hasContentBlocks ? (
              <View style={styles.contentBlockStack}>
                {contentBlocks.map((block, index) => {
                  const key = `${block.type}-${index}`;

                  if (block.type === "heading") {
                    return <Text key={key} style={styles.blockHeading}>{block.text}</Text>;
                  }

                  if (block.type === "image") {
                    return (
                      <View key={key} style={styles.blockImageWrap}>
                        <Image source={{ uri: block.url }} style={styles.blockImage} />
                        {block.caption ? <Text style={styles.blockImageCaption}>{block.caption}</Text> : null}
                      </View>
                    );
                  }

                  if (block.type === "quote") {
                    return (
                      <View key={key} style={styles.quoteBox}>
                        <Text style={styles.quoteText}>&quot;{block.text}&quot;</Text>
                        {block.author ? <Text style={styles.quoteAuthor}>- {block.author}</Text> : null}
                      </View>
                    );
                  }

                  return <Text key={key} style={styles.bodyText}>{block.text}</Text>;
                })}
              </View>
            ) : paragraphs.length > 0 ? (
              <View style={styles.bodyStack}>
                {paragraphs.map((paragraph, index) => (
                  <Text key={`${index}-${paragraph.slice(0, 24)}`} style={styles.bodyText}>
                    {paragraph}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyBodyText}>Nội dung bài viết đang được cập nhật.</Text>
            )}

            {!hasContentBlocks && quoteText ? (
              <View style={styles.quoteBox}>
                <Text style={styles.quoteText}>&quot;{quoteText}&quot;</Text>
                {quoteAuthor ? <Text style={styles.quoteAuthor}>- {quoteAuthor}</Text> : null}
              </View>
            ) : null}

            {!hasContentBlocks && extraImages.length > 0 ? (
              <View style={styles.mediaSection}>
                <Text style={styles.sectionLabel}>Hình ảnh minh họa</Text>
                <View style={styles.attachmentStack}>
                  {extraImages.map((url, index) => (
                    <Image key={`${url}-${index}`} source={{ uri: url }} style={styles.attachmentImage} />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.actions}>
              <View style={styles.buttonRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleShare}
                  style={styles.shareButton}
                >
                  <Ionicons name="share-social-outline" size={16} color={palette.white} />
                  <Text style={styles.shareButtonText}>Chia sẻ</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={liking}
                  onPress={toggleLike}
                  style={({ pressed }) => [styles.favoriteButton, liked && styles.favoriteButtonActive, (pressed || liking) && styles.pressed]}
                >
                  <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? palette.white : "#8f706b"} />
                  {likesCount > 0 ? <Text style={[styles.favoriteCount, liked && styles.favoriteCountActive]}>{likesCount}</Text> : null}
                </Pressable>
              </View>

              {tags.length > 0 ? (
                <View style={styles.tagRow}>
                  <Text style={styles.tagLabel}>TAGS:</Text>
                  {tags.map((tag) => (
                    <Text key={tag} style={styles.tag}>
                      {tag.toUpperCase()}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          {related.length > 0 ? (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedEyebrow}>KHÁM PHÁ THÊM</Text>
              <Text style={styles.relatedTitle}>Bài viết liên quan</Text>
              <View style={styles.relatedList}>
                {related.map((article) => {
                  const articleImage = mediaUrl(article.thumbnail);
                  const articleCategory = categoryLabel(article.category) || "Tin tức";

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={article.id}
                      onPress={() => router.push({ pathname: "/(app)/news-detail", params: publicNewsDetailParams(article) })}
                      style={styles.relatedCard}
                    >
                      {articleImage ? (
                        <Image source={{ uri: articleImage }} style={styles.relatedImage} />
                      ) : (
                        <View style={styles.relatedPlaceholder}>
                          <Ionicons name="image-outline" size={26} color="rgba(255, 255, 255, 0.7)" />
                        </View>
                      )}
                      <View style={styles.relatedCopy}>
                        <Text style={styles.relatedCategory}>{articleCategory}</Text>
                        <Text style={styles.relatedCardTitle}>{article.title || "Bài viết liên quan"}</Text>
                        {article.summary ? <Text numberOfLines={2} style={styles.relatedExcerpt}>{article.summary}</Text> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
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
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    zIndex: 2
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minWidth: 0
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  brandText: {
    color: palette.darkRed,
    flexShrink: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.36,
    lineHeight: 22
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
    paddingBottom: 40
  },
  stateWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 14
  },
  stateIcon: {
    alignItems: "center",
    backgroundColor: "rgba(106, 1, 0, 0.08)",
    borderRadius: 999,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  stateTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 22,
    lineHeight: 30,
    textAlign: "center"
  },
  stateText: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center"
  },
  loadingText: {
    marginTop: -2
  },
  stateActions: {
    gap: 10,
    marginTop: 4,
    width: "100%"
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: palette.darkRed,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 18
  },
  primaryActionText: {
    color: palette.white,
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 22
  },
  secondaryAction: {
    alignItems: "center",
    borderColor: palette.line,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 18
  },
  secondaryActionText: {
    color: palette.brown,
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 22
  },
  hero: {
    height: 442,
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative"
  },
  heroImage: {
    height: "100%",
    left: "-6.7%",
    position: "absolute",
    resizeMode: "cover",
    top: 0,
    width: "113.4%"
  },
  heroPlaceholder: {
    alignItems: "center",
    backgroundColor: "#8a736d",
    height: "100%",
    justifyContent: "center",
    gap: 8
  },
  heroPlaceholderText: {
    color: "rgba(255, 255, 255, 0.88)",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 20
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.42)"
  },
  heroCopy: {
    gap: 16,
    paddingBottom: 48,
    paddingHorizontal: 20
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: palette.darkRed,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  categoryPillText: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  heroTitle: {
    color: palette.white,
    fontFamily: appFonts.bold,
    fontSize: 38,
    letterSpacing: -1.4,
    lineHeight: 48
  },
  dateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  heroDate: {
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  articleContent: {
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 48
  },
  leadText: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 29.25
  },
  bodyStack: {
    gap: 16
  },
  contentBlockStack: {
    gap: 18
  },
  blockHeading: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 22,
    lineHeight: 30
  },
  bodyText: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 26
  },
  blockImageWrap: {
    gap: 8
  },
  blockImage: {
    borderRadius: 12,
    height: 256,
    resizeMode: "cover",
    width: "100%"
  },
  blockImageCaption: {
    color: palette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 19
  },
  emptyBodyText: {
    color: palette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 26
  },
  quoteBox: {
    backgroundColor: palette.pale,
    borderBottomRightRadius: 12,
    borderLeftColor: palette.goldDark,
    borderLeftWidth: 4,
    borderTopRightRadius: 12,
    gap: 8,
    paddingBottom: 48,
    paddingLeft: 52,
    paddingRight: 32,
    paddingTop: 48
  },
  quoteText: {
    color: palette.darkRed,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    fontStyle: "italic",
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  quoteAuthor: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontStyle: "italic",
    letterSpacing: 1.2,
    lineHeight: 16
  },
  mediaSection: {
    gap: 16
  },
  sectionLabel: {
    color: palette.goldDark,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  attachmentStack: {
    gap: 16
  },
  attachmentImage: {
    borderRadius: 12,
    height: 256,
    resizeMode: "cover",
    width: "100%"
  },
  actions: {
    borderTopColor: palette.line,
    borderTopWidth: 1,
    gap: 16,
    paddingTop: 24
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12
  },
  shareButton: {
    alignItems: "center",
    backgroundColor: palette.darkRed,
    borderRadius: 12,
    flexDirection: "row",
    gap: 4,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 22
  },
  shareButtonText: {
    color: palette.white,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 22
  },
  favoriteButton: {
    alignItems: "center",
    borderColor: "#8f706b",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    height: 48,
    justifyContent: "center",
    minWidth: 48,
    paddingHorizontal: 13
  },
  favoriteButtonActive: {
    backgroundColor: palette.darkRed,
    borderColor: palette.darkRed
  },
  favoriteCount: {
    color: "#8f706b",
    fontFamily: appFonts.bold,
    fontSize: 13,
    lineHeight: 16
  },
  favoriteCountActive: {
    color: palette.white
  },
  pressed: {
    opacity: 0.82
  },
  tagRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16
  },
  tagLabel: {
    color: palette.brown,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  tag: {
    color: palette.darkRed,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  relatedSection: {
    backgroundColor: palette.pale,
    marginTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 20,
    paddingTop: 48
  },
  relatedEyebrow: {
    color: palette.goldDark,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  relatedTitle: {
    color: palette.text,
    fontFamily: appFonts.bold,
    fontSize: 32,
    letterSpacing: -0.96,
    lineHeight: 38.4,
    marginTop: 4
  },
  relatedList: {
    gap: 24,
    marginTop: 24
  },
  relatedCard: {
    backgroundColor: palette.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  relatedImage: {
    height: 192,
    resizeMode: "cover",
    width: "100%"
  },
  relatedPlaceholder: {
    alignItems: "center",
    backgroundColor: "#9c847f",
    height: 192,
    justifyContent: "center"
  },
  relatedCopy: {
    gap: 4,
    paddingBottom: 32,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  relatedCategory: {
    color: palette.darkRed,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  relatedCardTitle: {
    color: palette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  relatedExcerpt: {
    color: palette.brown,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  }
});
