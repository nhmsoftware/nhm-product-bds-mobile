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
import { apiList, apiText, isApiObject } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { formatApiDateTime } from "./utils/formatters";
import { useCopy } from "./utils/i18n";
import { back, paramValue } from "./utils/navigation";
export function CommentsScreen() {
  const c = useCopy().notifications;
  const params = useLocalSearchParams<{ postId?: string; title?: string }>();
  const postId = paramValue(params.postId) ?? "";
  const routeTitle = paramValue(params.title) ?? "";
  const [commentDraft, setCommentDraft] = useState("");
  const [comments, setComments] = useState<ApiObject[]>([]);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const { data, failed, loading } = useEmployeeApiData(
    () => postId ? employeeApi.internalNewsDetail(postId) : Promise.resolve({ data: {} }),
    [postId]
  );
  const detailPayload = isApiObject(data) ? data : {};
  const detail = isApiObject(detailPayload.detail) ? detailPayload.detail : detailPayload;
  const fetchedComments = useMemo(() => apiList(detailPayload.comments), [detailPayload.comments]);
  const postTitle = apiText(detail.title ?? routeTitle, "Bình luận bài viết");
  const postSummary = htmlToPlainText(apiText(detail.summary ?? detail.content, ""));

  useEffect(() => {
    setComments(fetchedComments);
  }, [fetchedComments]);

  const handleRealtimeNewsComment = useCallback((payload: unknown) => {
    const realtimeComment = normalizeRealtimeNewsComment(payload, postId);
    if (!realtimeComment || realtimeComment.newsId !== postId) {
      return;
    }

    setComments((current) => prependNewsComment(current, realtimeComment.comment));
  }, [postId]);

  useRealtimeEvent("news.comment.created", handleRealtimeNewsComment);
  useRealtimeRoom(postId ? `news:${postId}` : "");

  async function submitComment() {
    const content = commentDraft.trim();

    if (!postId || !content || commentSubmitting) {
      return;
    }

    setCommentSubmitting(true);
    try {
      const response = await employeeApi.addInternalNewsComment(postId, content);
      const createdComment = isApiObject(response.data) ? response.data : {};
      setComments((current) => prependNewsComment(current, createdComment));
      setCommentDraft("");
      notifySuccess({ message: response.message || "Đã gửi bình luận." });
    } catch (error) {
      appLogger.warn("employee.news.comment", "Không thể gửi bình luận bài viết nội bộ.", { postId, error });
      notifyError(error, "Không thể gửi bình luận.");
    } finally {
      setCommentSubmitting(false);
    }
  }

  return (
    <EmployeePage title={c.comments} subtitle="Bảng tin nội bộ" back={back}>
      {!postId ? (
        <EmployeeCard>
          <Text style={styles.listTitle}>Chưa chọn bài viết</Text>
          <Text style={styles.bodyText}>Vui lòng mở bình luận từ một bài viết trong tab Tin tức.</Text>
        </EmployeeCard>
      ) : (
        <>
          <EmployeeCard>
            <Text style={styles.listTitle}>{postTitle}</Text>
            {postSummary ? <Text numberOfLines={3} style={styles.bodyText}>{postSummary}</Text> : null}
          </EmployeeCard>

          {loading ? <Text style={styles.bodyText}>Đang tải bình luận...</Text> : null}
          {failed ? <Text style={styles.bodyText}>Không thể tải bình luận. Vui lòng thử lại.</Text> : null}
          {!loading && !failed && comments.length === 0 ? <Text style={styles.bodyText}>Chưa có bình luận nào.</Text> : null}

          {comments.map((comment, index) => {
            const commentUser = isApiObject(comment.user) ? comment.user : {};
            const name = apiText(comment.user_name ?? comment.userName ?? commentUser.name, "Người dùng hệ thống");

            return (
              <EmployeeCard key={newsCommentKey(comment) || `${name}-${index}`}>
                <Text style={styles.listTitle}>{name}</Text>
                <Text style={styles.bodyText}>{apiText(comment.content ?? comment.text, "")}</Text>
                <Text style={styles.commentTimeText}>{formatApiDateTime(comment.created_at ?? comment.createdAt, "Vừa xong")}</Text>
              </EmployeeCard>
            );
          })}

          <View style={styles.commentsComposer}>
            <TextInput
              editable={!commentSubmitting}
              multiline
              onChangeText={setCommentDraft}
              placeholder="Nhập nội dung trao đổi..."
              placeholderTextColor="#8f706b"
              style={styles.commentsInput}
              textAlignVertical="top"
              value={commentDraft}
            />
            <Pressable
              accessibilityRole="button"
              disabled={commentSubmitting || !commentDraft.trim()}
              onPress={submitComment}
              style={({ pressed }) => [
                styles.commentsSendButton,
                (pressed || commentSubmitting || !commentDraft.trim()) && styles.pressed
              ]}
            >
              <Ionicons name="send-outline" size={18} color="#ffffff" />
              <Text style={styles.commentsSendText}>{commentSubmitting ? "Đang gửi" : c.send}</Text>
            </Pressable>
          </View>
        </>
      )}
    </EmployeePage>
  );
}



// ---- Local helpers extracted from original monolith ----

function htmlToPlainText(content: string) {
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


// ---- Local helpers extracted from original monolith ----

function normalizeRealtimeNewsComment(payload: unknown, fallbackNewsId: string) {
  const root = isApiObject(payload) ? payload : {};
  const data = isApiObject(root.data) ? root.data : {};
  const source = Object.keys(data).length > 0 ? data : root;
  const comment = isApiObject(source.comment) ? source.comment : source;
  const newsId = apiText(source.news_id ?? source.newsId ?? comment.news_id ?? comment.newsId, fallbackNewsId).trim();
  const content = apiText(comment.content ?? comment.text, "").trim();

  if (!newsId || !content) {
    return null;
  }

  return {
    newsId,
    comment: {
      ...comment,
      news_id: newsId
    }
  };
}


// ---- Local helpers extracted from original monolith ----

function prependNewsComment(comments: ApiObject[], comment: ApiObject) {
  const nextKey = newsCommentKey(comment);

  if (nextKey && comments.some((item) => newsCommentKey(item) === nextKey)) {
    return comments;
  }

  return [comment, ...comments];
}


// ---- Local helpers extracted from original monolith ----

function newsCommentKey(comment: ApiObject) {
  const id = apiText(comment.id, "").trim();
  if (id) return id;

  return [
    apiText(comment.news_id ?? comment.newsId, ""),
    apiText(comment.user_id ?? comment.userId, ""),
    apiText(comment.content ?? comment.text, ""),
    apiText(comment.created_at ?? comment.createdAt, "")
  ].filter(Boolean).join("|");
}

