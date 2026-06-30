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
import { apiBoolean, apiList, apiNumber, apiText, isApiObject } from "./utils/apiNormalizers";
import { formatScoreParam, formatWatchTime } from "./utils/formatters";
import { back } from "./utils/navigation";
export function QuizScreen() {
  const params = useLocalSearchParams<{ courseId?: string; lessonId?: string }>();
  const rawCourseId = params.courseId;
  const rawLessonId = params.lessonId;
  const courseId =
    (Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId) ||
    (Array.isArray(rawLessonId) ? rawLessonId[0] : rawLessonId) ||
    "019e640c-8acd-71f8-82e4-e40aa5caad2e";
  const { data } = useEmployeeApiData(() => employeeApi.courseQuiz(courseId), [courseId]);
  const questions = useMemo(() => apiList(isApiObject(data) ? (data.questions ?? data) : data), [data]);
  const attempt = useMemo(() => (isApiObject(data) && isApiObject(data.attempt) ? data.attempt : {}), [data]);
  const multipleChoiceQuestions = useMemo(
    () => questions.filter((question) => apiText(question.type, "multiple_choice") !== "essay"),
    [questions]
  );
  const essayQuestions = useMemo(
    () => questions.filter((question) => apiText(question.type, "") === "essay"),
    [questions]
  );
  const fallbackOptions = normalizeQuizOptions([
    "Đất thương mại dịch vụ",
    "Đất ở đô thị hỗn hợp",
    "Đất cây xanh cảnh quan",
    "Đất công trình công cộng"
  ]);
  const rawTimeLimitMinutes = isApiObject(data) ? data.time_limit_minutes : undefined;
  const rawTimeLimitSeconds = isApiObject(data) ? data.time_limit_seconds : undefined;
  const timeLimitMinutes = Math.max(1, apiNumber(rawTimeLimitMinutes, 45));
  const timeLimitSeconds = Math.max(1, apiNumber(rawTimeLimitSeconds, timeLimitMinutes * 60));
  const attemptId = apiText(attempt.id, "");
  const attemptRemainingSeconds = apiNumber(attempt.remaining_seconds, timeLimitSeconds);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number | null>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(attemptRemainingSeconds);
  const [savingDraft, setSavingDraft] = useState(false);
  const submittingQuizRef = useRef(false);
  const answeredCount = questions.reduce((count, question) => {
    const questionId = apiText(question.id, "");
    const type = apiText(question.type, "multiple_choice");
    if (type === "essay") {
      return apiText(essayAnswers[questionId], "").trim() ? count + 1 : count;
    }

    return selectedOptions[questionId] !== null && selectedOptions[questionId] !== undefined ? count + 1 : count;
  }, 0);
  const progressCount = questions.length > 0 ? `${answeredCount}/${questions.length} câu` : "0/0 câu";
  const progressWidth = (questions.length > 0 ? `${Math.max(10, Math.round((answeredCount / questions.length) * 100))}%` : "0%") as `${number}%`;

  const buildQuizAnswers = useCallback(() => {
    const answers: { quiz_id: string; selected_option?: number | null; essay_answer?: string | null }[] = [];
    multipleChoiceQuestions.forEach((question) => {
      const questionId = apiText(question.id, "");
      if (questionId) {
        answers.push({ quiz_id: questionId, selected_option: selectedOptions[questionId] ?? null });
      }
    });
    essayQuestions.forEach((question) => {
      const questionId = apiText(question.id, "");
      if (questionId) {
        answers.push({ quiz_id: questionId, essay_answer: essayAnswers[questionId] ?? "" });
      }
    });

    return answers;
  }, [essayAnswers, essayQuestions, multipleChoiceQuestions, selectedOptions]);

  useEffect(() => {
    const nextSelectedOptions: Record<string, number | null> = {};
    multipleChoiceQuestions.forEach((question) => {
      const questionId = apiText(question.id, "");
      if (!questionId) return;

      const draftSelectedOption = question.draft_selected_option;
      const numericDraft = Number(draftSelectedOption);
      nextSelectedOptions[questionId] = draftSelectedOption === null || draftSelectedOption === undefined || !Number.isFinite(numericDraft)
        ? null
        : numericDraft;
    });
    setSelectedOptions(nextSelectedOptions);
  }, [courseId, multipleChoiceQuestions]);

  useEffect(() => {
    const nextEssayAnswers: Record<string, string> = {};
    essayQuestions.forEach((question) => {
      const questionId = apiText(question.id, "");
      if (questionId) {
        nextEssayAnswers[questionId] = apiText(question.draft_essay_answer, "");
      }
    });
    setEssayAnswers(nextEssayAnswers);
  }, [courseId, essayQuestions]);

  useEffect(() => {
    setRemainingSeconds(Math.max(0, Math.floor(attemptRemainingSeconds)));
  }, [attemptId, attemptRemainingSeconds, courseId]);

  const saveDraft = useCallback(async () => {
    if (savingDraft) return false;
    const answers = buildQuizAnswers();
    if (answers.length === 0) return false;
    if (!attemptId) {
      notifyError("Không tìm thấy mã lượt làm bài để lưu nháp.");
      return false;
    }

    setSavingDraft(true);
    try {
      const response = await employeeApi.saveCourseQuizDraft(courseId, {
        attempt_id: attemptId,
        remaining_seconds: Math.max(0, Math.floor(remainingSeconds)),
        answers
      });
      const result = isApiObject(response.data) ? response.data : {};
      const syncedRemainingSeconds = result.remaining_seconds;
      if (syncedRemainingSeconds !== null && syncedRemainingSeconds !== undefined) {
        setRemainingSeconds(Math.max(0, Math.floor(apiNumber(syncedRemainingSeconds, remainingSeconds))));
      }
      notifySuccess({ message: response.message || "Lưu bản nháp thành công." });
      return true;
    } catch (error) {
      notifyError(error, "Không thể lưu bản nháp.");
      return false;
    } finally {
      setSavingDraft(false);
    }
  }, [attemptId, buildQuizAnswers, courseId, remainingSeconds, savingDraft]);

  const leaveQuiz = useCallback(() => {
    back();
  }, []);

  const requestLeaveQuiz = useCallback(() => {
    if (submittingQuizRef.current) return;

    Alert.alert("Rời bài kiểm tra?", "Bạn có muốn lưu bản nháp trước khi quay lại không?", [
      {
        text: "Ở lại",
        style: "cancel"
      },
      {
        text: "Thoát không lưu",
        style: "destructive",
        onPress: leaveQuiz
      },
      {
        text: "Lưu và thoát",
        onPress: () => {
          void saveDraft().then((saved) => {
            if (saved) leaveQuiz();
          });
        }
      }
    ]);
  }, [leaveQuiz, saveDraft]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        requestLeaveQuiz();
        return true;
      });

      return () => subscription.remove();
    }, [requestLeaveQuiz])
  );

  const submitQuiz = useCallback(async (isTimeout = false) => {
    if (submittingQuizRef.current) return;
    submittingQuizRef.current = true;

    const answers = buildQuizAnswers();
    if (answers.length === 0) {
      submittingQuizRef.current = false;
      return;
    }
    if (!isTimeout && answeredCount !== questions.length) {
      notifyError("Vui lòng hoàn thành tất cả câu hỏi.");
      submittingQuizRef.current = false;
      return;
    }

    try {
      const response = await employeeApi.submitCourseQuiz(courseId, {
        answers,
        is_timeout: isTimeout
      });
      const result = isApiObject(response.data) ? response.data : {};
      const details = apiList(result.details);
      const needsManualReview = details.some((item) => {
        return item.is_correct === null || item.is_correct === undefined;
      });
      const passed = apiBoolean(result.is_passed, false);

      if (passed && !needsManualReview) {
        await employeeApi.completeCourse(courseId).catch((error) => {
          appLogger.warn("employee.quiz.complete_course", "Không thể ghi nhận hoàn thành khóa học sau quiz.", { error });
        });
      }

      router.replace({
        pathname: "/employee/quiz-result",
        params: {
          score: formatScoreParam(result.score, "0"),
          maxScore: formatScoreParam(result.max_score ?? result.maxScore, "10"),
          totalQuestions: apiText(result.total_questions, "0"),
          correct: apiText(result.correct_count, "0"),
          courseId,
          passed: String(passed),
          pendingReview: String(needsManualReview),
          details: JSON.stringify(details)
        }
      });
    } catch (error) {
      appLogger.warn("employee.quiz.submit", "Không thể nộp bài kiểm tra.", { error });
      submittingQuizRef.current = false;
    }
  }, [buildQuizAnswers, courseId]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      void submitQuiz(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, submitQuiz]);

  return (
    <SafeAreaView style={styles.quizSafe}>
      <View style={styles.quizHeader}>
        <Pressable accessibilityRole="button" onPress={requestLeaveQuiz} style={styles.quizBackButton}>
          <Ionicons name="arrow-back" size={24} color="#111111" />
        </Pressable>
        <Text style={styles.quizHeaderTitle} numberOfLines={1}>
          {apiText(isApiObject(data) ? data.quiz_title : undefined, "Bài kiểm tra kiến thức")}
        </Text>
        <View style={styles.quizTimerPill}>
          <Ionicons name="timer" size={18} color={employeePalette.red} />
          <Text style={styles.quizTimerText}>{formatWatchTime(remainingSeconds)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.quizScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quizProgressBlock}>
          <View style={styles.quizProgressHeader}>
            <Text style={styles.quizProgressLabel}>TIẾN ĐỘ HOÀN THÀNH</Text>
            <Text style={styles.quizProgressCount}>{progressCount}</Text>
          </View>
          <View style={styles.quizProgressTrack}>
            <View style={[styles.quizProgressFill, { width: progressWidth }]} />
          </View>
        </View>

        {multipleChoiceQuestions.map((question, questionIndex) => {
          const questionId = apiText(question.id, `question-${questionIndex}`);
          const options = normalizeQuizOptions(question.options);
          const visibleOptions = options.length > 0 ? options : fallbackOptions;
          const questionImageUri = mediaUrl(question.image_url ?? question.imageUrl);
          const questionOrder = apiNumber(question.order, questionIndex + 1);
          const questionTitle = apiText(question.title, "").trim();
          const displayQuestionTitle =
            questionTitle && !/^câu(?:\s+hỏi)?\s+0$/i.test(questionTitle)
              ? questionTitle
              : `Câu ${questionOrder > 0 ? questionOrder : questionIndex + 1}`;

          return (
            <View key={questionId} style={styles.quizQuestionCard}>
              <Text style={styles.quizQuestionTitle}>{displayQuestionTitle}</Text>
              <Text style={styles.quizQuestionBody}>
                {apiText(question.question, "Nội dung câu hỏi đang được cập nhật.")}
              </Text>
              {questionImageUri ? (
                <View style={styles.quizMapFrame}>
                  <Image source={{ uri: questionImageUri }} style={styles.quizMapImage} />
                </View>
              ) : null}

              <View style={styles.quizOptionsList}>
                {visibleOptions.map((option, index) => {
                  const selected = option.value === selectedOptions[questionId];
                  const label = `${String.fromCharCode(65 + index)}. ${option.label}`;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      key={`${questionId}-${option.value}-${option.label}`}
                      onPress={() => setSelectedOptions((current) => ({ ...current, [questionId]: option.value }))}
                      style={[styles.quizOption, selected && styles.quizOptionSelected]}
                    >
                      <View style={[styles.quizRadio, selected && styles.quizRadioSelected]}>
                        {selected ? <View style={styles.quizRadioDot} /> : null}
                      </View>
                      <Text style={[styles.quizOptionText, selected && styles.quizOptionTextSelected]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        {essayQuestions.map((question, questionIndex) => {
          const questionId = apiText(question.id, `essay-${questionIndex}`);
          const questionOrder = apiNumber(question.order, multipleChoiceQuestions.length + questionIndex + 1);
          const questionTitle = apiText(question.title, "").trim();
          const displayQuestionTitle =
            questionTitle && !/^câu(?:\s+hỏi)?\s+0$/i.test(questionTitle)
              ? questionTitle
              : `Câu ${questionOrder > 0 ? questionOrder : multipleChoiceQuestions.length + questionIndex + 1}`;

          return (
            <View key={questionId} style={styles.quizEssaySection}>
              <Text style={styles.quizEssayTitle}>{displayQuestionTitle}</Text>
              <View style={styles.quizEssayCard}>
                <Text style={styles.quizEssayPrompt}>
                  {apiText(question.question, "Nội dung câu hỏi tự luận đang được cập nhật.")}
                </Text>
                <View style={styles.quizTextareaWrap}>
                  <TextInput
                    multiline
                    onChangeText={(value) => setEssayAnswers((current) => ({ ...current, [questionId]: value }))}
                    placeholder={apiText(question.placeholder, "Nhập câu trả lời của bạn tại đây...")}
                    placeholderTextColor="#8f706b"
                    style={styles.quizTextarea}
                    textAlignVertical="top"
                    value={essayAnswers[questionId] ?? ""}
                  />
                  <Ionicons name="document-text-outline" size={22} color="#8f706b" style={styles.quizTextareaIcon} />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.quizBottomActions}>
        <Pressable accessibilityRole="button" onPress={() => void saveDraft()} style={[styles.quizFooterButton, styles.quizDraftButton]}>
          <Ionicons name="save-outline" size={19} color={employeePalette.red} />
          <Text style={styles.quizDraftButtonText}>{savingDraft ? "Đang lưu..." : "Lưu bản nháp"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => submitQuiz(false)} style={[styles.quizFooterButton, styles.quizSubmitButton]}>
          <Ionicons name="send" size={18} color="#ffffff" />
          <Text style={styles.quizSubmitButtonText}>Nộp bài</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}



// ---- Local helpers extracted from original monolith ----

function normalizeQuizOptions(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((option, index) => {
      if (isApiObject(option)) {
        return {
          label: apiText(option.label ?? option.text ?? option.title ?? option.name, ""),
          value: apiNumber(option.value ?? option.id ?? index, index)
        };
      }

      return {
        label: apiText(option, ""),
        value: index
      };
    }).filter((option) => option.label);
  }

  if (isApiObject(value)) {
    return Object.entries(value)
      .map(([key, label], index) => ({
        label: apiText(label, ""),
        value: apiNumber(key, index)
      }))
      .filter((option) => option.label)
      .sort((a, b) => a.value - b.value);
  }

  return [];
}

