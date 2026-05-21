import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { appThemes, getAppTheme, LayoutMode } from "@/libs/theme";

type LayoutModeContextValue = {
  mode: LayoutMode;
  loading: boolean;
  theme: ReturnType<typeof getAppTheme>;
  setMode: (mode: LayoutMode) => Promise<void>;
};

const LayoutModeContext = createContext<LayoutModeContextValue | null>(null);

function isLayoutMode(value: string | null): value is LayoutMode {
  return value === "default" || value === "pro";
}

export function LayoutModeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<LayoutMode>("default");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.layoutMode)
      .then((storedMode) => {
        if (isLayoutMode(storedMode)) {
          setModeState(storedMode);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const setMode = useCallback(async (nextMode: LayoutMode) => {
    setModeState(nextMode);
    await AsyncStorage.setItem(STORAGE_KEYS.layoutMode, nextMode);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      loading,
      theme: appThemes[mode],
      setMode
    }),
    [loading, mode, setMode]
  );

  return <LayoutModeContext.Provider value={value}>{children}</LayoutModeContext.Provider>;
}

export function useLayoutMode() {
  const value = useContext(LayoutModeContext);
  if (!value) {
    throw new Error("useLayoutMode must be used inside LayoutModeProvider");
  }
  return value;
}

export function useAppTheme() {
  return useLayoutMode().theme;
}
