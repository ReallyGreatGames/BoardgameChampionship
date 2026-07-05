import { FeatureFlagSlugs } from "@/lib/feature-flags/feature-flag-slugs";
import { FeatureFlag } from "@/lib/models/feature-flag";
import { create } from "zustand";
import { fetchCollection, RealtimeCollectionStore, Set } from "../real-time-store";

const COLLECTION_ID = "feature_flags";
const ALL_SLUGS = Object.values(FeatureFlagSlugs) as string[];

function buildFlags(collection: FeatureFlag[]): Record<string, boolean> {
  const flags: Record<string, boolean> = Object.fromEntries(ALL_SLUGS.map((s) => [s, false]));
  for (const doc of collection) {
    if (ALL_SLUGS.includes(doc.slug)) {
      flags[doc.slug] = doc.enabled;
    }
  }
  return flags;
}

interface FeatureFlagState extends RealtimeCollectionStore<FeatureFlag> {
  flags: Record<string, boolean>;
  init: () => Promise<void>;
}

export const useFeatureFlagStore = create<FeatureFlagState>((set) => {
  const setWithFlags: Set<FeatureFlag, FeatureFlagState> = (partialOrFn) => {
    if (typeof partialOrFn === "function") {
      set((state) => {
        const result = partialOrFn(state);
        if ("collection" in result && result.collection) {
          return { ...result, flags: buildFlags(result.collection) };
        }
        return result;
      });
    } else if ("collection" in partialOrFn && partialOrFn.collection) {
      set({ ...partialOrFn, flags: buildFlags(partialOrFn.collection) });
    } else {
      set(partialOrFn);
    }
  };

  return {
    collection: [],
    key: COLLECTION_ID,
    realtimeSet: setWithFlags,
    flags: buildFlags([]),

    init: async () => {
      await fetchCollection<FeatureFlag, FeatureFlagState>(COLLECTION_ID, setWithFlags);
    },
  };
});
