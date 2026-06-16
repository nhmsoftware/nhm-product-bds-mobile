import { Redirect, type Href } from "expo-router";

import { ReferralQrScreen } from "@/components/EmployeeScreens";
import { isBaseEmployeeRole } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";

export default function ReferralQrRoute() {
  const { session } = useAuth();
  const user = session?.user;
  const approvedEmployeeProfile = !isBaseEmployeeRole(user?.role) || Boolean(user?.isActive && user?.jobPosition?.trim());

  if (!approvedEmployeeProfile) {
    return <Redirect href={"/(app)/employee/application" as Href} />;
  }

  return <ReferralQrScreen />;
}
