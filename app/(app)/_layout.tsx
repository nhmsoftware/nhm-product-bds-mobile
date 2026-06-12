import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/services/auth/store";

export default function AppLayout() {
  const { loading, signedIn } = useAuth();

  if (!loading && !signedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="employee" />
      <Stack.Screen name="market-news" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="news-detail" />
      <Stack.Screen name="project-detail" />
      <Stack.Screen name="planning-detail" />
      <Stack.Screen name="legal-knowledge" />
      <Stack.Screen name="listings/[id]" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="profile/change-password" />
      <Stack.Screen name="forbidden" />
    </Stack>
  );
}
