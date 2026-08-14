
export const fonts = {
  displayExtraBold: "BarlowCondensed_800ExtraBold",
  displayBold: "BarlowCondensed_700Bold",
  displaySemi: "BarlowCondensed_600SemiBold",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodyBold: "DMSans_700Bold",
} as const;

export const type = {
  display: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: 0,
  },
  h2: {
    fontFamily: fonts.displaySemi,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  h3: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    lineHeight: 26,
  },
  bodyLarge: {
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 26,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },
  button: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  bigNumber: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1,
  },
} as const;
