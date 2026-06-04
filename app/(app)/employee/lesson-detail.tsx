import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { LessonDetailScreen } from "@/components/EmployeeScreens";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { notifyError } from "@/libs/notify";
import { employeeApi } from "@/services/employee/api";
import type { LearningLessonDetail, LearningLessonProgressUpdate } from "@/services/employee/types";

const defaultLessonId = "019e640c-8acd-71f8-82e4-e40aa5caad2e";

export default function LessonDetailRoute() {
  const params = useLocalSearchParams<{ lessonId?: string; id?: string }>();
  const lessonId = useMemo(() => {
    const raw = params.lessonId || params.id || defaultLessonId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params.id, params.lessonId]);

  const [lesson, setLesson] = useState<LearningLessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const handleProgressUpdate = useCallback((progress: LearningLessonProgressUpdate) => {
    setLesson((currentLesson) => {
      if (!currentLesson || progress.lesson_id !== currentLesson.id) {
        return currentLesson;
      }

      if (!progress.is_completed) {
        return currentLesson;
      }

      return {
        ...currentLesson,
        current_watch_seconds: progress.current_watch_seconds,
        next_lesson_id: progress.next_lesson_id,
        status: progress.is_completed ? "completed" : currentLesson.status,
        status_label: progress.is_completed ? "Hoàn thành" : currentLesson.status_label,
        unlock_condition: progress.unlock_condition ?? currentLesson.unlock_condition
      };
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setFailed(false);

    employeeApi
      .lesson(lessonId)
      .then((response) => {
        if (mounted) {
          setLesson(response.data);
        }
      })
      .catch((error) => {
        if (mounted) {
          setFailed(true);
          notifyError(error, "Không thể tải bài học.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [lessonId]);

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Đang tải bài học..." />
      </Screen>
    );
  }

  if (failed) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Không tải được bài học"
          description="Vui lòng thử lại sau."
        />
      </Screen>
    );
  }

  if (!lesson) {
    return (
      <Screen>
        <EmptyState
          icon="school-outline"
          title="Chưa có dữ liệu bài học"
          description="Bài học này chưa có nội dung."
        />
      </Screen>
    );
  }

  return <LessonDetailScreen lesson={lesson} onProgressUpdate={handleProgressUpdate} />;
}
