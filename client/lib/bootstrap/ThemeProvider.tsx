import { FC, PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStorage from "@/lib/secureStorage";
import { ColorScheme, Palette, palettes } from "@/lib/theme/colors";

const SCHEME_STORE_KEY = "app_color_scheme";
const LEGACY_DARK_KEY = "app_theme_dark";

type ColorPalette = Palette;

type ThemeContextValue = {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
  colors: ColorPalette;
};

const DEFAULT_SCHEME: ColorScheme = "light";

const ThemeContext = createContext<ThemeContextValue>({
  scheme: DEFAULT_SCHEME,
  setScheme: () => {},
  isDark: false,
  colors: palettes[DEFAULT_SCHEME],
});

export const useTheme = () => useContext(ThemeContext);

const isColorScheme = (value: string): value is ColorScheme =>
  value === "light" || value === "dark" || value === "highContrast";

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [scheme, setSchemeState] = useState<ColorScheme>(DEFAULT_SCHEME);

  useEffect(() => {
    (async () => {
      const stored = await SecureStorage.getItemAsync(SCHEME_STORE_KEY);
      if (stored && isColorScheme(stored)) {
        setSchemeState(stored);
        return;
      }
      // Migrate from legacy boolean key
      const legacy = await SecureStorage.getItemAsync(LEGACY_DARK_KEY);
      if (legacy !== null) {
        const migrated: ColorScheme = legacy === "true" ? "dark" : "light";
        setSchemeState(migrated);
        await SecureStorage.setItemAsync(SCHEME_STORE_KEY, migrated);
      }
    })();
  }, []);

  const setScheme = useCallback(async (next: ColorScheme) => {
    setSchemeState(next);
    await SecureStorage.setItemAsync(SCHEME_STORE_KEY, next);
  }, []);

  const value: ThemeContextValue = useMemo(
    () => ({
      scheme,
      setScheme,
      isDark: scheme === "dark",
      colors: palettes[scheme],
    }),
    [scheme, setScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
