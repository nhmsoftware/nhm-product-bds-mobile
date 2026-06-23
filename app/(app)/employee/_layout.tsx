import { Stack } from "expo-router";

import { RoleGuard } from "@/components/RoleGuard";

export default function EmployeeLayout() {
  return (
    <RoleGuard allowedRoles={["employee"]}>
      <Stack
        screenOptions={{
          gestureEnabled: true,
          headerShown: false
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="required-learning" />
        <Stack.Screen name="lesson-detail" />
        <Stack.Screen name="quiz" />
        <Stack.Screen name="quiz-result" />
        <Stack.Screen name="certificates" />
        <Stack.Screen name="meet-client" />
        <Stack.Screen name="meeting-activities" />
        <Stack.Screen name="showing-client" />
        <Stack.Screen name="site-tour-activities" />
        <Stack.Screen name="point-history" />
        <Stack.Screen name="personal-info" />
        <Stack.Screen name="application" />
        <Stack.Screen name="referral-qr" />
        <Stack.Screen name="leave-requests" />
        <Stack.Screen name="transfer-requests" />
        <Stack.Screen name="department-staff" />
        <Stack.Screen name="document-viewer" />
        <Stack.Screen name="inventory-list" />
        <Stack.Screen name="inventory-map" />
        <Stack.Screen name="lot-detail" />
        <Stack.Screen name="planning-check" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="comments" />
        <Stack.Screen name="manager-profile" />
      </Stack>
    </RoleGuard>
  );
}
