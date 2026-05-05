import { useCallback } from "react";
import { useFeatureFlagStore } from "../stores/appwrite/feature-flag-store";
import { FeatureFlagSlug } from "./feature-flag-slugs";

export function useFeatureFlags() {
  const flags = useFeatureFlagStore((s) => s.flags);
  return useCallback((slug: FeatureFlagSlug) => flags[slug] ?? false, [flags]);
}
