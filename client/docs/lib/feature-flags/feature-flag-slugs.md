# `lib/feature-flags/feature-flag-slugs.ts`

[← lib/feature-flags](README.md)

## Purpose

Central registry of every feature-flag slug referenced in the code. New
flags are added here; the `slug` value must exactly match the `slug` field
of the corresponding Appwrite document ([`FeatureFlag`](../models/feature-flag.md)).

## Exports

| Export | Type | Meaning |
|---|---|---|
| `FeatureFlagSlugs` | `const` object (`as const`) | `{ TABLE_BELL: "table_bell", TIMER: "timer", RESULTS: "results", LOTTERY: "lottery" }`. Frozen at the type level so every property resolves to its literal string, not `string`. |
| `FeatureFlagSlug` | `type FeatureFlagSlug = "table_bell" \| "timer" \| "results" \| "lottery"` | Union of `FeatureFlagSlugs`' values (`(typeof FeatureFlagSlugs)[keyof typeof FeatureFlagSlugs]`), used to type any parameter that must be one of the known slugs. |

## Used by

- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md)
- [`lib/feature-flags/useFeatureFlags.ts`](useFeatureFlags.md)
- [`lib/stores/appwrite/feature-flag-store.ts`](../stores/appwrite/feature-flag-store.md)
