import { Redirect } from "expo-router";
import { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAppTheme } from "@/libs/layout-mode";
import { canAccessRole, getHomeHrefForSession } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";
import type { AppAccessRole } from "@/services/auth/types";

type RoleGuardProps = PropsWithChildren<{
  allowedRoles: AppAccessRole[];
}>;

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const theme = useAppTheme();
  const { loading, session, signedIn } = useAuth();

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!signedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!canAccessRole(session?.user.role, allowedRoles)) {
    return <Redirect href={getHomeHrefForSession(session)} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  }
});
