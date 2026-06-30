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
import { apiBoolean, apiList, apiNumber, apiText, avatarInitial, isApiObject } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { employeeDocumentMaxBytes, employeeDocumentMimeType, employeeDocumentMimeTypes, newsPostPreviewLines } from "./utils/constants";
import { formatApiDateTime } from "./utils/formatters";
import { canCreateInternalNews, logImageUploadAsset, resolveNewsImageAsset } from "./utils/sharedHelpers";
export function NewsFeedScreen() {
  const { session } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const [newsRefreshKey, setNewsRefreshKey] = useState(0);
  const newsFocusedRef = useRef(false);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createExpanded, setCreateExpanded] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [newPostAttachments, setNewPostAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostImage, setEditPostImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [editPostThumbnailUrl, setEditPostThumbnailUrl] = useState("");
  const [editPostNewAttachments, setEditPostNewAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [editPostKeepAttachments, setEditPostKeepAttachments] = useState<any[]>([]);
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [updatingPost, setUpdatingPost] = useState(false);
  // Rich editor — tentap-editor dùng EditorBridge, không dùng useRef
  const [showRichModal, setShowRichModal] = useState(false);
  const [richModalMode, setRichModalMode] = useState<"create" | "edit">("create");
  const editorCreate = useEditorBridge({
    bridgeExtensions: TenTapStartKit,
    initialContent: "",
    avoidIosKeyboard: true
  });
  const editorEdit = useEditorBridge({
    bridgeExtensions: TenTapStartKit,
    initialContent: "",
    avoidIosKeyboard: true
  });
  const { data, failed, loading } = useEmployeeApiData(() => employeeApi.internalNews(), [newsRefreshKey]);
  const apiPosts = apiList(data);
  const posts: ApiObject[] = apiPosts;
  const showInitialLoading = loading && apiPosts.length === 0;
  const showEmptyState = !loading && !failed && apiPosts.length === 0;
  const canCreateNews = canCreateInternalNews(session?.user);
  const currentUserAvatarUri = mediaUrl(session?.user.avatar);

  useFocusEffect(
    useCallback(() => {
      if (!newsFocusedRef.current) {
        newsFocusedRef.current = true;
        return undefined;
      }

      setNewsRefreshKey((value) => value + 1);
      return undefined;
    }, [])
  );

  useEffect(() => {
    if (!loading) {
      setNewsRefreshing(false);
    }
  }, [loading]);

  function refreshNewsManually() {
    setNewsRefreshing(true);
    setNewsRefreshKey((value) => value + 1);
  }

  function openRichModal(mode: "create" | "edit") {
    setRichModalMode(mode);
    setShowRichModal(true);
    const content = mode === "create" ? newPostContent : editPostContent;
    const bridge = mode === "create" ? editorCreate : editorEdit;
    // Delay setContent to make sure WebView is fully mounted and ready
    setTimeout(() => {
      bridge.setContent(content);
    }, 400);
  }

  async function closeRichModalAndSave() {
    try {
      if (richModalMode === "create") {
        const html = await editorCreate.getHTML();
        setNewPostContent(html);
      } else {
        const html = await editorEdit.getHTML();
        setEditPostContent(html);
      }
    } catch (e) {
      console.warn("Failed to retrieve HTML content from editor:", e);
    }
    setShowRichModal(false);
  }

  async function insertInlineImageToRichEditor(mode: "create" | "edit") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notifyError("Vui lòng cấp quyền truy cập thư viện ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.85,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset) {
        try {
          const form = new FormData();
          form.append("image", {
            uri: asset.uri,
            name: asset.fileName || `inline-image-${Date.now()}.jpg`,
            type: asset.mimeType || "image/jpeg"
          } as any);

          const response = await employeeApi.uploadEvidence(form);
          if (response.success && response.data?.url) {
            const imageUrl = mediaUrl(response.data.url);
            if (imageUrl) {
              const bridge = mode === "edit" ? editorEdit : editorCreate;
              bridge.setImage(imageUrl);
            }
          } else {
            notifyError(response.message || "Không thể upload ảnh lên hệ thống.");
          }
        } catch (error) {
          appLogger.warn("employee.news.inlineImage", "Không thể upload ảnh inline.", { error });
          notifyError(error, "Lỗi khi upload ảnh.");
        }
      }
    }
  }

  async function pickNewsImage(target: "create" | "edit" = editingPostId ? "edit" : "create") {
    if (target === "create" && !canCreateNews) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notifyError("Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh bài viết.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.85,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible
    });

    if (!result.canceled) {
      const asset = result.assets[0] ?? null;
      if (asset?.fileSize && asset.fileSize > 8 * 1024 * 1024) {
        notifyError("Ảnh bài viết không được vượt quá 8MB.");
        return;
      }

      if (asset) {
        void logImageUploadAsset("employee.news.thumbnail", asset);
      }

      if (target === "edit") {
        setEditPostImage(asset);
        return;
      }

      setNewPostImage(asset);
      setCreateExpanded(true);
    }
  }

  async function pickNewsAttachment(target: "create" | "edit" = "create") {
    if (target === "create" && !canCreateNews) {
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
      type: employeeDocumentMimeTypes
    });

    if (result.canceled || !result.assets) return;

    const validAssets = result.assets.filter((asset) => {
      if (asset.size && asset.size > employeeDocumentMaxBytes) {
        notifyError(`Tài liệu "${asset.name}" vượt quá dung lượng 10MB.`);
        return false;
      }
      return true;
    });

    if (validAssets.length === 0) return;

    if (target === "edit") {
      setEditPostNewAttachments((current) => [...current, ...validAssets]);
    } else {
      setNewPostAttachments((current) => [...current, ...validAssets]);
      setCreateExpanded(true);
    }
  }

  async function submitInternalNews() {
    if (!canCreateNews) {
      return;
    }

    const content = newPostContent.trim();
    const title = newPostTitle.trim();

    if (!content) {
      notifyError("Vui lòng nhập nội dung bài viết.");
      return;
    }

    setCreating(true);
    try {
      const thumbnail = newPostImage
        ? resolveNewsImageAsset(newPostImage)
        : undefined;
      const response = await employeeApi.createInternalNews({
        attachments: newPostAttachments.length > 0
          ? newPostAttachments.map((attachment) => ({
              name: attachment.name || `tai-lieu-bai-viet-${Date.now()}`,
              type: employeeDocumentMimeType(attachment.name || "", attachment.mimeType),
              uri: attachment.uri
            }))
          : undefined,
        content,
        thumbnail,
        title: title || undefined
      });

      notifySuccess({ message: response.message || "Đăng bài viết thành công." });
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostImage(null);
      setNewPostAttachments([]);
      setCreateExpanded(false);
      setNewsRefreshKey((value) => value + 1);
    } catch (error) {
      appLogger.warn("employee.news.create", "Không thể đăng bài viết nội bộ.", { error });
      notifyError(error, "Không thể đăng bài viết.");
    } finally {
      setCreating(false);
    }
  }

  function cancelEditInternalNews() {
    setActivePostMenuId(null);
    setEditingPostId(null);
    setEditPostTitle("");
    setEditPostContent("");
    setEditPostImage(null);
    setEditPostThumbnailUrl("");
    setEditPostNewAttachments([]);
    setEditPostKeepAttachments([]);
  }

  function startEditInternalNews(postId: string, post: ApiObject) {
    setActivePostMenuId(null);
    setEditingPostId(postId);
    setEditPostTitle(apiText(post.title ?? post.name, ""));
    setEditPostContent(apiText(post.content ?? post.summary ?? post.excerpt ?? post.description ?? post.body, ""));
    setEditPostThumbnailUrl(apiText(post.image_url ?? post.thumbnail_url ?? post.thumbnail, ""));
    setEditPostImage(null);
    setEditPostNewAttachments([]);
    setEditPostKeepAttachments(apiList(post.attachments));
  }

  function confirmDeleteInternalNews(postId: string) {
    setActivePostMenuId(null);

    Alert.alert("Xóa bài viết", "Bạn có chắc chắn muốn xóa bài viết này không?", [
      {
        text: "Hủy",
        style: "cancel"
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          void deleteInternalNews(postId);
        }
      }
    ]);
  }

  async function deleteInternalNews(postId: string) {
    setDeletingPostId(postId);

    try {
      const response = await employeeApi.deleteInternalNews(postId);
      notifySuccess({ message: response.message || "Đã xóa bài viết." });
      if (editingPostId === postId) {
        cancelEditInternalNews();
      }
      setNewsRefreshKey((value) => value + 1);
    } catch (error) {
      appLogger.warn("employee.news.delete", "Không thể xóa bài viết nội bộ.", { postId, error });
      notifyError(error, "Không thể xóa bài viết.");
    } finally {
      setDeletingPostId(null);
    }
  }

  async function submitEditInternalNews() {
    if (!editingPostId) return;

    const content = editPostContent.trim();
    const title = editPostTitle.trim();

    if (!content) {
      notifyError("Vui lòng nhập nội dung bài viết.");
      return;
    }

    setUpdatingPost(true);
    try {
      const thumbnail = editPostImage
        ? resolveNewsImageAsset(editPostImage)
        : undefined;

      const response = await employeeApi.updateInternalNews(editingPostId, {
        attachments: editPostNewAttachments.length > 0
          ? editPostNewAttachments.map((attachment) => ({
              name: attachment.name || `tai-lieu-bai-viet-${Date.now()}`,
              type: employeeDocumentMimeType(attachment.name || "", attachment.mimeType),
              uri: attachment.uri
            }))
          : undefined,
        content,
        keep_attachments: JSON.stringify(editPostKeepAttachments),
        thumbnail,
        thumbnail_url: thumbnail ? undefined : editPostThumbnailUrl,
        title: title || undefined
      });

      notifySuccess({ message: response.message || "Cập nhật bài viết thành công." });
      cancelEditInternalNews();
      setNewsRefreshKey((value) => value + 1);
    } catch (error) {
      appLogger.warn("employee.news.update", "Không thể cập nhật bài viết nội bộ.", { postId: editingPostId, error });
      notifyError(error, "Không thể cập nhật bài viết.");
    } finally {
      setUpdatingPost(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.newsFeedSafe}>
      <View style={styles.newsFeedHeader}>
        <EmployeeAvatarButton imageUri={currentUserAvatarUri} label={session?.user.fullName} />
        <EmployeeNotificationButton returnTo="/employee/news" />
      </View>

      <ScrollView
        contentContainerStyle={styles.newsFeedScroll}
        refreshControl={
          <RefreshControl
            colors={[employeePalette.red]}
            onRefresh={refreshNewsManually}
            refreshing={newsRefreshing && loading}
            tintColor={employeePalette.red}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.newsFeedPageHeader}>
          <Text style={styles.newsFeedTitle}>Bảng tin nội bộ</Text>
          <Text style={styles.newsFeedSubtitle}>Bài viết, thông báo và thảo luận trong đội ngũ.</Text>
        </View>

        {canCreateNews ? (
          <View style={styles.newsCreateCard}>
            <View style={styles.newsCreateBody}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/employee/personal-info")}
                style={({ pressed }) => [styles.newsCreateAvatar, pressed && styles.pressed]}
              >
                {currentUserAvatarUri ? (
                  <Image source={{ uri: currentUserAvatarUri }} style={styles.newsFeedAvatarImage} />
                ) : (
                  <Text style={styles.newsAvatarInitial}>{avatarInitial(session?.user.fullName)}</Text>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCreateExpanded(true)}
                style={styles.newsCreatePromptButton}
              >
                <Text style={styles.newsCreatePlaceholder}>Chia sẻ thông tin khu đất mới{"\n"}hoặc thành tích...</Text>
              </Pressable>
            </View>
            {createExpanded ? (
              <View style={styles.newsCreateForm}>
                <TextInput
                  editable={!creating}
                  onChangeText={setNewPostTitle}
                  placeholder="Tiêu đề bài viết"
                  placeholderTextColor="rgba(91, 64, 60, 0.45)"
                  style={styles.newsCreateTitleInput}
                  value={newPostTitle}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { setCreateExpanded(true); openRichModal("create"); }}
                  style={styles.newsRichPreviewButton}
                >
                  {newPostContent ? (
                    <RenderHtml
                      contentWidth={screenWidth - 64}
                      source={{ html: newPostContent }}
                      tagsStyles={{
                        p: { color: "#3b2c2a", fontSize: 14, marginVertical: 2 },
                        img: { maxWidth: "100%", borderRadius: 8 }
                      }}
                    />
                  ) : (
                    <Text style={styles.newsCreatePlaceholder}>Nội dung bài viết... (hỗ trợ ảnh inline)</Text>
                  )}
                </Pressable>

                {newPostImage ? (
                  <View style={styles.newsCreateImagePreview}>
                    <Image source={{ uri: newPostImage.uri }} style={styles.newsCreateImage} />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setNewPostImage(null)}
                      style={styles.newsCreateImageRemove}
                    >
                      <Ionicons name="close" size={16} color="#ffffff" />
                    </Pressable>
                  </View>
                ) : null}
                {newPostAttachments.length > 0 ? (
                  <View style={styles.newsCreateAttachmentsList}>
                    {newPostAttachments.map((attachment, idx) => (
                      <View key={`new-attach-${idx}`} style={styles.newsCreateAttachmentPreview}>
                        <View style={styles.newsCreateAttachmentTitleRow}>
                          <Ionicons name="document-text-outline" size={18} color={employeePalette.red} />
                          <Text numberOfLines={1} style={styles.newsCreateAttachmentName}>{attachment.name}</Text>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setNewPostAttachments((current) => current.filter((_, i) => i !== idx))}
                          style={({ pressed }) => [styles.newsCreateAttachmentRemove, pressed && styles.pressed]}
                        >
                          <Ionicons name="close" size={16} color={employeePalette.muted} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            <View style={styles.newsCreateFooter}>
              <View style={styles.newsCreateTools}>
                <Pressable
                  accessibilityRole="button"
                  disabled={creating}
                  onPress={() => pickNewsImage("create")}
                  style={({ pressed }) => [styles.newsCreateToolButton, pressed && styles.pressed]}
                >
                  <Ionicons name="image-outline" size={20} color={employeePalette.red} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={creating}
                  onPress={() => pickNewsAttachment("create")}
                  style={({ pressed }) => [styles.newsCreateToolButton, pressed && styles.pressed]}
                >
                  <Ionicons name="attach-outline" size={22} color={employeePalette.red} />
                </Pressable>
              </View>
              {createExpanded ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={creating}
                  onPress={() => {
                    setCreateExpanded(false);
                    setNewPostTitle("");
                    setNewPostContent("");
                    setNewPostImage(null);
                    setNewPostAttachments([]);
                  }}
                  style={styles.newsCreateCancelButton}
                >
                  <Text style={styles.newsCreateCancelText}>Hủy</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={creating}
                onPress={createExpanded ? submitInternalNews : () => setCreateExpanded(true)}
                style={({ pressed }) => [
                  styles.newsCreateButton,
                  creating && styles.newsCreateButtonDisabled,
                  pressed && styles.pressed
                ]}
              >
                <Text style={styles.newsCreateButtonText}>{creating ? "Đang đăng..." : "Tạo bài viết"}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.newsFeedList}>
          {showInitialLoading ? <Text style={styles.bodyText}>Đang tải bảng tin...</Text> : null}
          {failed ? <Text style={styles.bodyText}>Không thể tải bảng tin, đang hiển thị dữ liệu gần nhất.</Text> : null}
          {showEmptyState ? <Text style={styles.bodyText}>Chưa có tin nội bộ mới.</Text> : null}
          {posts.map((post, index) => {
            const id = apiText(isApiObject(post) ? post.id : undefined, `post-${index}`);
            const postAuthor = isApiObject(post.author) ? post.author : null;
            const title = apiText(post.title ?? post.name, "Tin tức nội bộ");
            const content = apiText(post.summary ?? post.excerpt ?? post.content ?? post.description ?? post.body, "");
            const author = apiText(post.author_name ?? postAuthor?.name ?? post.created_by, "Ban quản lý");
            const authorAvatarUri = mediaUrl(post.author_avatar ?? postAuthor?.avatar ?? post.user_avatar ?? post.avatar);
            const authorId = apiText(post.author_id ?? post.user_id ?? post.created_by_id, "");
            const category = apiText(post.category ?? post.type, "Thông báo");
            const timeAgo = formatApiDateTime(post.time_ago ?? post.published_at ?? post.created_at ?? post.timeAgo);
            const likes = apiText(post.likes_count ?? post.likes, "0");
            const comments = apiText(post.comments_count ?? post.comments, "0");
            const image = apiText(post.image_url ?? post.thumbnail_url ?? post.thumbnail, "");
            const imageUri = mediaUrl(image);
            const attachments = apiList(post.attachments);
            const highlighted = index === 0;
            const currentUserName = apiText(session?.user.fullName, "").trim().toLowerCase();
            const authorName = author.trim().toLowerCase();
            const canManagePost =
              Boolean(authorId && session?.user.id && authorId === session.user.id) ||
              Boolean(!authorId && currentUserName && authorName === currentUserName);
            const isEditingPost = editingPostId === id;
            const isPostMenuActive = activePostMenuId === id;
            const isDeletingPost = deletingPostId === id;

            return (
              <View key={id} style={[styles.newsPostCard, highlighted && styles.newsPostHighlighted]}>
                <View style={styles.newsPostHeader}>
                  <View style={styles.newsPostAuthorRow}>
                    <View style={highlighted ? styles.newsPostAvatarGold : styles.newsPostAvatar}>
                      {authorAvatarUri ? (
                        <Image source={{ uri: authorAvatarUri }} style={styles.newsFeedAvatarImage} />
                      ) : (
                        <Text style={styles.newsAvatarInitial}>{avatarInitial(author)}</Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.newsPostAuthor}>{author}</Text>
                      <Text style={styles.newsPostMeta}>{timeAgo} • {category}</Text>
                    </View>
                  </View>
                  {canManagePost ? (
                    <View style={styles.newsPostMenuWrap}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={updatingPost || isDeletingPost}
                        onPress={() => setActivePostMenuId(isPostMenuActive ? null : id)}
                        style={({ pressed }) => [styles.newsPostMenuButton, pressed && styles.pressed]}
                      >
                        <Ionicons name="ellipsis-horizontal" size={20} color={employeePalette.muted} />
                      </Pressable>
                      {isPostMenuActive ? (
                        <View style={styles.newsPostMenu}>
                          <Pressable
                            accessibilityRole="button"
                            disabled={updatingPost}
                            onPress={() => (isEditingPost ? cancelEditInternalNews() : startEditInternalNews(id, post))}
                            style={({ pressed }) => [styles.newsPostMenuItem, pressed && styles.pressed]}
                          >
                            <Ionicons name={isEditingPost ? "close-outline" : "create-outline"} size={17} color={employeePalette.text} />
                            <Text style={styles.newsPostMenuItemText}>{isEditingPost ? "Hủy sửa" : "Chỉnh sửa"}</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            disabled={isDeletingPost}
                            onPress={() => confirmDeleteInternalNews(id)}
                            style={({ pressed }) => [styles.newsPostMenuItem, pressed && styles.pressed]}
                          >
                            <Ionicons name="trash-outline" size={17} color={employeePalette.red} />
                            <Text style={[styles.newsPostMenuItemText, styles.newsPostMenuItemDanger]}>
                              {isDeletingPost ? "Đang xóa..." : "Xóa bài viết"}
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
                {isEditingPost ? (
                  <View style={styles.newsEditForm}>
                    <TextInput
                      editable={!updatingPost}
                      onChangeText={setEditPostTitle}
                      placeholder="Tiêu đề bài viết"
                      placeholderTextColor="rgba(91, 64, 60, 0.45)"
                      style={styles.newsCreateTitleInput}
                      value={editPostTitle}
                    />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => openRichModal("edit")}
                      style={styles.newsRichPreviewButton}
                    >
                      {editPostContent ? (
                        <RenderHtml
                          contentWidth={screenWidth - 64}
                          source={{ html: editPostContent }}
                          tagsStyles={{
                            p: { color: "#3b2c2a", fontSize: 14, marginVertical: 2 },
                            img: { maxWidth: "100%", borderRadius: 8 }
                          }}
                        />
                      ) : (
                        <Text style={styles.newsCreatePlaceholder}>Nội dung bài viết... (hỗ trợ ảnh inline)</Text>
                      )}
                    </Pressable>

                    {editPostImage || editPostThumbnailUrl ? (
                      <View style={styles.newsCreateImagePreview}>
                        <Image source={{ uri: editPostImage?.uri || mediaUrl(editPostThumbnailUrl) }} style={styles.newsCreateImage} />
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            setEditPostImage(null);
                            setEditPostThumbnailUrl("");
                          }}
                          style={styles.newsCreateImageRemove}
                        >
                          <Ionicons name="close" size={16} color="#ffffff" />
                        </Pressable>
                      </View>
                    ) : null}
                    {editPostKeepAttachments.length > 0 ? (
                      <View style={styles.newsCreateAttachmentsList}>
                        {editPostKeepAttachments.map((attachment, idx) => (
                          <View key={`keep-attach-${idx}`} style={styles.newsCreateAttachmentPreview}>
                            <View style={styles.newsCreateAttachmentTitleRow}>
                              <Ionicons name="document-text-outline" size={18} color={employeePalette.red} />
                              <Text numberOfLines={1} style={styles.newsCreateAttachmentName}>
                                {attachment.name || attachment.title || "Tài liệu cũ"}
                              </Text>
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => setEditPostKeepAttachments((current) => current.filter((_, i) => i !== idx))}
                              style={({ pressed }) => [styles.newsCreateAttachmentRemove, pressed && styles.pressed]}
                            >
                              <Ionicons name="close" size={16} color={employeePalette.muted} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {editPostNewAttachments.length > 0 ? (
                      <View style={styles.newsCreateAttachmentsList}>
                        {editPostNewAttachments.map((attachment, idx) => (
                          <View key={`new-edit-attach-${idx}`} style={styles.newsCreateAttachmentPreview}>
                            <View style={styles.newsCreateAttachmentTitleRow}>
                              <Ionicons name="document-text-outline" size={18} color={employeePalette.red} />
                              <Text numberOfLines={1} style={styles.newsCreateAttachmentName}>{attachment.name}</Text>
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => setEditPostNewAttachments((current) => current.filter((_, i) => i !== idx))}
                              style={({ pressed }) => [styles.newsCreateAttachmentRemove, pressed && styles.pressed]}
                            >
                              <Ionicons name="close" size={16} color={employeePalette.muted} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.newsEditActions}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={updatingPost}
                        onPress={() => pickNewsImage("edit")}
                        style={({ pressed }) => [styles.newsEditImageButton, pressed && styles.pressed]}
                      >
                        <Ionicons name="image-outline" size={18} color={employeePalette.red} />
                        <Text style={styles.newsEditImageText}>Đổi ảnh</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={updatingPost}
                        onPress={() => pickNewsAttachment("edit")}
                        style={({ pressed }) => [styles.newsEditImageButton, pressed && styles.pressed, { marginLeft: 8 }]}
                      >
                        <Ionicons name="attach-outline" size={20} color={employeePalette.red} />
                        <Text style={styles.newsEditImageText}>Đính kèm</Text>
                      </Pressable>
                      <View style={styles.newsEditActionButtons}>
                        <Pressable
                          accessibilityRole="button"
                          disabled={updatingPost}
                          onPress={cancelEditInternalNews}
                          style={({ pressed }) => [styles.newsEditCancelButton, pressed && styles.pressed]}
                        >
                          <Text style={styles.newsEditCancelText}>Hủy</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          disabled={updatingPost}
                          onPress={submitEditInternalNews}
                          style={({ pressed }) => [
                            styles.newsEditSaveButton,
                            updatingPost && styles.newsCreateButtonDisabled,
                            pressed && styles.pressed
                          ]}
                        >
                          <Text style={styles.newsEditSaveText}>{updatingPost ? "Đang lưu..." : "Lưu"}</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={highlighted ? styles.newsPostTitle : styles.newsStandardBody}>{title}</Text>
                    {content ? <ExpandableNewsPostText content={content} /> : null}
                    {imageUri ? <Image source={{ uri: imageUri }} style={styles.newsPostImage} /> : null}
                    {attachments.length > 0 ? (
                      <View style={styles.newsPostAttachmentList}>
                        {attachments.map((attachment, attachmentIndex) => (
                          <NewsAttachmentChip
                            key={`${id}-attachment-${attachmentIndex}`}
                            attachment={attachment}
                          />
                        ))}
                      </View>
                    ) : null}
                  </>
                )}
                <NewsPostActions
                  initialLiked={apiBoolean(post.is_liked ?? post.liked)}
                  postId={id}
                  postSummary={content}
                  postTitle={title}
                  likes={likes}
                  comments={`${comments} Bình luận`}
                  share
                />
                {highlighted ? <View style={styles.newsGoldAccent} /> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Rich Editor Modal */}
      <Modal
        animationType="slide"
        onRequestClose={() => setShowRichModal(false)}
        presentationStyle="pageSheet"
        visible={showRichModal}
      >
        <SafeAreaView edges={["top", "left", "right"]} style={styles.richModalSafe}>
          {/* Header */}
          <View style={styles.richModalHeader}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowRichModal(false)}
              style={({ pressed }) => [styles.richModalClose, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={24} color={employeePalette.text} />
            </Pressable>
            <Text style={styles.richModalTitle}>Soạn nội dung</Text>
            <Pressable
              accessibilityRole="button"
              onPress={closeRichModalAndSave}
              style={({ pressed }) => [styles.richModalDone, pressed && styles.pressed]}
            >
              <Text style={styles.richModalDoneText}>Xong</Text>
            </Pressable>
          </View>

          {/* Editor chiếm toàn bộ không gian, thêm paddingBottom để không bị che bởi toolbar */}
          <RichText
            editor={richModalMode === "create" ? editorCreate : editorEdit}
            style={{ flex: 1 }}
          />

          {/*
            Toolbar: absolute-positioned KAV bám sát đáy màn hình.
            Khi bàn phím lên, KAV tự đẩy toolbar lên đúng phía trên bàn phím.
          */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
          >
            <NewsRichToolbar
              mode={richModalMode}
              editorCreate={editorCreate}
              editorEdit={editorEdit}
              onPickImage={() => insertInlineImageToRichEditor(richModalMode)}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Custom Rich Toolbar dùng Ionicons — không phụ thuộc vào PNG assets của TenTap
// ---------------------------------------------------------------------------
type NewsRichToolbarProps = {
  mode: "create" | "edit";
  editorCreate: ReturnType<typeof useEditorBridge>;
  editorEdit: ReturnType<typeof useEditorBridge>;
  onPickImage: () => void;
};
function NewsRichToolbar({ mode, editorCreate, editorEdit, onPickImage }: NewsRichToolbarProps) {
  const editor = mode === "create" ? editorCreate : editorEdit;
  const editorState = useBridgeState(editor);

  const txtBtn = (label: string, onPress: () => void, active = false, fontStyle?: "normal" | "italic", textDecorationLine?: "none" | "line-through" | "underline") => (
    <Pressable
      key={label + String(active)}
      onPress={onPress}
      style={({ pressed }) => [richToolbarBtnStyle, active && richToolbarBtnActive, pressed && richToolbarBtnPressed]}
    >
      <Text style={{
        color: active ? employeePalette.red : employeePalette.text,
        fontFamily: label === "B" ? appFonts.bold : appFonts.regular,
        fontStyle: fontStyle ?? "normal",
        fontSize: 14,
        textDecorationLine: textDecorationLine ?? "none"
      }}>{label}</Text>
    </Pressable>
  );

  const icoBtn = (icon: React.ComponentProps<typeof Ionicons>["name"], onPress: () => void, active = false) => (
    <Pressable
      key={icon}
      onPress={onPress}
      style={({ pressed }) => [richToolbarBtnStyle, active && richToolbarBtnActive, pressed && richToolbarBtnPressed]}
    >
      <Ionicons name={icon} size={19} color={active ? employeePalette.red : employeePalette.text} />
    </Pressable>
  );

  return (
    <View style={richToolbarWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={richToolbarScroll}
        keyboardShouldPersistTaps="always"
      >
        {txtBtn("B", () => editor.toggleBold(), editorState.isBoldActive)}
        {txtBtn("I", () => editor.toggleItalic(), editorState.isItalicActive, "italic")}
        {txtBtn("U", () => editor.toggleUnderline(), editorState.isUnderlineActive, "normal", "underline")}
        {txtBtn("S", () => editor.toggleStrike(), editorState.isStrikeActive, "normal", "line-through")}
        <View style={richToolbarDivider} />
        {icoBtn("list-outline", () => editor.toggleBulletList(), editorState.isBulletListActive)}
        {icoBtn("list-circle-outline", () => editor.toggleOrderedList(), editorState.isOrderedListActive)}
        <View style={richToolbarDivider} />
        {icoBtn("arrow-undo-outline", () => editor.undo(), false)}
        {icoBtn("arrow-redo-outline", () => editor.redo(), false)}
        <View style={richToolbarDivider} />
        {icoBtn("image-outline", onPickImage, false)}
      </ScrollView>
    </View>
  );
}
const richToolbarWrap: import("react-native").ViewStyle = {
  backgroundColor: "#fdf5f4",
  borderTopColor: "rgba(227,190,184,0.5)",
  borderTopWidth: StyleSheet.hairlineWidth
};
const richToolbarScroll: import("react-native").ViewStyle = {
  alignItems: "center",
  flexDirection: "row",
  gap: 2,
  paddingHorizontal: 8,
  paddingVertical: 6
};
const richToolbarBtnStyle: import("react-native").ViewStyle = {
  alignItems: "center",
  borderRadius: 8,
  height: 36,
  justifyContent: "center",
  width: 36
};
const richToolbarBtnActive: import("react-native").ViewStyle = {
  backgroundColor: "rgba(227,190,184,0.25)"
};
const richToolbarBtnPressed: import("react-native").ViewStyle = {
  opacity: 0.55
};
const richToolbarDivider: import("react-native").ViewStyle = {
  backgroundColor: "rgba(227,190,184,0.5)",
  height: 22,
  marginHorizontal: 4,
  width: StyleSheet.hairlineWidth
};

function ExpandableNewsPostText({ content }: { content: string }) {
  const { width: screenWidth } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  // Detect xem content có phải HTML không (có chứa HTML tag)
  const isHtmlContent = /<[a-z][\s\S]*>/i.test(content);

  function handleTextLayout(event: NativeSyntheticEvent<TextLayoutEventData>) {
    setCanExpand(event.nativeEvent.lines.length > newsPostPreviewLines);
  }

  if (isHtmlContent) {
    return (
      <View style={styles.newsPostBodyWrap}>
        <RenderHtml
          contentWidth={screenWidth - 32}
          source={{ html: content }}
          tagsStyles={{
            body: { color: "#3b2c2a", fontFamily: appFonts.regular, fontSize: 14, lineHeight: 22 },
            p: { marginVertical: 2 },
            strong: { fontFamily: appFonts.semiBold },
            img: { borderRadius: 8, maxWidth: "100%" },
            ul: { paddingLeft: 16 },
            ol: { paddingLeft: 16 }
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.newsPostBodyWrap}>
      <Text
        aria-hidden
        onTextLayout={handleTextLayout}
        style={[styles.newsPostBody, styles.newsPostBodyMeasure]}
      >
        {content}
      </Text>
      <Text numberOfLines={expanded ? undefined : newsPostPreviewLines} style={styles.newsPostBody}>
        {content}
      </Text>
      {canExpand ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((current) => !current)}
          style={({ pressed }) => [styles.newsReadMoreButton, pressed && styles.pressed]}
        >
          <Text style={styles.newsReadMore}>{expanded ? "Thu gọn" : "Xem thêm"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function NewsAttachmentChip({ attachment }: { attachment: ApiObject }) {
  const title = apiText(attachment.name ?? attachment.title ?? attachment.file_name ?? attachment.fileName, "Tài liệu đính kèm");
  const url = mediaUrl(attachment.url ?? attachment.file_url ?? attachment.fileUrl ?? attachment.path ?? attachment.uri);

  function openAttachment() {
    if (!url) {
      notifyError("Tài liệu này chưa có đường dẫn để mở.");
      return;
    }

    router.push({
      pathname: "/employee/document-viewer",
      params: { title, url }
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={openAttachment}
      style={({ pressed }) => [styles.newsPostAttachmentChip, pressed && styles.pressed]}
    >
      <Ionicons name="document-text-outline" size={17} color={employeePalette.red} />
      <Text numberOfLines={1} style={styles.newsPostAttachmentText}>{title}</Text>
      <Ionicons name="open-outline" size={15} color={employeePalette.muted} />
    </Pressable>
  );
}

function NewsPostActions({
  comments,
  initialLiked,
  likes,
  postId,
  postSummary,
  postTitle,
  share
}: {
  comments: string;
  initialLiked?: boolean;
  likes: string;
  postId?: string;
  postSummary?: string;
  postTitle?: string;
  share?: boolean;
}) {
  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [likesCount, setLikesCount] = useState(apiNumber(likes, 0));
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    setLiked(Boolean(initialLiked));
    setLikesCount(apiNumber(likes, 0));
  }, [initialLiked, likes, postId]);

  async function toggleLike() {
    if (!postId) return;
    const previousLiked = liked;
    const previousLikesCount = likesCount;
    setLiked(!previousLiked);
    setLikesCount((value) => Math.max(0, value + (previousLiked ? -1 : 1)));
    setLiking(true);

    try {
      const response = await employeeApi.likeInternalNews(postId);
      if (isApiObject(response.data)) {
        setLiked(apiBoolean(response.data.is_liked ?? response.data.liked, !previousLiked));
        setLikesCount(apiNumber(response.data.likes_count, previousLikesCount));
      }
    } catch (error) {
      setLiked(previousLiked);
      setLikesCount(previousLikesCount);
      appLogger.warn("employee.news.like", "Không thể thích bài viết nội bộ.", { postId, error });
      notifyError(error, "Không thể cập nhật lượt thích.");
    } finally {
      setLiking(false);
    }
  }

  async function sharePost() {
    const title = apiText(postTitle, "Tin tức nội bộ");
    const summary = apiText(postSummary, "");
    const message = summary ? `${title}\n\n${summary}` : title;

    try {
      await Share.share({ message, title });
    } catch (error) {
      appLogger.warn("employee.news.share", "Không thể chia sẻ bài viết nội bộ.", { postId, error });
      notifyError(error, "Không thể chia sẻ bài viết.");
    }
  }

  return (
    <View style={styles.newsPostActions}>
      <Pressable disabled={liking} onPress={toggleLike} style={({ pressed }) => [styles.newsPostAction, (pressed || liking) && styles.pressed]}>
        <Ionicons name={liked ? "thumbs-up" : "thumbs-up-outline"} size={20} color={liked ? employeePalette.red : employeePalette.muted} />
        <Text style={styles.newsPostActionText}>{likesCount}</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          if (!postId) return;
          router.push({ pathname: "/employee/comments", params: { postId, title: postTitle ?? "" } });
        }}
        style={styles.newsPostAction}
      >
        <Ionicons name="chatbox-outline" size={20} color={employeePalette.muted} />
        <Text style={styles.newsPostActionText}>{comments}</Text>
      </Pressable>
      {share ? (
        <Pressable
          accessibilityRole="button"
          onPress={sharePost}
          style={({ pressed }) => [styles.newsPostActionShare, pressed && styles.pressed]}
        >
          <Ionicons name="share-social-outline" size={20} color={employeePalette.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

