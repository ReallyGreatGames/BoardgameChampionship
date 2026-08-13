# `lib/models/feature-flag.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type `FeatureFlag` — a single feature flag.

## Exports

### `type FeatureFlag`

| Field | Type | Meaning |
|---|---|---|
| `feature` | `string` | Display name of the feature |
| `slug` | `string` | Unique key (see [feature-flag-slugs.ts](../feature-flags/feature-flag-slugs.md)) |
| `enabled` | `boolean` | Whether the feature is active |

## Used by

- [`lib/stores/appwrite/feature-flag-store.ts`](../stores/appwrite/feature-flag-store.md)

## Related

- [`lib/feature-flags/useFeatureFlags.ts`](../feature-flags/useFeatureFlags.md) — the hook that consumes this store
