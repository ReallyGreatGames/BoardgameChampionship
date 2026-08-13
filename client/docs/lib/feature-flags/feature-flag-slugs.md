# `lib/feature-flags/feature-flag-slugs.ts`

[← lib/feature-flags](README.md)

## Purpose

Central registry of every feature-flag slug referenced in the code. New
flags are added here; the `slug` value must exactly match the `slug` field
of the corresponding Appwrite document ([`FeatureFlag`](../models/feature-flag.md)).

## Exports

| Export | Type | Meaning |
|---|---|---|
| `FeatureFlagSlugs` | `const` object | `{ TABLE_BELL: "table_bell", TIMER: "timer", RESULTS: "results", LOTTERY: "lottery" }` |
| `FeatureFlagSlug` | Type | Union of `FeatureFlagSlugs`' values |

## Used by

- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md)
- [`lib/feature-flags/useFeatureFlags.ts`](useFeatureFlags.md)
- [`lib/stores/appwrite/feature-flag-store.ts`](../stores/appwrite/feature-flag-store.md)
