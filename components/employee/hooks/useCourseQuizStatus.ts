import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { appLogger } from "@/libs/logger";
import { notifyError } from "@/libs/notify";
import { employeeApi } from "@/services/employee/api";
import type { LearningLessonDetail } from "@/services/employee/types";
import { apiText, isApiObject } from "../utils/apiNormalizers";
import { openQuizResultScreen, normalizeLessonCourseQuizStatus, quizResultStatus, type LessonCourseQuizStatus } from "../utils/sharedHelpers";

function lessonCourseQuizStatusFromLabel(value: unknown): LessonCourseQuizStatus | null {
  const label = apiText(value, "").trim().toLocaleLowerCase("vi-VN");

  if (!label) return null;
  if (label.includes("xem lại")) return "completed";
  if (label.includes("chưa đạt")) return "failed";
  if (label.includes("đang chấm")) return "grading";
  if (label.includes("làm bài kiểm tra")) return "available";

  return null;
}

export function useCourseQuizStatus(lesson: LearningLessonDetail) {
  const [courseQuizStatus, setCourseQuizStatus] = useState<LessonCourseQuizStatus>("unknown");
  const [courseQuizStatusKey, setCourseQuizStatusKey] = useState("");
  const [courseQuizResultLoading, setCourseQuizResultLoading] = useState(false);

  const hasNextLesson = Boolean(lesson.next_lesson_id);
  const isCompleted = lesson.status === "completed";
  const lessonLabelQuizStatus = !hasNextLesson && isCompleted ? lessonCourseQuizStatusFromLabel(lesson.status_label) : null;
  const expectedCourseQuizStatusKey = `${lesson.id}:${lesson.course_id}:${lesson.next_lesson_id ?? ""}`;

  const effectiveCourseQuizStatus = courseQuizStatusKey === expectedCourseQuizStatusKey
    ? courseQuizStatus
    : hasNextLesson
      ? "none"
      : lessonLabelQuizStatus ?? "unknown";

  const courseQuizPending = !hasNextLesson && effectiveCourseQuizStatus === "unknown";
  const hasCourseQuiz = !hasNextLesson && effectiveCourseQuizStatus !== "unknown" && effectiveCourseQuizStatus !== "none";
  const courseQuizHasResult = effectiveCourseQuizStatus === "passed" || effectiveCourseQuizStatus === "failed" || effectiveCourseQuizStatus === "completed";
  const courseQuizIsGrading = effectiveCourseQuizStatus === "grading";
  const courseQuizActionDisabled =
    !hasNextLesson && (courseQuizPending || courseQuizIsGrading || effectiveCourseQuizStatus === "locked" || courseQuizResultLoading);

  const nextActionLabel = (() => {
    if (hasNextLesson) return "Bài tiếp theo";
    if (courseQuizPending) return "Đang kiểm tra bài thi...";
    if (courseQuizResultLoading) return "Đang tải...";
    if (courseQuizIsGrading) return "Đang chấm";
    if (courseQuizHasResult) return "Xem lại bài kiểm tra";
    if (effectiveCourseQuizStatus === "locked") return "Bài kiểm tra chưa mở";
    if (hasCourseQuiz) return effectiveCourseQuizStatus === "in_progress" ? "Tiếp tục bài kiểm tra" : "Làm bài kiểm tra";
    return "Về trang Học viện Đào tạo";
  })();

  const completedNotice = (() => {
    if (hasNextLesson) {
      return lesson.unlock_condition?.replace("Hoàn thành bài học này để mở khóa bài tiếp theo:", "Bài tiếp theo đã được mở khóa:") ||
        "Bài học đã hoàn thành. Bạn có thể chuyển sang bài học tiếp theo trong lộ trình.";
    }

    if (courseQuizIsGrading) return "Bài kiểm tra đang được chấm. Bạn sẽ xem lại kết quả khi có điểm.";
    if (courseQuizHasResult) return "Bạn đã nộp bài kiểm tra. Có thể xem lại kết quả bài làm.";
    if (hasCourseQuiz) return "Bạn đã hoàn thành toàn bộ bài học. Vui lòng làm bài kiểm tra để hoàn thành khóa học.";
    return "Bạn đã hoàn thành khóa học bắt buộc. Học viện Đào tạo đã được mở khóa.";
  })();

  useEffect(() => {
    let mounted = true;

    if (!lesson.course_id || lesson.next_lesson_id) {
      setCourseQuizStatus("none");
      setCourseQuizStatusKey(expectedCourseQuizStatusKey);
      return () => {
        mounted = false;
      };
    }

    setCourseQuizStatus(lessonLabelQuizStatus ?? "unknown");
    setCourseQuizStatusKey(expectedCourseQuizStatusKey);

    const setLoadedCourseQuizStatus = (status: LessonCourseQuizStatus) => {
      setCourseQuizStatus(status);
      setCourseQuizStatusKey(expectedCourseQuizStatusKey);
    };

    async function loadCourseQuizStatus() {
      const resultResponse = await employeeApi.courseQuizResult(lesson.course_id).catch(() => null);
      if (!mounted) return;

      if (resultResponse) {
        const result = isApiObject(resultResponse.data) ? resultResponse.data : {};
        const resultStatus = quizResultStatus(result);

        if (["passed", "failed", "completed", "grading"].includes(resultStatus)) {
          setLoadedCourseQuizStatus(resultStatus);
          return;
        }
      }

      const availabilityResponse = await employeeApi.courseQuizAvailability(lesson.course_id).catch(() => null);
      if (!mounted) return;

      if (!availabilityResponse) {
        setLoadedCourseQuizStatus("none");
        return;
      }

      if (availabilityResponse.status === 404) {
        setLoadedCourseQuizStatus("none");
        return;
      }

      if (availabilityResponse.status === 403) {
        setLoadedCourseQuizStatus("locked");
        return;
      }

      const responseData = isApiObject(availabilityResponse.data) ? availabilityResponse.data : {};
      const attempt = isApiObject(responseData.attempt) ? responseData.attempt : {};
      const attemptStatus = normalizeLessonCourseQuizStatus(attempt.status ?? responseData.status);

      setLoadedCourseQuizStatus(attemptStatus === "available" ? "available" : attemptStatus);
    }

    void loadCourseQuizStatus();

    return () => {
      mounted = false;
    };
  }, [expectedCourseQuizStatusKey, lesson.course_id, lesson.next_lesson_id, lessonLabelQuizStatus]);

  const openNextLesson = useCallback(async () => {
    if (lesson.next_lesson_id) {
      router.replace({
        pathname: "/employee/lesson-detail",
        params: { lessonId: lesson.next_lesson_id }
      });
      return;
    }

    if (courseQuizPending) {
      return;
    }

    if (courseQuizIsGrading || effectiveCourseQuizStatus === "locked") {
      return;
    }

    if (courseQuizHasResult) {
      setCourseQuizResultLoading(true);
      try {
        const response = await employeeApi.courseQuizResult(lesson.course_id);
        const result = isApiObject(response.data) ? response.data : {};
        const resultStatus = quizResultStatus(result);

        if (resultStatus === "grading") {
          setCourseQuizStatus("grading");
          return;
        }

        openQuizResultScreen(lesson.course_id, result);
      } catch (error) {
        appLogger.warn("employee.lesson.quiz_result", "Không thể tải kết quả bài kiểm tra.", {
          courseId: lesson.course_id,
          error
        });
        notifyError(error, "Không thể tải kết quả bài kiểm tra.");
      } finally {
        setCourseQuizResultLoading(false);
      }
      return;
    }

    if (hasCourseQuiz) {
      router.replace({
        pathname: "/employee/quiz",
        params: { courseId: lesson.course_id }
      });
      return;
    }

    router.replace("/employee/learning");
  }, [
    courseQuizHasResult,
    courseQuizIsGrading,
    courseQuizPending,
    effectiveCourseQuizStatus,
    hasCourseQuiz,
    lesson.course_id,
    lesson.next_lesson_id
  ]);

  return {
    effectiveCourseQuizStatus,
    courseQuizPending,
    hasCourseQuiz,
    courseQuizHasResult,
    courseQuizIsGrading,
    courseQuizActionDisabled,
    courseQuizResultLoading,
    nextActionLabel,
    completedNotice,
    openNextLesson,
    isCompleted,
    hasNextLesson
  };
}
