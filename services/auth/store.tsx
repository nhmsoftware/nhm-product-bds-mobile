import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { setUnauthorizedHandler } from "@/libs/api";
import { STORAGE_KEYS } from "@/libs/env";
import { useI18n } from "@/libs/i18n";
import { notifyInfo } from "@/libs/notify";
import { authApi } from "@/services/auth/api";
import { createDemoSession, DEMO_AUTH_ENABLED, isDemoSession, type DemoLoginRole } from "@/services/auth/demo";
import { getHomeHrefForRole } from "@/services/auth/roles";
import type { AppAccessRole, AuthSession } from "@/services/auth/types";

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  signedIn: boolean;
  signIn: (session: AuthSession) => Promise<void>;
  signInWithDemo: (role?: DemoLoginRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isExpiredSession(session: AuthSession | null) {
  if (!session?.expiresAtUtc) {
    return false;
  }

  const expiresAt = Date.parse(session.expiresAtUtc);
  if (Number.isNaN(expiresAt)) {
    return false;
  }

  return expiresAt <= Date.now();
}

export function AuthProvider({ children }: PropsWithChildren) {
  const { t } = useI18n();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const clearLocalSession = useCallback(
    async ({ message }: { message?: string } = {}) => {
      setSession(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.auth);

      if (message) {
        notifyInfo({ message });
      }

      router.replace("/(auth)/login");
    },
    []
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.auth)
      .then((raw) => {
        if (!raw) {
          return;
        }

        const storedSession = JSON.parse(raw) as AuthSession;
        if (isExpiredSession(storedSession)) {
          AsyncStorage.removeItem(STORAGE_KEYS.auth);
          return;
        }

        setSession(storedSession);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() =>
      clearLocalSession({
        message: t("notifications.sessionExpired")
      })
    );

    return () => setUnauthorizedHandler(null);
  }, [clearLocalSession, t]);

  useEffect(() => {
    if (!session?.expiresAtUtc) {
      return undefined;
    }

    const expiresAt = Date.parse(session.expiresAtUtc);
    if (Number.isNaN(expiresAt)) {
      return undefined;
    }

    const timeoutMs = expiresAt - Date.now();
    if (timeoutMs <= 0) {
      clearLocalSession({
        message: t("notifications.sessionExpired")
      });
      return undefined;
    }

    const timer = setTimeout(() => {
      clearLocalSession({
        message: t("notifications.sessionExpired")
      });
    }, Math.min(timeoutMs, 2147483647));

    return () => clearTimeout(timer);
  }, [clearLocalSession, session?.expiresAtUtc, t]);

  const signIn = useCallback(async (nextSession: AuthSession) => {
    setSession(nextSession);
    await AsyncStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(nextSession));
  }, []);

  const signInWithDemo = useCallback(async (role: DemoLoginRole = "customer") => {
    if (!DEMO_AUTH_ENABLED) {
      throw new Error("Demo auth is disabled");
    }

    const demoSession = createDemoSession(role);
    await signIn(demoSession);
    router.replace(getHomeHrefForRole(demoSession.user.role));
  }, [signIn]);

  const signOut = useCallback(async () => {
    if (!isDemoSession(session)) {
      try {
        await authApi.logout();
      } catch {
        // Local logout still clears stale tokens if the backend already revoked them.
      }
    }

    await clearLocalSession();
  }, [clearLocalSession, session]);

  const refreshMe = useCallback(async () => {
    if (!session || isDemoSession(session)) return;
    const response = await authApi.me();
    const nextSession = {
      ...session,
      user: response.data
    };
    setSession(nextSession);
    await AsyncStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(nextSession));
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signedIn: Boolean(session?.accessToken) && !isExpiredSession(session),
      signIn,
      signInWithDemo,
      signOut,
      refreshMe
    }),
    [loading, refreshMe, session, signIn, signInWithDemo, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
