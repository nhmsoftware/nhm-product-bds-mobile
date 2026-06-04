import { Redirect, Stack } from "expo-router";

import { getHomeHrefForSession } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";

export default function AuthLayout() {
  const { loading, session, signedIn } = useAuth();

  if (!loading && signedIn) {
    return <Redirect href={getHomeHrefForSession(session)} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password-otp" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
