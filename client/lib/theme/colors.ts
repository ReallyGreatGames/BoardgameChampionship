
export const dark = {
  background: "#010509",
  surface: "#080f1a",
  surfaceHigh: "#0d1a2e",

  border: "#122040",
  borderMuted: "#0a1830",
  divider: "#0d1e33",

  text: "#daecfa",
  textSecondary: "#8badc8",
  textMuted: "#3a5a78",
  textPlaceholder: "#2e4d68",

  primary: "#81b8ed",
  secondary: "#8c1591",
  accent: "#e02883",
  error: "#f05252",
  success: "#4caf50",
  onAccent: "#ffffff",
} as const;

export const oled = {
  background: "#000000",
  surface: "#050505",
  surfaceHigh: "#0b0d0c",

  border: "#1c2421",
  borderMuted: "#101614",
  divider: "#151b18",

  text: "#e8fff6",
  textSecondary: "#9bcab8",
  textMuted: "#5f8275",
  textPlaceholder: "#48665b",

  primary: "#00d68f",
  secondary: "#7cb7ff",
  accent: "#ff4f8b",
  error: "#ff6b6b",
  success: "#45e37f",
  onAccent: "#080004",
} as const;

export const light = {
  background: "#f6fafe",
  surface: "#e8f2fc",
  surfaceHigh: "#daeaf8",

  border: "#b8d0e8",
  borderMuted: "#cde0f2",
  divider: "#c5d8ee",

  text: "#051624",
  textSecondary: "#2e6090",
  textMuted: "#6a90b0",
  textPlaceholder: "#9ab8d0",

  primary: "#12497d",
  secondary: "#e66cea",
  accent: "#d61f7a",
  error: "#d63232",
  success: "#4caf50",
  onAccent: "#ffffff",
} as const;

export const highContrast = {
  background: "#9ec3ff",
  surface: "#a3a0ff",
  surfaceHigh: "#c99bf0",

  border: "#1a1a1a",
  borderMuted: "#3d3d3d",
  divider: "#1a1a1a",

  text: "#000000",
  textSecondary: "#1a1a1a",
  textMuted: "#3d3d3d",
  textPlaceholder: "#5c5c5c",

  primary: "#0a3a8a",
  secondary: "#4a148c",
  accent: "#ad1457",
  error: "#8b0000",
  success: "#1b5e20",
  onAccent: "#ffffff",
} as const;

export type ColorScheme = "light" | "dark" | "oled" | "highContrast";

export type Palette = { [K in keyof typeof dark]: string };

export const palettes: Record<ColorScheme, Palette> = {
  light,
  dark,
  oled,
  highContrast,
};

export const colors = dark;
