# `lib/stores/appwrite/feature-flag-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `feature_flags` collection
([`FeatureFlag`](../../models/feature-flag.md)). Read-only from the app's
perspective (flags are toggled in the [admin UI](../../components/admin/FeatureFlags.md)
via the shared `updateInCollection` helper directly, not through this
store's own methods).

## Exports

### `useFeatureFlagStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: FeatureFlag[]` | All `FeatureFlag` documents — each one a `{ slug, enabled }` row |
| `flags: Record<string, boolean>` | `slug → enabled` lookup map (see below) |
| `init(): Promise<void>` | Fetches all `FeatureFlag` documents (no query filter) and populates `collection`/`flags`; call once on app start |

## How it works

Wraps the store's `set` in `setWithFlags`, which recomputes `flags` from
`buildFlags(collection)` every time `collection` changes (on both the
initial fetch and every realtime update) — consumers read `flags` directly
instead of re-deriving the same lookup on every render. `buildFlags`
initializes every known slug (from
[`FeatureFlagSlugs`](../../feature-flags/feature-flag-slugs.md)) to `false`,
then overlays `true`/`false` from whatever documents actually exist —
so an unknown/not-yet-created slug reads as disabled rather than `undefined`.

## Used by

- [`lib/feature-flags/useFeatureFlags.ts`](../../feature-flags/useFeatureFlags.md) — the intended way to read a flag
- [`lib/components/admin/FeatureFlags.tsx`](../../components/admin/FeatureFlags.md) — admin toggle UI
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
