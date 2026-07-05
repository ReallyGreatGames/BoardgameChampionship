/** Shared UI constants — use these instead of raw strings/numbers */
export const ui = {
  backdropColor: "rgba(0,0,0,0.6)",
  disabledOpacity: 0.4,
  cardRadius: 12,
  sheetRadius: 20,
  inputRadius: 10,
  buttonRadius: 10,
  /** Window width at/above which we treat the device as tablet+ rather than phone */
  breakpointTablet: 600,
} as const;
