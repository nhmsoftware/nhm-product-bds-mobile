import { apiClient, getData, postData, type ApiResponse } from "@/libs/api";
import type {
  LearningLessonDetail,
  LearningLessonProgressUpdate,
  MandatoryLearningCoursesData
} from "@/services/employee/types";

export type AttendanceStatus = {
  id?: string;
  user_id?: string;
  work_date?: string;
  check_in_at?: string | null;
  check_in_lat?: string | null;
  check_in_lng?: string | null;
  check_in_method?: "gps" | "wifi" | "qr" | string | null;
  check_in_wifi_ssid?: string | null;
  check_in_device_name?: string | null;
  check_out_at?: string | null;
  check_out_lat?: string | null;
  check_out_lng?: string | null;
  check_out_method?: "gps" | "wifi" | "qr" | string | null;
  check_out_wifi_ssid?: string | null;
  check_out_device_name?: string | null;
  status?: string;
  note?: string | null;
};

export type AttendanceOfficeConfig = {
  office_latitude?: number | string;
  office_longitude?: number | string;
  office_radius_meters?: number;
  office_wifi_ssid?: string;
  shift_start_time?: string;
};

export type AttendanceTodayStatus = {
  has_checked_in?: boolean;
  attendance?: AttendanceStatus | null;
  office_config?: AttendanceOfficeConfig;
  checked_in?: boolean;
  checked_out?: boolean;
  check_in_time?: string | null;
  check_out_time?: string | null;
};

export type AttendancePunchInput = {
  method: "gps" | "wifi";
  latitude?: string;
  longitude?: string;
  wifi_ssid?: string;
  device_name?: string;
};

export type AttendanceCheckOutData = {
  attendance: AttendanceStatus;
  working_duration: string;
  working_seconds: number;
};

export type CustomerMeetingImage = {
  name: string;
  type: string;
  uri: string;
};

export type CheckInMeetCustomerInput = {
  customer_name: string;
  customer_phone: string;
  image: CustomerMeetingImage;
  latitude: string;
  longitude: string;
  project_id: string;
};

export type CheckInSiteTourInput = {
  customer_name: string;
  image: CustomerMeetingImage;
  latitude: string;
  longitude: string;
  project_id: string;
  unit_code: string;
};

export type LearningAccess = {
  // MOCK until backend exposes a direct onboarding-complete flag for mobile routing.
  mandatoryLearningCompleted: boolean;
};

type JsonRecord = Record<string, unknown>;

type CourseQuizAnswer = {
  quiz_id: string;
  selected_option?: number | null;
  essay_answer?: string | null;
};

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boolValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }

  return fallback;
}

function numValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export type InternalNewsThumbnail = {
  name: string;
  type: string;
  uri: string;
};

export type InternalNewsAttachment = InternalNewsThumbnail;

export type CreateInternalNewsInput = {
  attachments?: InternalNewsAttachment[];
  content: string;
  thumbnail?: InternalNewsThumbnail;
  title?: string;
};

export type UpdateInternalNewsInput = CreateInternalNewsInput & {
  thumbnail_url?: string;
};

export type CreateDepartmentTransferInput = {
  desired_transfer_date: string;
  reason: string;
  target_department: string;
};

export const employeeApi = {
  dashboard() {
    return getData<JsonRecord>("/api/v1/dashboard");
  },

  todayAttendance() {
    return getData<AttendanceTodayStatus>("/api/v1/attendance/today");
  },

  checkIn(input: AttendancePunchInput) {
    return postData<AttendanceStatus>("/api/v1/attendance/check-in", input);
  },

  checkOut(input: AttendancePunchInput) {
    return postData<AttendanceCheckOutData>("/api/v1/attendance/check-out", input);
  },

  checkInMeetCustomer(input: CheckInMeetCustomerInput) {
    const formData = new FormData();
    formData.append("customer_name", input.customer_name);
    formData.append("customer_phone", input.customer_phone);
    formData.append("project_id", input.project_id);
    formData.append("latitude", input.latitude);
    formData.append("longitude", input.longitude);
    formData.append("image", {
      name: input.image.name,
      type: input.image.type,
      uri: input.image.uri
    } as unknown as Blob);

    return apiClient
      .post<ApiResponse<unknown>>("/api/v1/customer-meetings/check-in", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      .then((response) => response.data);
  },

  checkInSiteTour(input: CheckInSiteTourInput) {
    const formData = new FormData();
    formData.append("project_id", input.project_id);
    formData.append("unit_code", input.unit_code);
    formData.append("customer_name", input.customer_name);
    formData.append("latitude", input.latitude);
    formData.append("longitude", input.longitude);
    formData.append("image", {
      name: input.image.name,
      type: input.image.type,
      uri: input.image.uri
    } as unknown as Blob);

    return apiClient
      .post<ApiResponse<unknown>>("/api/v1/site-tours/check-in", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      .then((response) => response.data);
  },

  siteToursRecent() {
    return getData("/api/v1/site-tours/recent");
  },

  recentMeetings() {
    return getData("/api/v1/customer-meetings/recent");
  },

  publicProjects(params?: { page?: number; per_page?: number; search?: string }) {
    return getData("/api/v1/public/projects", params);
  },

  siteTourHistory() {
    return getData("/api/v1/site-tours/history");
  },

  internalNews() {
    return getData<JsonRecord>("/api/v1/news/internal");
  },

  internalNewsDetail(id: string) {
    return getData<JsonRecord>(`/api/v1/news/internal/${id}`);
  },

  createInternalNews(input: CreateInternalNewsInput) {
    const form = new FormData();
    const title = input.title?.trim();

    if (title) {
      form.append("title", title);
    }

    form.append("content", input.content.trim());

    if (input.thumbnail) {
      form.append("thumbnail", input.thumbnail as unknown as Blob);
    }

    input.attachments?.forEach((attachment) => {
      form.append("attachments[]", attachment as unknown as Blob);
    });

    return apiClient
      .post<ApiResponse<JsonRecord>>("/api/v1/news/internal", form, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      .then((response) => response.data);
  },

  updateInternalNews(id: string, input: UpdateInternalNewsInput) {
    const form = new FormData();
    const title = input.title?.trim();

    form.append("_method", "PUT");

    if (title) {
      form.append("title", title);
    }

    form.append("content", input.content.trim());

    if (input.thumbnail) {
      form.append("thumbnail", input.thumbnail as unknown as Blob);
    } else if (input.thumbnail_url !== undefined) {
      form.append("thumbnail_url", input.thumbnail_url);
    }

    input.attachments?.forEach((attachment) => {
      form.append("attachments[]", attachment as unknown as Blob);
    });

    return apiClient
      .post<ApiResponse<JsonRecord>>(`/api/v1/news/internal/${id}`, form, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      .then((response) => response.data);
  },

  deleteInternalNews(id: string) {
    return apiClient
      .delete<ApiResponse<JsonRecord>>(`/api/v1/news/internal/${id}`)
      .then((response) => response.data);
  },

  addInternalNewsComment(id: string, content: string) {
    return postData<JsonRecord>(`/api/v1/news/internal/${id}/comments`, { content });
  },

  likeInternalNews(id: string) {
    return postData<JsonRecord>(`/api/v1/news/internal/${id}/like`, {});
  },

  courses() {
    return getData<MandatoryLearningCoursesData>("/api/v1/learning/courses");
  },

  course(courseId: string) {
    return getData<JsonRecord>(`/api/v1/learning/courses/${courseId}`);
  },

  completeCourse(courseId: string) {
    return postData<JsonRecord>(`/api/v1/learning/courses/${courseId}/complete`, {});
  },

  courseCertificate(courseId: string) {
    return getData<JsonRecord>(`/api/v1/learning/courses/${courseId}/certificate`);
  },

  lesson(lessonId: string) {
    return getData<LearningLessonDetail>(`/api/v1/learning/lessons/${lessonId}`);
  },

  updateLessonProgress(lessonId: string, watchTimeSeconds: number) {
    return postData<LearningLessonProgressUpdate>(`/api/v1/learning/lessons/${lessonId}/progress`, {
      watch_time_seconds: Math.max(0, Math.floor(watchTimeSeconds))
    });
  },

  courseQuiz(courseId: string) {
    return getData<JsonRecord>(`/api/v1/learning/courses/${courseId}/quiz`);
  },

  courseQuizAvailability(courseId: string) {
    return apiClient
      .get<ApiResponse<JsonRecord>>(`/api/v1/learning/courses/${courseId}/quiz`, {
        validateStatus: (status) => (status >= 200 && status < 300) || status === 403 || status === 404
      })
      .then((response) => ({
        data: response.data.data,
        message: response.data.message,
        status: response.status
      }));
  },

  submitCourseQuiz(courseId: string, input: { answers: CourseQuizAnswer[]; is_timeout?: boolean }) {
    return postData<JsonRecord>(`/api/v1/learning/courses/${courseId}/quiz/submit`, input);
  },

  courseQuizResult(courseId: string) {
    return getData<JsonRecord>(`/api/v1/learning/courses/${courseId}/quiz/result`);
  },

  saveCourseQuizDraft(
    courseId: string,
    input: { answers: CourseQuizAnswer[]; attempt_id?: string | null; remaining_seconds?: number | null }
  ) {
    return postData<JsonRecord>(`/api/v1/learning/courses/${courseId}/quiz/draft`, input);
  },

  notifications(params?: Record<string, unknown>) {
    return getData<JsonRecord>("/api/v1/notifications", params);
  },

  notificationDetail(id: string) {
    return getData<JsonRecord>(`/api/v1/notifications/${id}`);
  },

  markNotificationRead(id: string) {
    return apiClient.put<ApiResponse<JsonRecord>>(`/api/v1/notifications/${id}/read`).then((response) => response.data);
  },

  markAllNotificationsRead() {
    return apiClient.put<ApiResponse<JsonRecord>>("/api/v1/notifications/read-all").then((response) => response.data);
  },

  areas(params?: Record<string, unknown>) {
    return getData<JsonRecord>("/api/v1/areas", params);
  },

  searchAreas(query: string) {
    return getData<JsonRecord>("/api/v1/areas/search", { keyword: query });
  },

  inventoryMap(areaId: string, params?: Record<string, unknown>) {
    return getData<JsonRecord>(`/api/v1/areas/${areaId}/inventory-map`, params);
  },

  lotDetail(lotId: string) {
    return getData<JsonRecord>(`/api/v1/lots/${lotId}`);
  },

  addAreaComment(areaId: string, content: string) {
    return postData<JsonRecord>(`/api/v1/areas/${areaId}/comments`, { content });
  },

  requestLotLock(lotId: string, input: JsonRecord = {}) {
    return postData<JsonRecord>(`/api/v1/lots/${lotId}/lock`, input);
  },

  requestLotDeposit(lotId: string, input: JsonRecord = {}) {
    return postData<JsonRecord>(`/api/v1/lots/${lotId}/deposit-requests`, input);
  },

  leaveRequests() {
    return getData<JsonRecord>("/api/v1/leave/requests");
  },

  leaveHistory() {
    return getData<JsonRecord>("/api/v1/leave/history");
  },

  createLeaveRequest(input: JsonRecord) {
    return postData<JsonRecord>("/api/v1/leave/requests", input);
  },

  cancelLeaveRequest(id: string) {
    return apiClient.put(`/api/v1/leave/requests/${id}/cancel`).then((response) => response.data);
  },

  approveLeaveRequest(id: string) {
    return apiClient.put(`/api/v1/leave/requests/${id}/approve`).then((response) => response.data);
  },

  rejectLeaveRequest(id: string, reason: string) {
    return apiClient.put(`/api/v1/leave/requests/${id}/reject`, { reason }).then((response) => response.data);
  },

  departmentTransfers(params?: Record<string, unknown>) {
    return getData<JsonRecord>("/api/v1/department-transfers", params);
  },

  departmentTransferHistory(params?: Record<string, unknown>) {
    return getData<JsonRecord>("/api/v1/department-transfers/history", params);
  },

  createDepartmentTransfer(input: CreateDepartmentTransferInput) {
    return postData<JsonRecord>("/api/v1/department-transfers", input);
  },

  approveDepartmentTransfer(id: string) {
    return apiClient.put(`/api/v1/department-transfers/${id}/approve`).then((response) => response.data);
  },

  rejectDepartmentTransfer(id: string, reason?: string) {
    return apiClient.put(`/api/v1/department-transfers/${id}/reject`, { reason }).then((response) => response.data);
  },

  employeeProfile() {
    return getData<JsonRecord>("/api/v1/auth/employee-profile");
  },

  updateEmployeeProfile(input: JsonRecord) {
    return apiClient.put("/api/v1/auth/employee-profile", input).then((response) => response.data);
  },

  uploadEmployeeAvatar(form: FormData) {
    return apiClient.post("/api/v1/auth/employee-profile/avatar", form, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }).then((response) => response.data);
  },

  uploadEmployeeDocument(form: FormData) {
    return apiClient.post("/api/v1/auth/employee-profile/documents", form, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }).then((response) => response.data);
  },

  rewardPointOverview() {
    return getData<JsonRecord>("/api/v1/auth/reward-points/overview");
  },

  rewardPointHistory() {
    return getData<JsonRecord>("/api/v1/auth/reward-points/history");
  },

  teamOverview() {
    return getData<JsonRecord>("/api/v1/auth/team/overview");
  },

  teamMembers(params?: { search?: string; job_position?: string; per_page?: number }) {
    return getData<JsonRecord>("/api/v1/auth/team/members", params);
  },

  departments(params?: { branch_id?: string }) {
    return getData<JsonRecord>("/api/v1/auth/departments", params);
  },

  teamKpiOverview() {
    return getData<JsonRecord>("/api/v1/auth/team/kpi/overview");
  },

  teamKpiLeaderboard() {
    return getData<JsonRecord>("/api/v1/auth/team/kpi/leaderboard");
  },

  departmentRanking() {
    return getData<JsonRecord>("/api/v1/auth/team/ranking/departments");
  },

  customerReferralQr() {
    return getData<JsonRecord>("/api/v1/employee-referrals/customer-qr");
  },

  recruitmentReferralQr() {
    return getData<JsonRecord>("/api/v1/employee-referrals/recruitment-qr");
  },

  referralHistory() {
    return getData<JsonRecord>("/api/v1/employee-referrals/history");
  },

  referralCommissions() {
    return getData<JsonRecord>("/api/v1/employee-referrals/commissions");
  },

  async learningAccess(): Promise<LearningAccess> {
    try {
      const response = await this.courses();
      const course = response.data.course as (JsonRecord & { progress?: unknown }) | null;
      const progress = isJsonRecord(course?.progress) ? course.progress : {};
      const quiz = isJsonRecord(course?.quiz) ? course.quiz : null;
      const courseId = typeof course?.id === "string" ? course.id : "";
      const isMandatory = boolValue(course?.isMandatory ?? course?.is_mandatory, false);
      const hasAccessFlag = course
        ? course.canAccessPremiumLearning !== undefined || course.can_access_premium_learning !== undefined
        : false;
      const canAccessPremiumLearning = boolValue(
        course?.canAccessPremiumLearning ?? course?.can_access_premium_learning,
        false
      );
      const hasQuizFlag = boolValue(quiz?.hasQuiz ?? quiz?.has_quiz, false);
      const quizStatus = typeof quiz?.status === "string" ? quiz.status : "";
      const quizPassed = boolValue(quiz?.isPassed ?? quiz?.is_passed, false);
      const totalLessons = numValue(progress.totalLessons ?? progress.total_lessons, 0);
      const completedLessons = numValue(progress.completedLessons ?? progress.completed_lessons, 0);
      const status = typeof progress.status === "string" ? progress.status : "";
      const lessonsCompleted = status === "completed" || (totalLessons > 0 && completedLessons >= totalLessons);

      if (!course) {
        return { mandatoryLearningCompleted: false };
      }

      if (!isMandatory) {
        return { mandatoryLearningCompleted: true };
      }

      if (hasAccessFlag && canAccessPremiumLearning) {
        return { mandatoryLearningCompleted: canAccessPremiumLearning };
      }

      if (!lessonsCompleted) {
        return { mandatoryLearningCompleted: false };
      }

      if (hasQuizFlag) {
        return { mandatoryLearningCompleted: quizStatus === "passed" || quizPassed };
      }

      if (!courseId) {
        return { mandatoryLearningCompleted: status === "completed" };
      }

      const quizAvailability = await this.courseQuizAvailability(courseId).catch(() => null);

      if (quizAvailability?.status === 404) {
        return { mandatoryLearningCompleted: true };
      }

      if (quizAvailability?.status === 200 || quizAvailability?.status === 403) {
        return { mandatoryLearningCompleted: false };
      }

      return {
        mandatoryLearningCompleted: false
      };
    } catch {
      return {
        mandatoryLearningCompleted: false
      };
    }
  },

  async uploadEvidence(form: FormData) {
    const response = await apiClient.post("/api/v1/evidence/upload", form, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  },

  recruitmentBranches() {
    return getData<JsonRecord>("/api/v1/recruitment/branches");
  },

  recruitmentPositions() {
    return getData<JsonRecord>("/api/v1/recruitment/positions");
  },

  async applyRecruitment(form: FormData) {
    const response = await apiClient.post("/api/v1/recruitment/apply", form, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  },

  recruitmentApplications() {
    return getData<JsonRecord>("/api/v1/recruitment/applications");
  },

  processRecruitmentApplication(id: string, status: "approved" | "rejected", rejectedReason?: string) {
    return postData<JsonRecord>(`/api/v1/recruitment/applications/${id}/process`, {
      status,
      rejected_reason: rejectedReason
    });
  }
};
