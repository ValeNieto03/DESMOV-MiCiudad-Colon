import { Colors } from "@/constants/theme";
import type { Preferencias } from "@/tipos/usuario";
import Storage from "expo-sqlite/kv-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useColorScheme } from "react-native";

type ThemePreference = Preferencias["tema"];
type AppTheme = "light" | "dark";

type ThemeContextValue = {
  preference: ThemePreference;
  theme: AppTheme;
  colors: (typeof Colors)[AppTheme];
  isReady: boolean;
  persistenceError: boolean;
  setPreference: (preference: ThemePreference) => void;
};

const STORAGE_KEY = "mi-ciudad-theme-preference";
const VALID_PREFERENCES: ThemePreference[] = ["claro", "oscuro", "sistema"];

function isThemePreference(value: string | null): value is ThemePreference {
  return value !== null && VALID_PREFERENCES.includes(value as ThemePreference);
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] =
    useState<ThemePreference>("sistema");
  const [isReady, setIsReady] = useState(false);
  const [persistenceError, setPersistenceError] = useState(false);
  const writes = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let mounted = true;

    async function restorePreference() {
      try {
        const storedPreference = await Storage.getItemAsync(STORAGE_KEY);

        if (!mounted) return;

        if (isThemePreference(storedPreference)) {
          setPreferenceState(storedPreference);
        } else if (storedPreference !== null) {
          await Storage.setItemAsync(STORAGE_KEY, "sistema");
          setPreferenceState("sistema");
        }
      } catch {
        if (mounted) setPersistenceError(true);
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    void restorePreference();

    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    setPersistenceError(false);

    writes.current = writes.current
      .catch(() => undefined)
      .then(() => Storage.setItemAsync(STORAGE_KEY, nextPreference))
      .catch(() => {
        setPersistenceError(true);
      });
  }, []);

  const theme: AppTheme =
    preference === "sistema"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference === "oscuro"
        ? "dark"
        : "light";

  const value = useMemo(
    () => ({
      preference,
      theme,
      colors: Colors[theme],
      isReady,
      persistenceError,
      setPreference,
    }),
    [preference, theme, isReady, persistenceError, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error("useThemeContext debe usarse dentro de ThemeProvider.");
  }

  return context;
}
