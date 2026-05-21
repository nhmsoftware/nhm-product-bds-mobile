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

import { STORAGE_KEYS } from "@/libs/env";
import { setUnauthorizedHandler } from "@/libs/api";
import { notifyInfo } from "@/libs/notify";
import { authApi } from "@/services/auth/api";
import type { AuthSession } from "@/services/auth/types";

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  signedIn: boolean;
  signIn: (session: AuthSession) => Promise<void>;
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
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
      })
    );

    return () => setUnauthorizedHandler(null);
  }, [clearLocalSession]);

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
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
      });
      return undefined;
    }

    const timer = setTimeout(() => {
      clearLocalSession({
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
      });
    }, Math.min(timeoutMs, 2147483647));

    return () => clearTimeout(timer);
  }, [clearLocalSession, session?.expiresAtUtc]);

  const signIn = useCallback(async (nextSession: AuthSession) => {
    setSession(nextSession);
    await AsyncStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(nextSession));
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout still clears stale tokens if the backend already revoked them.
    }
    await clearLocalSession();
  }, [clearLocalSession]);

  const refreshMe = useCallback(async () => {
    if (!session) return;
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
      signOut,
      refreshMe
    }),
    [loading, refreshMe, session, signIn, signOut]
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
