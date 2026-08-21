# `lib/feature-flags/useFeatureFlags.ts`

[← lib/feature-flags](README.md)

## Purpose

React hook for checking whether a given feature flag is active.

## Exports

### `useFeatureFlags(): (slug: FeatureFlagSlug) => boolean`

Takes no parameters. Reads `flags: Record<string, boolean>` from
[`useFeatureFlagStore`](../stores/appwrite/feature-flag-store.md) — a map keyed by
every known slug (from `FeatureFlagSlugs`), pre-seeded to `false` and filled in
as the flag collection loads from Appwrite — and returns a stable
(`useCallback`-memoized on `flags`) checker function.

The returned function:

| Signature | Parameter | Returns |
|---|---|---|
| `(slug: FeatureFlagSlug) => boolean` | `slug` — one of the known slugs from [`FeatureFlagSlug`](feature-flag-slugs.md) | `flags[slug] ?? false` — `true` only if that flag's Appwrite document has `enabled: true`; `false` if disabled or not yet loaded, so callers can gate UI safely before the store finishes fetching. |

The memoization means components only re-render the check function identity when the underlying `flags` object changes (i.e. on store updates), not on every render.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md)

## Related

- [`lib/feature-flags/feature-flag-slugs.ts`](feature-flag-slugs.md)
