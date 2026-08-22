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

One table's pulled result, referencing option ids by id (a live reference, not a snapshot — editing an option's title/description updates already-shown results immediately).

| Field | Type | Meaning |
|---|---|---|
| `table` | `number` | Table number this result was drawn for |
| `optionIds` | `string[]` | The `id`s of the options this table pulled, in draw order; length is normally `pullsPerTable` |

### `type OptionsLotteryRow`

The raw Appwrite row.

| Field | Type | Meaning |
|---|---|---|
| `gameId` | `string` | The game this lottery instance belongs to |
| `name` | `string` | Display name of the lottery instance (e.g. "Scenario Sheet") |
| `pullsPerTable` | `number` | How many options each table draws when the lottery is run for it |
| `sameForAllTables` | `boolean` | `false` (default): each table gets an independently-dealt hand (room-wide mix close to the weight ratio). `true`: one hand is drawn via weighted-random selection and copied to every table — see [`computeDraw`](../utils/lottery-draw.md) |
| `optionsJson` | `string` | JSON-serialized `LotteryOption[]` — the option pool, stringified because Appwrite has no nested-object attribute type. Parsed via [`parseOptionsLottery`](../utils/options-lottery.md); an unparseable value falls back to `[]` |
| `resultsJson` | `string` | JSON-serialized `LotteryTableResult[]` — the per-table draw results so far, same stringify-for-storage reasoning as `optionsJson`. Empty/falsy or unparseable falls back to `[]` |

### `type OptionsLottery`

The derived, parsed shape used everywhere outside the store —
`Omit<OptionsLotteryRow, "optionsJson" | "resultsJson"> & { options: LotteryOption[]; results: LotteryTableResult[] }`.
Produced by [`parseOptionsLottery`](../utils/options-lottery.md), i.e. every `OptionsLotteryRow` field except `optionsJson`/`resultsJson`, plus:

| Field | Type | Meaning |
|---|---|---|
| `options` | [`LotteryOption[]`](#type-lotteryoption) | Parsed option pool (from `optionsJson`) |
| `results` | [`LotteryTableResult[]`](#type-lotterytableresult) | Parsed per-table draw results so far (from `resultsJson`) |

## Used by

- [`lib/utils/options-lottery.ts`](../utils/options-lottery.md)
- [`lib/utils/lottery-draw.ts`](../utils/lottery-draw.md)
- [`lib/stores/appwrite/options-lottery-store.ts`](../stores/appwrite/options-lottery-store.md)
- [`lib/hooks/useOptionsLotteryActions.ts`](../hooks/useOptionsLotteryActions.md)
- [`app/(pages)/(user)/lottery.tsx`](../../app/(pages)/(user)/lottery.md), [`lottery-options-edit.tsx`](../../app/(pages)/(user)/lottery-options-edit.md)
