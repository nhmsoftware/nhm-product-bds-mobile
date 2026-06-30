import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiObject } from "../utils/apiNormalizers";
import { apiText, isApiObject } from "../utils/apiNormalizers";
import { useRealtimeEvent, useRealtimeRoom } from "@/services/notifications/provider";

function areaCommentKey(comment: ApiObject) {
  const id = apiText(comment.id, "").trim();
  if (id) return `id:${id}`;

  return [
    apiText(comment.user_id ?? comment.userId, ""),
    apiText(comment.content ?? comment.text, ""),
    apiText(comment.created_at ?? comment.createdAt, "")
  ].join("|");
}

function prependAreaComment(comments: ApiObject[], comment: ApiObject) {
  const nextKey = areaCommentKey(comment);

  if (nextKey && comments.some((item) => areaCommentKey(item) === nextKey)) {
    return comments;
  }

  return [comment, ...comments];
}

function mergeAreaComments(primary: ApiObject[], secondary: ApiObject[]) {
  return secondary.reduce((items, comment) => prependAreaComment(items, comment), primary);
}

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

function normalizeRealtimeAreaComment(payload: unknown) {
  const root = isApiObject(payload) ? payload : {};
  const data = isApiObject(root.data) ? root.data : {};
  const nestedPayload = isApiObject(root.payload) ? root.payload : {};
  const candidate = isApiObject(root.comment) || root.area_id || root.areaId
    ? root
    : isApiObject(data.comment) || data.area_id || data.areaId
      ? data
      : nestedPayload;

  return normalizeAreaComment(candidate);
}

export function useRealtimeAreaComments(areaId: string, fetchedComments: ApiObject[]) {
  const [realtimeComments, setRealtimeComments] = useState<ApiObject[]>([]);
  const areaDotRoom = areaId ? `area.${areaId}` : "";
  const areaColonRoom = areaId ? `area:${areaId}` : "";

  useEffect(() => {
    setRealtimeComments([]);
  }, [areaId]);

  const appendComment = useCallback((comment: ApiObject) => {
    setRealtimeComments((current) => prependAreaComment(current, comment));
  }, []);

  const comments = useMemo(
    () => mergeAreaComments(fetchedComments, realtimeComments),
    [fetchedComments, realtimeComments]
  );

  const handleRealtimeComment = useCallback((payload: unknown) => {
    const realtimeComment = normalizeRealtimeAreaComment(payload);

    if (!realtimeComment || realtimeComment.areaId !== areaId) {
      return;
    }

    appendComment(realtimeComment.comment);
  }, [appendComment, areaId]);

  useRealtimeEvent("area.comment.created", handleRealtimeComment);
  useRealtimeRoom(areaDotRoom);
  useRealtimeRoom(areaColonRoom);

  return { appendComment, comments };
}
