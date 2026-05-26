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
};

export type MandatoryLearningCoursesData = {
  course: MandatoryLearningCourse | null;
};
