import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { RequiredLearningScreen } from "@/components/EmployeeScreens";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { notifyError } from "@/libs/notify";
import { employeeApi } from "@/services/employee/api";
import type { MandatoryLearningCourse, MandatoryLearningQuiz } from "@/services/employee/types";

type CourseWithLooseQuiz = MandatoryLearningCourse & Record<string, unknown>;

function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return ["true", "1", "yes"].includes(value.trim().toLowerCase());
  }

  return false;
}

function optionalBooleanValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return booleanValue(value);
}

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeQuizStatus(value: unknown) {
  const status = textValue(value)?.toLowerCase() ?? "";

  if (["passed", "pass", "success", "done", "completed", "complete"].includes(status)) return "passed";
  if (["failed", "fail", "not_passed", "not passed", "chưa đạt", "chua_dat"].includes(status)) return "failed";
  if (["grading", "pending", "pending_review", "manual_review", "reviewing", "submitted", "waiting_review"].includes(status)) return "grading";
  if (["in_progress", "draft", "started", "doing"].includes(status)) return "in_progress";
  if (["locked", "forbidden"].includes(status)) return "locked";
  if (["none", "not_available", "unavailable", "no_quiz"].includes(status)) return "none";

  return status || "available";
}

function lastLessonId(course: MandatoryLearningCourse) {
  const lastLesson = [...course.lessons].sort((a, b) => b.order - a.order)[0];
  return lastLesson?.id ?? null;
}

function normalizeCourseQuiz(course: MandatoryLearningCourse): MandatoryLearningQuiz | null {
  const looseCourse = course as CourseWithLooseQuiz;
  const rawQuiz = looseCourse.quiz && typeof looseCourse.quiz === "object"
    ? looseCourse.quiz as Record<string, unknown>
    : null;

  const hasExplicitQuiz = rawQuiz
    ? rawQuiz.hasQuiz ?? rawQuiz.has_quiz
    : looseCourse.hasQuiz ?? looseCourse.has_quiz;

  if (hasExplicitQuiz === undefined || hasExplicitQuiz === null) {
    return null;
  }

  const hasQuiz = booleanValue(hasExplicitQuiz);
  if (!hasQuiz) {
    return { actionText: "Làm bài kiểm tra", courseId: null, hasQuiz: false, lessonId: null, status: "none" };
  }

  const quizStatus = textValue(rawQuiz?.status ?? looseCourse.quizStatus ?? looseCourse.quiz_status) ?? "locked";

  return {
    actionText: textValue(rawQuiz?.actionText ?? rawQuiz?.action_text) ?? "Làm bài kiểm tra",
    canStart: optionalBooleanValue(rawQuiz?.canStart ?? rawQuiz?.can_start),
    courseId: textValue(rawQuiz?.courseId ?? rawQuiz?.course_id ?? looseCourse.quizCourseId ?? looseCourse.quiz_course_id) ?? course.id,
    hasQuiz,
    isPassed: optionalBooleanValue(rawQuiz?.isPassed ?? rawQuiz?.is_passed),
    lastScore: numberValue(rawQuiz?.lastScore ?? rawQuiz?.last_score),
    lessonId: textValue(rawQuiz?.lessonId ?? rawQuiz?.lesson_id ?? looseCourse.quizLessonId ?? looseCourse.quiz_lesson_id) ?? lastLessonId(course),
    passingScore: numberValue(rawQuiz?.passingScore ?? rawQuiz?.passing_score),
    status: quizStatus
  };
}

function firstIncompleteCourse(courses: MandatoryLearningCourse[]) {
  return courses.find((course) => {
    const status = textValue(course.progress?.status)?.toLowerCase() ?? "";
    const percent = numberValue(course.progress?.percent) ?? 0;
    return status !== "completed" && percent < 100;
  }) ?? courses[0] ?? null;
}

async function withCourseQuiz(course: MandatoryLearningCourse | null) {
  if (!course) {
    return null;
  }

  const explicitQuiz = normalizeCourseQuiz(course);
  if (explicitQuiz) {
    return { ...course, quiz: explicitQuiz };
  }

  const quizCourseId = course.id;
  if (!quizCourseId) {
    return course;
  }

  const response = await employeeApi.courseQuizAvailability(quizCourseId).catch(() => null);

  if (!response) {
    return course;
  }

  if (response.status === 404) {
    return { ...course, quiz: { actionText: "Làm bài kiểm tra", courseId: null, hasQuiz: false, lessonId: null, status: "none" } };
  }

  const responseData = response.data && typeof response.data === "object" && !Array.isArray(response.data)
    ? response.data as Record<string, unknown>
    : {};
  const attempt = responseData.attempt && typeof responseData.attempt === "object" && !Array.isArray(responseData.attempt)
    ? responseData.attempt as Record<string, unknown>
    : {};
  const status = response.status === 200 ? normalizeQuizStatus(attempt.status ?? responseData.status) : "locked";
  const actionText = status === "grading"
    ? "Đang chấm"
    : status === "in_progress"
      ? "Tiếp tục bài kiểm tra"
      : "Làm bài kiểm tra";

  return {
    ...course,
    quiz: {
      actionText,
      canStart: status !== "grading" && status !== "locked",
      courseId: quizCourseId,
      hasQuiz: true,
      lessonId: lastLessonId(course),
      status
    }
  };
}

export default function RequiredLearningRoute() {
  const params = useLocalSearchParams<{ courseId?: string; returnTo?: string }>();
  const rawCourseId = params.courseId;
  const selectedCourseId = Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId;
  const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const [course, setCourse] = useState<MandatoryLearningCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (
      returnTo?.startsWith("/employee") &&
      returnTo !== "/employee/required-learning" &&
      returnTo !== "/employee/learning"
    ) {
      router.replace(returnTo as Href);
      return;
    }

    router.replace("/employee");
  }, [returnTo]);

  const loadCourse = useCallback((mode: "loading" | "refreshing" | "silent" = "silent") => {
    let mounted = true;

    if (mode === "loading") {
      setLoading(true);
    } else if (mode === "refreshing") {
      setRefreshing(true);
    }
    setFailed(false);

    const request = employeeApi
      .courses()
      .then(async (response) => {
        const courses = response.data.courses ?? [];
        const selectedCourse = selectedCourseId
          ? courses.find((item) => item.id === selectedCourseId) ?? response.data.course
          : firstIncompleteCourse(courses) ?? response.data.course;
        const courseWithQuiz = await withCourseQuiz(selectedCourse);
        if (mounted) {
          setCourse(courseWithQuiz);
        }
      })
      .catch((error) => {
        if (mounted) {
          setFailed(true);
          notifyError(error, "Không thể tải khóa học bắt buộc.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return {
      cancel: () => {
        mounted = false;
      },
      request
    };
  }, [selectedCourseId]);

  useEffect(() => {
    const loader = loadCourse("loading");

    return () => {
      loader.cancel();
    };
  }, [loadCourse]);

  useFocusEffect(
    useCallback(() => {
      if (loading || refreshing) {
        return undefined;
      }

      const loader = loadCourse("silent");

      return () => {
        loader.cancel();
      };
    }, [loadCourse, loading, refreshing])
  );

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Đang tải lộ trình học..." />
      </Screen>
    );
  }

  if (failed) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Không tải được lộ trình học"
          description="Vui lòng thử lại sau."
        />
      </Screen>
    );
  }

  if (!course) {
    return (
      <Screen>
        <EmptyState
          icon="school-outline"
          title="Chưa có khóa học bắt buộc"
          description="Hiện tại chưa có lộ trình được phân công."
        />
      </Screen>
    );
  }

  return (
    <RequiredLearningScreen
      course={course}
      onBack={handleBack}
      refreshing={refreshing}
      onRefresh={() => loadCourse("refreshing")}
    />
  );
}
