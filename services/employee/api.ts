import { apiClient, getData, postData } from "@/libs/api";
import type { MandatoryLearningCoursesData } from "@/services/employee/types";

export type AttendanceStatus = {
  checked_in?: boolean;
  checked_out?: boolean;
  check_in_time?: string | null;
  check_out_time?: string | null;
  status?: string;
};

export type LearningAccess = {
  // MOCK until backend exposes a direct onboarding-complete flag for mobile routing.
  mandatoryLearningCompleted: boolean;
};

export const employeeApi = {
  todayAttendance() {
    return getData<AttendanceStatus>("/api/v1/attendance/today");
  },

  checkIn(input?: { latitude?: number; longitude?: number; note?: string }) {
    return postData<AttendanceStatus>("/api/v1/attendance/check-in", input ?? {});
  },

  checkOut(input?: { latitude?: number; longitude?: number; note?: string }) {
    return postData<AttendanceStatus>("/api/v1/attendance/check-out", input ?? {});
  },

  checkInMeetCustomer(input: {
    customer_name: string;
    phone?: string;
    project?: string;
    note?: string;
  }) {
    return postData("/api/v1/customer-meetings/check-in", input);
  },

  checkInSiteTour(input: {
    project: string;
    unit_code?: string;
    customer_name?: string;
    note?: string;
  }) {
    return postData("/api/v1/site-tours/check-in", input);
  },

  recentMeetings() {
    return getData("/api/v1/customer-meetings/recent");
  },

  siteTourHistory() {
    return getData("/api/v1/site-tours/history");
  },

  internalNews() {
    return getData("/api/v1/news/internal");
  },

  courses() {
    return getData<MandatoryLearningCoursesData>("/api/v1/learning/courses");
  },

  async learningAccess(): Promise<LearningAccess> {
    try {
      const response = await this.courses();
      const course = response.data.course;
      return {
        mandatoryLearningCompleted:
          Boolean(
            course &&
              (!course.isMandatory ||
                course.progress.status === "completed" ||
                (course.progress.totalLessons > 0 &&
                  course.progress.completedLessons >= course.progress.totalLessons))
          )
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
  }
};
