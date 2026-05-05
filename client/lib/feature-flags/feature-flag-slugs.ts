// Add your feature flag slugs here. The slug must match the `slug` field in Appwrite.
// Example: MY_FEATURE: "my_feature",
export const FeatureFlagSlugs = {
  TABLE_BELL: "table_bell",
  TIMER: "timer",
  RESULTS: "results",
  LOTTERY: "lottery"
} as const;

export type FeatureFlagSlug = (typeof FeatureFlagSlugs)[keyof typeof FeatureFlagSlugs];
