import { FC, PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStorage from "@/lib/secureStorage";
import { dark, light } from "@/lib/theme/colors";

const THEME_STORE_KEY = "app_theme_dark";

type ColorPalette = typeof dark | typeof light;

type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ColorPalette;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
  colors: dark,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    SecureStorage.getItemAsync(THEME_STORE_KEY).then((stored) => {
      if (stored !== null) {
        setIsDark(stored === "true");
      }
    });
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    await SecureStorage.setItemAsync(THEME_STORE_KEY, String(next));
  }, [isDark]);

  const value: ThemeContextValue = useMemo(
    () => ({ isDark, toggleTheme, colors: isDark ? dark : light }),
    [isDark, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
