import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { RequiredLearningScreen } from "@/components/EmployeeScreens";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { notifyError } from "@/libs/notify";
import { employeeApi } from "@/services/employee/api";
import type { MandatoryLearningCourse } from "@/services/employee/types";

export default function RequiredLearningRoute() {
  const [course, setCourse] = useState<MandatoryLearningCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    employeeApi
      .courses()
      .then((response) => {
        if (mounted) {
          setCourse(response.data.course);
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

    return () => {
      mounted = false;
    };
  }, []);

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
