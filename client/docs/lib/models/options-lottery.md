# `lib/models/options-lottery.ts`

[← lib/models](README.md)

## Purpose

Appwrite document type for an **options lottery** — a named, weighted pool
of options (e.g. "Scenario Sheet": scenarios 2-6) that gets drawn once per
table for a game. Unlike photo lottery items, these have a real database
row: `options` and `results` are stored as JSON strings on the row
(`optionsJson`/`resultsJson`) since Appwrite has no nested-object attribute
type outside relationships, and parsed into the derived `OptionsLottery`
shape for everything outside the store layer.

## Exports

### `type LotteryOption`

| Field | Type | Meaning |
|---|---|---|
| `id` | `string` | Stable id within this instance's option pool |
| `title` | `string` | Required label |
| `description?` | `string` | Optional detail text |
| `weight` | `number` | Relative frequency across the whole room (largest-remainder apportionment) |
| `maxPerTable` | `number` | Cap on how many times this option can appear in one table's own pulls |

### `type LotteryTableResult`

`{ table: number; optionIds: string[] }` — one table's pulled result, referencing option ids by id (a live reference, not a snapshot — editing an option's title/description updates already-shown results immediately).

### `type OptionsLotteryRow`

The raw Appwrite row: `{ gameId, name, pullsPerTable, optionsJson, resultsJson } & Models.Document`.

### `type OptionsLottery`

The derived, parsed shape used everywhere outside the store:
`Omit<OptionsLotteryRow, "optionsJson" | "resultsJson"> & { options: LotteryOption[]; results: LotteryTableResult[] }`.
Produced by [`parseOptionsLottery`](../utils/options-lottery.md).

## Used by

- [`lib/utils/options-lottery.ts`](../utils/options-lottery.md)
- [`lib/utils/lottery-draw.ts`](../utils/lottery-draw.md)
- [`lib/stores/appwrite/options-lottery-store.ts`](../stores/appwrite/options-lottery-store.md)
- [`lib/hooks/useOptionsLotteryActions.ts`](../hooks/useOptionsLotteryActions.md)
- [`app/(pages)/(user)/lottery.tsx`](../../app/(pages)/(user)/lottery.md), [`lottery-options-edit.tsx`](../../app/(pages)/(user)/lottery-options-edit.md)
