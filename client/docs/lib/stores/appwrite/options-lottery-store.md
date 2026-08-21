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
| `collection: OptionsLotteryRow[]` | All options-lottery rows (`Models.Document` + `name`, `optionsJson`, `resultsJson`, etc.) across every game |
| `init(): Promise<void>` | `fetchCollection(key, set)` — loads the full `options-lotteries` collection with no query filter |
| `add(data: Omit<OptionsLotteryRow, keyof Models.Document>): Promise<OptionsLotteryRow \| null>` | Creates a row via `addToCollection(key, data)` with an auto-generated (`ID.unique()`) id — a game can have several instances; returns the created row, or `null` (and shows an `Alert`) on failure |
| `update(item: PartialOptionsLotteryRow): Promise<boolean>` | `updateInCollection(key, item)` — partial update by `item.$id` (used for both config edits and writing a fresh `resultsJson` after a pull); returns whether the update succeeded |
| `delete(data: PartialOptionsLotteryRow): Promise<boolean>` | `removeFromCollection(key, data)` — deletes the row by `data.$id`; since results are embedded JSON on the same row, this is the entire cascade-delete: one row, everything gone; returns whether the delete succeeded |

### `type PartialOptionsLotteryRow`

`Partial<OptionsLotteryRow> & { $id: string }` — the shape `update`/`delete` expect.

## Used by

- [`lib/hooks/useOptionsLotteryActions.ts`](../../hooks/useOptionsLotteryActions.md)
- [`lib/bootstrap/RealTimeStoreProvider.tsx`](../../bootstrap/RealTimeStoreProvider.md)
- Screens: [`lottery.tsx`](../../../app/(pages)/(user)/lottery.md), [`lottery-options-edit.tsx`](../../../app/(pages)/(user)/lottery-options-edit.md), [`game.tsx`](../../../app/(pages)/(user)/game.md)
