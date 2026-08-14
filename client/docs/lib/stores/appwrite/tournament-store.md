# `lib/stores/appwrite/tournament-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `tournament` collection
([`Tournament`](../../models/tournament.md) — a single global document). Read-only.

## Exports

### `useTournamentStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Tournament[]` | The `Tournament` documents (in practice exactly one) |
| `initialized: boolean` | `true` once the initial fetch has resolved |
| `init()` | Loads the collection |

## Used by

- [`lib/auth.tsx`](../../auth.md) — `initialized` gates the "force logout on inactive tournament" effect
- [`lib/bootstrap/TournamentProvider.tsx`](../../bootstrap/TournamentProvider.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
