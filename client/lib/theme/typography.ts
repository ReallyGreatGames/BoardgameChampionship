/**
 * Typography system — Barlow Condensed (display/headings) + DM Sans (body/UI)
 *
 * Barlow Condensed: condensed, athletic, championship energy
 * DM Sans: clean, modern, highly readable — not Inter
 */

// Font family references — must match keys passed to useFonts() in _layout.tsx
export const fonts = {
  displayExtraBold: "BarlowCondensed_800ExtraBold",
  displayBold: "BarlowCondensed_700Bold",
  displaySemi: "BarlowCondensed_600SemiBold",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodyBold: "DMSans_700Bold",
} as const;

// Type scale — intentional modular scale, no arbitrary sizes
export const type = {
  /** 52px — championship moments, hero numbers */
  display: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -0.5,
  },
  /** 40px — primary screen title */
  h1: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: 0,
  },
  /** 28px — section headings, card titles */
  h2: {
    fontFamily: fonts.displaySemi,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  /** 20px — sub-section headings */
  h3: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    lineHeight: 26,
  },
  /** 18px — emphasized body, lead text */
  bodyLarge: {
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 26,
  },
  /** 16px — standard body text */
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  /** 14px — labels, secondary content */
  bodySmall: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  /** 12px — metadata, timestamps */
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  /** 11px — badges, eyebrow labels, ALL CAPS */
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },
  /** 16px bold — buttons, CTAs */
  button: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  /** 56px — player number tiles, large stat displays */
  bigNumber: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1,
  },
} as const;
