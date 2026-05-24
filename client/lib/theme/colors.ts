/**
 * Brand color tokens — applied via `dark`, `light`, and `highContrast` objects.
 *
 * Usage strategy:
 *   primary   → interactive chrome (links, back buttons, icons, focused states, identifiers)
 *   secondary → supporting highlights, tags, section labels
 *   accent    → CTAs, high-emphasis moments, badges, competitive highlights
 *   error     → destructive actions, validation failures
 */

export const dark = {
  // Backgrounds
  background: "#010509",
  surface: "#080f1a",       // cards, inputs
  surfaceHigh: "#0d1a2e",   // slightly elevated surfaces

  // Borders / dividers
  border: "#122040",
  borderMuted: "#0a1830",
  divider: "#0d1e33",

  // Text
  text: "#daecfa",
  textSecondary: "#8badc8",
  textMuted: "#3a5a78",
  textPlaceholder: "#2e4d68",

  // Brand
  primary: "#81b8ed",
  secondary: "#8c1591",
  accent: "#e02883",
  error: "#f05252",
  success: "#4caf50",
  onAccent: "#ffffff",  // text on accent/primary CTA buttons
} as const;

export const light = {
  // Backgrounds
  background: "#f6fafe",
  surface: "#e8f2fc",
  surfaceHigh: "#daeaf8",

  // Borders / dividers
  border: "#b8d0e8",
  borderMuted: "#cde0f2",
  divider: "#c5d8ee",

  // Text
  text: "#051624",
  textSecondary: "#2e6090",
  textMuted: "#6a90b0",
  textPlaceholder: "#9ab8d0",

  // Brand
  primary: "#12497d",
  secondary: "#e66cea",
  accent: "#d61f7a",
  error: "#d63232",
  success: "#4caf50",
  onAccent: "#ffffff",  // text on accent/primary CTA buttons
} as const;

export const highContrast = {
  // Backgrounds — pastel surfaces from the requested palette
  background: "#9ec3ff",
  surface: "#a3a0ff",
  surfaceHigh: "#c99bf0",

  // Borders / dividers
  border: "#1a1a1a",
  borderMuted: "#3d3d3d",
  divider: "#1a1a1a",

  // Text — pure black on light pastel bgs
  text: "#000000",
  textSecondary: "#1a1a1a",
  textMuted: "#3d3d3d",
  textPlaceholder: "#5c5c5c",

  // Brand — dark counterparts of the palette hues so they read as text
  // and icons on pastel surfaces (primary/secondary/accent are used as
  // foreground in most places, not just as button backgrounds).
  primary: "#0a3a8a",     // dark blue, matches #9ec3ff hue
  secondary: "#4a148c",   // dark purple, matches #c99bf0
  accent: "#ad1457",      // dark magenta, matches #f8a5df / #ffafc1
  error: "#8b0000",
  success: "#1b5e20",
  onAccent: "#ffffff",
} as const;

export type ColorScheme = "light" | "dark" | "highContrast";

export type Palette = { [K in keyof typeof dark]: string };

export const palettes: Record<ColorScheme, Palette> = { light, dark, highContrast };

/** Fallback static palette — prefer useTheme() from ThemeProvider for dynamic theming */
export const colors = dark;
