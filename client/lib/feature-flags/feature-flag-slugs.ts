export const FeatureFlagSlugs = {
  TABLE_BELL: "table_bell",
  TIMER: "timer",
  RESULTS: "results",
  LOTTERY: "lottery"
} as const;

export type FeatureFlagSlug = (typeof FeatureFlagSlugs)[keyof typeof FeatureFlagSlugs];
