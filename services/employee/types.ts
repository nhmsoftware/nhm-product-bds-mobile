import type { Ionicons } from "@expo/vector-icons";

export type EmployeeKpi = {
  label: string;
  value: string;
  helper: string;
  tone: "red" | "gold" | "green";
  icon: keyof typeof Ionicons.glyphMap;
};

export type EmployeeAction = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export type EmployeeNewsPost = {
  id: string;
  author: string;
  role: string;
  timeAgo: string;
  category: string;
  title: string;
  content: string;
  pinned?: boolean;
  comments: number;
  likes: number;
};

export type EmployeeLesson = {
  id: string;
  title: string;
  provider: string;
  status: "verified" | "inProgress" | "required";
  issuedAt: string;
  expiresAt: string;
  score?: string;
};

export type EmployeeCheckEvent = {
  id: string;
  type: "checkIn" | "checkOut" | "clientVisit";
  title: string;
  location: string;
  time: string;
  status: "done" | "pending";
};

export type MandatoryLearningLesson = {
  id: string;
  order: number;
  title: string;
  durationSeconds: number;
  status: "learning" | "locked" | "completed" | string;
  progressPercent: number;
  isLocked: boolean;
  canContinue: boolean;
  actionText: string;
};

export type MandatoryLearningQuiz = {
  courseId: string | null;
  canStart?: boolean;
  hasQuiz: boolean;
  isPassed?: boolean;
  lessonId: string | null;
  lastScore?: number | null;
  passingScore?: number | null;
  status: "not_started" | "grading" | "failed" | "passed" | "locked" | "available" | "completed" | "none" | string;
  actionText: string;
};

export type MandatoryLearningCourse = {
  id: string;
  title: string;
  label: string;
  description: string;
  thumbnailUrl: string | null;
  isMandatory: boolean;
  learningRule: {
    type: "sequential" | string;
    canSkipLesson: boolean;
    requireWatchFullVideo: boolean;
    autoTrackProgress: boolean;
  };
  progress: {
    status: "not_started" | "learning" | "completed" | string;
    percent: number;
    completedLessons: number;
    totalLessons: number;
    currentLessonId: string | null;
  };
  notice: {
    type: "warning" | "info" | string;
    message: string;
  } | null;
  lessons: MandatoryLearningLesson[];
  quiz?: MandatoryLearningQuiz | null;
  canAccessPremiumLearning?: boolean;
};

export type MandatoryLearningCoursesData = {
  course: MandatoryLearningCourse | null;
  courses?: MandatoryLearningCourse[];
};

export type LearningLessonAttachment = {
  id?: string;
  title?: string;
  name?: string;
  file_name?: string;
  fileName?: string;
  url?: string;
  file_url?: string;
  fileUrl?: string;
  size?: string;
  file_size?: string;
  fileSize?: string;
  mime_type?: string;
  mimeType?: string;
  type?: string;
};

export type LearningLessonDetail = {
  id: string;
  course_id: string;
  title: string;
  content: string;
  video_url: string | null;
  duration_seconds: number;
  duration_minutes?: number;
  order: number;
  status: "learning" | "locked" | "completed" | string;
  status_label: string;
  attachments: LearningLessonAttachment[];
  current_watch_seconds: number;
  unlock_condition: string | null;
  next_lesson_id?: string | null;
};

export type LearningLessonProgressUpdate = {
  lesson_id: string;
  current_watch_seconds: number;
  is_completed: boolean;
  course_progress_percent: number;
  course_status: string;
  next_lesson_id: string | null;
  unlock_condition: string | null;
};
