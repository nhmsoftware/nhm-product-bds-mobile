import { useFocusEffect } from "expo-router";
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

  return {
    ...course,
    quiz: {
      actionText: "Làm bài kiểm tra",
      courseId: quizCourseId,
      hasQuiz: true,
      lessonId: lastLessonId(course),
      status: response.status === 200 ? "available" : "locked"
    }
  };
}

export default function RequiredLearningRoute() {
  const [course, setCourse] = useState<MandatoryLearningCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadCourse = useCallback((showLoading = false) => {
    let mounted = true;

    if (showLoading) {
      setLoading(true);
    }
    setFailed(false);

    const request = employeeApi
      .courses()
      .then(async (response) => {
        const courseWithQuiz = await withCourseQuiz(response.data.course);
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
        }
      });

    return {
      cancel: () => {
        mounted = false;
      },
      request
    };
  }, []);

  useEffect(() => {
    const loader = loadCourse(true);

    return () => {
      loader.cancel();
    };
  }, [loadCourse]);

  useFocusEffect(
    useCallback(() => {
      if (loading) {
        return undefined;
      }

      const loader = loadCourse(false);

      return () => {
        loader.cancel();
      };
    }, [loadCourse, loading])
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

  return <RequiredLearningScreen course={course} />;
}
