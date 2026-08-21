# `lib/stores/appwrite/options-lottery-store.ts`

[← lib/stores/appwrite](README.md)

## Purpose

Zustand store for the `options-lotteries` collection — one row per named
options-lottery instance (e.g. "Scenario Sheet"), `options`/`results` kept
as JSON strings on the row (see
[`lib/models/options-lottery.ts`](../../models/options-lottery.md)).
Standard DB-row store: default realtime channel, generic CRUD helpers.

## Exports

### `useOptionsLotteryStore` (zustand hook)

| State/Method | Purpose |
|---|---|
| `collection: OptionsLotteryRow[]` | All options-lottery rows across every game |
| `init()` | Loads the full collection |
| `add(data)` | Creates a row (`ID.unique()` id — a game can have several instances) |
| `update(item)` | Partial update (used for both config edits and writing a fresh `resultsJson` after a pull) |
| `delete(item)` | Deletes the row — since results are embedded JSON on the same row, this is the entire cascade-delete: one row, everything gone |

## Used by

- [`lib/hooks/useOptionsLotteryActions.ts`](../../hooks/useOptionsLotteryActions.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
- Screens: [`lottery.tsx`](../../../app/(pages)/(user)/lottery.md), [`lottery-options-edit.tsx`](../../../app/(pages)/(user)/lottery-options-edit.md), [`game.tsx`](../../../app/(pages)/(user)/game.md)
