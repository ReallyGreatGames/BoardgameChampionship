# `lib/feature-flags/useFeatureFlags.ts`

[← lib/feature-flags](README.md)

## Purpose

React hook for checking whether a given feature flag is active.

## Exports

### `useFeatureFlags()`

Reads the flags from [`useFeatureFlagStore`](../stores/appwrite/feature-flag-store.md)
and returns a stable (`useCallback`-memoized) function
`(slug: FeatureFlagSlug) => boolean`, which returns `false` if the flag
isn't found (e.g. not yet loaded from Appwrite).

## Used by

- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md)

## Related

- [`lib/feature-flags/feature-flag-slugs.ts`](feature-flag-slugs.md)
