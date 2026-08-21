# `lib/utils/options-lottery.ts`

[← lib/utils](README.md)

## Purpose

Raw-row ↔ derived-shape conversion and lookups for options lotteries,
mirroring the raw/derived split [`lottery.ts`](lottery.md) uses for photos.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `parseOptionsLottery(row)` | `(OptionsLotteryRow) => OptionsLottery` | Parses `optionsJson`/`resultsJson` into `options`/`results` arrays (falls back to `[]` on malformed JSON) |
| `serializeOptions(options)` | `(LotteryOption[]) => string` | Inverse — for writing back to `optionsJson` |
| `serializeResults(results)` | `(LotteryTableResult[]) => string` | Inverse — for writing back to `resultsJson` |
| `getOptionsLotteriesForGame(rows, gameId)` | `(OptionsLotteryRow[], string) => OptionsLottery[]` | Filters + parses a collection down to one game's instances, oldest first |
| `getResultForTable(instance, table)` | `(OptionsLottery, number) => LotteryTableResult \| null` | Looks up one table's result within an instance |
| `getOptionById(instance, optionId)` | `(OptionsLottery, string) => LotteryOption \| null` | Resolves an option id to its current definition (the "live reference" — not a snapshot) |

## Used by

- [`app/(pages)/(user)/lottery.tsx`](../../app/(pages)/(user)/lottery.md), [`game.tsx`](../../app/(pages)/(user)/game.md), [`lottery-options-edit.tsx`](../../app/(pages)/(user)/lottery-options-edit.md)
- [`lib/hooks/useOptionsLotteryActions.ts`](../hooks/useOptionsLotteryActions.md)
