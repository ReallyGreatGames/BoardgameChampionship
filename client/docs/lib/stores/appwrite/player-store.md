# `lib/stores/appwrite/player-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `players` collection ([`Player`](../../models/player.md)). Read-only.

## Exports

### `usePlayerStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: Player[]` | All `Player` documents, with `team` hydrated |
| `initialized: boolean` | `true` once the initial fetch has resolved; `false` beforehand so consumers can distinguish "still loading" from "empty" |
| `init(): Promise<void>` | `fetchCollection<Player>(key, set, [Query.select(["*", "team.*"])])` — loads every `Player` with the related `team` document's fields inlined, then flips `initialized` to `true` |

## How it works

`relationshipFields: ["team"]` — `team` is a to-one relationship; Appwrite's
realtime payload can omit it (return `null`) on an update that didn't touch
it, so it needs the relationship-omission handling in
[`real-time-store.ts`](../real-time-store.md).

## Used by

- [`lib/bootstrap/PlayerProvider.tsx`](../../bootstrap/PlayerProvider.md)
- [`lib/components/onboarding/PlayerPickerForm.tsx`](../../components/onboarding/PlayerPickerForm.md)
- [`app/(pages)/(team-player)/choose-your-character.tsx`](../../../app/(pages)/(team-player)/choose-your-character.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
