# `lib/stores/appwrite/team-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `teams` collection ([`Team`](../../models/team.md)). Read-only.

## Exports

### `useTeamStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Team[]` | All `Team` documents |
| `initialized: boolean` | `true` once the initial fetch has resolved; `false` beforehand so consumers can distinguish "still loading" from "empty" |
| `init(): Promise<void>` | `fetchCollection<Team>(key, set)` — loads the full `teams` collection with no query filter, then flips `initialized` to `true` |

## Used by

- [`lib/components/onboarding/PlayerPickerForm.tsx`](../../components/onboarding/PlayerPickerForm.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
