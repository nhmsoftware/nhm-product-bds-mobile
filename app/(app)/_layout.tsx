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
      <Stack.Screen name="listings/[id]" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="forbidden" />
    </Stack>
  );
}
