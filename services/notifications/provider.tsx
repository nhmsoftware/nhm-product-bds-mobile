import Constants from "expo-constants";
import { router, type Href } from "expo-router";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { io, type Socket } from "socket.io-client";

import { EAS_PROJECT_ID, REALTIME_URL } from "@/libs/env";
import { appLogger } from "@/libs/logger";
import { notifyInfo } from "@/libs/notify";
import { authApi } from "@/services/auth/api";
import { isDemoSession } from "@/services/auth/demo";
import { useAuth } from "@/services/auth/store";
import { employeeApi } from "@/services/employee/api";

type NotificationPayload = Record<string, unknown>;
type ExpoNotificationsModule = typeof import("expo-notifications");
type RealtimeEventListener = (payload: unknown, event: string) => void;

type NotificationState = {
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: (value: number | ((current: number) => number)) => void;
  unreadCount: number;
};

const recentRealtimeNotificationKeys = new Map<string, number>();
const realtimeNotificationDedupeWindowMs = 10_000;
let activeRealtimeSocket: Socket | null = null;
const realtimeEventListeners = new Map<string, Set<RealtimeEventListener>>();
const realtimeRoomRefs = new Map<string, number>();
const NotificationContext = createContext<NotificationState>({
  refreshUnreadCount: async () => undefined,
  setUnreadCount: () => undefined,
  unreadCount: 0
});
const isAndroidExpoGo = Platform.OS === "android" && Constants.executionEnvironment === "storeClient";
const Notifications = isAndroidExpoGo
  ? null
  : (require("expo-notifications") as ExpoNotificationsModule);

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function recordValue(value: unknown): NotificationPayload {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    ? (value as NotificationPayload)
    : {};
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function getProjectId() {
  const extra = Constants.expoConfig?.extra;
  const easExtra = recordValue(recordValue(extra).eas);
  return EAS_PROJECT_ID || stringValue(Constants.easConfig?.projectId) || stringValue(easExtra.projectId);
}

function routeFromNotificationData(data: NotificationPayload): Href | null {
  const actionType = stringValue(data.action_type ?? data.actionType ?? data.type);
  const actionId = stringValue(data.action_id ?? data.actionId ?? data.id);

  if (actionType.includes("leave")) {
    return "/employee/leave-requests";
  }

  if (actionType.includes("department_transfer") || actionType.includes("transfer")) {
    return "/employee/transfer-requests";
  }

  if (actionType.includes("lot") || actionType.includes("deposit") || actionType.includes("inventory")) {
    return actionId ? { pathname: "/employee/lot-detail", params: { lotId: actionId } } : "/employee/inventory-map";
  }

  if (actionType.includes("news") || actionType.includes("post")) {
    return "/(app)/employee/(tabs)/news";
  }

  if (actionType.includes("learning") || actionType.includes("quiz")) {
    return "/employee/required-learning";
  }

  return null;
}

function notificationIdFromData(data: NotificationPayload) {
  return stringValue(data.notification_id ?? data.notificationId ?? data.id);
}

async function markNotificationOpened(data: NotificationPayload, setUnreadCount?: NotificationState["setUnreadCount"]) {
  const notificationId = notificationIdFromData(data);
  if (!notificationId) {
    return;
  }

  try {
    await employeeApi.markNotificationRead(notificationId);
    setUnreadCount?.((current) => Math.max(0, current - 1));
  } catch (error) {
    appLogger.warn("notifications.read", "Không thể đánh dấu thông báo đã đọc khi mở.", {
      error,
      notificationId
    });
  }
}

function openNotification(data: NotificationPayload) {
  const href = routeFromNotificationData(data);

  if (href) {
    router.push(href);
    return;
  }

  router.push("/employee/notifications");
}

async function handleNotificationOpen(data: NotificationPayload, setUnreadCount?: NotificationState["setUnreadCount"]) {
  await markNotificationOpened(data, setUnreadCount);
  openNotification(data);
}

async function configureAndroidChannel() {
  if (Platform.OS !== "android" || !Notifications) {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "Thông báo",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#950100",
    sound: "default"
  });
}

async function registerPushToken() {
  if (!Notifications) {
    appLogger.info("notifications.token", "Bỏ qua push notification khi chạy Android Expo Go.");
    return;
  }

  await configureAndroidChannel();

  const currentPermission = await Notifications.getPermissionsAsync();
  const finalPermission = currentPermission.granted
    ? currentPermission
    : await Notifications.requestPermissionsAsync();

  if (!finalPermission.granted) {
    appLogger.warn("notifications.permission", "Người dùng chưa cấp quyền nhận thông báo.");
    return;
  }

  const projectId = getProjectId();
  if (!projectId) {
    appLogger.warn(
      "notifications.token",
      "Thiếu EXPO_PUBLIC_EAS_PROJECT_ID nên chưa thể lấy Expo push token."
    );
    return;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });

  await authApi.updatePushToken(tokenResponse.data);
  appLogger.info("notifications.token", "Đã cập nhật push token cho thiết bị.", {
    hasProjectId: Boolean(projectId)
  });
}

function extractNotificationPayload(event: string, payload: unknown) {
  const root = recordValue(payload);
  const notification = recordValue(root.notification);
  const data = recordValue(root.data);
  const payloadData = recordValue(root.payload);
  const nestedData = recordValue(notification.data);
  const title =
    stringValue(root.title) ||
    stringValue(data.title) ||
    stringValue(payloadData.title) ||
    stringValue(notification.title) ||
    stringValue(nestedData.title);
  const body =
    stringValue(root.body) ||
    stringValue(root.message) ||
    stringValue(data.body) ||
    stringValue(data.message) ||
    stringValue(payloadData.body) ||
    stringValue(payloadData.message) ||
    stringValue(notification.body) ||
    stringValue(nestedData.body);
  const actionData: NotificationPayload = {
    ...root,
    ...data,
    ...payloadData,
    ...nestedData,
    event,
    action_type:
      data.action_type ??
      payloadData.action_type ??
      nestedData.action_type ??
      root.action_type ??
      event,
    action_id:
      data.action_id ??
      payloadData.action_id ??
      nestedData.action_id ??
      root.action_id ??
      root.id
  };

  return { title, body, data: actionData };
}

function isPayloadForUser(payload: unknown, userId: string) {
  const root = recordValue(payload);
  const data = recordValue(root.data);
  const payloadData = recordValue(root.payload);
  const notification = recordValue(root.notification);
  const candidates = [
    root.user_id,
    root.notifiable_id,
    data.user_id,
    data.notifiable_id,
    payloadData.user_id,
    payloadData.notifiable_id,
    notification.user_id,
    notification.notifiable_id
  ].map((value) => String(value ?? ""));

  return candidates.every((candidate) => !candidate) || candidates.includes(userId);
}

function realtimeNotificationKey(event: string, payload: unknown, notification: ReturnType<typeof extractNotificationPayload>) {
  const root = recordValue(payload);
  const data = recordValue(notification.data);
  const id = stringValue(root.id ?? data.id);
  const actionId = stringValue(data.action_id ?? data.actionId);
  const userId = stringValue(root.user_id ?? root.notifiable_id ?? data.user_id ?? data.notifiable_id);

  return [id, actionId, userId, notification.title, notification.body].filter(Boolean).join("|");
}

function hasRecentRealtimeNotification(key: string) {
  const now = Date.now();

  for (const [cachedKey, createdAt] of recentRealtimeNotificationKeys.entries()) {
    if (now - createdAt > realtimeNotificationDedupeWindowMs) {
      recentRealtimeNotificationKeys.delete(cachedKey);
    }
  }

  if (recentRealtimeNotificationKeys.has(key)) {
    return true;
  }

  recentRealtimeNotificationKeys.set(key, now);
  return false;
}

function dispatchRealtimeEvent(event: string, payload: unknown) {
  const listeners = realtimeEventListeners.get(event);
  const wildcardListeners = realtimeEventListeners.get("*");

  [listeners, wildcardListeners].forEach((listenerSet) => {
    listenerSet?.forEach((listener) => {
      try {
        listener(payload, event);
      } catch (error) {
        appLogger.warn("notifications.socket.event", "Realtime event listener failed.", { event, error });
      }
    });
  });
}

function addRealtimeEventListener(event: string, listener: RealtimeEventListener) {
  const listeners = realtimeEventListeners.get(event) ?? new Set<RealtimeEventListener>();
  listeners.add(listener);
  realtimeEventListeners.set(event, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      realtimeEventListeners.delete(event);
    }
  };
}

function joinRealtimeRoom(room: string) {
  const normalizedRoom = room.trim();

  if (!normalizedRoom) {
    return () => undefined;
  }

  realtimeRoomRefs.set(normalizedRoom, (realtimeRoomRefs.get(normalizedRoom) ?? 0) + 1);
  activeRealtimeSocket?.emit("join", normalizedRoom);

  return () => {
    const nextCount = (realtimeRoomRefs.get(normalizedRoom) ?? 1) - 1;

    if (nextCount > 0) {
      realtimeRoomRefs.set(normalizedRoom, nextCount);
      return;
    }

    realtimeRoomRefs.delete(normalizedRoom);
    activeRealtimeSocket?.emit("leave", normalizedRoom);
  };
}

function subscribeRealtime(userId: string, setUnreadCount: NotificationState["setUnreadCount"]) {
  activeRealtimeSocket?.removeAllListeners();
  activeRealtimeSocket?.disconnect();

  let socket: Socket | null = io(REALTIME_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    timeout: 10000
  });
  activeRealtimeSocket = socket;

  socket.on("connect", () => {
    socket?.emit("user:join", { userId });
    socket?.emit("join", `user.${userId}`);
    socket?.emit("join", `user:${userId}`);
    socket?.emit("join", `private_user_${userId}`);
    realtimeRoomRefs.forEach((_count, room) => {
      socket?.emit("join", room);
    });
    appLogger.info("notifications.socket", "Realtime notification socket connected.", {
      realtimeUrl: REALTIME_URL
    });
  });

  socket.onAny((event, payload) => {
    dispatchRealtimeEvent(event, payload);

    if (
      event === "area.comment.created" ||
      event === ".area.comment.created" ||
      event === "news.comment.created" ||
      event === ".news.comment.created"
    ) {
      return;
    }

    if (__DEV__) {
      appLogger.info("notifications.socket.event", "Realtime socket event received.", {
        event,
        hasPayload: Boolean(payload)
      });
    }

    if (!isPayloadForUser(payload, userId)) {
      if (__DEV__) {
        appLogger.info("notifications.socket.event", "Bỏ qua realtime event không thuộc user hiện tại.", {
          event
        });
      }
      return;
    }

    const notification = extractNotificationPayload(event, payload);
    if (!notification.title && !notification.body) {
      if (__DEV__) {
        appLogger.warn("notifications.socket.event", "Realtime event thiếu title/body.", {
          event
        });
      }
      return;
    }

    const notificationKey = realtimeNotificationKey(event, payload, notification);
    if (notificationKey && hasRecentRealtimeNotification(notificationKey)) {
      if (__DEV__) {
        appLogger.info("notifications.socket.event", "Bỏ qua realtime notification trùng lặp.", {
          event
        });
      }
      return;
    }

    const unreadCount = numberValue(notification.data.unread_count, -1);
    setUnreadCount((current) => (unreadCount >= 0 ? unreadCount : current + 1));

    notifyInfo({
      message: notification.title || "Bạn có thông báo mới",
      description: notification.body || undefined,
      onPress: () => {
        void handleNotificationOpen(notification.data, setUnreadCount);
      }
    });

    if (Notifications) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title || "Bạn có thông báo mới",
          body: notification.body || undefined,
          data: notification.data
        },
        trigger: null
      }).catch((error) => {
        appLogger.warn("notifications.local", "Không thể hiển thị local notification.", { error });
      });
    }
  });

  socket.on("connect_error", (error) => {
    appLogger.warn("notifications.socket", "Realtime notification socket connect failed.", {
      message: error.message,
      realtimeUrl: REALTIME_URL
    });
  });

  socket.on("reconnect_failed", () => {
    appLogger.warn("notifications.socket", "Realtime socket đã hết số lần thử kết nối lại.", {
      realtimeUrl: REALTIME_URL
    });
  });

  return () => {
    socket?.removeAllListeners();
    socket?.disconnect();
    if (activeRealtimeSocket === socket) {
      activeRealtimeSocket = null;
    }
    socket = null;
  };
}

export function NotificationProvider({ children }: PropsWithChildren) {
  const { session, signedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = useMemo(() => session?.user.id ?? "", [session?.user.id]);
  const refreshUnreadCount = useCallback(async () => {
    if (!signedIn || !session || isDemoSession(session)) {
      setUnreadCount(0);
      return;
    }

    const response = await employeeApi.notifications({ per_page: 1 });
    const data = recordValue(response.data);
    setUnreadCount(numberValue(data.unread_count, 0));
  }, [session, signedIn]);
  const contextValue = useMemo(
    () => ({
      refreshUnreadCount,
      setUnreadCount,
      unreadCount
    }),
    [refreshUnreadCount, unreadCount]
  );

  useEffect(() => {
    if (!signedIn || !session || isDemoSession(session)) {
      setUnreadCount(0);
      return undefined;
    }

    refreshUnreadCount().catch((error) => {
      appLogger.warn("notifications.unread", "Không thể tải số thông báo chưa đọc.", { error });
    });

    registerPushToken().catch((error) => {
      appLogger.warn("notifications.token", "Không thể đăng ký push token.", { error });
    });

    return subscribeRealtime(userId, setUnreadCount);
  }, [refreshUnreadCount, session, signedIn, userId]);

  useEffect(() => {
    if (!Notifications) {
      return undefined;
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleNotificationOpen(
        recordValue(response.notification.request.content.data),
        setUnreadCount
      );
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          void handleNotificationOpen(
            recordValue(response.notification.request.content.data),
            setUnreadCount
          );
        }
      })
      .catch((error) => {
        appLogger.warn("notifications.response", "Không thể đọc notification response gần nhất.", { error });
      });

    return () => subscription.remove();
  }, []);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationState() {
  return useContext(NotificationContext);
}

export function useRealtimeEvent(event: string, handler: RealtimeEventListener) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(
    () => addRealtimeEventListener(event, (payload, receivedEvent) => handlerRef.current(payload, receivedEvent)),
    [event]
  );
}

export function useRealtimeRoom(room: string) {
  useEffect(() => joinRealtimeRoom(room), [room]);
}
