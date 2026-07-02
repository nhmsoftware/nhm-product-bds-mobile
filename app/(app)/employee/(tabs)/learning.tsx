import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { LearningHomeScreen, MandatoryCourseListScreen } from "@/components/EmployeeScreens";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { canUseDemoLearning } from "@/services/auth/demo";
import { useAuth } from "@/services/auth/store";
import { employeeApi } from "@/services/employee/api";

export default function EmployeeLearningRoute() {
  const { session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;

      if (canUseDemoLearning(session)) {
        setAllowed(true);
        setLoading(false);
        return;
      }

      let mounted = true;
      setLoading(true);

      employeeApi
        .learningAccess()
        .then((result) => {
          if (mounted) setAllowed(result.mandatoryLearningCompleted);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });

      return () => { mounted = false; };
    }, [authLoading, session])
  );

  if (authLoading || loading) {
    return (
      <Screen edges={["top", "left", "right"]} scroll={false}>
        <LoadingState />
      </Screen>
    );
  }

  if (!allowed) {
    return <MandatoryCourseListScreen onComplete={() => setAllowed(true)} />;
  }

  return <LearningHomeScreen />;
}
