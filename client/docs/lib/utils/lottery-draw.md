# `lib/utils/lottery-draw.ts`

[← lib/utils](README.md)

## Purpose

Pure draw algorithm for options lotteries — no Appwrite or React imports, so
it's trivially testable on its own. Given a weighted option pool and a
table count, produces one result per table that keeps the room-wide mix
close to the configured weight ratio.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `validateLotteryConfig(options, pullsPerTable)` | `(LotteryOption[], number) => LotteryValidationError \| null` | Checks the config is drawable; returns an error code (for i18n lookup) or `null` |
| `computeDraw(options, pullsPerTable, tableNumbers)` | `(LotteryOption[], number, number[]) => LotteryTableResult[]` | Computes a fresh draw |
| `LotteryValidationError` | Type | `{ code: "no-options" \| "invalid-pulls-per-table" \| "missing-title" \| "invalid-weight" \| "invalid-max-per-table" \| "insufficient-capacity"; meta? }` |

## How it works

1. **Apportion**: `totalSlots = tableNumbers.length * pullsPerTable` is split
   across options proportional to `weight`, using the largest-remainder
   method so the split stays as close to the configured ratio as integer
   math allows.
2. **Shuffle**: the resulting multiset of option ids is Fisher-Yates
   shuffled.
3. **Deal**: `pullsPerTable` items are dealt to each table in turn, greedily
   taking the first remaining pool item that doesn't exceed that option's
   `maxPerTable` *within this table's own hand so far* (each table's cap
   usage resets per table — `maxPerTable` isn't a global cap, only a
   per-table one).
4. If a table can't be completed from what's left (a dead end — only
   reachable with `maxPerTable` configs pushed to the edge relative to
   `pullsPerTable`), the whole shuffle-and-deal is retried (bounded at 50
   attempts) before `computeDraw` throws.

`validateLotteryConfig`'s `insufficient-capacity` check
(`sum(maxPerTable) >= pullsPerTable`) is a *necessary* condition for a
table to be fillable at all, not a guarantee — the retry loop in step 4 is
what actually handles the harder case of the global apportionment leaving a
late table with too little variety left in the pool.

## Used by

- [`lib/hooks/useOptionsLotteryActions.ts`](../hooks/useOptionsLotteryActions.md)
- [`app/(pages)/(user)/lottery-options-edit.tsx`](../../app/(pages)/(user)/lottery-options-edit.md)
