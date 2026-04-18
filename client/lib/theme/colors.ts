/**
 * Brand color tokens — applied via `dark` and `light` objects.
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
} as const;

/** Active theme — swap to `light` when implementing theme switching */
export const colors = light;
