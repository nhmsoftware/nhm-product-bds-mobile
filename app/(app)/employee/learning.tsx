import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { LearningHomeScreen } from "@/components/EmployeeScreens";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { canUseDemoLearning } from "@/services/auth/demo";
import { useAuth } from "@/services/auth/store";
import { employeeApi } from "@/services/employee/api";

export default function EmployeeLearningRoute() {
  const { session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return undefined;
    }

    if (canUseDemoLearning(session)) {
      setAllowed(true);
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    setLoading(true);

    employeeApi
      .learningAccess()
      .then((result) => {
        if (mounted) {
          setAllowed(result.mandatoryLearningCompleted);
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
  }, [authLoading, session]);

  if (authLoading || loading) {
    return (
      <Screen edges={["top", "left", "right"]} scroll={false}>
        <LoadingState />
      </Screen>
    );
  }

  if (!allowed) {
    return <Redirect href="/(app)/employee/required-learning" />;
  }

  return <LearningHomeScreen />;
}
