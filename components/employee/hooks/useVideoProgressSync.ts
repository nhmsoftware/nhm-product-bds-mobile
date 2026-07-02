import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { appLogger } from "@/libs/logger";
import { employeeApi } from "@/services/employee/api";
import type { LearningLessonProgressUpdate } from "@/services/employee/types";

type VideoProgressSyncParams = {
  lessonId: string;
  progressSyncDisabled: boolean;
  onProgressUpdate?: (progress: LearningLessonProgressUpdate) => void;
  player: {
    currentTime: number;
    duration: number;
    pause: () => void;
  };
  currentSecondsRef: React.RefObject<number>;
};

export function useVideoProgressSync({
  lessonId,
  progressSyncDisabled,
  onProgressUpdate,
  player,
  currentSecondsRef
}: VideoProgressSyncParams) {
  const lastSyncedSecondsRef = useRef(-1);
  const lastSyncedAtRef = useRef(0);
  const syncingRef = useRef(false);
  const finalSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFinalProgressSync = useCallback(() => {
    if (finalSyncTimerRef.current) {
      clearTimeout(finalSyncTimerRef.current);
      finalSyncTimerRef.current = null;
    }
  }, []);

  const syncProgress = useCallback(async (watchSeconds = currentSecondsRef.current, force = false) => {
    if (progressSyncDisabled) {
      return;
    }

    const nextSeconds = Math.max(0, Math.floor(watchSeconds));
    if (syncingRef.current || nextSeconds <= 0 || (!force && nextSeconds === lastSyncedSecondsRef.current)) {
      return;
    }

    syncingRef.current = true;
    try {
      const response = await employeeApi.updateLessonProgress(lessonId, nextSeconds);
      lastSyncedSecondsRef.current = nextSeconds;
      lastSyncedAtRef.current = Date.now();
      onProgressUpdate?.(response.data);
    } catch (error) {
      appLogger.warn("learning.progress", "Không thể cập nhật tiến độ bài học.", {
        lessonId,
        watchSeconds: nextSeconds,
        error
      });
    } finally {
      syncingRef.current = false;
    }
  }, [lessonId, onProgressUpdate, progressSyncDisabled]);

  const scheduleFinalProgressSync = useCallback(() => {
    const watchSeconds = currentSecondsRef.current;
    const now = Date.now();
    const elapsed = lastSyncedAtRef.current ? now - lastSyncedAtRef.current : 0;
    const delayMs = lastSyncedAtRef.current && elapsed < 2000 ? 2000 - elapsed : 0;

    clearFinalProgressSync();
    finalSyncTimerRef.current = setTimeout(() => {
      finalSyncTimerRef.current = null;
      syncProgress(watchSeconds, true);
    }, delayMs);
  }, [clearFinalProgressSync, syncProgress]);

  useEffect(() => {
    return () => {
      clearFinalProgressSync();
    };
  }, [clearFinalProgressSync]);

  const pauseAndSync = useCallback(() => {
    try {
      player.pause();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("NativeSharedObjectNotFoundException")) {
        return;
      }
      appLogger.warn("learning.video", "Không thể tạm dừng video.", { error });
    }
    scheduleFinalProgressSync();
  }, [player, scheduleFinalProgressSync]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        pauseAndSync();
      };
    }, [pauseAndSync])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        pauseAndSync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [pauseAndSync]);

  return {
    syncProgress,
    scheduleFinalProgressSync,
    clearFinalProgressSync,
    lastSyncedSecondsRef,
    lastSyncedAtRef
  };
}
